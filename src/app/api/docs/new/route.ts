import crypto from "crypto";
import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { sendMemoTransaction, getTransactionUrl } from "@/lib/utils/solana";
import { checkDocumentExists, insertDocument } from "@/lib/utils/db";

/**
 * Handles the POST request for uploading and processing new documents
 *
 * @param request - The incoming request object containing blob data and metadata
 */
export async function POST(request: Request) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Invalid content type. Expected multipart/form-data");
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const password = form.get("password") as string | null;
    const mimeType = form.get("mimeType") as string | null;

    if (!file) {
      throw new Error("No file provided");
    }

    if (!mimeType) {
      throw new Error("No mime type provided");
    }

    // Validate mime type
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("Invalid file type");
    }

    // Get file data and hash
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Check if document already exists
    const existingDoc = await checkDocumentExists(fileHash);
    if (existingDoc) {
      throw new Error("Document already exists in the database");
    }

    // Create memo message and send transaction
    const memoMessage = `FILE_HASH=${fileHash}`;
    const transactionSignature = await sendMemoTransaction(memoMessage);

    // Store document in database
    await insertDocument(
      fileHash,
      password,
      transactionSignature,
      fileBuffer,
      file.name,
      mimeType
    );


    return NextResponse.json({
      success: true,
      transactionUrl: getTransactionUrl(transactionSignature),
      hash: fileHash,
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

      console.error("Error processing request:", error);
      captureException(error);

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
