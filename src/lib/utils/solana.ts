import bs58 from "bs58";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import { PLATFORM_FEE } from "@/constants";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_API_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

export function isWalletAddress(address: string) {
  return /^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(address);
}

export function getTransactionUrl(signature: string) {
  return `https://explorer.solana.com/tx/${signature}`;
}

export async function hasSufficientBalance(publicKey: PublicKey) {
  const connection = new Connection(RPC_URL, "confirmed");
  const balance = await connection.getBalance(publicKey);
  const solBalance = balance / LAMPORTS_PER_SOL;
  return solBalance > PLATFORM_FEE;
}

export const isTransactionSignature = (val: string) => {
  try {
    return (
      val.length >= 86 && val.length <= 88 && bs58.decode(val).length === 64
    );
  } catch {
    return false;
  }
};

/**
 * Get the hash from a transaction signature. Since we know when we send the
 * memo transaction, there should only be 4 log messages, with the second
 * containing the file hash.
 *
 * @param tx - The transaction signature
 * @returns The hash or null if not found
 */
export const getHashFromTransactionSignature = async (tx: string) => {
  const connection = new Connection(RPC_URL, "confirmed");
  const txRes = await connection.getTransaction(tx, {
    maxSupportedTransactionVersion: 0,
  });
  const messages = txRes?.meta?.logMessages;
  if (Array.isArray(messages) && messages.length === 4) {
    const memo = messages.find((m) => m.startsWith("Program log: Memo"));
    if (memo) {
      const hash = memo.match(/FILE_HASH=([a-f0-9]{64})/i)?.[1];
      return hash ?? null;
    }
  }
  return null;
};

/**
 * Sends a transaction with a memo instruction containing the provided message to the Solana blockchain.
 * This function creates a new transaction with a single memo instruction and broadcasts it to the network.
 *
 * @param {string} message - The message to be included in the memo
 * @param {string} privateKey - Base58-encoded private key (secret key)
 * @param {string} rpcUrl - Solana RPC endpoint URL
 * @throws {Error} If the message is empty or too long
 * @throws {Error} If the private key is invalid
 * @throws {Error} If there's insufficient balance
 * @returns {Promise<string>} The transaction signature
 */
export async function sendMemoTransaction(message: string): Promise<string> {
  if (!message || message.length === 0) {
    throw new Error("Message cannot be empty");
  }

  if (message.length > 1000) {
    throw new Error("Message is too long (max 1000 characters)");
  }

  let secretKeyBytes: Uint8Array;
  try {
    secretKeyBytes = bs58.decode(PRIVATE_KEY);
  } catch (error) {
    console.error(error);
    throw new Error("Invalid private key format");
  }

  const sender = Keypair.fromSecretKey(secretKeyBytes);
  const connection = new Connection(RPC_URL, "confirmed");

  const balance = await connection.getBalance(sender.publicKey);
  if (balance === 0) {
    throw new Error("Insufficient balance in sender account");
  }

  const memoData = Buffer.from(message, "utf-8");
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: memoData,
  });

  const transaction = new Transaction().add(memoInstruction);
  transaction.feePayer = sender.publicKey;

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  try {
    const signature = await connection.sendTransaction(transaction, [sender]);
    return signature;
  } catch (err) {
    const error = err as Error;
    console.error(error);
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}

export async function confirmTransaction(signature: string) {
  const connection = new Connection(RPC_URL, "confirmed");
  return await connection.confirmTransaction({
    signature,
    blockhash: (await connection.getLatestBlockhash()).blockhash,
    lastValidBlockHeight: (await connection.getBlockHeight()) + 150,
  });
}

export async function getLatestBlockSlot() {
  const connection = new Connection(RPC_URL, "confirmed");
  return await connection.getSlot();
}

export async function getConfirmedTransactionSlot(
  signature: string,
): Promise<number> {
  const connection = new Connection(RPC_URL, "confirmed");

  try {
    const tx = await connection.getTransaction(signature);
    if (!tx?.slot) {
      throw new Error("No slot found for transaction");
    }
    return tx.slot;
  } catch (err) {
    const error = err as Error;
    throw new Error(`Failed to get slot for transaction: ${error.message}`);
  }
}
