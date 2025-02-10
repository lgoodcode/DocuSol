import { create } from "zustand";
import { useEffect, useState } from "react";
import { useWallet, Wallet } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { captureException } from "@sentry/nextjs";

type WalletStore = {
  wallet: Wallet | null;
  isConnected: boolean;
  isConnecting: boolean;
  setWallet: (wallet: Wallet | null) => void;
  setIsConnected: (connected: boolean) => void;
  setIsConnecting: (connecting: boolean) => void;
};

const useWalletStore = create<WalletStore>((set) => ({
  wallet: null,
  isConnected: false,
  isConnecting: false,
  setWallet: (wallet: Wallet | null) => set({ wallet }),
  setIsConnected: (connected: boolean) => set({ isConnected: connected }),
  setIsConnecting: (connecting: boolean) => set({ isConnecting: connecting }),
}));

const createWalletIfNotExists = async (address: string) => {
  const response = await fetch("/api/wallet/connect", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
  if (!response.ok) {
    throw new Error("An error occurred while connecting the wallet");
  }
};

export function useConnectWallet() {
  const [error, setError] = useState<string | null>();
  const { select, wallets, disconnect, wallet, connected } = useWallet();
  const {
    isConnected,
    isConnecting,
    setWallet,
    setIsConnected,
    setIsConnecting,
  } = useWalletStore();

  // select is synchronous, so we start connecting once the wallet is selected
  const selectWallet = (wallet: WalletName) => {
    setIsConnecting(true);
    setIsConnected(false);
    setError(null);
    select(wallet);
  };

  // Once connected, we need to check if the wallet exists in the database
  // so we use the useEffect hook to check if the wallet is connected and then
  // check if the wallet exists in the database
  useEffect(() => {
    if (connected && wallet) {
      const address = wallet.adapter.publicKey?.toBase58() ?? "";

      if (address) {
        setIsConnecting(true);
        createWalletIfNotExists(address)
          .then(() => {
            setWallet(wallet);
            setIsConnected(true);
          })
          .catch((error) => {
            console.error(error);
            captureException(error);
            setError("Failed to connect wallet");
          })
          .finally(() => setIsConnecting(false));
      }
    } else {
      setIsConnected(false);
      setWallet(null);
    }
  }, [connected, wallet, setIsConnecting, setIsConnected, setWallet]);

  return {
    selectWallet,
    wallets,
    disconnect,
    wallet,
    isConnected,
    isConnecting,
    error,
  };
}
