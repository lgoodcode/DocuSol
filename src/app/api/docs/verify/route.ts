import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import { verifyFileHash } from "@/lib/utils/hashing";
import { getConfirmedTransactionSlot } from "@/lib/utils/solana";

type VerifyDocumentDataWithPassword = {
  verifyDocumentData: VerifyDocumentData;
  password: string | null;
};

type VerificationResponse = {
  matches: boolean;
  verifyDocumentData: VerifyDocumentData | null;
};

const ERRORS = {
  INVALID_CONTENT_TYPE: "Invalid content type. Expected multipart/form-data",
  NO_DOCUMENT_ID: "No document ID provided",
  NO_VERSION: "No version provided",
  NO_FILE: "No file provided",
  FETCH_ERROR: (message: string) => `Failed to fetch document: ${message}`,
  DOCUMENT_NOT_FOUND: "Document not found",
  NOT_SIGNED: "Document is not signed",
  SLOT_ERROR: (message: string) =>
    `Failed to get slot for transaction: ${message}`,
} as const;

const ERROR_STATUS_CODES: Record<string, number> = {
  [ERRORS.INVALID_CONTENT_TYPE]: 400,
  [ERRORS.NO_DOCUMENT_ID]: 400,
  [ERRORS.NO_VERSION]: 400,
  [ERRORS.NO_FILE]: 400,
  [ERRORS.DOCUMENT_NOT_FOUND]: 404,
  [ERRORS.NOT_SIGNED]: 401,
};

const FormDataSchema = z.object({
  documentId: z.string({
    required_error: ERRORS.NO_DOCUMENT_ID,
  }),
  version: z.number({
    required_error: ERRORS.NO_VERSION,
  }),
  file: z.instanceof(File, {
    message: ERRORS.NO_FILE,
  }),
});

function getErrorStatusCode(message: string): number {
  // Check if message starts with any of the error keys
  const matchingError = Object.keys(ERROR_STATUS_CODES).find((key) =>
    message.startsWith(key),
  );
  return matchingError ? ERROR_STATUS_CODES[matchingError] : 500;
}

const createErrorResponse = (error: unknown) => {
  console.error("Error processing verify request:", error);
  captureException(error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message },
      { status: 400 },
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
async function fetchDocumentByIdAndVersion(
  documentId: string,
  version: number,
): Promise<VerifyDocumentDataWithPassword> {
  const supabase = await createServerClient();
  const { error, data } = await supabase.rpc("get_document_with_version", {
    p_document_id: documentId,
    p_version: version,
  });

  if (error) {
    throw new Error(ERRORS.FETCH_ERROR(error.message));
  }
  if (!data?.[0]) {
    throw new Error(ERRORS.DOCUMENT_NOT_FOUND);
  }

  const document = data[0];
  if (document.status !== "completed" || !document.completed_at) {
    throw new Error(ERRORS.NOT_SIGNED);
  }

  return {
    verifyDocumentData: {
      id: documentId,
      name: document.name,
      hasPassword: !!document.password,
      createdAt: document.created_at,
      completedAt: document.completed_at,
      txSignature: document.tx_signature,
      hash: document.filehash,
    },
    password: document.password,
  };
}

/**
 * Get confirmation slot for transaction
 */
async function getConfirmationSlot(
  txSignature: string,
  documentId: string,
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
        error instanceof Error ? error.message : "Unknown error",
      ),
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
      documentId: formData.get("documentId"),
      version: formData.get("version"),
      file: formData.get("file"),
    });

    // Fetch document
    const { verifyDocumentData, password } = await fetchDocumentByIdAndVersion(
      validatedData.documentId,
      validatedData.version,
    );

    // Get file buffer
    const fileBuffer = Buffer.from(await validatedData.file.arrayBuffer());

    // Get confirmation slot
    const confirmationSlot = await getConfirmationSlot(
      verifyDocumentData.txSignature,
      verifyDocumentData.id,
    );

    // Verify file hash
    const matches = verifyFileHash(
      fileBuffer,
      verifyDocumentData.hash,
      password,
      confirmationSlot,
    );

    // Return verification result
    return NextResponse.json<VerificationResponse>({
      matches,
      verifyDocumentData,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
