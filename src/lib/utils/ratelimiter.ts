import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimit = {
  requests: number;
  period: Duration;
};

const RATE_LIMIT: RateLimit = {
  requests: 20,
  period: "30 s",
};

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

export const rateLimit = async (request: Request) => {
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (!ip) {
    throw new Error("No IP was found");
  }

  const rateLimiter = RateLimiter({
    requests: RATE_LIMIT.requests,
    period: RATE_LIMIT.period,
  });
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
