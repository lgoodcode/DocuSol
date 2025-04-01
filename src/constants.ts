export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
export const IS_CI = process.env.CI === "true";

export const ACCESS_TOKEN_EXPIRATION = "1h";
export const REFRESH_TOKEN_EXPIRATION = "14d";
export const ACCESS_TOKEN_EXPIRATION_SECONDS = 60 * 60; // 1 hour in seconds
export const REFRESH_TOKEN_EXPIRATION_SECONDS = 14 * 24 * 60 * 60; // 14 days in seconds

export const IS_MOBILE = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export const PLATFORM_FEE = 100.0001;

/** mime_type: [extensions] */
export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
};
export const ACCEPTED_FILE_EXTENSIONS =
  Object.values(ACCEPTED_FILE_TYPES).flat();

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export const GITHUB_URL = "";
export const CONTRACT_ADDRESS = "2thfFEH6nR7Qbqd315Dt9BjSJRau9YQ4mmBhkAuepump";
export const X_URL = "https://x.com/docusol_";
export const DISCORD_URL = "https://discord.com/invite/docusol";
export const LINKTREE_URL = "https://linktr.ee/docusol";
export const PUMPFUN_URL =
  "https://pump.fun/coin/2thfFEH6nR7Qbqd315Dt9BjSJRau9YQ4mmBhkAuepump";
export const DEXSCREENER_URL =
  "https://dexscreener.com/solana/2thfFEH6nR7Qbqd315Dt9BjSJRau9YQ4mmBhkAuepump";

export const SUPPORT_EMAIL = "support@docusol.app";
