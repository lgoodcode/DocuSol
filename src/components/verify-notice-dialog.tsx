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

const VERIFY_NOTICE_KEY = "verify-notified";

const getHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isNotified = localStorage.getItem(VERIFY_NOTICE_KEY);
  return isNotified ? true : false;
};

const setHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(VERIFY_NOTICE_KEY, "true");
};

export function VerifyNoticeDialog() {
  const [open, setOpen] = useState(!getHasBeenNotified());
  const handleConfirm = () => {
    setHasBeenNotified();
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-2.5">
          <div className="flex gap-2 items-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Important Document Compatibility Notice</DialogTitle>
          </div>
          <DialogDescription>
            A system update is scheduled for January 31st, 2025 that will affect document
            verification
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Documents uploaded prior to 8:30am PST January 31st, 2025 will not be
            compatible with our new self-service verification system. Our
            database will undergo maintenance to implement these improvements.
          </p>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All documents uploaded after 8:30am PST January 31st, 2025 will be
              fully compatible with our self-service verification system. Any
              documents you need verified should be re-uploaded after the
              maintenance is complete.
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
