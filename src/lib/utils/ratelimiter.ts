import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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
  return null;
};
