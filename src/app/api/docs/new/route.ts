import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { ACCEPTED_FILE_TYPES } from "@/constants";
import { createServerClient } from "@/lib/supabase/server";
import { getLatestBlockSlot, sendMemoTransaction } from "@/lib/utils/solana";
import { bufferToHex } from "@/lib/utils";
import { createFileHash } from "@/lib/utils/hashing";

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing
  },
};

const ERRORS = {
  INVALID_CONTENT_TYPE: "Invalid content type. Expected multipart/form-data",
  NO_NAME: "No name provided",
  NO_ORIGINAL_FILENAME: "No original filename provided",
  NO_MIME_TYPE: "No mime type provided",
  NO_ORIGINAL_DOCUMENT: "No original document provided",
  NO_UNSIGNED_DOCUMENT: "No unsigned document provided",
  INVALID_FILE_TYPE: "Invalid file type",
  TRANSACTION_FAILED: (error: Error) => `Transaction failed: ${error.message}`,
};

export async function POST(request: Request) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error(ERRORS.INVALID_CONTENT_TYPE);
    }

    const form = await request.formData();
    const name = form.get("name") as string | null;
    const password = (form.get("password") as string) || "";
    const originalFilename = form.get("original_filename") as string | null;
    const mimeType = form.get("mime_type") as string | null;
    const originalDocument = form.get("original_document") as File | null;
    const unsignedDocument = form.get("unsigned_document") as File | null;

    if (!name) {
      throw new Error(ERRORS.NO_NAME);
    } else if (!originalFilename) {
      throw new Error(ERRORS.NO_ORIGINAL_FILENAME);
    } else if (!mimeType) {
      throw new Error("No mime type provided");
    } else if (!originalDocument) {
      throw new Error(ERRORS.NO_ORIGINAL_DOCUMENT);
    } else if (!unsignedDocument) {
      throw new Error(ERRORS.NO_UNSIGNED_DOCUMENT);
    } else if (!Object.keys(ACCEPTED_FILE_TYPES).includes(mimeType)) {
      throw new Error(ERRORS.INVALID_FILE_TYPE);
    }

    const blockSlot = await getLatestBlockSlot();
    const originalDocumentBuffer = Buffer.from(
      await originalDocument.arrayBuffer()
    );
    const unsignedDocumentBuffer = Buffer.from(
      await unsignedDocument.arrayBuffer()
    );
    const unsignedDocumentHash = createFileHash(
      unsignedDocumentBuffer,
      blockSlot,
      password
    );

    // Create memo message and send transaction
    const memoMessage = `FILE_HASH=${unsignedDocumentHash}`;

    let txSignature: string;
    try {
      txSignature = await sendMemoTransaction(memoMessage);
    } catch (error) {
      throw new Error(ERRORS.TRANSACTION_FAILED(error as Error));
    }

    // Store document in database
    const supabase = await createServerClient();
    const { error: insertError, data: insertData } = await supabase
      .from("documents")
      .insert({
        name,
        password,
        mime_type: mimeType,
        unsigned_hash: unsignedDocumentHash,
        unsigned_transaction_signature: txSignature,
        original_filename: originalFilename,
        original_document: bufferToHex(originalDocumentBuffer),
        unsigned_document: bufferToHex(unsignedDocumentBuffer),
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Failed to insert document: ${insertError.message}`);
    }

    return NextResponse.json({
      id: insertData.id,
      txSignature,
      unsignedHash: unsignedDocumentHash,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    captureException(error);

    if (error instanceof Error) {
      const statusCode =
        error.message === "No file provided" ||
        error.message === "Invalid file type" ||
        error.message === "No mime type provided" ||
        error.message === "Invalid content type. Expected multipart/form-data"
          ? 400
          : error.message === "Document already exists in the database"
          ? 409
          : 500;

      return NextResponse.json(
        { error: error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
