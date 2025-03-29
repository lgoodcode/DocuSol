/**
 * Gets PDF coordinates from viewport coordinates
 *
 * @param x - The x coordinate in viewport space
 * @param y - The y coordinate in viewport space
 * @param pageIndex - The page index
 * @param scale - The current scale factor
 * @returns The coordinates in PDF space
 */
export function viewportToPdfCoordinates(
  x: number,
  y: number,
  pageIndex: number,
  scale: number,
): { x: number; y: number; pageIndex: number } {
  return {
    x: x / scale,
    y: y / scale,
    pageIndex,
  };
}

/**
 * Gets viewport coordinates from PDF coordinates
 *
 * @param x - The x coordinate in PDF space
 * @param y - The y coordinate in PDF space
 * @param pageIndex - The page index
 * @param scale - The current scale factor
 * @returns The coordinates in viewport space
 */
export function pdfToViewportCoordinates(
  x: number,
  y: number,
  pageIndex: number,
  scale: number,
): { x: number; y: number; pageIndex: number } {
  return {
    x: x * scale,
    y: y * scale,
    pageIndex,
  };
}
