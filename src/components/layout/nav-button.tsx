import { Button } from "@/components/ui/button";
import { NavTooltip } from "@/components/layout/tooltip";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

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
          className="hover:bg-purple-900/20 transition-colors"
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </Link>
    </NavTooltip>
  );
}
