const requiredEnvList = [
  "SENTRY_PROJECT",
  "SENTRY_ORG",
  "SENTRY_AUTH_TOKEN",
  "NEXT_PUBLIC_SENTRY_DSN",

  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",

  "NEXT_PUBLIC_HELIUS_API_URL",

  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

// Skip checking environment variables if in local development or running on CI
if (
  process.env.NODE_ENV &&
  process.env.NODE_ENV !== "development" &&
  !process.env.CIRCLECI
) {
  requiredEnvList.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is not defined`);
    }

    console.log("✅", envVar, "is defined");
  });
}
