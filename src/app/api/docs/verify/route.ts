import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { rateLimit } from "@/lib/utils/ratelimiter";
import { createServerClient } from "@/lib/supabase/server";
import { verifyFileHash } from "@/lib/utils/hashing";
import { getConfirmedTransactionSlot } from "@/lib/utils/solana";

const ERRORS = {
  INVALID_CONTENT_TYPE: "Invalid content type. Expected multipart/form-data",
  NO_TX_SIGNATURE: "No transaction signature provided",
  NO_FILE: "No file provided",
  FETCH_ERROR: "Failed to fetch document",
  DOCUMENT_NOT_FOUND: "Document not found",
  NOT_SIGNED: "Document is not signed",
  FAILED_TO_GET_SLOT: "Failed to get slot for transaction",
} as const;

export async function POST(request: Request) {
  const rateLimited = await rateLimit(request);
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error(ERRORS.INVALID_CONTENT_TYPE);
    }

    const formData = await request.formData();
    const txSignature = formData.get("txSignature") as string;
    const file = formData.get("file") as File;

    if (!txSignature) {
      throw new Error(ERRORS.NO_TX_SIGNATURE);
    } else if (!file) {
      throw new Error(ERRORS.NO_FILE);
    }

    // Check if document exists
    const supabase = await createServerClient();
    const { error, data } = await supabase
      .from("documents")
      .select(
        "id,name,password,mime_type,is_signed,signed_document,signed_hash,created_at,signed_at"
      )
      .or(
        `unsigned_transaction_signature.eq.${txSignature},signed_transaction_signature.eq.${txSignature}`
      );

    if (error) {
      throw new Error(ERRORS.FETCH_ERROR);
    } else if (!data || !data[0]) {
      throw new Error(ERRORS.DOCUMENT_NOT_FOUND);
    } else if (
      !data[0].is_signed ||
      !data[0].signed_hash ||
      !data[0].signed_at
    ) {
      throw new Error(ERRORS.NOT_SIGNED);
    }

    // Convert the file into buffer and use the exact same timestamp
    // format, otherwise the hash will not match
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let confirmationSlot: number;
    try {
      confirmationSlot = await getConfirmedTransactionSlot(txSignature);
    } catch (error) {
      console.error(error);
      captureException(error, {
        extra: {
          id: data[0].id,
          txSignature,
        },
      });
      throw new Error(ERRORS.FAILED_TO_GET_SLOT);
    }

    const matches = verifyFileHash(
      fileBuffer,
      data[0].signed_hash,
      data[0].password,
      confirmationSlot
    );

    const verifyDocument: VerifyDocument = {
      id: data[0].id,
      name: data[0].name,
      password: !!data[0].password,
      mime_type: data[0].mime_type,
      signed_hash: data[0].signed_hash,
      created_at: data[0].created_at,
      signed_at: data[0].signed_at,
    };

    return NextResponse.json({
      matches,
      verifyDocument: matches ? verifyDocument : null,
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
    case ERRORS.INVALID_CONTENT_TYPE:
      return 400;
    case ERRORS.NO_TX_SIGNATURE:
      return 400;
    case ERRORS.NO_FILE:
      return 400;
    case ERRORS.DOCUMENT_NOT_FOUND:
      return 404;
    case ERRORS.NOT_SIGNED:
      return 401;
    default:
      return 500;
  }
}
