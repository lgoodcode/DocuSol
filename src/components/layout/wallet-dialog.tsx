"use client";

import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

export function WalletDialog({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const { select, wallets, disconnect, wallet, connected, connecting } =
    useWallet();
  const walletsInstalled = wallets.filter(
    (wallet) => wallet.readyState === "Installed",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children || (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-full bg-primary-foreground/10 text-primary/60 hover:bg-primary hover:text-primary-foreground dark:hover:bg-white dark:hover:text-black"
            onClick={() => setOpen(!open)}
          >
            <Wallet className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        // Suppresses the "aria-describedby" warning
        aria-describedby={undefined}
      >
        <DialogHeader>
          {/* Suppresses the DialogTitle required warning */}
          <DialogTitle className="sr-only">
            {wallet ? "Connected Wallet" : "Connect Wallet to Continue"}
          </DialogTitle>
          <h1 className="text-center text-2xl font-bold">
            {wallet ? "Connected Wallet" : "Connect Wallet to Continue"}
          </h1>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col gap-6">
          {!connected && connecting && (
            <div className="flex flex-col items-center gap-12 py-6">
              <Wallet className="h-12 w-12 animate-pulse text-muted-foreground" />
            </div>
          )}

          {!connected && !connecting && (
            <div className="flex flex-col items-center gap-12 py-6">
              <Wallet className="h-12 w-12" />

              {!walletsInstalled.length && (
                <p className="text-muted-foreground">
                  No wallets installed. Please install a wallet to continue.
                </p>
              )}

              {walletsInstalled.length && (
                <div className="flex w-full flex-col gap-2">
                  {walletsInstalled.map((wallet) => (
                    <Button
                      key={wallet.adapter.name}
                      variant="ghost"
                      onClick={() => select(wallet.adapter.name)}
                      className="w-full justify-start gap-4 px-4 py-6 text-left text-lg"
                    >
                      <Image
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name}
                        width={28}
                        height={28}
                      />
                      {wallet.adapter.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {connected && (
            <>
              <div className="space-y-4">
                {wallet && (
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
                )}

                <div className="flex w-full flex-col gap-2">
                  <p className="font-medium">Address</p>
                  <div className="flex items-center justify-between rounded-md bg-muted-foreground/10 p-2 dark:bg-muted/50">
                    <code className="flex-1 break-all font-mono">
                      {wallet?.adapter.publicKey?.toBase58()}
                    </code>
                    <CopyButton
                      value={wallet?.adapter.publicKey?.toBase58() ?? ""}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-stone-300 pt-4 dark:border-border">
                <Button variant="destructive" onClick={disconnect}>
                  Disconnect
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
