"use client";

import { useState, FormEvent } from "react";
import { AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MAX_ATTEMPTS = 3;

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  correctPasswordHash: string; // Assume we pass the hash to compare against
  onCorrectPassword: (password: string) => void; // Pass the entered password back
  onMaxAttempts: () => void;
}

export function PasswordDialog({
  open,
  onOpenChange,
  correctPasswordHash, // TODO: Implement hashing comparison
  onCorrectPassword,
  onMaxAttempts,
}: PasswordDialogProps) {
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [attempts, setAttempts] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || attempts >= MAX_ATTEMPTS) return;

    setIsSubmitting(true);
    setError(null);

    const isCorrect = passwordInput === correctPasswordHash;

    if (isCorrect) {
      onCorrectPassword(passwordInput);
      setPasswordInput("");
      setAttempts(0);
      setError(null);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPasswordInput("");

      if (newAttempts >= MAX_ATTEMPTS) {
        setError("Too many incorrect attempts.");
        onMaxAttempts();
      } else {
        setError(
          `Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
        );
      }
    }
    setIsSubmitting(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPasswordInput("");
      setAttempts(0);
      setError(null);
      setIsSubmitting(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        noClose
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Password Required</DialogTitle>
          <DialogDescription>
            This document is password protected. Please enter the password to
            continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid items-center">
            <Input
              id="password-input"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="col-span-3"
              required
              disabled={attempts >= MAX_ATTEMPTS || isSubmitting}
              aria-describedby={error ? "password-error" : undefined}
            />
          </div>

          {error && (
            <Alert
              id="password-error"
              variant={attempts >= MAX_ATTEMPTS ? "destructive" : "warning"}
              aria-live="assertive"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !passwordInput || attempts >= MAX_ATTEMPTS || isSubmitting
              }
            >
              {isSubmitting ? "Verifying..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
