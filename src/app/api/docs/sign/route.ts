import crypto from "crypto";
import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import { sendMemoTransaction } from "@/lib/utils/solana";
import { bufferToHex } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Invalid content type. Expected multipart/form-data");
    }

    const form = await request.formData();
    const id = form.get("id") as string | null;
    const signedDocument = form.get("signed_document") as File | null;
    // const password = form.get("password") as string | null;

    if (!id) {
      throw new Error("No id provided");
    } else if (!signedDocument) {
      throw new Error("No signed document provided");
    }
    // else if (!password) {
    //   throw new Error("No password provided");
    // }

    // Check if document exists
    const supabase = await createServerClient();
    const { error: fetchError, data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !document) {
      throw new Error("Document not found");
    } else if (document.is_signed) {
      return NextResponse.json(
        {
          error: "Document is already signed",
          signedAt: document.signed_at,
        },
        { status: 409 }
      );
    }
    // else if (document.password) {
    //   if (!password) {
    //     throw new Error("Password required for this document");
    //   } else if (password !== document.password) {
    //     throw new Error("Invalid password");
    //   }
    // }

    // Process signed document
    const signedDocumentBuffer = Buffer.from(
      await signedDocument.arrayBuffer()
    );
    const signedHash = crypto
      .createHash("sha256")
      .update(signedDocumentBuffer)
      .digest("hex");

    // Send memo transaction for signed document
    const memoMessage = `SIGNED_FILE_HASH=${signedHash}`;
    const transactionSignature = await sendMemoTransaction(memoMessage);

    // Update document with signed information
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        is_signed: true,
        signed_hash: signedHash,
        signed_transaction_signature: transactionSignature,
        signed_document: bufferToHex(signedDocumentBuffer),
        signed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    return NextResponse.json({
      txSignature: transactionSignature,
      signedHash,
    });
  } catch (error) {
    console.error("Error processing sign request:", error);
    captureException(error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const statusCode = getErrorStatusCode(errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

function getErrorStatusCode(errorMessage: string): number {
  switch (errorMessage) {
    case "Missing required fields: file and/or hash":
      return 400;
    case "Document not found":
      return 404;
    case "Password required for this document":
    case "Invalid password":
      return 401;
    default:
      return 500;
  }
}
