import crypto from "crypto";

export function createFileHash(
  fileBuffer: Buffer,
  blockSlot: number,
  password: string | null
): string {
  // Different set of primes: 11369, 13997, 16127, 19211
  const transformedSlot =
    ((Math.pow(blockSlot, 3) * 11369 + // Cube with first prime
      Math.pow(blockSlot, 2) * 13997 + // Square with second prime
      blockSlot * 16127) ^
      ((blockSlot >> 4) + // Linear with third prime + bitshift
        19211)) % // Fourth prime as offset
    2 ** 32;

  // Create hash including transformed block
  return crypto
    .createHash("sha256")
    .update(fileBuffer + transformedSlot.toString() + password || "")
    .digest("hex");
}

export function verifyFileHash(
  fileBuffer: Buffer,
  storedHash: string,
  password: string | null,
  confirmationSlot: number
): boolean {
  // Check all possible slots within 150 block range
  for (
    let possibleSlot = confirmationSlot - 150;
    possibleSlot <= confirmationSlot;
    possibleSlot++
  ) {
    const testHash = createFileHash(fileBuffer, possibleSlot, password || "");
    console.log({
      possibleSlot,
      testHash,
      storedHash,
    });
    if (testHash === storedHash) {
      return true;
    }
  }
  return false;
}
