import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { validate as uuidValidate } from "uuid";
import { z } from "zod";

import { STAMP_VERSION } from "@/lib/types/stamp";
import { createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/utils/email";
import { sendMemoTransaction } from "@/lib/utils/solana";
import { ObfuscatedStampSerializer } from "@/lib/utils/serializer";
import type { DocumentStamp } from "@/lib/types/stamp";
import { SignatureState } from "@/lib/types/stamp";

import { SignRequestFormSchema } from "./utils";

const createErrorResponse = (message: string, status: number) => {
  console.error(`Sign API Error: ${message}`);
  captureException(new Error(message));
  return NextResponse.json({ error: message }, { status });
};

const schema = SignRequestFormSchema.extend({
  dryRun: z.object({
    memo: z.boolean().optional().default(false),
    email: z.boolean().optional().default(false),
    database: z.boolean().optional().default(false),
  }),
});

// --- Main POST Handler ---
export async function POST(request: Request) {
  const supabase = await createServerClient({ useServiceRole: true });

  try {
    const body = await request.json();
    const {
      documentId,
      documentName,
      participantId,
      isLastSigner,
      versionNumber,
      password,
      creatorUserId,
      contentHash,
      fileHash,
      metadataHash,
      dryRun,
      signerEmail,
      token,
    } = schema.parse(body);
    const newVersionNumber = versionNumber + 1;

    console.log({
      documentId,
      documentName,
      participantId,
      isLastSigner,
      versionNumber,
      password,
      creatorUserId,
      contentHash,
      fileHash,
      metadataHash,
      dryRun,
      signerEmail,
      token,
    });

    // Step 1: Construct the DocumentStamp object
    const documentStamp: DocumentStamp = {
      version: STAMP_VERSION,
      contentHash: {
        contentHash,
        fileHash,
        metadataHash,
      },
      // hashHistory: {
      //   initialHash: documentContentHash.fileHash,
      //   currentHash: documentContentHash.fileHash,
      //   updates: [],
      // },
      // signers: participants,
      // signatures: [],
      status: {
        state: isLastSigner
          ? SignatureState.COMPLETED
          : SignatureState.AWAITING_SIGNATURES,
        revoked: false,
        expired: false,
        expiresAt: undefined,
      },
      // rules: {
      //   requireAll: true,
      //   requireOrder: false,
      //   minSignatures: participants.length,
      //   allowRevocation: false,
      // },
      metadata: {
        transaction: "", // Will be filled after Solana tx
        createdAt: new Date().getTime(),
        creator: creatorUserId,
        documentId: documentId,
        version: newVersionNumber,
        password: password,
      },
    };

    console.log("documentStamp", documentStamp);

    // Step 2: Serialize, Pack, Obfuscate the DocumentStamp
    const serializer = new ObfuscatedStampSerializer();
    const obfuscatedStamp = serializer.serialize(documentStamp);

    // Step 3: Format the memo for the Solana blockchain - prefix the obfuscated stamp with
    // the version to identify the stamp format for method of deserialization
    const formattedMemo = `v${STAMP_VERSION}:${obfuscatedStamp}`;

    // Step 4: Store the stamp in the Solana memo blockchain
    const txSignature = dryRun.memo
      ? "dry_run_memo_transaction"
      : await sendMemoTransaction(formattedMemo);

    // Step 5: Update the document metadata with the new transaction signature
    documentStamp.metadata.transaction = txSignature;

    console.log("txSignature", txSignature);
    if (dryRun.memo) {
      console.log("Dry run: Skipped memo transaction");
    }

    // Step 6: Call the appropriate RPC function based on the dryRun flag
    const rpcName = dryRun.database ? "dry_run_sign_document" : "sign_document";
    const { error: rpcError, data: rpcData } = await supabase
      .rpc(rpcName, {
        p_document_id: documentId,
        p_participant_id: participantId,
        p_content_hash: contentHash,
        p_file_hash: fileHash,
        p_metadata_hash: metadataHash,
        p_transaction_signature: txSignature,
      })
      .single();

    let creatorEmail: string | null = null;
    if (dryRun.database) {
      creatorEmail = "lawrence@docusol.app";
      console.log("Dry run: Skipped database operation for signing.");
    } else if (rpcError) {
      // Handle actual RPC errors only if not in dry run mode
      console.error(`RPC ${rpcName} error:`, rpcError);
      if (rpcError.message.includes("Signer record not found")) {
        return createErrorResponse(
          "Signer record mismatch or already processed.",
          404,
        );
      }
      if (rpcError.message.includes("Token already used or invalidated")) {
        return createErrorResponse(
          "Verification token already used or invalidated.",
          401,
        );
      }
      // Handle other potential RPC errors
      return createErrorResponse(
        `Failed to record signature: ${rpcError.message}`,
        500,
      );
    } else {
      console.log("rpcData", rpcData);
      creatorEmail = rpcData.creator_email;
    }

    console.log("creatorEmail", creatorEmail);

    if (!dryRun.database && token) {
      const { error: updateError } = await supabase
        .from("email_verification_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      if (updateError) {
        // Log the error but proceed, as the main signing action succeeded.
        console.error("Failed to invalidate token:", updateError);
        captureException(updateError, {
          extra: { token },
        });
      } else {
        console.log(
          `Token invalidated successfully: ${token.substring(0, 8)}...`,
        );
      }
    } else if (dryRun.database) {
      console.log("Dry run: Skipped token invalidation.");
    }

    // Step 8: Send email notifications
    if (dryRun.email) {
      console.log("Dry run: Using test email address.");
      await sendEmail({
        type: "notify",
        creatorEmail: creatorEmail,
        signerEmail: signerEmail,
        subject: "Document signed",
        documentName: "Document name",
      });
    } else if (isLastSigner) {
      // If this is the last signer, send a completion email to the creator
      try {
        await sendEmail({
          type: "complete",
          creatorEmail: creatorEmail,
          subject: `Document Completed: "${documentName}"`,
          documentName: documentName,
        });
      } catch (emailError) {
        console.error("Failed to send completion email:", emailError);
        captureException(emailError, {
          extra: { documentId, creatorUserId },
        });
      }
    }

    // Step 9: Return Success Response (renumbered from 8)
    return NextResponse.json({
      success: true,
      message: `Document successfully ${dryRun.database ? "(dry run) " : ""}signed.`,
      transactionSignature: txSignature, // Return the new signature
      versionNumber: newVersionNumber,
      documentStatus: rpcData?.document_status ?? "unknown", // Return updated status from RPC or dry run status
      dryRun: dryRun, // Include dry run status in response
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Invalid request data: ${error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")}`,
        400,
      );
    }

    captureException(error);

    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during signing.";
    // Determine status code based on error message if possible
    let statusCode = 500;
    if (
      message === "Signer is not a participant of this document" ||
      message === "Could not determine the user performing the signing action."
    )
      statusCode = 403;
    else if (
      message === "Invalid or expired verification token" ||
      message === "Verification token already used" ||
      message === "Verification token invalidated"
    )
      statusCode = 401;
    else if (message === "Signer record mismatch or already processed.")
      statusCode = 404;

    return createErrorResponse(message, statusCode);
  }
}
