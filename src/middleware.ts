import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { captureException, setUser } from "@sentry/nextjs";

import { IS_PROD } from "@/constants";
import { createMiddlewareResponse } from "@/lib/supabase/middleware";
import { handleRateLimit, rateLimit } from "@/lib/auth/ratelimiter";
import { PROTECTED_PATHS, PAGE_PATHS } from "@/config/routes";

const isApiRoute = (request: NextRequest): boolean => {
  return request.nextUrl.pathname.startsWith("/api/");
};

export async function middleware(request: NextRequest) {
  // Prevent direct requests to the error pages
  if (request.nextUrl.pathname.startsWith("/error")) {
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      headers: {
        "x-middleware-rewrite": "/not-found",
      },
    });
  }

  // Rate limit - only in production
  if (IS_PROD) {
    try {
      const rateLimitHeaders = await rateLimit(request);
      if (rateLimitHeaders) {
        return handleRateLimit(request, rateLimitHeaders);
      }
    } catch (error) {
      console.error("Middleware rate limit error:", error);
      captureException(error, {
        tags: { context: "middleware-rate-limit" },
        extra: { url: request.url },
      });

      const response = NextResponse.rewrite(new URL("/error", request.url), {
        status: 500,
      });
      response.headers.set("x-error-rewrite", "true");
      return response;
    }
  }

  // Protected routes
  const { response, user } = await createMiddlewareResponse(request);
  if (!user && PROTECTED_PATHS.includes(request.nextUrl.pathname)) {
    if (isApiRoute(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    setUser({
      id: user.id,
      email: user.email,
    });

    // If visiting the login page, redirect to the home page
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL(PAGE_PATHS.DOCS.LIST, request.url));
    }
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
