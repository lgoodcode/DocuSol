import { NextResponse } from "next/server";
import { z } from "zod";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/utils";
import { documentStateExportSchema } from "@/lib/pdf-editor/document-types";
import {
  DocumentStamp,
  SignatureState,
  STAMP_VERSION,
} from "@/lib/types/stamp";
import { sendMemoTransaction } from "@/lib/utils/solana";
import { ObfuscatedStampSerializer } from "@/lib/utils/serializer";
import { sendEmails } from "@/lib/utils/email";

import { generateSigningLinkForParticipants } from "./utils";

const createErrorResponse = (message: string, status: number) => {
  console.error(`Upload API Error: ${message}`);
  captureException(new Error(message));
  return NextResponse.json({ error: message }, { status });
};

// Extend the schema to include an optional dryRun flag
const uploadRequestSchema = documentStateExportSchema.extend({
  dryRun: z.object({
    memo: z.boolean().optional().default(false),
    email: z.boolean().optional().default(false),
    database: z.boolean().optional().default(false),
  }),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const user = await getUser(supabase);
    const body = await request.json();

    // Validate the extended schema including the optional dryRun flag
    const {
      documentId,
      documentName,
      documentContentHash,
      signers: participants,
      fields,
      encryptionPassword,
      expirationDate,
      dryRun,
    } = uploadRequestSchema.parse(body);

    // Step 1: Construct the DocumentStamp object
    const documentStamp: DocumentStamp = {
      version: STAMP_VERSION,
      contentHash: documentContentHash,
      // signers: participants,
      // signatures: [],
      status: {
        state: SignatureState.AWAITING_SIGNATURES,
        revoked: false,
        expired: false,
        expiresAt: expirationDate
          ? new Date(expirationDate).getTime()
          : undefined,
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
        creator: user.id,
        documentId: documentId,
        version: 1, // Initial finalized version
        password: encryptionPassword,
      },
    };

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

    if (dryRun.memo) {
      console.log("Dry run: Skipped memo transaction");
    }

    // Step 5: Call the appropriate RPC function based on the dryRun flag
    const rpcName = dryRun.database
      ? "dry_run_finalize_document_upload"
      : "finalize_document_upload";
    const { error: finalizeError } = await supabase.rpc(rpcName, {
      p_document_id: documentId,
      p_user_id: user.id,
      p_content_hash: documentContentHash.contentHash,
      p_file_hash: documentContentHash.fileHash,
      p_metadata_hash: documentContentHash.metadataHash,
      p_transaction_signature: txSignature,
      p_fields: fields,
      p_password: encryptionPassword,
      p_expires_at: expirationDate
        ? new Date(expirationDate).toISOString()
        : undefined,
      p_participants: participants,
    });

    if (dryRun.database) {
      console.log("Dry run: Skipped database operations");
    }

    if (finalizeError) {
      // Log the specific error from the RPC call.
      const errorMessage = `Error during ${dryRun ? "dry run" : "finalization"}: ${finalizeError.message}`;
      console.error(errorMessage);
      // If it was a dry run failure, we might want a different status code or error message structure
      if (dryRun && finalizeError.message.startsWith("Dry run failed:")) {
        // Provide a clearer error message indicating dry run failure
        return createErrorResponse(
          `Dry run validation failed: ${finalizeError.message.substring("Dry run failed: ".length)}`,
          400,
        );
      }
      // Otherwise, throw a general error for commit failures or unexpected dry run errors
      throw new Error(errorMessage);
    }

    // Step 6: Generate verification token and signing links
    let signingLinks: string[] = [];
    try {
      signingLinks = await generateSigningLinkForParticipants(
        participants,
        documentId,
      );
    } catch (error) {
      console.error("Error generating signing links:", error);
      captureException(error);
      return createErrorResponse("Error generating signing links", 500);
    }

    // Step 7: Send emails to participants
    if (!dryRun.email) {
      const emailPayloads = participants.map((participant, index) => ({
        email: participant.email,
        name: participant.name,
        link: signingLinks[index],
      }));

      try {
        await sendEmails(
          emailPayloads,
          {
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
          },
          "Document Ready for Signature",
          documentName,
        );
      } catch (emailError) {
        console.error("Error during email sending:", emailError);
        captureException(emailError);
        const message =
          emailError instanceof Error
            ? emailError.message
            : "An error occurred while sending emails.";
        return createErrorResponse(message, 500);
      }
    } else {
      console.log("Dry run: Skipped sending emails.");
    }

    return NextResponse.json({
      success: true,
      dryRun,
      transactionSignature: txSignature,
    });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Invalid request body: ${error.errors.map((e) => `${e.path.join(".")} - ${e.message}`).join(", ")}`,
        400,
      );
    }
    captureException(error);
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during document upload.";
    return createErrorResponse(message, 500);
  }
}
