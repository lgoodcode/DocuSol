import crypto from "crypto";
import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { ACCEPTED_FILE_TYPES } from "@/constants";
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
    const name = form.get("name") as string | null;
    const password = (form.get("password") as string) || "";
    const originalFilename = form.get("original_filename") as string | null;
    const mimeType = form.get("mime_type") as string | null;
    const originalDocument = form.get("original_document") as File | null;
    const unsignedDocument = form.get("unsigned_document") as File | null;

    if (!name) {
      throw new Error("No name provided");
    } else if (!originalFilename) {
      throw new Error("No original filename provided");
    } else if (!mimeType) {
      throw new Error("No mime type provided");
    } else if (!originalDocument) {
      throw new Error("No original document provided");
    } else if (!unsignedDocument) {
      throw new Error("No unsigned document provided");
    } else if (!Object.keys(ACCEPTED_FILE_TYPES).includes(mimeType)) {
      throw new Error("Invalid file type");
    }

    // Add unique timestamp to the document to prevent duplicate hashes
    // in the event of a hash collision
    const timestamp = new Date().toISOString();
    // Get file data and hash
    const originalDocumentBuffer = Buffer.from(
      await originalDocument.arrayBuffer()
    );
    const unsignedDocumentBuffer = Buffer.from(
      await unsignedDocument.arrayBuffer()
    );
    const unsignedDocumentHash = crypto
      .createHash("sha256")
      .update(unsignedDocumentBuffer + timestamp + password)
      .digest("hex");

    // Create memo message and send transaction
    const memoMessage = `FILE_HASH=${unsignedDocumentHash}`;
    const txSignature = await sendMemoTransaction(memoMessage);

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
        created_at: timestamp,
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
