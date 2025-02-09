"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";
import { SkeletonContent } from "@/components/layout/skeleton-content";
import { Button } from "@/components/ui/button";

export function WalletAuthWrapper({ children }: { children: React.ReactNode }) {
  const { connected, connecting } = useWallet();

  if (connecting) {
    return <SkeletonContent />;
  } else if (connected) {
    return children;
  }

  const triggerWalletDialog = () => {
    const walletDialogTrigger = document.getElementById(
      "wallet-dialog-trigger",
    );
    if (walletDialogTrigger) {
      walletDialogTrigger.click();
    }
  };

  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div className="relative mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="space-y-4">
          <Wallet className="mx-auto h-24 w-24 text-muted-foreground/50" />

          <h1 className="bg-gradient-to-r from-blue-500 to-blue-600/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-blue-500/50 sm:text-5xl md:text-6xl">
            Connect Your Wallet
          </h1>
        </div>

        <div className="w-full space-y-8">
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            To use this app, you&apos;ll need to connect your wallet. This
            allows us to use your wallet address as your unique signature. If
            authenticating with an email or federated identity, a wallet will be
            generated for you.
          </p>

          <p className="mx-auto max-w-xl text-muted-foreground sm:text-lg md:text-xl">
            Having trouble? Contact support via{" "}
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              target="_blank"
              className="text-primary underline"
            >
              {SUPPORT_EMAIL}
            </Link>{" "}
            or get help in our{" "}
            <Link
              href={DISCORD_URL}
              target="_blank"
              className="text-primary underline"
            >
              Discord
            </Link>
            .
          </p>

          <Button size="lg" className="mx-auto" onClick={triggerWalletDialog}>
            Connect Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
