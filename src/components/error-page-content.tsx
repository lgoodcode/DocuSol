import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { SUPPORT_EMAIL, SUPPORT_DISCORD_URL } from "@/constants";
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
    <div className="relative overflow-hidden min-h-[calc(100dvh-200px)] flex items-center justify-center">
      <div
        className={cn(
          "relative mx-auto flex flex-col items-center justify-center max-w-4xl text-center gap-4 px-4",
          className
        )}
      >
        <div className="space-y-4">
          <AlertCircle className="h-24 w-24 text-muted-foreground/50 mx-auto" />

          <h1 className="p-2 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-destructive to-destructive/60 dark:to-destructive/50">
            {title}
          </h1>
        </div>

        <div className="w-full space-y-8">
          <p className="sm:text-lg md:text-xl text-muted-foreground mx-auto">
            {message}
          </p>

          <p className="sm:text-lg md:text-xl max-w-xl text-muted-foreground mx-auto">
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
              href={SUPPORT_DISCORD_URL}
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
