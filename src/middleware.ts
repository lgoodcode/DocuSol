import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { captureException, setUser } from "@sentry/nextjs";

import { AUTHENTICATED_REDIRECT_TO } from "@/constants";
import { handleRateLimit, rateLimit } from "@/lib/auth/ratelimiter";
import { apiRoutes, pageRoutes, accountRoute } from "@/config/routes";
import { getSession } from "@/lib/auth/session";

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

  /**
   * Session handling
   */
  let session: AccessTokenPayload | null = null;
  let redirectToLogin = true;

  if (PROTECTED_ROUTES.includes(request.nextUrl.pathname)) {
    try {
      session = await getSession(request);
      if (session) {
        redirectToLogin = false;
      }
    } catch (error) {
      console.error("Middleware session verification error:", error);
      captureException(error, {
        tags: { context: "middleware-session" },
        extra: { url: request.url },
      });
    }
  }

  if (redirectToLogin) {
    if (isApiRoute(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session) {
    setUser({
      id: session.id,
      publicKey: session.publicKey,
    });

    // If visiting the login page, redirect to the home page
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(
        new URL(AUTHENTICATED_REDIRECT_TO, request.url),
      );
    }
  }

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
