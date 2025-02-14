import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { captureException } from "@sentry/nextjs";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

import { generateTokens } from "@/lib/auth/tokens";
import { verifySignature } from "@/lib/auth/wallet";
import { createServerClient } from "@/lib/supabase/server";
import {
  ACCESS_TOKEN_EXPIRATION_SECONDS,
  REFRESH_TOKEN_EXPIRATION_SECONDS,
} from "@/constants";

const ERRORS = {
  INVALID_SIGNATURE: "Invalid wallet signature",
  MISSING_SIGNATURE: "Missing wallet signature",
  MISSING_MESSAGE: "Missing message",
  INVALID_MESSAGE: "Invalid message",
  INVALID_PUBKEY: "Invalid public key",
  MISSING_PUBKEY: "Missing public key",
  DATABASE_ERROR: (message: string) => `Database error: ${message}`,
} as const;

const RequestSchema = z.object({
  publicKey: z
    .string({
      required_error: ERRORS.MISSING_PUBKEY,
      invalid_type_error: ERRORS.INVALID_PUBKEY,
    })
    .refine(
      (val) => {
        try {
          new PublicKey(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: ERRORS.INVALID_PUBKEY },
    ),
  signature: z.array(z.number(), {
    required_error: ERRORS.MISSING_SIGNATURE,
    invalid_type_error: ERRORS.INVALID_SIGNATURE,
  }),
  message: z.array(z.number(), {
    required_error: ERRORS.MISSING_MESSAGE,
    invalid_type_error: ERRORS.INVALID_MESSAGE,
  }),
});

const createErrorResponse = (error: unknown) => {
  console.error("Error authenticating wallet:", error);
  captureException(error);

  if (error instanceof z.ZodError) {
    console.log("Zod error:", error.errors);
    return NextResponse.json(
      { error: JSON.stringify(error.errors), isZodError: true },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    const statusCode = error.message.startsWith("Database error: duplicate")
      ? 409
      : 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};

/**
 * Create a wallet if it doesn't exist in the database
 *
 * @param address the address of the wallet
 * @throws if there is a database error
 */
const createWalletIfNotExists = async (address: string) => {
  const supabase = await createServerClient({ useServiceRole: true });
  const { error } = await supabase.from("wallets").upsert(
    {
      address,
      chain: "solana", // TODO: once we support other chains modify this
    },
    {
      onConflict: "address",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(ERRORS.DATABASE_ERROR(error.message));
  }
};

const createSession = async (tokens: Tokens) => {
  const cookieStore = await cookies();

  // Set access token in an HTTP-only cookie
  cookieStore.set("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: true, // Always use HTTPS because we have self-signed certs in dev
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRATION_SECONDS,
  });

  // Set refresh token in an HTTP-only cookie
  cookieStore.set("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRATION_SECONDS,
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      publicKey: pubkeyString,
      signature,
      message,
    } = RequestSchema.parse(body);

    const publicKey = new PublicKey(pubkeyString);
    const signatureBytes = Uint8Array.from(signature);
    const messageBytes = Uint8Array.from(message);

    // Verify the signature
    const isValid = verifySignature(publicKey, signatureBytes, messageBytes);
    if (!isValid) {
      throw new Error(ERRORS.INVALID_SIGNATURE);
    }

    // Verify wallet exists in database
    await createWalletIfNotExists(publicKey.toBase58());

    // Create the user session
    const tokens = await generateTokens(publicKey);
    await createSession(tokens);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (!(error instanceof z.ZodError)) {
      captureException(error);
    }
    return createErrorResponse(error);
  }
}
