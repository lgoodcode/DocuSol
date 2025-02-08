"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { navRoutes } from "@/config/routes";
import { NavButton } from "@/components/layout/nav-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavTooltip } from "@/components/layout/nav-tooltip";
import { WalletDialog } from "@/components/layout/wallet-dialog";

export function Nav() {
  const { connected } = useWallet();
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileMenu connected={connected} onAuthClick={() => null} />
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
            {navRoutes.map((route) => (
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
            <NavTooltip content="Wallet">
              <WalletDialog open={open} setOpen={setOpen} />
            </NavTooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
