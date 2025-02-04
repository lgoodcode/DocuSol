import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { captureException } from "@sentry/nextjs";
import { rateLimit } from "@/lib/utils/ratelimiter";

const ERROR_MESSAGES = {
  RATE_LIMIT: "Too many requests",
  INTERNAL_ERROR: "Internal server error",
} as const;

const ERROR_CODES = {
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

type RateLimitErrorResponse = {
  error: string;
  code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
  retryAfter: string;
};

const isApiRoute = (request: NextRequest): boolean => {
  return request.nextUrl.pathname.startsWith("/api/");
};

const createRateLimitApiResponse = (
  headers: Headers,
  status: number = 429
): NextResponse<RateLimitErrorResponse> => {
  return NextResponse.json(
    {
      error: ERROR_MESSAGES.RATE_LIMIT,
      code: ERROR_CODES.RATE_LIMIT,
      retryAfter: headers.get("Retry-After") || "60",
    },
    { status, headers }
  );
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isApi = isApiRoute(request);

  try {
    const rateLimitHeaders = await rateLimit(request);
    if (!rateLimitHeaders) {
      return response;
    }
    // Add current path to headers for layout handling
    const currentPath = new URL(request.url).pathname;
    rateLimitHeaders.set("x-invoke-path", currentPath);

    // Handle API routes differently
    if (isApi) {
      return createRateLimitApiResponse(rateLimitHeaders);
    }

    // For page routes, add rate limit headers to response
    rateLimitHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    captureException(error, {
      tags: { context: "middleware" },
      extra: { url: request.url },
    });

    // Set error header for debugging
    response.headers.set("X-Middleware-Error", "true");

    // For API routes, return error response
    if (isApi) {
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.INTERNAL_ERROR,
          code: ERROR_CODES.INTERNAL_ERROR,
          retryAfter: "60",
        },
        { status: 500 }
      );
    }

    return response;
  }
}

// Static file extensions to exclude
const STATIC_FILE_EXTENSIONS = [
  "svg",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "mp4",
  "ico",
  "css",
  "js",
] as const;

// Middleware configuration
export const config = {
  matcher: [
    // Exclude Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
    // Exclude static files using regex
    `/((?!\\.(${STATIC_FILE_EXTENSIONS.join("|")})).*)`,
  ],
};
