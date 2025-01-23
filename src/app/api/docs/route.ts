import { promises as fs } from "fs";
import crypto from "crypto";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file) {
      throw new Error("No file provided");
    }

    const fileData = await file.arrayBuffer();
    const fileHash = crypto
      .createHash("sha256")
      .update(Buffer.from(fileData))
      .digest("hex");

    const transactionSignature = await sendMemoWithFileHash(
      fileHash,
      "2wagLEqHk1TAS45agEgeiPjDWKvNxW31RxTVLwGh1H1VsNf8NBigWLpEsau7zr59Yfp1JQJcEojRDSJ7Kgpbhcsn"
    );

    const transactionUrl = `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`;

    return Response.json({ transactionUrl });
  } catch (error) {
    throw error; // This will be caught by Sentry as per instructions
  }
}

/**
 * Sends a transaction with only a memo instruction containing the file's hash
 *
 * @param fileHash - Hash of the file to be recorded on-chain
 * @param base58PrivateKey - Base58-encoded private key (secret key)
 * @param rpcUrl - Solana RPC endpoint. We are currently using devnet
 */
async function sendMemoWithFileHash(
  fileHash: string,
  base58PrivateKey: string,
  rpcUrl = "https://api.devnet.solana.com"
): Promise<string> {
  const secretKeyBytes = bs58.decode(base58PrivateKey);
  const sender = Keypair.fromSecretKey(secretKeyBytes);
  const connection = new Connection(rpcUrl, "confirmed");

  const memoProgramId = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

  const memoData = Buffer.from(`FILE_HASH=${fileHash}`, "utf-8");
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: memoProgramId,
    data: memoData,
  });

  const transaction = new Transaction().add(memoInstruction);
  transaction.feePayer = sender.publicKey;

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  const signature = await connection.sendTransaction(transaction, [sender]);

  return signature;
}
