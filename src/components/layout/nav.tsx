"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { pageRoutes } from "@/config/routes/pages";
import { NavButton } from "@/components/layout/nav-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavTooltip } from "@/components/layout/nav-tooltip";
import { AccountDialog } from "@/components/layout/account-dialog";
import { useWallet } from "@/lib/auth/use-wallet";
import { Button } from "../ui/button";
import { User } from "lucide-react";

export function Nav() {
  const { connected } = useWallet();
  const [open, setOpen] = useState(false);
  return (
    <>
      <AccountDialog open={open} setOpen={setOpen} />
      <MobileMenu setAccountDialogOpen={setOpen} />
      <aside className="sticky top-0 z-50 hidden h-screen w-[60px] flex-col border-r border-stone-300 py-4 dark:border-border md:flex">
        <div className="flex flex-1 flex-col">
          <Link href="/" className="mb-3 h-12 w-full">
            <Image
              src="/img/branding/logo.webp"
              alt="DocuSol"
              width={318}
              height={85}
            />
          </Link>

          <nav className="grid gap-0">
            {pageRoutes.map((route) => (
              <NavButton
                key={route.name}
                href={route.path}
                icon={route.Icon}
                label={route.name}
                disabled={!connected}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="border-t border-stone-300 dark:border-border">
            <ThemeToggle withTooltip />
            <NavTooltip content="Account">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-full bg-primary-foreground/10 text-primary/60 hover:bg-primary hover:text-primary-foreground dark:hover:bg-white dark:hover:text-black"
                onClick={() => setOpen(true)}
              >
                <User className="h-5 w-5" />
              </Button>
            </NavTooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
