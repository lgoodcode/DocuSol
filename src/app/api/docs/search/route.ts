import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import {
  isTransactionSignature,
  getHashFromTransactionSignature,
} from "@/lib/utils/solana";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { value, password } = await request.json();

    if (!value) {
      return Response.json(
        { error: "Missing required field: value" },
        { status: 400 }
      );
    }

    const isTxSig = isTransactionSignature(value);
    const isHash = /^[a-f0-9]{64}$/i.test(value);
    if (!isTxSig && !isHash) {
      return Response.json(
        {
          error: "Invalid value: must be a valid hash or transaction signature",
        },
        { status: 400 }
      );
    }

    let hash = value;
    if (isTxSig) {
      hash = await getHashFromTransactionSignature(value);
      if (!hash) {
        return Response.json(
          { error: "Invalid transaction signature: no hash found" },
          { status: 400 }
        );
      }
    }

    // Get full document details
    const supabase = await createServerClient();
    const { error, data } = await supabase
      .from("documents")
      .select("*")
      .eq("unsigned_hash", hash);

    if (error) {
      throw error;
    } else if (!data || !data[0]) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }
    // Verify password if required
    const document = data[0];
    if (document.password) {
      if (!password) {
        return Response.json(
          { error: "Password required for this document" },
          { status: 401 }
        );
      } else if (password !== document.password) {
        return Response.json({ error: "Invalid password" }, { status: 403 });
      }
    }

    return NextResponse.json(document);
  } catch (err) {
    const error = err as Error;
    console.error(error);
    captureException(error);
    return Response.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
