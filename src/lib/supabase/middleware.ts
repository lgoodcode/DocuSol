import { type NextRequest, NextResponse } from "next/server";

export const supabaseResponse = (request: NextRequest) => {
  // Create an unmodified response
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return supabaseResponse;
};
