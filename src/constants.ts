export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";
export const IS_CI = process.env.CI === "true";

export const IS_MOBILE = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/** mime_type: [extensions] */
export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpeg"],
  "image/jpg": [".jpg"],
};
export const ACCEPTED_FILE_EXTENSIONS =
  Object.values(ACCEPTED_FILE_TYPES).flat();

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export const GITHUB_URL = "";
export const CONTRACT_ADDRESS = "2thfFEH6nR7Qbqd315Dt9BjSJRau9YQ4mmBhkAuepump";
export const X_URL = "https://x.com/docusol_";
export const PUMPFUN_URL = "";
export const DEXSCREENER_URL = "";

export const SUPPORT_EMAIL = "support@docusol.app";
export const SUPPORT_DISCORD_URL = "https://discord.gg/docusol";
