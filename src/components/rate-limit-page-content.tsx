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
  waitTime = "a few minutes",
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
      waitTime ? parseInt(waitTime) * 1000 : 60000
    );

    return () => clearTimeout(timer);
  }, [waitTime]);

  return (
    <div className="relative overflow-hidden min-h-[calc(100dvh-200px)] flex items-center justify-center">
      <div
        className={cn(
          "relative mx-auto flex flex-col items-center justify-center max-w-4xl text-center gap-4 px-4",
          className
        )}
      >
        <div className="space-y-4">
          <Clock className="h-24 w-24 text-muted-foreground/50 mx-auto" />

          <h1 className="p-2 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-yellow-600/60 dark:to-yellow-500/50">
            Whoa there! Take a breather
          </h1>
        </div>

        <div className="w-full space-y-8">
          <p className="sm:text-lg md:text-xl text-muted-foreground mx-auto">
            You&apos;ve hit our rate limit. Please wait{" "}
            <span className="font-bold text-foreground">{formattedTime}</span>{" "}
            before trying again.
          </p>

          <p className="sm:text-lg md:text-xl max-w-xl text-muted-foreground mx-auto">
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
