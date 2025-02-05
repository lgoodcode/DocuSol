"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next-nprogress-bar";

import { navRoutes } from "@/config/routes";
import { NavButton } from "@/components/layout/nav-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { PrivyAuthButton } from "@/components/layout/privy-auth-button";

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
      router.refresh();
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
                disabled={!authenticated}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <PrivyAuthButton
            ready={ready}
            authenticated={authenticated}
            handleAuthClick={handleAuthClick}
          />
        </div>
      </aside>
    </>
  );
}
