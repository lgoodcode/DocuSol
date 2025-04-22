import { pack, unpack } from "msgpackr";
import { Buffer } from "buffer"; // Ensure Buffer is available

import {
  SignatureState,
  type DocumentStamp,
  type SignerRole,
  type SigningMode,
} from "@/lib/types/stamp";

// Set of original keys that should contain boolean values
const booleanKeys = new Set([
  "isOwner", // DocumentSigner
  "revoked", // DocumentStatus
  "expired", // DocumentStatus
  "requireOrder", // DocumentRules
  "requireAll", // DocumentRules
  "allowRevocation", // DocumentRules
]);

// Set of original keys whose values are enums to be mapped to/from integers
const enumKeys = new Set([
  "state", // DocumentStatus -> SignatureState
  "mode", // DocumentSigner -> SigningMode
  "currentSignerMode", // DocumentStatus -> SigningMode
  "role", // DocumentSigner -> SignerRole
  "type", // DocumentHashUpdate -> HashUpdateType
]);

// SignatureState Mapping
const stateToCode = {
  [SignatureState.DRAFT]: 0,
  [SignatureState.AWAITING_SIGNATURES]: 1,
  [SignatureState.PARTIALLY_SIGNED]: 2,
  [SignatureState.COMPLETED]: 3,
  [SignatureState.REJECTED]: 4,
  [SignatureState.EXPIRED]: 5,
} as const;
const codeToState = Object.entries(stateToCode).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {} as Record<number, string>,
);

// SigningMode Mapping
const modeToCode: Record<SigningMode, number> = {
  transparent: 0,
  anonymous: 1,
};
const codeToMode = Object.entries(modeToCode).reduce(
  (acc, [key, value]) => {
    acc[value] = key as SigningMode;
    return acc;
  },
  {} as Record<number, SigningMode>,
);

// SignerRole Mapping
const roleToCode: Record<SignerRole, number> = {
  reviewer: 0,
  witness: 1,
  notary: 2,
  participant: 3,
};
const codeToRole = Object.entries(roleToCode).reduce(
  (acc, [key, value]) => {
    acc[value] = key as SignerRole;
    return acc;
  },
  {} as Record<number, SignerRole>,
);

// DocumentHashUpdate Type Mapping
type HashUpdateType = "metadata" | "signature" | "other";
const hashUpdateTypeToCode: Record<HashUpdateType, number> = {
  metadata: 0,
  signature: 1,
  other: 2,
};
const codeToHashUpdateType = Object.entries(hashUpdateTypeToCode).reduce(
  (acc, [key, value]) => {
    acc[value] = key as HashUpdateType;
    return acc;
  },
  {} as Record<number, HashUpdateType>,
);

// --- Key Mappings ---
// Define short keys for each property in DocumentStamp and its nested objects
const keyMap: Record<string, string | number> = {
  // DocumentStamp
  version: "v",
  contentHash: "ch",
  hashHistory: "hh",
  signers: "sn",
  signatures: "sg",
  status: "st",
  rules: "rl",
  metadata: "md",
  // DocumentContentHash
  // contentHash: "ch", // Reused key, context matters - let's use distinct ones for clarity
  fileHash: "fh",
  metadataHash: "mh",
  // DocumentHashHistory
  initialHash: "ih",
  currentHash: "crh",
  updates: "u",
  // DocumentHashUpdate
  hash: "h", // Object is DocumentContentHash, keys inside will be mapped
  type: "t",
  timestamp: "ts",
  // DocumentSigner
  id: "i",
  userId: "ui",
  name: "n",
  email: "e",
  role: "r",
  mode: "m",
  isOwner: "io",
  color: "c",
  // DocumentSignature
  signerIndex: "si",
  proof: "p",
  // timestamp: 'ts', // Reused
  // DocumentStatus
  state: "s",
  lastSignedAt: "lsa",
  revoked: "rv",
  revokedAt: "rvt",
  expired: "ex",
  expiresAt: "eat",
  currentSignerIndex: "csi",
  currentSignerMode: "csm",
  // DocumentRules
  requireOrder: "ro",
  minSignatures: "ms",
  requireAll: "ra",
  allowRevocation: "ar",
  // DocumentMetadata
  transaction: "tx",
  createdAt: "ca",
  creator: "cr",
  documentId: "di",
  // version: 'v', // Reused
  encryptionKey: "ek",
  password: "pw",

  // Explicitly add the reused key from DocumentContentHash
  // to avoid potential ambiguity during automatic reverse mapping generation.
  // It maps the *property name* 'contentHash' to 'ch'.
  // contentHash: "ch", // Removed duplicate
};

