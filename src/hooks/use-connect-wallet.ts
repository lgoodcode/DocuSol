import { create } from "zustand";
import { useEffect, useState } from "react";
import bs58 from "bs58";
import {
  useWallet as useWalletAdapter,
  Wallet,
} from "@solana/wallet-adapter-react";
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

const generateNonce = (): string => {
  const nonce = crypto.getRandomValues(new Uint8Array(32));
  return bs58.encode(nonce);
};

export const generateSignature = async (
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
) => {
  const signature = await signMessage(
    new TextEncoder().encode(generateNonce()),
  );
  return bs58.encode(signature);
};

const useWalletStore = create<WalletStore>((set) => ({
  wallet: null,
  isConnected: false,
  isConnecting: false,
  setWallet: (wallet: Wallet | null) => set({ wallet }),
  setIsConnected: (connected: boolean) => set({ isConnected: connected }),
  setIsConnecting: (connecting: boolean) => set({ isConnecting: connecting }),
}));

export const useWallet = () => useWalletStore((state) => state.wallet);

export const useWalletAddress = () =>
  useWalletStore((state) => state.wallet?.adapter.publicKey?.toBase58() ?? "");

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
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const { select, wallets, disconnect, wallet } = useWalletAdapter();
  const {
    isConnected,
    isConnecting,
    setWallet,
    setIsConnected,
    setIsConnecting,
  } = useWalletStore();

  // select is synchronous, so we start connecting once the wallet is selected
  const selectWallet = (wallet: WalletName) => {
    setWalletConnecting(true);
    setWalletConnected(false);
    setIsConnecting(true);
    setIsConnected(false);
    setError(null);
    select(wallet);
  };

  // Once connected, we need to check if the wallet exists in the database
  // so we use the useEffect hook to check if the wallet is connected and then
  // check if the wallet exists in the database
  useEffect(() => {
    if (!walletConnected && walletConnecting && wallet?.adapter.publicKey) {
      const address = wallet.adapter.publicKey.toBase58();

      if (address) {
        createWalletIfNotExists(address)
          .then(() => {
            setWallet(wallet);
            setWalletConnected(true);
            setIsConnected(true);
          })
          .catch((error) => {
            console.error(error);
            captureException(error);
            setError("Failed to connect wallet");
          })
          .finally(() => {
            setIsConnecting(false);
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnecting, wallet]);

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
