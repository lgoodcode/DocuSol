"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet as useWalletAdapter } from "@solana/wallet-adapter-react";
import { WalletName } from "@solana/wallet-adapter-base";
import { useRouter } from "next-nprogress-bar";

import { API_PATHS } from "@/config/routes/api";
import { useToast } from "@/hooks/use-toast";
import { createMessageAndSign, authenticateWallet } from "@/lib/auth/wallet";

const logout = async () => {
  const response = await fetch(API_PATHS.AUTH.LOGOUT, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
};

export function useWalletAuth() {
  const router = useRouter();
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
    logout()
      .then(() => {
        setHasSelected(false);
        setSigning(false);
        setAuthenticating(false);
        setAuthenticated(false);
        disconnect();
        router.push("/login");
      })
      .catch((err) => {
        console.error("Failed to logout", err);
        toast({
          title: "Failed to logout",
          description: "An error occurred while logging out",
          variant: "destructive",
        });
      });
  }, [disconnect, router, toast]);

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
    } catch (err) {
      const error = err as Error;
      setError(error.message);

      toast({
        title: "Failed to connect wallet",
        description: "An error occurred while connecting your wallet",
        variant: "destructive",
      });

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
    connected,
    error,
  };
}
