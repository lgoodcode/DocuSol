const requiredEnvList = ["SENTRY_PROJECT", "SENTRY_ORG", "SENTRY_AUTH_TOKEN"];

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
