import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import { isWalletAddress } from "@/lib/utils/solana";
const ERRORS = {
  MISSING_ADDRESS: "No wallet address provided",
  INVALID_WALLET: "Invalid Solana wallet address",
  DATABASE_ERROR: (message: string) => `Database error: ${message}`,
} as const;

const RequestSchema = z.object({
  address: z
    .string({
      required_error: ERRORS.MISSING_ADDRESS,
    })
    .refine(isWalletAddress, ERRORS.INVALID_WALLET),
});

const createErrorResponse = (error: unknown) => {
  console.error("Error processing wallet creation:", error);
  captureException(error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.errors[0].message },
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

const createWalletIfNotExists = async (address: string) => {
  const supabase = await createServerClient({ useServiceRole: true });

  const { error: fetchError, data } = await supabase
    .from("wallets")
    .select("address")
    .eq("address", address)
    .single();

  if (!fetchError || fetchError.code === "PGRST116") {
    if (data) return;

    const { error: insertError } = await supabase
      .from("wallets")
      .insert({ address });

    if (!insertError) return;
  }
  throw new Error(ERRORS.DATABASE_ERROR(fetchError.message));
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = RequestSchema.parse(body);

    await createWalletIfNotExists(address);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
