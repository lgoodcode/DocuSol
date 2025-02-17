"use client";

import Image from "next/image";
import { LogOut } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { useWalletAuth } from "@/lib/auth/use-wallet-auth";

export function AccountDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { connected, wallet, disconnect } = useWalletAuth();

  if (!connected || !wallet) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">Account</DialogTitle>
          <h1 className="text-center text-2xl font-bold">Account</h1>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <p className="font-medium">Provider</p>
              <div className="flex items-center gap-2">
                <Image
                  src={wallet.adapter.icon}
                  alt={wallet.adapter.name}
                  width={28}
                  height={28}
                />
                <span className="text-lg text-muted-foreground">
                  {wallet.adapter.name}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2">
              <p className="font-medium">Address</p>
              <div className="flex items-center justify-between rounded-md bg-muted-foreground/10 p-2 dark:bg-muted/50">
                <code className="flex-1 break-all font-mono">
                  {wallet.adapter.publicKey?.toBase58()}
                </code>
                <CopyButton
                  value={wallet.adapter.publicKey?.toBase58() ?? ""}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-stone-300 pt-4 dark:border-border">
            <Button variant="destructive" onClick={disconnect}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
