import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";

import { rateLimit } from "@/lib/utils/ratelimiter";

export async function middleware(request: Request) {
  const response = NextResponse.next();
  try {
    const rateLimitHeaders = await rateLimit(request);
    if (rateLimitHeaders) {
      const isApiRoute = request.url.includes("/api/");
      if (isApiRoute) {
        return NextResponse.json(
          {
            error: "Too many requests",
            code: "RATE_LIMIT",
            retryAfter: rateLimitHeaders.get("Retry-After"),
          },
          { status: 429, headers: rateLimitHeaders }
        );
      }

      // Set the rate limit headers to the response and handle in layout
      rateLimitHeaders.entries().forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
  } catch (error) {
    console.error(error);
    captureException(error);
    response.headers.set("Middleware-Error", "true");
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (svg, png, jpg, jpeg, gif, webp, mp4)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
