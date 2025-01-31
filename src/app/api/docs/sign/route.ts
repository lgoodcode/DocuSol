import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import {
  confirmTransaction,
  getLatestBlockSlot,
  sendMemoTransaction,
} from "@/lib/utils/solana";
import { bufferToHex } from "@/lib/utils";
import { createFileHash } from "@/lib/utils/hashing";

const ERRORS = {
  NO_ID: "No id provided",
  NO_SIGNED_DOCUMENT: "No signed document provided",
  DOCUMENT_NOT_FOUND: "Document not found",
  PASSWORD_REQUIRED: "Password required for this document",
  INVALID_PASSWORD: "Invalid password",
  TRANSACTION_FAILED: (error: Error) =>
    `Transaction failed: ${error.message}`,
  TRANSACTION_CONFIRMATION_FAILED: (error: Error) =>
    `Transaction confirmation failed: ${error.message}`,
  FAILED_TO_UPDATE_DOCUMENT: (error: string) =>
    `Failed to update document: ${error}`,
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Invalid content type. Expected multipart/form-data");
    }

    const form = await request.formData();
    const id = form.get("id") as string | null;
    const signedDocument = form.get("signed_document") as File | null;
    const password = form.get("password") as string | null;

    if (!id) {
      throw new Error(ERRORS.NO_ID);
    } else if (!signedDocument) {
      throw new Error(ERRORS.NO_SIGNED_DOCUMENT);
    }

    // Check if document exists
    const supabase = await createServerClient();
    const { error: fetchError, data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !document) {
      throw new Error(ERRORS.DOCUMENT_NOT_FOUND);
    } else if (document.is_signed) {
      return NextResponse.json(
        {
          error: "Document is already signed",
          signedAt: document.signed_at,
        },
        { status: 409 }
      );
    } else if (document.password) {
      if (!password) {
        throw new Error(ERRORS.PASSWORD_REQUIRED);
      } else if (password !== document.password) {
        throw new Error(ERRORS.INVALID_PASSWORD);
      }
    }

    // Process signed document
    const blockSlot = await getLatestBlockSlot();
    const signedDocumentBuffer = Buffer.from(
      await signedDocument.arrayBuffer()
    );
    const signedHash = createFileHash(
      signedDocumentBuffer,
      blockSlot,
      password
    );

    // Send memo transaction for signed document
    const memoMessage = `SIGNED_FILE_HASH=${signedHash}`;

    let transactionSignature: string;
    try {
      transactionSignature = await sendMemoTransaction(memoMessage);
    } catch (error) {
      throw new Error(ERRORS.TRANSACTION_FAILED(error as Error));
    }

    try {
      await confirmTransaction(transactionSignature);
    } catch (error) {
      throw new Error(ERRORS.TRANSACTION_CONFIRMATION_FAILED(error as Error));
    }

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
      throw new Error(ERRORS.FAILED_TO_UPDATE_DOCUMENT(updateError.message));
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
    case ERRORS.NO_ID:
      return 400;
    case ERRORS.NO_SIGNED_DOCUMENT:
      return 400;
    case ERRORS.DOCUMENT_NOT_FOUND:
      return 404;
    case ERRORS.PASSWORD_REQUIRED:
    case ERRORS.INVALID_PASSWORD:
      return 401;
    default:
      return 500;
  }
}
