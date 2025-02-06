"use client";

import { PrivyProvider as AppPrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

import { IS_CI } from "@/constants";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});

const SOLANA_CHAIN = {
  id: 101,
  name: "Solana",
  network: "mainnet",
  nativeCurrency: {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
  },
  rpcUrls: {
    default: {
      http: ["https://api.mainnet-beta.solana.com"],
    },
  },
};

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  if (IS_CI) {
    return <>{children}</>;
  }

  return (
    <AppPrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#101012",
          walletChainType: "solana-only",
          logo: "/img/branding/logo_color_white_1694x432.png",
        },
        loginMethods: ["email", "wallet", "google"],
        defaultChain: SOLANA_CHAIN,
        supportedChains: [SOLANA_CHAIN],
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
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
