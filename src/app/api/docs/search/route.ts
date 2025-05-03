import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import {
  isTransactionSignature,
  getHashFromTransactionSignature,
} from "@/lib/utils/solana";

type DocumentDetailsWithPassword = {
  document: DocumentDetails;
  passwordToCheck: string | null;
};

// Error definitions
const ERRORS = {
  MISSING_VALUE: "Missing required field: value",
  INVALID_VALUE: "Invalid value: must be a valid hash or transaction signature",
  INVALID_TX_SIG: "Invalid transaction signature: no hash found",
  DOCUMENT_NOT_FOUND: "Document not found",
  PASSWORD_REQUIRED: "Password required for this document",
  INVALID_PASSWORD: "Invalid password",
  DATABASE_ERROR: (message: string) => `Database error: ${message}`,
} as const;

const ERROR_STATUS_CODES: Record<string, number> = {
  [ERRORS.MISSING_VALUE]: 400,
  [ERRORS.INVALID_VALUE]: 400,
  [ERRORS.INVALID_TX_SIG]: 400,
  [ERRORS.DOCUMENT_NOT_FOUND]: 404,
  [ERRORS.PASSWORD_REQUIRED]: 401,
  [ERRORS.INVALID_PASSWORD]: 403,
};

const RequestSchema = z.object({
  value: z
    .string({
      required_error: ERRORS.MISSING_VALUE,
    })
    .refine(
      (val) => isTransactionSignature(val) || /^[a-f0-9]{64}$/i.test(val),
      ERRORS.INVALID_VALUE,
    ),
  password: z.string().optional(),
});

const createErrorResponse = (error: unknown) => {
  console.error("Error processing verify request:", error);
  captureException(error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const statusCode = ERROR_STATUS_CODES[error.message] || 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

/**
 * Get hash from input value (either hash or transaction signature)
 */
async function resolveHash(value: string): Promise<string> {
  if (isTransactionSignature(value)) {
    const hash = await getHashFromTransactionSignature(value);
    if (!hash) {
      throw new Error(ERRORS.INVALID_TX_SIG);
    }
    return hash;
  }
  return value;
}

/**
 * Fetch document by hash
 */
async function fetchDocumentByHash(
  hash: string,
): Promise<DocumentDetailsWithPassword> {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .select("*")
    .or(`unsigned_hash.eq.${hash},signed_hash.eq.${hash}`);

  if (error) {
    throw new Error(ERRORS.DATABASE_ERROR(error.message));
  }

  if (!data?.[0]) {
    throw new Error(ERRORS.DOCUMENT_NOT_FOUND);
  }

  return {
    document: {
      ...data[0],
      password: !!data[0].password,
    },
    passwordToCheck: data[0].password,
  };
}

function validateDocumentAccess(
  password: string | undefined,
  passwordToCheck: string | null,
): void {
  if (passwordToCheck) {
    if (!password) {
      throw new Error(ERRORS.PASSWORD_REQUIRED);
    }
    if (password !== passwordToCheck) {
      throw new Error(ERRORS.INVALID_PASSWORD);
    }
  }
}

/**
 * Main POST handler
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { value, password } = RequestSchema.parse(body);

    const hash = await resolveHash(value);
    const { document, passwordToCheck } = await fetchDocumentByHash(hash);

    validateDocumentAccess(password, passwordToCheck);

    return NextResponse.json<DocumentDetails>(document);
  } catch (error) {
    return createErrorResponse(error);
  }
}
