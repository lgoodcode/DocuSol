"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { motion, AnimatePresence } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { Menu, X, Sun, Moon, LogOut } from "lucide-react";

import { PAGE_ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const useIsFirstRender = () => {
  const isFirst = useRef(true);

  useEffect(() => {
    isFirst.current = false;
  }, []);

  return isFirst.current;
};

export function MobileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const isFirstRender = useIsFirstRender();
  const headerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { theme = "dark", setTheme } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      console.error(logoutError);
      captureException(logoutError);
    }
    router.push("/login");
  };

  const handleSheetOpenChange = (newOpen: boolean) => {
    if (window) {
      const event = (window.event as CustomEvent).detail
        ?.originalEvent as PointerEvent;
      if (!newOpen && event) {
        const menuRect = menuButtonRef.current?.getBoundingClientRect();
        const themeRect = themeButtonRef.current?.getBoundingClientRect();
        const logoRect = logoRef.current?.getBoundingClientRect();

        if (
          menuRect &&
          event.clientX >= menuRect.left &&
          event.clientX <= menuRect.right &&
          event.clientY >= menuRect.top &&
          event.clientY <= menuRect.bottom
        ) {
          setOpen(newOpen);
          return;
        }
        if (
          themeRect &&
          event.clientX >= themeRect.left &&
          event.clientX <= themeRect.right &&
          event.clientY >= themeRect.top &&
          event.clientY <= themeRect.bottom
        ) {
          setTheme(theme === "dark" ? "light" : "dark");
          return;
        }
        if (
          logoRect &&
          event.clientX >= logoRect.left &&
          event.clientX <= logoRect.right &&
          event.clientY >= logoRect.top &&
          event.clientY <= logoRect.bottom
        ) {
          logoRef.current?.click();
        }
      }
      setOpen(true);
    }
  };

  return (
    <div
      ref={headerRef}
      className="fixed right-0 top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link
          ref={logoRef}
          href="/"
          className="flex min-w-fit items-center gap-2 p-2"
        >
          <div className="flex items-center gap-2">
            <Image
              src="/img/branding/logo.webp"
              alt="DocuSol"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="sr-only">DocuSol</span>
            <h1 className="text-xl font-bold">DocuSol</h1>
          </div>
        </Link>

        <Sheet open={open} onOpenChange={handleSheetOpenChange}>
          <div className="flex items-center justify-between gap-2">
            <Button
              ref={themeButtonRef}
              variant="ghost"
              size="icon"
              className="bg-transparent hover:bg-transparent hover:text-primary active:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            >
              {!!theme ? (
                <>
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span className="sr-only">
                    {theme === "dark" ? "Light theme" : "Dark theme"}
                  </span>
                </>
              ) : null}
            </Button>

            <SheetTrigger asChild>
              <Button
                ref={menuButtonRef}
                variant="ghost"
                size="icon"
                className="bg-transparent hover:bg-transparent active:bg-transparent"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={open ? "close" : "menu"}
                    initial={isFirstRender ? false : { opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    {open ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </motion.div>
                </AnimatePresence>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          </div>
          <SheetContent
            ref={headerRef}
            side="right"
            className="mt-[65px] h-[calc(100dvh-64px)] w-full border-l-0 bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 [&>button]:hidden"
            // Full sheet with top section that is commented out below
            // className="w-full border-l-0 [&>button]:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          >
            <div className="flex h-full flex-col">
              {/* If not using the same header to display but instead a separate header on
              the sheet, uncomment this section and restore the commented changes above. */}
              {/* <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="p-2 w-12 h-12 flex items-center gap-2">
                  <Image
                    src="/img/branding/logo.webp"
                    alt="DocuSol"
                    width={318}
                    height={85}
                  />
                  <span className="sr-only">DocuSol</span>
                  <h1 className="text-xl font-bold">DocuSol</h1>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="hover:bg-transparent"
                >
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div> */}
              <ScrollArea className="flex-1">
                <div className="space-y-2 p-4">
                  {Object.values(PAGE_ROUTES).map(
                    (route, i) =>
                      !route.noNav && (
                        <motion.div
                          key={route.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                        >
                          <Link
                            href={route.path}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-4 rounded-none px-4 py-3 text-sm font-medium transition-colors hover:bg-accent",
                              pathname === route.path
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            <route.Icon className="h-6 w-6" />
                            <div className="flex flex-col gap-1">
                              <span>{route.name}</span>
                              <span className="text-xs font-normal">
                                {route.description}
                              </span>
                            </div>
                          </Link>
                        </motion.div>
                      ),
                  )}
                </div>
              </ScrollArea>
              <div className="mt-auto border-t border-border p-4">
                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-4 rounded-none px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <User className="h-6 w-6" />
                    <div className="flex w-full flex-col gap-1 text-left">
                      <span>Account</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Manage your account
                      </span>
                    </div>
                  </button>
                </motion.div> */}
                <motion.div>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-4 rounded-none px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-6 w-6" />
                    <div className="flex w-full flex-col gap-1 text-left">
                      <span>Logout</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Logout from your account
                      </span>
                    </div>
                  </button>
                </motion.div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
