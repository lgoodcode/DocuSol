import { NextRequest } from "next/server";

import { supabaseResponse } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const supabase = supabaseResponse(request);
  return supabase;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
