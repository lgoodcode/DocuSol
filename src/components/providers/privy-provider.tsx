"use client";

import { PrivyProvider as AppPrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppPrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#101012",
          walletChainType: "solana-only",
          logo: "/img/docusol_logo_full.webp",
        },
        loginMethods: ["email", "wallet", "google"],
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      {children}
    </AppPrivyProvider>
  );
}
