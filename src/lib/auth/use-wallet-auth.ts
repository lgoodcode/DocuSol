"use client";

import { create } from "zustand";
import { useCallback, useEffect, useState } from "react";
import {
  useWallet as useWalletAdapter,
  Wallet,
} from "@solana/wallet-adapter-react";
import { WalletName, WalletError } from "@solana/wallet-adapter-base";

import { createMessageAndSign, authenticateWallet } from "@/lib/auth/wallet";
import { useToast } from "@/hooks/use-toast";

type WalletStore = {
  wallet: Wallet | null;
  authenticated: boolean;
  authenticating: boolean;
  setWallet: (wallet: Wallet | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setAuthenticating: (authenticating: boolean) => void;
};

/**
 * Stupid hack because React state update is garbo - otherwise it
 * trigger duplicate calls to the useEffect hook and double authentications
 */
let IS_AUTHENTICATING = false;

const useWalletStore = create<WalletStore>((set) => ({
  wallet: null,
  authenticated: false,
  authenticating: false,
  setWallet: (wallet: Wallet | null) => set({ wallet }),
  setAuthenticated: (authenticated: boolean) => set({ authenticated }),
  setAuthenticating: (authenticating: boolean) => set({ authenticating }),
}));

export const useWallet = () => useWalletStore((state) => state.wallet);

export const useWalletAddress = () =>
  useWalletStore((state) => state.wallet?.adapter.publicKey?.toBase58() ?? "");

export function useWalletAuth(serverAuthenticated = false) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>();
  const [hasSelected, setHasSelected] = useState(false);
  const {
    select,
    wallets,
    disconnect,
    wallet,
    signMessage,
    connected,
    connecting,
  } = useWalletAdapter();
  const {
    authenticated,
    authenticating,
    setWallet,
    setAuthenticated,
    setAuthenticating,
  } = useWalletStore();

  // select is synchronous, so we start connecting once the wallet is selected
  const selectWallet = (wallet: WalletName) => {
    setHasSelected(true);
    setAuthenticated(false);
    setAuthenticating(true);
    setError(null);
    select(wallet);
  };

  const handleDisconnect = useCallback(() => {
    setWallet(null);
    setHasSelected(false);
    setAuthenticated(false);
    setAuthenticating(false);
    disconnect();
  }, [
    disconnect,
    setAuthenticated,
    setAuthenticating,
    setWallet,
    setHasSelected,
  ]);

  const connectAndAuthenticateWallet = useCallback(async () => {
    try {
      if (!signMessage) {
        throw new Error("Wallet not connected");
      }

      const publicKey = wallet?.adapter.publicKey;
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      const { message, signature } = await createMessageAndSign(signMessage);
      await authenticateWallet(publicKey, message, signature);

      setWallet(wallet);
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
      setAuthenticating(false);
      IS_AUTHENTICATING = false;
    }
  }, [
    signMessage,
    wallet,
    handleDisconnect,
    setAuthenticating,
    setWallet,
    setAuthenticated,
    toast,
  ]);

  // // If the user is not authenticated, we need to disconnect the wallet
  // // and have them reconnect to ensure they actually have the wallet
  // useEffect(() => {
  //   if (!authenticated && !hasAttempted) {
  //     if (!wallet) {
  //       handleDisconnect();
  //     } else if (
  //       // !attempted &&
  //       !authenticating &&
  //       wallet &&
  //       connected &&
  //       signMessage
  //     ) {
  //       debugger;
  //       // attempted = true;
  //       setHasAttempted(true);
  //       setAuthenticating(true);
  //       await connectAndAuthenticateWallet();
  //     }
  //   }
  //   //  else if (wallet) {
  //   //   debugger;
  //   //   setAuthenticated(true);
  //   // }
  //   setAuthenticating(false);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   hasAttempted,
  //   wallet,
  //   authenticated,
  //   authenticating,
  //   connected,
  //   signMessage,
  //   connectAndAuthenticateWallet,
  // ]);

  // If the server has already authenticated the user, we need to set the
  // authenticated state to true
  useEffect(() => {
    if (serverAuthenticated) {
      setAuthenticated(true);
    }
  }, [serverAuthenticated, setAuthenticated]);

  // Once connected, we need to check if the wallet exists in the database
  // so we use the useEffect hook to check if the wallet is connected and then
  // check if the wallet exists in the database
  useEffect(() => {
    // Once the wallet is connected, begin the authentication process
    if (
      hasSelected &&
      !IS_AUTHENTICATING &&
      !authenticated &&
      connected &&
      wallet?.adapter.publicKey &&
      signMessage
    ) {
      IS_AUTHENTICATING = true;
      setAuthenticating(true);
      connectAndAuthenticateWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, connected, wallet, signMessage, hasSelected]);

  return {
    selectWallet,
    wallets,
    disconnect: handleDisconnect,
    wallet,
    connecting,
    authenticated,
    authenticating,
    error,
  };
}
