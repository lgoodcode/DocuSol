"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { captureException } from "@sentry/nextjs";

import { PLATFORM_FEE } from "@/constants";
import { useToast } from "@/hooks/use-toast";
import { sign, useUploadNewDocument } from "@/lib/utils/sign";
import { hasSufficientBalance } from "@/lib/utils/solana";

export function useSignDoc() {
  const { toast } = useToast();

  return async (
    file: File,
    signatureType: "draw" | "type",
    hasDrawn: boolean,
    writtenSignature: HTMLCanvasElement | null,
    typedSignature: string,
  ) => {
    const isSigned =
      (signatureType === "draw" && hasDrawn) ||
      (signatureType === "type" && typedSignature);

    if (!isSigned) {
      return null;
    }

    try {
      const signedDoc = await sign(
        file,
        signatureType === "draw" ? writtenSignature : null,
        signatureType === "type" ? typedSignature : undefined,
      );

      return signedDoc;
    } catch (err) {
      const error = err as Error;
      console.error(error);

      const isEncrypted = error.message.includes("encrypted");
      const errorMessage = isEncrypted
        ? "The document is encrypted and cannot be modified"
        : "An error occurred while signing the document";

      if (!isEncrypted) {
        captureException(error);
      }

      toast({
        title: "Document Signing Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  };
}

export function useUserHasSufficientBalance() {
  const { toast } = useToast();
  const { publicKey } = useWallet();

  return async () => {
    try {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      const isSufficient = await hasSufficientBalance(publicKey);
      if (!isSufficient) {
        toast({
          title: "Insufficient Balance",
          description: (
            <span>
              You need at least <strong>{PLATFORM_FEE} SOL</strong> in your
              wallet to upload a document for the platform fee. Please add more
              SOL to continue.
            </span>
          ),
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      const error = err as Error;
      console.error(error);
      captureException(error);

      toast({
        title: "Error",
        description: "An error occurred while verifying your balance",
      });
      return false;
    }
  };
}
