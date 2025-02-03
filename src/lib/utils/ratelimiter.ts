import { NextResponse } from "next/server";
import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RateLimiter = ({
  requests,
  period,
}: {
  requests: number;
  period: Duration;
}) =>
  new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, period),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     */
    prefix: "@upstash/ratelimit",
  });

const defaultRequests = 20;

export const rateLimit = async (request: Request) => {
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (!ip) {
    return NextResponse.json({ error: "No IP was found" }, { status: 400 });
  }

  const rateLimiter = RateLimiter({
    requests: defaultRequests,
    period: "30 s",
  });
  const { success, reset, limit } = await rateLimiter.limit(ip);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000).toString();
    return NextResponse.json(
      {
        error: "Too many requests",
        code: "RATE_LIMIT",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter,
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
        },
      }
    );
  }
  return null;
};
