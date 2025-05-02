import React from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner"; // Assuming spinner is in the same ui folder

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = "Processing...",
  className,
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-lg font-medium text-foreground">{message}</p>
      )}
    </div>
  );
};
