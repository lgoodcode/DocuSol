"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { captureException } from "@sentry/nextjs";

import { createClient } from "@/lib/supabase/client";
import { PAGE_PATHS } from "@/config/routes/pages";
import { Button } from "@/components/ui/button";

import { PasswordDialog } from "./password-dialog";

const invalidateToken = async (token: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("email_verification_tokens")
    .update({ invalidated_at: new Date().toISOString() })
    .eq("token", token);

  if (error) {
    throw error;
  }
};

export function PasswordRequiredContent({
  token,
  password,
  onSuccess,
}: {
  token: string;
  password: string;
  onSuccess: () => void;
}) {
  const [passwordDialogOpen, setPasswordDialogOpen] =
    useState<boolean>(!!password);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const handleCorrectPassword = () => {
    setIsPasswordVerified(true);
    onSuccess();
  };

  const handleMaxPasswordAttempts = async () => {
    setError(
      "Too many incorrect password attempts. You can no longer access this document.",
    );
    setIsLockedOut(true);
    setPasswordDialogOpen(false);
    try {
      await invalidateToken(token);
    } catch (error) {
      console.error("Error invalidating token", error);
      captureException(error, { extra: { token } });
    }
  };

  if (isLockedOut) {
    return (
      <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertCircle className="mx-auto h-24 w-24 text-destructive/80" />
          <h1 className="bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-destructive/50 sm:text-5xl md:text-6xl">
            Access Denied
          </h1>
          <p className="mx-auto max-w-lg text-muted-foreground sm:text-lg md:text-xl">
            {error}
          </p>
          <Link href={PAGE_PATHS.DOCS.LIST} className="mt-4 block">
            <Button size="lg" variant="outline">
              Go to My Documents
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PasswordDialog
      open={passwordDialogOpen}
      onOpenChange={setPasswordDialogOpen}
      correctPasswordHash={password}
      onCorrectPassword={handleCorrectPassword}
      onMaxAttempts={handleMaxPasswordAttempts}
    />
  );
}
