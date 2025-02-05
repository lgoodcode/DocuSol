"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { usePrivy, useSolanaWallets } from "@privy-io/react-auth";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";
import { SkeletonContent } from "@/components/layout/skeleton-content";
import { Button } from "@/components/ui/button";

export function WalletAuthWrapper({ children }: { children: React.ReactNode }) {
  const { ready, login, authenticated } = usePrivy();
  const { wallets } = useSolanaWallets();

  if (!ready) {
    return <SkeletonContent />;
  } else if (authenticated || !!wallets.length) {
    return children;
  }

  return (
    <div className="relative overflow-hidden min-h-[calc(100dvh-200px)] flex items-center justify-center">
      <div className="relative mx-auto flex flex-col items-center justify-center max-w-3xl text-center gap-4 px-4">
        <div className="space-y-4">
          <Wallet className="h-24 w-24 text-muted-foreground/50 mx-auto" />

          <h1 className="p-2 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600/60 dark:to-blue-500/50">
            Connect Your Wallet
          </h1>
        </div>

        <div className="w-full space-y-8">
          <p className="sm:text-lg md:text-xl text-muted-foreground mx-auto">
            To use this app, you&apos;ll need to connect your wallet. This
            allows us to use your wallet address as your unique signature. If
            authenticating with an email or federated identity, a wallet will be
            generated for you.
          </p>

          <p className="sm:text-lg md:text-xl max-w-xl text-muted-foreground mx-auto">
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

          <Button
            size="lg"
            className="mx-auto"
            onClick={() => login()}
            disabled={!ready}
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
