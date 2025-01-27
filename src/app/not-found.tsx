"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 from-background to-background"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                           linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`,
          backgroundSize: "4rem 4rem",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] dark:opacity-[0.05]">
        <span className="text-[15rem] sm:text-[18rem] md:text-[22rem] lg:text-[35rem] font-bold select-none">
          404
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-dvh px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Page not found</h1>
        <p className="text-muted-foreground mb-8 max-w-sm font-medium">
          We can&apos;t find the page that you&apos;re looking for. Probably the
          link is broken
        </p>
        <div className="flex sm:flex-row gap-2">
          <Link href="/">
            <Button>Take me home</Button>
          </Link>
          <Button onClick={() => window.history.back()}>Go back</Button>
        </div>
      </div>
    </div>
  );
}
