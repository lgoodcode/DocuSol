import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { captureException } from "@sentry/nextjs";

import { handleRateLimit, rateLimit } from "@/lib/auth/ratelimiter";
import { apiRoutes, pageRoutes, accountRoute } from "@/config/routes";
import { validateSession } from "@/lib/auth/session";
import { AUTHENTICATED_REDIRECT_TO } from "@/constants";

const PROTECTED_ROUTES: string[] = [
  accountRoute.path,
  ...apiRoutes.filter((r) => !!r?.protected).map((r) => r.path),
  ...pageRoutes.filter((r) => !!r?.protected).map((r) => r.path),
];

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

  // Rate limit
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

  // Validate session if visiting a protected route
  if (PROTECTED_ROUTES.includes(request.nextUrl.pathname)) {
    try {
      const sessionValid = await validateSession(request);
      if (sessionValid) {
        // If visiting the login page, redirect to the home page
        if (request.nextUrl.pathname === "/login") {
          return NextResponse.redirect(
            new URL(AUTHENTICATED_REDIRECT_TO, request.url),
          );
        }

        return NextResponse.next();
      }
    } catch (error) {
      console.error("Middleware session verification error:", error);
      captureException(error, {
        tags: { context: "middleware-session" },
        extra: { url: request.url },
      });
    }

    if (isApiRoute(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Otherwise, visiting a public route
  return NextResponse.next();
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
