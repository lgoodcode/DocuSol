"use client";

import { useTheme } from "next-themes";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export const ProgressBarProvider = () => {
  const { theme } = useTheme();
  return (
    <ProgressBar
      height="3px"
      color={theme === "dark" ? "#fff" : "#000"}
      options={{
        showSpinner: false,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    />
  );
};
