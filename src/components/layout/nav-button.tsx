import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavTooltip } from "@/components/layout/nav-tooltip";

interface NavButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}

export function NavButton({
  href,
  icon: Icon,
  label,
  disabled,
}: NavButtonProps) {
  return (
    <NavTooltip content={label}>
      <Link
        href={href}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          }
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-full bg-primary-foreground/10 text-primary/60 hover:bg-primary hover:text-primary-foreground dark:hover:bg-white dark:hover:text-black"
          disabled={!!disabled}
        >
          <Icon className="h-5 w-5" />
          <span className="sr-only">{label}</span>
        </Button>
      </Link>
    </NavTooltip>
  );
}
