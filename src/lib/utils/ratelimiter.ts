import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

type RateLimitErrorResponse = {
  error: string;
  code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
  retryAfter: string;
};

const RETRY_AFTER = "60s";

const ERROR_MESSAGES = {
  RATE_LIMIT: "Too many requests",
  INTERNAL_ERROR: "Internal server error",
} as const;

const ERROR_CODES = {
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// Separate limits for API calls and page views
const RATE_LIMITERS = {
  api: Ratelimit.slidingWindow(20, "30 s"),
  pages: Ratelimit.slidingWindow(60, "60 s"),
} as const;

// Initialize Redis outside middleware to enable connection reuse
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  automaticDeserialization: false, // Optimize for Edge Runtime
});

// Separate limiters for API and pages
const limiters = {
  api: new Ratelimit({
    redis,
    limiter: RATE_LIMITERS.api,
    analytics: true,
    prefix: "@docusol/ratelimit/api",
    timeout: 1000,
  }),
  pages: new Ratelimit({
    redis,
    limiter: RATE_LIMITERS.pages,
    analytics: true,
    prefix: "@docusol/ratelimit/pages",
    timeout: 1000,
  }),
};

const isApiRoute = (request: Request): boolean => {
  return request.url.startsWith("/api/");
};

const getClientIp = (request: Request): string => {
  const xff =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  return xff ? xff.split(",")[0].trim() : "127.0.0.1";
};

export const rateLimit = async (request: Request) => {
  const ip = getClientIp(request);
  const isApi = isApiRoute(request);
  const rateLimiter = isApi ? limiters.api : limiters.pages;
  const { success, reset, limit } = await rateLimiter.limit(ip);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000).toString();
    const headers = new Headers();
    headers.set("Retry-After", retryAfter);
    headers.set("X-RateLimit-Limit", limit.toString());
    headers.set("X-RateLimit-Remaining", "0");
    headers.set("X-RateLimit-Reset", Math.ceil(reset / 1000).toString());
    return headers;
  }
};

const apiRateLimitResponse = (
  headers: Headers,
): NextResponse<RateLimitErrorResponse> => {
  return NextResponse.json(
    {
      error: ERROR_MESSAGES.RATE_LIMIT,
      code: ERROR_CODES.RATE_LIMIT,
      retryAfter: RETRY_AFTER,
    },
    { status: 429, headers },
  );
};

const errorApiRateLimitResponse = (): NextResponse<RateLimitErrorResponse> => {
  return NextResponse.json(
    {
      error: ERROR_MESSAGES.INTERNAL_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      retryAfter: RETRY_AFTER,
    },
    { status: 500 },
  );
};

export const handleRateLimit = async (
  request: NextRequest,
  rateLimitHeaders: Headers,
) => {
  const isApi = isApiRoute(request);
  try {
    if (isApi) {
      return apiRateLimitResponse(rateLimitHeaders);
    }

    const response = NextResponse.rewrite(
      new URL("/error/rate-limit", request.url),
      {
        status: 429,
      },
    );
    rateLimitHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    response.headers.set("x-error-rewrite", "true");

    return response;
  } catch (error) {
    if (isApi) {
      return errorApiRateLimitResponse();
    }
    throw error;
  }
};
