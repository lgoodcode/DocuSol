import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { clearSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    captureException(error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
