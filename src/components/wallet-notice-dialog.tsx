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

const WALLET_NOTICE_KEY = "wallet-notified";

const getHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isNotified = localStorage.getItem(WALLET_NOTICE_KEY);
  return isNotified ? true : false;
};

const setHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(WALLET_NOTICE_KEY, "true");
};

export function WalletNoticeDialog() {
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
            <DialogTitle>Wallet Integration Notice</DialogTitle>
          </div>
          <DialogDescription>
            The wallet integration feature is currently under development
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            We are working on implementing wallet integration for document
            signing. Currently, this feature is not yet available and documents
            cannot be signed using wallet connections.
          </p>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Document signing with wallet integration will be available in a
              future update. We appreciate your patience as we work to implement
              this feature securely.
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
