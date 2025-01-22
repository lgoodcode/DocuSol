"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";

import { Nav } from "@/components/layout/nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <>
      <ProgressBar
        height="2px"
        color={theme === "dark" ? "#fff" : "#000"}
        options={{
          showSpinner: false,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      <div className="relative flex">
        {/* Tech pattern overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 dark:from-primary/[0.03] to-transparent" />
        </div>

        <Nav />
        <main className="relative z-10 flex-1 px-6 mt-[64px] md:mt-0">
          {children}
        </main>
      </div>
    </>
  );
}
