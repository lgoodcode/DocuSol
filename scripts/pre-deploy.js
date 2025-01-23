const requiredEnvList = [
  "SENTRY_PROJECT",
  "SENTRY_ORG",
  "SENTRY_AUTH_TOKEN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "HELIUS_API_URL",
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
