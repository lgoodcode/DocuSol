import { headers } from "next/headers";

import { RateLimitPageContent } from "./rate-limit-page-content";

export default async function RateLimitErrorPage() {
  const headersList = await headers();
  const retryAfter = headersList.get("Retry-After") || "";

  return <RateLimitPageContent waitTime={retryAfter} />;
}
