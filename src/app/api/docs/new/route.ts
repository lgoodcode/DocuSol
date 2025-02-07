import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import { ACCEPTED_FILE_TYPES } from "@/constants";
import { createServerClient } from "@/lib/supabase/server";
import { getLatestBlockSlot, sendMemoTransaction } from "@/lib/utils/solana";
import { bufferToHex } from "@/lib/utils";
import { createFileHash } from "@/lib/utils/hashing";

type DocumentUploadResponse = {
  id: string;
  txSignature: string;
  unsignedHash: string;
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
  DATABASE_ERROR: (message: string) => `Database error: ${message}`,
} as const;

const FormDataSchema = z.object({
  name: z.string().min(1, ERRORS.NO_NAME),
  password: z.string().default(""),
  original_filename: z.string().min(1, ERRORS.NO_ORIGINAL_FILENAME),
  mime_type: z
    .string()
    .refine(
      (type) => Object.keys(ACCEPTED_FILE_TYPES).includes(type),
      ERRORS.INVALID_FILE_TYPE,
    ),
  original_document: z.instanceof(File, {
    message: ERRORS.NO_ORIGINAL_DOCUMENT,
  }),
  unsigned_document: z.instanceof(File, {
    message: ERRORS.NO_UNSIGNED_DOCUMENT,
  }),
});

const createErrorResponse = (error: unknown, defaultStatus = 500) => {
  console.error("Error processing request:", error);
  captureException(error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const statusCode = getErrorStatusCode(error.message);
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: defaultStatus },
  );
};

const getErrorStatusCode = (message: string): number => {
  const badRequestErrors = [
    ERRORS.NO_NAME,
    ERRORS.INVALID_FILE_TYPE,
    ERRORS.NO_MIME_TYPE,
    ERRORS.INVALID_CONTENT_TYPE,
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (badRequestErrors.includes(message as any)) return 400;
  if (message.startsWith("Database error: duplicate")) return 409;
  return 500;
};

/**
 * Process document upload and create blockchain record
 */
async function processDocumentUpload(
  formData: z.infer<typeof FormDataSchema>,
): Promise<DocumentUploadResponse> {
  try {
    console.log("Starting document upload process");
    // Get latest block slot
    const blockSlot = await getLatestBlockSlot();
    console.log("Retrieved block slot:", blockSlot);
    console.log("formData", formData);
    // Process documents
    console.log("Processing document buffers");
    const [originalBuffer, unsignedBuffer] = await Promise.all([
      formData.original_document.arrayBuffer(),
      formData.unsigned_document.arrayBuffer(),
    ]);

    const originalDocumentBuffer = Buffer.from(originalBuffer);
    const unsignedDocumentBuffer = Buffer.from(unsignedBuffer);
    console.log("Document buffers created successfully");

    // Create hash and send transaction
    console.log("Creating document hash");
    const unsignedDocumentHash = createFileHash(
      unsignedDocumentBuffer,
      blockSlot,
      formData.password,
    );
    console.log("Document hash created:", unsignedDocumentHash);

    const memoMessage = `FILE_HASH=${unsignedDocumentHash}`;
    let txSignature: string;
    try {
      console.log("Initiating transaction with memo:", memoMessage);
      txSignature = await sendMemoTransaction(memoMessage);
      console.log("Transaction successful, signature:", txSignature);
    } catch (error) {
      console.error("Transaction failed with error:", error);
      throw new Error(ERRORS.TRANSACTION_FAILED(error as Error));
    }

    // Store in database
    console.log("Storing document in database");
    const supabase = await createServerClient();
    const { error: insertError, data: insertData } = await supabase
      .from("documents")
      .insert({
        name: formData.name,
        password: formData.password,
        mime_type: formData.mime_type,
        unsigned_hash: unsignedDocumentHash,
        unsigned_transaction_signature: txSignature,
        original_filename: formData.original_filename,
        original_document: bufferToHex(originalDocumentBuffer),
        unsigned_document: bufferToHex(unsignedDocumentBuffer),
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Database insertion failed:", insertError);
      throw new Error(ERRORS.DATABASE_ERROR(insertError.message));
    }

    console.log("Document upload process completed successfully");
    return {
      id: insertData.id,
      txSignature,
      unsignedHash: unsignedDocumentHash,
    };
  } catch (error) {
    console.error("Document upload process failed:", error);
    throw error; // Re-throw to be handled by the main error handler
  }
}

/**
 * Main POST handler
 */
export async function POST(request: Request) {
  try {
    // Validate content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error(ERRORS.INVALID_CONTENT_TYPE);
    }

    // Parse and validate form data
    const formData = await request.formData();
    const validatedData = FormDataSchema.parse({
      name: formData.get("name"),
      password: formData.get("password"),
      original_filename: formData.get("original_filename"),
      mime_type: formData.get("mime_type"),
      original_document: formData.get("original_document"),
      unsigned_document: formData.get("unsigned_document"),
    });

    console.log("validatedData", validatedData);
    // Process upload
    const result = await processDocumentUpload(validatedData);
    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error);
  }
}
