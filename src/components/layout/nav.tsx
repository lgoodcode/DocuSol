"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next-nprogress-bar";

import { LogOut, User } from "lucide-react";

import { navRoutes } from "@/config/routes";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavButton } from "@/components/layout/nav-button";
import { NavTooltip } from "@/components/layout/nav-tooltip";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function Nav() {
  const router = useRouter();
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (user) {
    console.log(user);
  }

  const handleAuthClick = () => {
    if (!ready) return;
    if (authenticated) {
      logout();
      router.push("/");
    } else {
      login();
    }
  };

  return (
    <>
      <MobileMenu authenticated={authenticated} onAuthClick={handleAuthClick} />
      <aside className="w-[60px] py-4 hidden md:flex flex-col border-r border-stone-300 dark:border-border sticky top-0 h-screen z-50">
        <div className="flex flex-col flex-1">
          <Link href="/" className="w-full h-12 mb-3">
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
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="border-t border-stone-300 dark:border-border">
            <ThemeToggle withTooltip />
            <NavTooltip content={authenticated ? "Logout" : "Login"}>
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
                  <User className="h-5 w-5" />
                )}
              </Button>
            </NavTooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
