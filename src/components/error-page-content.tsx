import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  title?: string;
  message?: string;
  className?: string;
  retry?: () => void;
}

export function ErrorPageContent({
  title = "Something went wrong",
  message = "An error occurred while processing your request. Please try again later.",
  className,
  retry,
}: ErrorPageProps) {
  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div
        className={cn(
          "relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center",
          className,
        )}
      >
        <div className="space-y-4">
          <AlertCircle className="mx-auto h-24 w-24 text-destructive/80" />

          <h1 className="bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-destructive/50 sm:text-5xl md:text-6xl">
            {title}
          </h1>
        </div>

        <div className="w-full space-y-8">
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            {message}
          </p>

          <p className="mx-auto max-w-xl text-muted-foreground sm:text-lg md:text-xl">
            If this was a mistake, please contact support via{" "}
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

          {retry && (
            <Button variant="outline" onClick={retry} className="mx-auto">
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
