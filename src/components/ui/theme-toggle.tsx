"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavTooltip } from "@/components/layout/nav-tooltip";

function ThemeToggleButton({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: string) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-12 w-full bg-primary-foreground/10 text-primary/60 hover:bg-primary hover:text-primary-foreground dark:hover:bg-white dark:hover:text-black"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}

export function ThemeToggle({
  withTooltip = false,
}: {
  withTooltip?: boolean;
}) {
  const { theme = "dark", setTheme } = useTheme();

  return withTooltip ? (
    <NavTooltip content={theme === "dark" ? "Light theme" : "Dark theme"}>
      <ThemeToggleButton theme={theme} setTheme={setTheme} />
    </NavTooltip>
  ) : (
    <ThemeToggleButton theme={theme} setTheme={setTheme} />
  );
}
