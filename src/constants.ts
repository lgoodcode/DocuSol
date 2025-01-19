export const IS_PROD = process.env.NODE_ENV === "production";
export const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

export const IS_MOBILE = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const LOADING_MESSAGES = [
  "404: Brain cells not found",
  "Your query has me acting unwise fr fr",
  "No rizz? Loading some...",
  "Touch grass.exe loading...",
  "No bitches? Working on it...",
  "Bussin' through the search results",
  "SHEEEESH still thinking",
  "Getting rekt, gimme a sec fam",
  "Dead ass loading rn",
  "Based algorithm processing...",
  "This ain't bussin fr fr",
  "Skill issue detected",
  "*monke brain loading*",
  "POV: Me being dense AF",
  "Ratio'd by loading time",
  "My brother in Christ, I'm cooking",
  "L + ratio + loading",
  "Certified bruh moment",
  "Vibing in the backrooms",
  "Chief called, this ain't it yet",
  "Down bad in the database",
  "Maidenless behavior detected",
  "Copium levels rising...",
  "Sus loading detected",
  "Living my worst NPC life rn",
  "Touching grass.exe failed successfully",
  "On God, we almost there",
  "No cap, still thinking",
];