// Generate the reverse map automatically
const reverseKeyMap: Record<string | number, string> = Object.entries(
  keyMap,
).reduce(
  (acc, [key, value]) => {
    // Basic check for duplicate short keys
    if (
      Object.prototype.hasOwnProperty.call(acc, value) &&
      acc[value] !== key
    ) {
      // Allow duplicate short keys only if they map back to the same original key
      // (e.g., 'version' appearing in multiple interfaces)
      // This check is basic and might need refinement based on actual usage.
      // For this specific structure, it should be okay.
      console.warn(
        `Serializer Warning: Duplicate short key detected '${value}' mapping to '${key}' but already maps to '${acc[value]}'. Ensure context handles potential ambiguity during deserialization if necessary.`,
      );
    }
    acc[value] = key;
    return acc;
  },
  {} as Record<string | number, string>,
);

// --- Serializer Class ---

export class DocumentStampSerializer {
  private keyMap: Record<string, string | number>;
  private reverseKeyMap: Record<string | number, string>;

  constructor(
    map: Record<string, string | number> = keyMap,
    reverseMap: Record<string | number, string> = reverseKeyMap,
  ) {
    this.keyMap = map;
    this.reverseKeyMap = reverseMap;
  }

  /**
   * Recursively substitutes keys in an object or array based on the provided map,
   * converts boolean values to/from 0/1, and maps specific enum string values to/from integers.
   *
   * @param data - The object or array to process.
   * @param map - The key mapping to use (long-to-short for serialize, short-to-long for deserialize).
   * @param originalKeyContext - The original key name for the current data element (used for boolean/enum deserialization context).
   * @returns The processed data with substituted keys and converted values.
   */
  private substituteKeys(
    data: any,
    map: Record<string, any>,
    originalKeyContext: string | null = null,
  ): any {
    const isSerializing = map === this.keyMap;
    let processedData = data; // Start with the original data

    // --- 1. Apply Value Substitutions (Enums, Booleans) ---
    if (originalKeyContext) {
      // Enum Substitution
      if (enumKeys.has(originalKeyContext)) {
        if (isSerializing && typeof data === "string") {
          if (
            originalKeyContext === "state" &&
            stateToCode[data as keyof typeof stateToCode] !== undefined
          )
            processedData = stateToCode[data as keyof typeof stateToCode];
          else if (
            (originalKeyContext === "mode" ||
              originalKeyContext === "currentSignerMode") &&
            modeToCode[data as SigningMode] !== undefined
          )
            processedData = modeToCode[data as SigningMode];
          else if (
            originalKeyContext === "role" &&
            roleToCode[data as SignerRole] !== undefined
          )
            processedData = roleToCode[data as SignerRole];
          else if (
            originalKeyContext === "type" &&
            hashUpdateTypeToCode[data as HashUpdateType] !== undefined
          )
            processedData = hashUpdateTypeToCode[data as HashUpdateType];
        } else if (!isSerializing && typeof data === "number") {
          if (originalKeyContext === "state" && codeToState[data] !== undefined)
            processedData = codeToState[data];
          else if (
            (originalKeyContext === "mode" ||
              originalKeyContext === "currentSignerMode") &&
            codeToMode[data] !== undefined
          )
            processedData = codeToMode[data];
          else if (
            originalKeyContext === "role" &&
            codeToRole[data] !== undefined
          )
            processedData = codeToRole[data];
          else if (
            originalKeyContext === "type" &&
            codeToHashUpdateType[data] !== undefined
          )
            processedData = codeToHashUpdateType[data];
        }
      }
      // Boolean Conversion (Applied after potential enum substitution if data became 0/1)
      // Check if the key is a boolean key *and* the current processed data is boolean (serialize) or 0/1 (deserialize)
      else if (booleanKeys.has(originalKeyContext)) {
        if (isSerializing && typeof data === "boolean") {
          processedData = data ? 1 : 0;
        } else if (!isSerializing && (data === 1 || data === 0)) {
          // Only convert back if the original value was 0 or 1
          processedData = data === 1;
        }
      }
    } else if (isSerializing && typeof data === "boolean") {
      // Handle booleans not tied to a specific known key (e.g., at the root or in an unknown structure)
      processedData = data ? 1 : 0;
    }

    // --- 2. Recursive Processing for Arrays/Objects ---
    // If the data type hasn't changed to a primitive by value substitution
    if (Array.isArray(processedData)) {
      // Process elements, passing null context as element context isn't directly inherited from array key
      return processedData.map((item) => this.substituteKeys(item, map, null));
    }

    if (
      processedData !== null &&
      typeof processedData === "object" &&
      !(processedData instanceof Date) // Also ensure it's not a Buffer if Buffer objects might exist
    ) {
      const newObj: Record<string | number, any> = {};
      for (const key in processedData) {
        if (Object.prototype.hasOwnProperty.call(processedData, key)) {
          const newKey = map[key] ?? key;
          const currentOriginalKey = isSerializing
            ? key
            : (this.reverseKeyMap[key] ?? key);
          // Recursively process the value, passing the original key context for that property
          newObj[newKey] = this.substituteKeys(
            processedData[key],
            map,
            currentOriginalKey,
          );
        }
      }
      return newObj;
    }

    // --- 3. Return the potentially modified primitive or original unchanged value ---
    return processedData;
  }

