/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended for GCM
const KEY_LENGTH = 32; // For AES-256
const AUTH_TAG_LENGTH = 16; // Standard for GCM

// --- Key Management ---

/**
 * Generates a secure, random encryption key.
 * @returns {string} A Base64 encoded encryption key (32 bytes / 256 bits).
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("base64");
}

// --- Encryption ---

/**
 * Encrypts a buffer using AES-256-GCM with a random key.
 * @param buffer - The buffer to encrypt.
 * @returns The encrypted data and the encryption key.
 */
export function encrypt(buffer: Buffer): {
  encryptedData: string;
  encryptionKey: string;
} {
  const encryptionKey = generateEncryptionKey();
  const encryptedData = encryptwithKey(buffer, encryptionKey);
  return { encryptedData, encryptionKey };
}

/**
 * Encrypts JSON data using AES-256-GCM.
 * @param {any} jsonData - The JSON-serializable data to encrypt.
 * @param {string} keyBase64 - The Base64 encoded encryption key (must be 32 bytes).
 * @returns {string} A string containing iv:authTag:encryptedData, all Base64 encoded.
 * @throws {Error} If encryption fails or key is invalid.
 */
export function encryptwithKey(buffer: Buffer, keyBase64: string): string {
  try {
    const key = Buffer.from(keyBase64, "base64");
    if (key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(buffer.toString("utf8"), "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Combine IV, AuthTag, and Encrypted Data
    // We encode each part in Base64 for easier handling as a single string
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
  } catch (error: any) {
    console.error("Encryption failed:", error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

// --- Decryption ---

/**
 * Decrypts data encrypted with encryptJson.
 * @template T - The expected type of the original JSON data.
 * @param {string} encryptedPayload - The encrypted string (iv_base64:authTag_base64:encryptedData_base64).
 * @param {string} keyBase64 - The Base64 encoded encryption key used for encryption.
 * @returns {T} The original decrypted JSON data.
 * @throws {Error} If decryption fails (e.g., invalid key, tampered data, invalid format).
 */
export function decryptJson<T = any>(
  encryptedPayload: string,
  keyBase64: string,
): T {
  try {
    const key = Buffer.from(keyBase64, "base64");
    if (key.length !== KEY_LENGTH) {
      throw new Error(`Invalid key length. Expected ${KEY_LENGTH} bytes.`);
    }

    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) {
      throw new Error(
        "Invalid encrypted payload format. Expected 'iv:authTag:encryptedData'.",
      );
    }

    const [ivBase64, authTagBase64, encryptedDataBase64] = parts;

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const encryptedData = Buffer.from(encryptedDataBase64, "base64");

    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes.`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid AuthTag length. Expected ${AUTH_TAG_LENGTH} bytes.`,
      );
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag); // Must be done before update/final

    let decrypted = decipher.update(encryptedData);
    // GCM throws an error during final() if authentication fails (wrong key or tampered data)
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const jsonString = decrypted.toString("utf8");

    try {
      return JSON.parse(jsonString) as T;
    } catch (parseError) {
      throw new Error("Decryption succeeded but failed to parse JSON.");
    }
  } catch (error: any) {
    console.error("Decryption failed:", error);
    // Provide a generic error for security; avoid leaking details about *why* it failed (e.g., bad tag vs. bad key)
    throw new Error("Decryption failed. Invalid key, data, or format.");
  }
}
