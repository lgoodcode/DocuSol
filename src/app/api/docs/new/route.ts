import crypto from "crypto";
import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { sendMemoTransaction } from "@/lib/utils/solana";
import { insertDocument } from "@/lib/utils/db";
import { bufferToHex } from "@/lib/utils";

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: Request) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Invalid content type. Expected multipart/form-data");
    }

    const form = await request.formData();
    const name = form.get("name") as string | null;
    const password = form.get("password") as string | null;
    const originalFilename = form.get("original_filename") as string | null;
    const mimeType = form.get("mime_type") as string | null;
    const unsignedDocument = form.get("unsigned_document") as File | null;
    const signedDocument = form.get("signed_document") as File | null;

    if (!name) {
      throw new Error("No name provided");
    } else if (!originalFilename) {
      throw new Error("No original filename provided");
    } else if (!mimeType) {
      throw new Error("No mime type provided");
    } else if (!unsignedDocument) {
      throw new Error("No unsigned document provided");
    } else if (!signedDocument) {
      throw new Error("No signed document provided");
    } else if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Invalid file type");
    }

    // Get file data and hash
    const originalDocumentBuffer = Buffer.from(
      await unsignedDocument.arrayBuffer()
    );
    const unsignedDocumentBuffer = Buffer.from(
      await signedDocument.arrayBuffer()
    );
    const unsignedDocumentHash = crypto
      .createHash("sha256")
      .update(unsignedDocumentBuffer)
      .digest("hex");

    // Create memo message and send transaction
    const memoMessage = `FILE_HASH=${unsignedDocumentHash}`;
    const txSignature = await sendMemoTransaction(memoMessage);

    // Store document in database
    const id = await insertDocument({
      name,
      password: password || "",
      original_filename: originalFilename,
      mime_type: mimeType,
      original_document: bufferToHex(originalDocumentBuffer),
      unsigned_document: bufferToHex(unsignedDocumentBuffer),
      unsigned_transaction_signature: txSignature,
      unsigned_hash: unsignedDocumentHash,
    });

    return NextResponse.json({
      id,
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
