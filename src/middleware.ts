import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { captureException, setUser } from "@sentry/nextjs";

import { handleRateLimit, rateLimit } from "@/lib/auth/ratelimiter";
import { PROTECTED_PATHS, PAGE_PATHS } from "@/config/routes";
import { getSession, clearSession } from "@/lib/auth/session";

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
  let redirectToLogin = false;

  if (PROTECTED_PATHS.includes(request.nextUrl.pathname)) {
    try {
      session = await getSession(request);
      if (!session) {
        redirectToLogin = true;
        await clearSession();
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message !== "No access token or refresh token found"
      ) {
        console.error("Middleware session verification error:", error);
        captureException(error, {
          tags: { context: "middleware-session" },
          extra: { url: request.url },
        });
      }
      redirectToLogin = true;
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
      return NextResponse.redirect(new URL(PAGE_PATHS.DOCS.LIST, request.url));
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
