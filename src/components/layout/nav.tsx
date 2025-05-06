"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { captureException } from "@sentry/nextjs";
import { LogOutIcon } from "lucide-react";

import { PAGE_ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { NavButton } from "@/components/layout/nav-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NavTooltip } from "@/components/layout/nav-tooltip";
import { Button } from "../ui/button";

const LogoutButton = () => {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      console.error(logoutError);
      captureException(logoutError);
    }
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-12 w-full bg-primary-foreground/10 text-primary/60 hover:bg-primary hover:text-primary-foreground dark:hover:bg-white dark:hover:text-black"
      onClick={handleLogout}
    >
      <LogOutIcon className="h-5 w-5" />
    </Button>
  );
};

export function Nav() {
  return (
    <>
      <MobileMenu />
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
            {Object.values(PAGE_ROUTES).map(
              (route) =>
                !route.noNav && (
                  <NavButton
                    key={route.name}
                    href={route.path}
                    icon={route.Icon}
                    label={route.name}
                  />
                ),
            )}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="border-t border-stone-300 dark:border-border">
            <ThemeToggle withTooltip />
            <NavTooltip content="Logout">
              <LogoutButton />
            </NavTooltip>
          </div>
        </div>
      </aside>
    </>
  );
}
