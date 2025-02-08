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

const DATABASE_WIPE_KEY = "wipe-notified";

const getHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const isNotified = localStorage.getItem(DATABASE_WIPE_KEY);
  return isNotified ? true : false;
};

const setHasBeenNotified = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(DATABASE_WIPE_KEY, "true");
};

export function DatabaseWipeDialog() {
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
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Database Maintenance</DialogTitle>
          </div>
          <DialogDescription>
            Our database will be wiped on{" "}
            <span className="font-medium">January 31st, 2025</span>. Please
            ensure you have downloaded any important documents before this date.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-4">
          <p className="text-sm text-muted-foreground">
            This is a scheduled maintenance to improve our service during our
            beta phase. All user data, including documents and signatures will
            be permanently deleted.
          </p>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              While unlikely, an additional maintenance wipe may be required as
              we finalize our beta infrastructure. We expect to have this fully
              resolved within a week. We appreciate your understanding during
              this beta period.
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
