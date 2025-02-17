"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next-nprogress-bar";
import { Clock } from "lucide-react";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RateLimitPageProps {
  className?: string;
  waitTime?: string;
}

export function RateLimitPageContent({
  className,
  waitTime,
}: RateLimitPageProps) {
  const router = useRouter();
  const [showRetry, setShowRetry] = useState(false);
  const formattedTime = waitTime
    ? parseInt(waitTime) > 60
      ? `${Math.ceil(parseInt(waitTime) / 60)} minutes`
      : `${waitTime} seconds`
    : "a few minutes";

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setShowRetry(true);
      },
      waitTime ? parseInt(waitTime) * 1000 : 60000,
    );

    return () => clearTimeout(timer);
  }, [waitTime]);

  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div
        className={cn(
          "relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center",
          className,
        )}
      >
        <div className="space-y-4">
          <Clock className="mx-auto h-24 w-24 text-muted-foreground/50" />

          <h1 className="bg-gradient-to-r from-yellow-500 to-yellow-600/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-yellow-500/50 sm:text-5xl md:text-6xl">
            Whoa there! Take a breather
          </h1>
        </div>

        <div className="w-full space-y-8">
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            You&apos;ve hit our rate limit. Please wait{" "}
            <span className="font-bold text-foreground">{formattedTime}</span>{" "}
            before trying again.
          </p>

          <p className="mx-auto max-w-xl text-muted-foreground sm:text-lg md:text-xl">
            If you believe this is a mistake, please contact support via{" "}
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              target="_blank"
              className="text-primary underline"
            >
              {SUPPORT_EMAIL}
            </Link>{" "}
            or via the ticketing system in our{" "}
            <Link
              href={DISCORD_URL}
              target="_blank"
              className="text-primary underline"
            >
              Discord
            </Link>
            .
          </p>

          {showRetry && (
            <Button
              variant="outline"
              onClick={() => router.refresh()}
              className="mx-auto"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
