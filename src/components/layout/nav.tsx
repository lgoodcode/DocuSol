"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";

import { navRoutes, accountRoute } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavButton } from "@/components/layout/nav-button";
import { NavTooltip } from "@/components/layout/nav-tooltip";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function Nav() {
  return (
    <>
      <MobileMenu />
      <aside className="w-[60px] py-4 hidden md:flex flex-col border-r border-border sticky top-0 h-screen z-50">
        <div className="flex flex-col flex-1">
          <Link href="/" className="p-3 w-full h-12 mb-3">
            <Image
              src="/img/docusol_icon.png"
              alt="DocuSol"
              width={318}
              height={85}
            />
          </Link>

          <nav className="grid gap-0">
            {navRoutes.map((route) => (
              <NavButton
                key={route.name}
                href={route.path}
                icon={route.Icon}
                label={route.name}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="border-t border-border">
            <ThemeToggle withTooltip />
            <NavTooltip content="Account">
              <Link href={accountRoute.path}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-12 text-primary/60 hover:text-primary-foreground bg-primary-foreground/10 hover:bg-primary dark:hover:bg-white dark:hover:text-black"
                >
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </NavTooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