  /**
   * Serializes a DocumentStamp object by substituting long keys with short keys.
   * @param stamp - The original DocumentStamp object.
   * @returns The serialized object with short keys.
   */
  serialize(stamp: DocumentStamp): any {
    // Explicitly handle the top-level contentHash to ensure its inner keys are also mapped
    const serializedStamp = this.substituteKeys(stamp, this.keyMap, null);
    return serializedStamp;
  }

  /**
   * Deserializes an object with short keys back into a DocumentStamp-like structure.
   * Note: This performs key substitution but doesn't strictly validate the structure against DocumentStamp type.
   * @param serializedData - The object with short keys.
   * @returns The deserialized object with original keys.
   */
  deserialize(serializedData: any): any {
    // Explicitly handle the top-level contentHash during deserialization
    const deserializedStamp = this.substituteKeys(
      serializedData,
      this.reverseKeyMap,
      null,
    );
    return deserializedStamp;
  }
}

export class ObfuscatedStampSerializer {
  private obfuscationKey: string;
  private keySerializer: DocumentStampSerializer;

  /**
   * Initializes the serializer, retrieving the obfuscation key from environment variables.
   *
   * @param envKey - The environment variable name for the obfuscation key. Defaults to 'STAMP_OBFUSCATION_KEY'.
   * @param defaultKey - A default key to use if the environment variable is not set (use for testing only, logs a warning).
   */
  constructor(
    envKey: string = "STAMP_OBFUSCATION_KEY",
    defaultKey: string = "default-very-secret-key", // WARNING: Insecure default
  ) {
    this.obfuscationKey = process.env[envKey] || defaultKey;
    if (this.obfuscationKey === defaultKey && process.env.NODE_ENV !== "test") {
      console.warn(
        `ObfuscatedStampSerializer: Using default or missing obfuscation key ('${envKey}'). Set this environment variable securely!`,
      );
    }
    this.keySerializer = new DocumentStampSerializer(); // Uses the default key/reverseKey maps
  }

  /**
   * Helper function for XOR obfuscation/de-obfuscation.
   */
  private xorOperation(data: Buffer): Buffer {
    const keyBuffer = Buffer.from(this.obfuscationKey, "utf8");
    const result = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
      result[i] = data[i] ^ keyBuffer[i % keyBuffer.length];
    }
    return result;
  }

  /**
   * Serializes, packs, obfuscates, and encodes a DocumentStamp.
   *
   * @param stamp - The original DocumentStamp object.
   * @returns The obfuscated stamp as a binary string.
   */
  serialize(stamp: DocumentStamp): string {
    try {
      // 1. Serialize keys (long -> short)
      const shortKeyData = this.keySerializer.serialize(stamp);
      // 2. Pack with Msgpack
      const packedData = pack(shortKeyData);
      // 3. Obfuscate with XOR
      const obfuscatedData = this.xorOperation(packedData);
      return obfuscatedData.toString("binary");
    } catch (error) {
      console.error("Error during ObfuscatedStampSerializer serialize:", error);
      throw new Error("Failed to serialize and obfuscate stamp.");
    }
  }

  /**
   * Decodes, de-obfuscates, unpacks, and deserializes a stamp string.
   *
   * @param binaryStamp - The binary string representing the obfuscated stamp.
   * @returns The deserialized DocumentStamp object.
   */
  deserialize(binaryStamp: string): DocumentStamp {
    try {
      // 1. Decode Binary String to Buffer
      const obfuscatedData = Buffer.from(binaryStamp, "binary");
      // 2. De-obfuscate with XOR
      const packedData = this.xorOperation(obfuscatedData);
      // 3. Unpack Msgpack
      const shortKeyData = unpack(packedData);
      // 4. Deserialize keys (short -> long)
      const originalStamp = this.keySerializer.deserialize(shortKeyData);
      return originalStamp as DocumentStamp; // Assuming deserialize returns the correct type structure
    } catch (error) {
      console.error(
        "Error during ObfuscatedStampSerializer deserialize:",
        error,
      );
      throw new Error("Failed to de-obfuscate and deserialize stamp.");
    }
  }
}

// --- Optional: Enum/Constant Value Substitution (Example) ---
// If certain string values (like roles or states) are common,
// you could map them to numbers too for further reduction.

// const stateToCode = {
//   [SignatureState.DRAFT]: 0,
//   [SignatureState.AWAITING_SIGNATURES]: 1,
//   [SignatureState.PARTIALLY_SIGNED]: 2,
//   [SignatureState.COMPLETED]: 3,
//   [SignatureState.REJECTED]: 4,
//   [SignatureState.EXPIRED]: 5,
// };
// const codeToState = Object.entries(stateToCode).reduce((acc, [key, value]) => {
//   acc[value] = key;
//   return acc;
// }, {} as Record<number, string>);

// You would then need to modify substituteKeys to handle these specific value substitutions.
// For simplicity, this example focuses only on key substitution.
