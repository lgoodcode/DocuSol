/* eslint-disable @typescript-eslint/no-explicit-any */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { createClient } from "@/lib/supabase/client";
import { getUser } from "@/lib/supabase/utils";
import { StorageService } from "@/lib/supabase/storage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEnvVar(key: string): string | undefined {
  return process.env[key];
}

export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
}

export const previewBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
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
  /** Prevent a retry if the condition is satisfied */
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

export async function uploadDocumentToStorage(
  userId: string,
  documentName: string,
  file: File,
  version: number,
) {
  const supabase = createClient();
  const storageService = new StorageService(supabase);
  await withRetry(async () => {
    await storageService.uploadFile(
      userId,
      documentName,
      file,
      file.type,
      version,
    );
  });
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time it was invoked.
 *
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced version of the original function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Converts a File object to a data URL string
 * @param file The File object to convert
 * @returns A Promise that resolves to the data URL string
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader did not return a string"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL string back to a File object
 * @param dataUrl The data URL string
 * @param fileName The name to use for the File
 * @param options Optional File properties like type and lastModified
 * @returns A new File object
 */
export function dataUrlToFile(
  dataUrl: string,
  fileName: string,
  options: FilePropertyBag = {},
): File {
  // Extract the MIME type from the data URL
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "";
  const bstr = atob(arr[1]);

  // Create a Uint8Array from the binary string
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  // Set default options with the extracted MIME type
  const fileOptions: FilePropertyBag = {
    type: mime,
    ...options,
  };

  // Create and return a new File object
  return new File([u8arr], fileName, fileOptions);
}
