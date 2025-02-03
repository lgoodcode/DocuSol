import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import {
  confirmTransaction,
  getLatestBlockSlot,
  sendMemoTransaction,
} from "@/lib/utils/solana";
import { bufferToHex } from "@/lib/utils";
import { createFileHash } from "@/lib/utils/hashing";

export const config = {
  api: {
    bodyParser: false,
  },
};

interface Document {
  id: string;
  password: string | null;
  is_signed: boolean;
  signed_at: string | null;
}

type SigningResponse = {
  txSignature: string;
  signedHash: string;
};

const ERRORS = {
  INVALID_CONTENT_TYPE: "Invalid content type. Expected multipart/form-data",
  NO_ID: "No id provided",
  NO_SIGNED_DOCUMENT: "No signed document provided",
  DOCUMENT_NOT_FOUND: "Document not found",
  DOCUMENT_ALREADY_SIGNED: "Document is already signed",
  PASSWORD_REQUIRED: "Password required for this document",
  INVALID_PASSWORD: "Invalid password",
  TRANSACTION_FAILED: (error: Error) => `Transaction failed: ${error.message}`,
  TRANSACTION_CONFIRMATION_FAILED: (error: Error) =>
    `Transaction confirmation failed: ${error.message}`,
  DATABASE_ERROR: (message: string) => `Database error: ${message}`,
} as const;

const ERROR_STATUS_CODES: Record<string, number> = {
  [ERRORS.NO_ID]: 400,
  [ERRORS.NO_SIGNED_DOCUMENT]: 400,
  [ERRORS.INVALID_CONTENT_TYPE]: 400,
  [ERRORS.DOCUMENT_NOT_FOUND]: 404,
  [ERRORS.PASSWORD_REQUIRED]: 401,
  [ERRORS.INVALID_PASSWORD]: 401,
  [ERRORS.DOCUMENT_ALREADY_SIGNED]: 409,
};

const FormDataSchema = z.object({
  id: z.string().min(1, ERRORS.NO_ID),
  signed_document: z.instanceof(File, { message: ERRORS.NO_SIGNED_DOCUMENT }),
  password: z.string().nullable(),
});

const getErrorStatusCode = (message: string): number => {
  return ERROR_STATUS_CODES[message] || 500;
};

const createErrorResponse = (error: unknown) => {
  console.error("Error processing sign request:", error);
  captureException(error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message },
      { status: 400 }
    );
  }

  const errorMessage =
    error instanceof Error ? error.message : "Internal server error";
  const statusCode = getErrorStatusCode(errorMessage);

  return NextResponse.json({ error: errorMessage }, { status: statusCode });
};

/**
 * Validate document access and status
 */
async function validateDocumentAccess(
  id: string,
  password: string | null
): Promise<Document> {
  const supabase = await createServerClient();
  const { error: fetchError, data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !document) {
    throw new Error(ERRORS.DOCUMENT_NOT_FOUND);
  }

  if (document.is_signed) {
    throw new Error(ERRORS.DOCUMENT_ALREADY_SIGNED);
  }

  if (document.password) {
    if (!password) {
      throw new Error(ERRORS.PASSWORD_REQUIRED);
    }
    if (password !== document.password) {
      throw new Error(ERRORS.INVALID_PASSWORD);
    }
  }

  return document;
}

/**
 * Process document signing
 */
async function processDocumentSigning(
  signedDocument: File,
  password: string | null,
  blockSlot: number
): Promise<{ hash: string; signature: string }> {
  const signedDocumentBuffer = Buffer.from(await signedDocument.arrayBuffer());
  const signedHash = createFileHash(signedDocumentBuffer, blockSlot, password);
  const memoMessage = `SIGNED_FILE_HASH=${signedHash}`;

  try {
    const transactionSignature = await sendMemoTransaction(memoMessage);
    await confirmTransaction(transactionSignature);

    return {
      hash: signedHash,
      signature: transactionSignature,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("confirmation")) {
      throw new Error(ERRORS.TRANSACTION_CONFIRMATION_FAILED(error));
    }
    throw new Error(ERRORS.TRANSACTION_FAILED(error as Error));
  }
}

/**
 * Update document with signing information
 */
async function updateDocumentWithSignature(
  id: string,
  signedDocument: Buffer,
  signedHash: string,
  transactionSignature: string
): Promise<void> {
  const supabase = await createServerClient();
  const { error: updateError } = await supabase
    .from("documents")
    .update({
      is_signed: true,
      signed_hash: signedHash,
      signed_transaction_signature: transactionSignature,
      signed_document: bufferToHex(signedDocument),
      signed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    throw new Error(ERRORS.DATABASE_ERROR(updateError.message));
  }
}

/**
 * Main POST handler
 */
export async function POST(request: Request) {
  // Check rate limit
  const rateLimited = await rateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    // Validate content type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error(ERRORS.INVALID_CONTENT_TYPE);
    }

    // Parse and validate form data
    const formData = await request.formData();
    const validatedData = FormDataSchema.parse({
      id: formData.get("id"),
      signed_document: formData.get("signed_document"),
      password: formData.get("password"),
    });

    // Validate document access
    await validateDocumentAccess(validatedData.id, validatedData.password);

    // Get block slot and process signing
    const blockSlot = await getLatestBlockSlot();
    const signedDocumentBuffer = Buffer.from(
      await validatedData.signed_document.arrayBuffer()
    );
    const { hash: signedHash, signature: txSignature } =
      await processDocumentSigning(
        validatedData.signed_document,
        validatedData.password,
        blockSlot
      );

    // Update document
    await updateDocumentWithSignature(
      validatedData.id,
      signedDocumentBuffer,
      signedHash,
      txSignature
    );

    return NextResponse.json<SigningResponse>({
      txSignature,
      signedHash,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
