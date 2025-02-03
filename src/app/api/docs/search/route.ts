import { captureException } from "@sentry/nextjs";

import { rateLimit } from "@/lib/utils/ratelimiter";
import { createServerClient } from "@/lib/supabase/server";
import {
  isTransactionSignature,
  getHashFromTransactionSignature,
} from "@/lib/utils/solana";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const rateLimited = await rateLimit(request);
  if (rateLimited) {
    return rateLimited;
  }

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
      .or(`unsigned_hash.eq.${hash},signed_hash.eq.${hash}`);

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

    const documentDetails: DocumentDetails = {
      ...document,
      password: !!document.password,
    };
    return NextResponse.json(documentDetails);
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
