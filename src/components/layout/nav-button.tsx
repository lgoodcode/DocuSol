import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavTooltip } from "@/components/layout/nav-tooltip";

interface NavButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

export function NavButton({ href, icon: Icon, label }: NavButtonProps) {
  return (
    <NavTooltip content={label}>
      <Link href={href}>
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-12 text-primary/60 hover:text-primary-foreground bg-primary-foreground/10 hover:bg-primary dark:hover:bg-white dark:hover:text-black"
        >
          <Icon className="h-5 w-5" />
          <span className="sr-only">{label}</span>
        </Button>
      </Link>
    </NavTooltip>
  );
}
