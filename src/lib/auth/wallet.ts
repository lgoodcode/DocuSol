import { PublicKey } from "@solana/web3.js";
import { sign } from "tweetnacl";

/**
 * Create a message and sign it with the wallet's private key.
 *
 * @param publicKey the public key of the wallet
 * @param signMessage the wallet adapter signMessage function
 * @returns the signature of the message
 */
export async function createMessageAndSign(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
) {
  const message = new TextEncoder().encode(
    `Sign in to ${window.location.origin}\n` +
      `Time: ${new Date().toLocaleString()}`,
  );
  return {
    message,
    signature: await signMessage(message),
  };
}

/**
 * Verify a signature from a wallet by supplying the public key, signature,
 * and nonce and using the tweetnacl library to verify the signature.
 *
 * @param publicKey the public key of the wallet
 * @param signature the signature of the wallet
 * @param nonce the nonce that was signed by the wallet
 * @returns true if the signature is valid, false otherwise
 */
export function verifySignature(
  publicKey: PublicKey,
  signature: Uint8Array,
  nonce: Uint8Array,
) {
  return sign.detached.verify(nonce, signature, publicKey.toBytes());
}

/**
 * Authenticate a wallet by sending the wallet pubkey and signature of a signed
 * nonce by the wallet. On the server we will validate the signature and nonce
 * and then create a session for the user
 *
 * @param pubkey the public key of the wallet
 * @param message the message that was signed by the wallet
 * @param signature the signature of the wallet
 * @returns the response from the server
 */
export async function authenticateWallet(
  publicKey: PublicKey,
  message: Uint8Array,
  signature: Uint8Array,
) {
  const signatureBytes = Array.from(signature);
  const messageBytes = Array.from(message);
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicKey: publicKey.toBase58(),
      message: messageBytes,
      signature: signatureBytes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.isZodError) {
      throw new Error("ZodError");
    }
    throw new Error(error.message || "Authentication failed");
  }
}
