import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const previewBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

/**
 * Validates if the provided string is a valid email address
 *
 * @param email The email string to validate
 * @returns Boolean indicating if the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Convert Buffer/ArrayBuffer to hex string for BYTEA
export const bufferToHex = (buffer: Buffer) => "\\x" + buffer.toString("hex");

export const hexToBuffer = (hex: string): Uint8Array => {
  if (!hex.startsWith("\\x")) {
    throw new Error("Invalid hex string format - must start with \\x");
  }
  return new Uint8Array(Buffer.from(hex.slice(2), "hex"));
};

type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryOnError?: (error: Error) => boolean;
  cancelOnError?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
};

/**
 * Retries a function with exponential backoff
 * @param fn The function to retry
 * @param options Configuration options
 * @returns Promise that resolves with the function result or rejects after all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 10000,
    backoffFactor = 2,
    retryOnError = () => true,
    cancelOnError = () => false,
    onRetry = () => {},
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      const error = err as Error;
      attempt++;

      if (
        attempt > maxRetries ||
        !retryOnError(error as Error) ||
        cancelOnError(error as Error)
      ) {
        throw error;
      }

      onRetry(error, attempt, delay);

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AppStorage", 3);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }
    };
  });
};

export const storeNewDocument = async (
  document: StoredDocument,
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readwrite");
    const store = transaction.objectStore("documents");
    const request = store.put(document);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const removeStoredDocument = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readwrite");
    const store = transaction.objectStore("documents");
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getStoredDocument = async (
  id: string,
): Promise<StoredDocument | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const getAllStoredDocuments = async (): Promise<StoredDocument[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};
