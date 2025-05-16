import { createConnection } from "@/lib/utils/solana";
import { ObfuscatedStampSerializer } from "@/lib/utils/serializer";
import { PDFHash } from "@/lib/stamp/hash-service";
import type { DocumentStamp } from "@/lib/types/stamp";

export const verificationErrors = {
  TRANSACTION_NOT_FOUND: "Transaction not found",
  TRANSACTION_MESSAGE_NOT_FOUND: "Transaction message not found",
  MEMO_NOT_FOUND: "Memo not found",
  INVALID_VERSION: "Invalid version",
  CONTENT_HASH_MISMATCH: "Content hash mismatch",
};

export const handleVerifyDocument = async (
  txSignature: string,
  file: File,
): Promise<DocumentStamp> => {
  const connection = createConnection();
  const result = await connection.getParsedTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!result) {
    throw new Error(verificationErrors.TRANSACTION_NOT_FOUND);
  }

  if (!result.transaction.message || !result.transaction.message.instructions) {
    throw new Error(verificationErrors.TRANSACTION_MESSAGE_NOT_FOUND);
  }

  const memo = result.transaction.message.instructions.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (instruction: any) => instruction.program === "spl-memo",
  );

  if (!memo) {
    throw new Error(verificationErrors.MEMO_NOT_FOUND);
  }

  // The DocuSol serialized string. Now we need to deserialize it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memoData = (memo as any).parsed;
  const [version, stamp] = memoData.split(/:(.*)/, 2);
  if (version !== "v0") {
    throw new Error(verificationErrors.INVALID_VERSION);
  }

  const serializer = new ObfuscatedStampSerializer();
  const documentStamp = serializer.deserialize(stamp);
  const pdfBuffer = Buffer.from(await file.arrayBuffer());
  const pdfHash = await PDFHash.generateContentHash(pdfBuffer);

  if (pdfHash.contentHash !== documentStamp.contentHash.contentHash) {
    throw new Error(verificationErrors.CONTENT_HASH_MISMATCH);
  }

  return documentStamp;
};
