import crypto from "crypto";
import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { supabase } from "@/lib/supabase/client";
import { sendMemoTransaction, getTransactionUrl } from "@/lib/utils/solana";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const unsignedHash = form.get("hash") as string | null;
    const password = form.get("password") as string | null;

    if (!file || !unsignedHash) {
      throw new Error("Missing required fields: file and/or hash");
    }

    // Check if document exists
    const { error: fetchError, data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("unsigned_hash", unsignedHash)
      .single();

    if (fetchError || !document) {
      throw new Error("Document not found");
    }

    if (document.is_signed) {
      return NextResponse.json(
        {
          error: "Document is already signed",
          signedAt: document.signed_at,
        },
        { status: 409 }
      );
    }

    if (document.password) {
      if (!password) {
        throw new Error("Password required for this document");
      }

      if (password !== document.password) {
        throw new Error("Invalid password");
      }
    }

    // Process signed document
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const signedHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Send memo transaction for signed document
    const memoMessage = `SIGNED_FILE_HASH=${signedHash}`;
    const transactionSignature = await sendMemoTransaction(memoMessage);

    // Update document with signed information
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        is_signed: true,
        signed_hash: signedHash,
        transaction_signature: transactionSignature,
        signed_file: fileBuffer,
        signed_at: new Date().toISOString(),
      })
      .eq("unsigned_hash", unsignedHash);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "Document signed successfully",
      unsignedHash,
      signedHash,
      transactionUrl: getTransactionUrl(transactionSignature),
      signedAt: Math.floor(Date.now() / 1000),
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
    case "Missing required fields: file and/or hash":
      return 400;
    case "Document not found":
      return 404;
    case "Password required for this document":
    case "Invalid password":
      return 401;
    default:
      return 500;
  }
}
