export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const IS_MOBILE = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const ACCEPTED_FILE_TYPES = [".pdf", ".jpeg", ".png", ".jpg"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const GITHUB_URL = "";

export const CONTRACT_ADDRESS = "2thfFEH6nR7Qbqd315Dt9BjSJRau9YQ4mmBhkAuepump";
export const X_URL = "https://x.com/docusol_";
export const PUMPFUN_URL = "";
export const DEXSCREENER_URL = "";

// export const CONTRACT_ADDRESS = "75kZbiQ5TyXLNrmyPTkCpLhP9Jxs8vWr1DwjVcLhpump";
// export const X_URL = "https://x.com/DocuSol";
// export const DEXSCREENER_URL = "https://dexscreener.com";
