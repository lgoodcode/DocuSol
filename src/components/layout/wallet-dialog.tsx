"use client";

import Image from "next/image";
import { Wallet, AlertCircle } from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWalletAuth } from "@/hooks/use-connect-wallet";

export function WalletDialog({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const {
    error,
    selectWallet,
    wallets,
    disconnect,
    wallet,
    connecting,
    authenticated,
    authenticating,
  } = useWalletAuth();
  const isLoading = authenticating || connecting;
  const walletsInstalled = wallets.filter(
    (wallet) => wallet.readyState === "Installed",
  );

  return (
    <Dialog open={open || authenticating} onOpenChange={setOpen}>
      {children || (
        <DialogTrigger asChild>
          <Button
            id="wallet-dialog-trigger"
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
        onInteractOutside={(e) => {
          if (!authenticating && authenticated) {
            e.preventDefault();
          }
        }}
        // Suppresses the "aria-describedby" warning
        aria-describedby={undefined}
      >
        <DialogHeader className="flex flex-col gap-2">
          {/* Suppresses the DialogTitle required warning */}
          <DialogTitle className="sr-only">
            {authenticated
              ? "Connected Wallet"
              : isLoading
                ? "Connecting..."
                : "Connect Wallet"}
          </DialogTitle>
          <h1 className="text-center text-2xl font-bold">
            {authenticated
              ? "Connected Wallet"
              : isLoading
                ? "Connecting..."
                : "Connect Wallet"}
          </h1>
          <p className="text-center text-muted-foreground">
            Please sign the message to authenticate your wallet in the wallet
            provider popup window
          </p>
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-col gap-6">
          {/* Connecting */}
          {!error && !authenticated && isLoading && (
            <div className="flex flex-col items-center gap-12 py-6">
              <Wallet className="h-12 w-12 animate-pulse text-muted-foreground" />
            </div>
          )}

          {/* No wallet adapters installed */}
          {!authenticated && !isLoading && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Wallet className="h-12 w-12" />

              {!walletsInstalled.length && (
                <p className="text-muted-foreground">
                  No wallets installed. Please install a wallet to use the app.
                </p>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {walletsInstalled.length && (
                <div className="flex w-full flex-col gap-2">
                  {walletsInstalled.map((wallet) => (
                    <Button
                      key={wallet.adapter.name}
                      variant="ghost"
                      onClick={() => selectWallet(wallet.adapter.name)}
                      className="w-full justify-start gap-6 px-4 py-6 text-left text-lg"
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

          {/* Connected */}
          {!error && authenticated && !isLoading && (
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
