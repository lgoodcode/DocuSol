"use client";

import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavTooltip } from "@/components/layout/nav-tooltip";

export function PrivyAuthButton({
  ready,
  onClick,
}: {
  ready: boolean;
  onClick: () => void;
}) {
  return (
    <NavTooltip content="Wallet">
      <Button
        variant="ghost"
        size="icon"
        className="w-full h-12 text-primary/60 hover:text-primary-foreground bg-primary-foreground/10 hover:bg-primary dark:hover:bg-white dark:hover:text-black"
        onClick={onClick}
        disabled={!ready}
      >
        <Wallet className="h-5 w-5" />
      </Button>
    </NavTooltip>
  );
}
