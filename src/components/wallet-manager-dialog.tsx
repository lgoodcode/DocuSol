"use client";

import {
  ConnectedSolanaWallet,
  usePrivy,
  User,
  useSolanaWallets,
} from "@privy-io/react-auth";
import { useRouter } from "next-nprogress-bar";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const getAuthType = (user: User) => {
  if (!!user?.google) return "Google";
  if (!!user?.apple) return "Apple";
  if (!!user?.discord) return "Discord";
  if (!!user?.github) return "GitHub";
  if (!!user?.twitter) return "Twitter";
  if (!!user?.email?.address) return "Email";
  if (!!user?.wallet?.address) return "Wallet";
  return "Unknown";
};

const getWalletType = (wallet: ConnectedSolanaWallet) => {
  if (wallet.walletClientType === "privy") return "Embedded (built-in)";
  if (wallet.walletClientType === "phantom") return "Phantom";
  return "Solana";
};

export function WalletManagerDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { ready, authenticated, user, logout, connectOrCreateWallet } =
    usePrivy();
  const { wallets } = useSolanaWallets();
  const activeWallet = wallets?.[0];

  const handleLogout = () => {
    if (ready && authenticated) {
      logout();
    }
    if (activeWallet) {
      activeWallet.disconnect();
    }
    router.refresh();
  };

  console.log({
    user,
    authenticated,
    wallets,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>User and Wallet Information</DialogTitle>
          <DialogDescription>
            Authenticate and connect your wallet. This will be used to sign your
            documents and will be visible to other users in transactions.
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="mt-4 flex flex-col gap-6">
          {activeWallet ? (
            <div className="space-y-4">
              {user?.email?.address && (
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">
                    {user?.email?.address}
                  </p>
                </div>
              )}

              {user && (
                <div>
                  <p className="font-medium">Authentication Type</p>
                  <p className="text-muted-foreground">{getAuthType(user)}</p>
                </div>
              )}

              {activeWallet && (
                <div>
                  <p className="font-medium">Wallet Provider</p>
                  <p className="text-muted-foreground">
                    {getWalletType(activeWallet)}
                  </p>
                </div>
              )}

              <div className="flex w-full flex-col gap-2">
                <p className="font-medium">Active Wallet</p>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted-foreground/10 dark:bg-muted/50">
                  <code className="font-mono break-all flex-1">
                    {activeWallet.address}
                  </code>
                  <CopyButton value={activeWallet.address} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <Wallet className="w-12 h-12" />
              <p className="text-muted-foreground">
                {authenticated
                  ? "Connect an additional wallet"
                  : "Sign into your account or connect a wallet to get started"}
              </p>
              <Button onClick={() => connectOrCreateWallet()}>
                Connect Wallet
              </Button>
            </div>
          )}

          {activeWallet && (
            <DialogFooter className="pt-4 border-t border-stone-300 dark:border-border">
              <Button variant="destructive" onClick={handleLogout}>
                Disconnect
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
