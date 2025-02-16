"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet as useWalletAdapter } from "@solana/wallet-adapter-react";
import { WalletName, WalletError } from "@solana/wallet-adapter-base";

import { createMessageAndSign, authenticateWallet } from "@/lib/auth/wallet";
import { useToast } from "@/hooks/use-toast";

export function useWallet() {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);
  const [signing, setSigning] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const {
    select,
    wallets,
    disconnect,
    wallet,
    signMessage,
    connected,
    connecting,
  } = useWalletAdapter();

  // select is synchronous, so we start connecting once the wallet is selected
  const selectWallet = (wallet: WalletName) => {
    setHasSelected(true);
    setAuthenticated(false);
    setError(null);
    select(wallet);
  };

  const handleDisconnect = useCallback(() => {
    setHasSelected(false);
    setSigning(false);
    setAuthenticating(false);
    setAuthenticated(false);
    disconnect();
  }, [disconnect, setHasSelected]);

  const connectAndAuthenticateWallet = useCallback(async () => {
    try {
      if (!signMessage) {
        throw new Error("Wallet not connected");
      }

      const publicKey = wallet?.adapter.publicKey;
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      setSigning(true);
      const { message, signature } = await createMessageAndSign(signMessage);
      setSigning(false);
      setAuthenticating(true);
      await authenticateWallet(publicKey, message, signature);
      setAuthenticated(true);
    } catch (error) {
      if (error instanceof WalletError) {
        setError(error.message);
      } else {
        toast({
          title: "Failed to connect wallet",
          description: "An error occurred while connecting your wallet",
          variant: "destructive",
        });
      }

      handleDisconnect();
    } finally {
      setSigning(false);
      setAuthenticating(false);
    }
  }, [signMessage, wallet, handleDisconnect, toast]);

  // Once connected, we need to check if the wallet exists in the database
  // so we use the useEffect hook to check if the wallet is connected and then
  // check if the wallet exists in the database
  useEffect(() => {
    // Once the wallet is connected, begin the authentication process
    if (hasSelected && connected && wallet?.adapter.publicKey && signMessage) {
      connectAndAuthenticateWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, wallet, signMessage, hasSelected]);

  return {
    selectWallet,
    wallets,
    disconnect: handleDisconnect,
    wallet,
    signing,
    authenticating,
    authenticated,
    connecting,
    error,
  };
}
