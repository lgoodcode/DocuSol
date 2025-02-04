import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import { verifyFileHash } from "@/lib/utils/hashing";
import { getConfirmedTransactionSlot } from "@/lib/utils/solana";

type VerificationResponse = {
  matches: boolean;
  verifyDocument: VerifyDocument | null;
};

const ERRORS = {
  INVALID_CONTENT_TYPE: "Invalid content type. Expected multipart/form-data",
  NO_TX_SIGNATURE: "No transaction signature provided",
  NO_FILE: "No file provided",
  FETCH_ERROR: (message: string) => `Failed to fetch document: ${message}`,
  DOCUMENT_NOT_FOUND: "Document not found",
  NOT_SIGNED: "Document is not signed",
  SLOT_ERROR: (message: string) =>
    `Failed to get slot for transaction: ${message}`,
} as const;

const ERROR_STATUS_CODES: Record<string, number> = {
  [ERRORS.INVALID_CONTENT_TYPE]: 400,
  [ERRORS.NO_TX_SIGNATURE]: 400,
  [ERRORS.NO_FILE]: 400,
  [ERRORS.DOCUMENT_NOT_FOUND]: 404,
  [ERRORS.NOT_SIGNED]: 401,
};

const FormDataSchema = z.object({
  txSignature: z.string({
    required_error: ERRORS.NO_TX_SIGNATURE,
  }),
  file: z.instanceof(File, {
    message: ERRORS.NO_FILE,
  }),
});

function getErrorStatusCode(message: string): number {
  // Check if message starts with any of the error keys
  const matchingError = Object.keys(ERROR_STATUS_CODES).find((key) =>
    message.startsWith(key)
  );
  return matchingError ? ERROR_STATUS_CODES[matchingError] : 500;
}

const createErrorResponse = (error: unknown) => {
  console.error("Error processing verify request:", error);
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
 * Fetch document by transaction signature
 */
async function fetchDocumentByTxSignature(
  txSignature: string
): Promise<VerifyDocument> {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .select(
      "id,name,password,mime_type,is_signed,signed_hash,created_at,signed_at"
    )
    .or(
      `unsigned_transaction_signature.eq.${txSignature},signed_transaction_signature.eq.${txSignature}`
    );

  if (error) {
    throw new Error(ERRORS.FETCH_ERROR(error.message));
  }
  if (!data?.[0]) {
    throw new Error(ERRORS.DOCUMENT_NOT_FOUND);
  }

  const document = data[0];
  if (!document.is_signed || !document.signed_hash || !document.signed_at) {
    throw new Error(ERRORS.NOT_SIGNED);
  }

  return {
    id: document.id,
    name: document.name,
    password: document.password,
    mime_type: document.mime_type,
    signed_hash: document.signed_hash,
    created_at: document.created_at,
    signed_at: document.signed_at,
  };
}

/**
 * Get confirmation slot for transaction
 */
async function getConfirmationSlot(
  txSignature: string,
  documentId: string
): Promise<number> {
  try {
    return await getConfirmedTransactionSlot(txSignature);
  } catch (error) {
    captureException(error, {
      tags: { context: "slot_confirmation" },
      extra: { documentId, txSignature },
    });
    throw new Error(
      ERRORS.SLOT_ERROR(
        error instanceof Error ? error.message : "Unknown error"
      )
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error(ERRORS.INVALID_CONTENT_TYPE);
    }

    const formData = await request.formData();
    const validatedData = FormDataSchema.parse({
      txSignature: formData.get("txSignature"),
      file: formData.get("file"),
    });

    // Fetch document
    const document = await fetchDocumentByTxSignature(
      validatedData.txSignature
    );

    // Get file buffer
    const fileBuffer = Buffer.from(await validatedData.file.arrayBuffer());

    // Get confirmation slot
    const confirmationSlot = await getConfirmationSlot(
      validatedData.txSignature,
      document.id
    );

    // Verify file hash
    const matches = verifyFileHash(
      fileBuffer,
      document.signed_hash,
      document.password,
      confirmationSlot
    );

    // Return verification result
    return NextResponse.json<VerificationResponse>({
      matches,
      verifyDocument: matches ? document : null,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
