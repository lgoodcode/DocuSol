"use client";

import { LogOut, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavTooltip } from "@/components/layout/nav-tooltip";

export function PrivyAuthButton({
  ready,
  authenticated,
  handleAuthClick,
}: {
  ready: boolean;
  authenticated: boolean;
  handleAuthClick: () => void;
}) {
  return (
    <div className="border-t border-stone-300 dark:border-border">
      <ThemeToggle withTooltip />
      <NavTooltip
        content={authenticated ? "Disconnect Wallet" : "Connect Wallet"}
      >
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-12 text-primary/60 hover:text-primary-foreground bg-primary-foreground/10 hover:bg-primary dark:hover:bg-white dark:hover:text-black"
          onClick={handleAuthClick}
          disabled={!ready}
        >
          {authenticated ? (
            <LogOut className="h-5 w-5" />
          ) : (
            <Wallet className="h-5 w-5" />
          )}
        </Button>
      </NavTooltip>
    </div>
  );
}
