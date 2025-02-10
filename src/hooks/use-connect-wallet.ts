import { useWallet, Wallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { WalletName } from "@solana/wallet-adapter-base";
import { captureException } from "@sentry/nextjs";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const { select, wallets, disconnect, connected } = useWallet();

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
