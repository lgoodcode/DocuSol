"use client";

import Link from "next/link";
import { useRouter } from "next-nprogress-bar";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
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
        <span className="select-none text-[15rem] font-bold sm:text-[18rem] md:text-[22rem] lg:text-[35rem]">
          404
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold">Page not found</h1>
        <p className="mb-8 max-w-sm font-medium text-muted-foreground">
          We can&apos;t find the page that you&apos;re looking for. Probably the
          link is broken
        </p>
        <div className="flex gap-2 sm:flex-row">
          <Link href="/">
            <Button>Take me home</Button>
          </Link>
          <Button onClick={() => router.back()}>Go back</Button>
        </div>
      </div>
    </div>
  );
}
