/**
 * Creates a blob URL from a string document
 *
 * @param content - The string content to convert to a blob
 * @param mimeType - The MIME type of the content
 * @returns The generated blob URL
 */
export function createBlobUrl(content: string, mimeType: string): string {
  const blob = new Blob([content], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Cleans up a blob URL to prevent memory leaks
 *
 * @param url - The blob URL to revoke
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}
