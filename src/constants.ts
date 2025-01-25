export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const IS_MOBILE = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const GITHUB_URL = "https://github.com/DocuSol";

// export const CONTRACT_ADDRESS = "";
// export const X_URL = "";
// export const PUMPFUN_URL = "";
// export const DEXSCREENER_URL = "";

export const CONTRACT_ADDRESS = "75kZbiQ5TyXLNrmyPTkCpLhP9Jxs8vWr1DwjVcLhpump";
export const X_URL = "https://x.com/DocuSol";
export const DEXSCREENER_URL = "https://dexscreener.com";
