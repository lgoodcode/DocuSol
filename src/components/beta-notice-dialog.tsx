"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const BETA_NOTICE_KEY = "beta-notified";

const getHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isNotified = localStorage.getItem(BETA_NOTICE_KEY);
  return isNotified ? true : false;
};

const setHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(BETA_NOTICE_KEY, "true");
};

export function BetaNoticeDialog() {
  const [open, setOpen] = useState(!getHasBeenNotified());

  const handleConfirm = () => {
    setHasBeenNotified();
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <DialogTitle>Beta Version Notice</DialogTitle>
          </div>
          <DialogDescription>
            Welcome! You&apos;re accessing an early beta version of our
            application.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <p className="text-sm text-muted-foreground">
            As this is a beta releases, you may encounter occasional issues or
            interruptions in service. We&apos;re actively working on
            improvements and appreciate your understanding and feedback during
            this phase.
          </p>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some features may be incomplete or subject to change. Your data
              and experience might be impacted by ongoing development and
              updates.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleConfirm}>
            I understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
