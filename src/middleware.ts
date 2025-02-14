import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { captureException } from "@sentry/nextjs";
import { handleRateLimit, rateLimit } from "@/lib/utils/ratelimiter";

export async function middleware(request: NextRequest) {
  // Prevent direct requests to the error pages
  if (request.nextUrl.pathname.startsWith("/error")) {
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      headers: {
        "x-middleware-rewrite": "/not-found",
      },
    });
  }

  // Rate limit
  try {
    const rateLimitHeaders = await rateLimit(request);
    if (rateLimitHeaders) {
      return handleRateLimit(request, rateLimitHeaders);
    }
  } catch (error) {
    console.error("Middleware rate limit error:", error);
    captureException(error, {
      tags: { context: "middleware" },
      extra: { url: request.url },
    });

    const response = NextResponse.rewrite(new URL("/error", request.url), {
      status: 500,
    });
    response.headers.set("x-error-rewrite", "true");
    return response;
  }

  // Validate session if visiting a protected route
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.redirect(new URL("/api/auth/login", request.url));
    }
  }
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
