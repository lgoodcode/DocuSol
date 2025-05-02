/* eslint-disable @typescript-eslint/no-explicit-any */

import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { toast } from "sonner";

import type { DocumentField } from "@/lib/pdf-editor/document-types";
import { DEFAULT_PDF_WIDTH } from "@/lib/pdf-editor/constants";

const PX_TO_PT = 0.75;
const DEFAULT_FONT_SIZE = 16;

// Font cache to avoid reloading fonts
// Store ArrayBuffer for fetch
const fontCache: Record<string, ArrayBuffer> = {};

const getFontSize = (field: DocumentField) => {
  return field.textStyles?.fontSize || DEFAULT_FONT_SIZE;
};

const getPdfFontSize = (field: DocumentField) => {
  return getFontSize(field) * PX_TO_PT;
};

const getPdfFontColor = (field: DocumentField) => {
  return field.textStyles?.fontColor
    ? rgbFromHex(field.textStyles.fontColor)
    : rgb(0, 0, 0);
};

/**
 * Converts a hex color string to RGB values for PDF-lib
 *
 * @param hex - Hex color string (e.g., "#FF0000")
 * @returns RGB color object for PDF-lib
 */
function rgbFromHex(hex: string): ReturnType<typeof rgb> {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse the hex values
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

  return rgb(r, g, b);
}

/**
 * Loads a font file using fetch and caches it.
 *
 * @param fontPath - Public URL path to the font file (e.g., /fonts/bastliga.otf)
 * @returns Promise resolving to the font data as ArrayBuffer or null if fetch fails
 */
async function loadFont(fontPath: string): Promise<ArrayBuffer | null> {
  // Check cache first
  if (fontCache[fontPath]) {
    return fontCache[fontPath];
  }

  try {
    // Ensure the path starts with '/' for consistency, useful if paths are sometimes relative
    const fetchPath = fontPath.startsWith("/") ? fontPath : `/${fontPath}`;
    console.log(`Fetching font from URL: ${fetchPath}`);
    const response = await fetch(fetchPath);
    if (!response.ok) {
      console.error(
        `Failed to fetch font: ${response.statusText} for URL ${fetchPath}`,
      );
      return null; // Return null if fetch fails
    }

    const fontData = await response.arrayBuffer();
    // Cache the ArrayBuffer
    fontCache[fontPath] = fontData;
    return fontData;
  } catch (error) {
    console.error(`Error fetching font from ${fontPath}:`, error);
    return null; // Return null on network or other fetch errors
  }
}

/**
 * Maps a font family name to its public URL path.
 * NOTE: Font names here MUST match the `fontFamily` stored in `field.textStyles`
 * and the font-family defined in CSS.
 *
 * @param fontFamily - The CSS font-family value (e.g., "Bastliga", "Dancing Font")
 * @returns The public URL path to the font file (e.g., /fonts/bastliga.otf) or null if not found
 */
function getFontPath(fontFamily: string): string | null {
  // Extract the primary font name, removing quotes if present
  const primaryFont = fontFamily.split(",")[0].trim().replace(/['"]/g, "");

  // Font map should point to the public URLs where fonts are served
  const fontMap: Record<string, string> = {
    Bastliga: "/fonts/bastliga.otf",
    Brother: "/fonts/brother.otf",
    CentralWell: "/fonts/centralwell.ttf",
    "Dancing Font": "/fonts/dancing.ttf",
    DancingFont: "/fonts/dancing.ttf",
    "Modern Signature": "/fonts/modern-signature.ttf",
    ModernSignature: "/fonts/modern-signature.ttf",
    "Perfecto Calligraphy": "/fonts/perfectocalligraphy.ttf",
    PerfectoCalligraphy: "/fonts/perfectocalligraphy.ttf",
    Phitagate: "/fonts/phitagate.otf",
    Priestacy: "/fonts/priestacy.otf",
    Dalton: "/fonts/dalton.otf",
    Satoshi: "/fonts/Satoshi-Variable.ttf",
  };

  return fontMap[primaryFont] || null;
}

/**
 * Exports the current PDF with field values flattened onto it.
 * This version draws the text directly onto the page, not creating interactive form fields.
 *
 * @param pdfDataUrl - The data URL of the source PDF
 * @param filename - The desired filename for the exported PDF
 * @param fields - The fields with values to flatten onto the PDF
 * @returns A promise that resolves when the PDF is generated and download is initiated
 */
export async function exportPdfWithFields(
  pdfDataUrl: string,
  filename: string,
  fields: DocumentField[],
): Promise<Blob> {
  try {
    const pdfDoc = await PDFDocument.load(pdfDataUrl);
    pdfDoc.registerFontkit(fontkit);

    // Embed necessary standard fonts (will be done on demand by selectFontForField)
    // const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Get the pages
    const pages = pdfDoc.getPages();

    // Add each field to the PDF
    for (const field of fields) {
      if (!field.value) {
        continue; // Skip fields without a value
      }

      // Get the page for this field
      const pageIndex = field.position.page;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(
          `Field ${field.id} references non-existent page ${field.position.page}. Skipping.`,
        );
        continue;
      }
      const page = pages[pageIndex];

      // Get page dimensions
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Calculate scale factor based on default width used during field placement
      const scaleFactor = pageWidth / DEFAULT_PDF_WIDTH;

      // Select the appropriate font (handles standard, custom, bold, italic)
      const font = await selectFontForField(pdfDoc, field);
      const fontSize = getPdfFontSize(field); // Size in PT
      const fontColor = getPdfFontColor(field);

      // Convert coordinates and adjust for font baseline
      // PDF origin is bottom-left. App origin is top-left.
      const fieldX = field.position.x * scaleFactor;

      // Get font metrics directly from the font object and scale them
      const fontAny = font as any;

      const unitsPerEm = fontAny.unitsPerEm || 1000; // Provide a default if undefined
      const ascender = fontAny.ascender;
      const descender = fontAny.descender; // Typically negative

      const scale = fontSize / unitsPerEm;
      let scaledAscent = ascender * scale;
      let scaledDescent = descender * scale;

      // Calculate the baseline Y coordinate for drawing text in PDF space.
      // const fieldHeightPt = field.size.height * PX_TO_PT * scaleFactor;
      const fieldCenterYApp = field.position.y + field.size.height / 2;
      const fieldCenterYPdf = pageHeight - fieldCenterYApp * scaleFactor;

      let y: number;

      // Check if font metrics are valid for baseline calculation
      if (
        typeof ascender === "number" &&
        typeof descender === "number" &&
        !isNaN(ascender) &&
        !isNaN(descender) &&
        !isNaN(scaledAscent) && // Check scaled values too
        !isNaN(scaledDescent)
      ) {
        // Use baseline calculation if metrics are valid
        const baselineOffset = (scaledAscent + scaledDescent) / 2; // Distance from font center to baseline
        y = fieldCenterYPdf - baselineOffset;
      } else {
        // Fallback: Vertically center the text using font size as a guide
        // Position Y roughly at the middle, adjusted slightly down by half the font size
        y = fieldCenterYPdf - fontSize / 2.5; // Adjust divisor as needed for better centering
        scaledAscent = fontSize * 0.8; // Approximate ascent for line height fallback
        scaledDescent = fontSize * -0.2; // Approximate descent
      }

      try {
        switch (field.type) {
          case "text": {
            let currentY = y;

            if (field.value.includes("\n")) {
              const lines = field.value.split("\n");
              const scaledLineHeight = scaledAscent - scaledDescent;
              const lineHeightWithLeading = scaledLineHeight * 1.2;

              for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() !== "") {
                  page.drawText(lines[i], {
                    x: fieldX,
                    y: currentY,
                    font: font,
                    size: fontSize,
                    color: fontColor,
                  });
                }
                currentY -= lineHeightWithLeading;
              }
            } else {
              page.drawText(field.value, {
                x: fieldX,
                y: currentY,
                font: font,
                size: fontSize,
                color: fontColor,
              });
            }
            break;
          }

          case "initials": {
            console.log(
              `Processing initials field ${field.id}. Value:`,
              field.value,
            );
            // Handle initials similarly to signature: check if image or text
            if (field.value.startsWith("data:image")) {
              // Handle drawn initials (Image)
              try {
                const initialsBytes = await fetch(field.value).then((res) =>
                  res.arrayBuffer(),
                );
                const isPng = field.value.startsWith("data:image/png");
                const initialsImage = isPng
                  ? await pdfDoc.embedPng(initialsBytes)
                  : await pdfDoc.embedJpg(initialsBytes);

                const fieldWidthPt = field.size.width * PX_TO_PT * scaleFactor;
                const fieldHeightPt =
                  field.size.height * PX_TO_PT * scaleFactor;
                const fieldCenterX = fieldX + fieldWidthPt / 2;
                const fieldCenterY =
                  pageHeight -
                  (field.position.y * scaleFactor + fieldHeightPt / 2);

                // Apply the signature scale factor to the field dimensions
                const scale = field.signatureScale ?? 1.0;
                const scaledWidth = fieldWidthPt * scale;
                const scaledHeight = fieldHeightPt * scale;

                // Calculate bottom-left corner for the scaled box, centered on the original field center
                const imageX = fieldCenterX - scaledWidth / 2;
                const imageY = fieldCenterY - scaledHeight / 2;

                page.drawImage(initialsImage, {
                  x: imageX,
                  y: imageY,
                  width: scaledWidth, // Use scaled field width
                  height: scaledHeight, // Use scaled field height
                });
              } catch (error) {
                console.error(
                  `Error embedding or drawing initials image ${field.id}: `,
                  error,
                );
                page.drawText("[Initials Image Error]", {
                  x: fieldX,
                  y: y,
                  font: await pdfDoc.embedFont(StandardFonts.Helvetica),
                  size: 10,
                  color: rgb(1, 0, 0),
                });
              }
            } else {
              // Handle typed initials (Text)
              page.drawText(field.value, {
                x: fieldX,
                y: y,
                size: fontSize,
                font: font,
                color: fontColor,
              });
            }
            break;
          }

          case "date": {
            let textToDraw = field.value;
            // Attempt to format date, fallback to original value if invalid
            try {
              textToDraw = new Date(field.value).toLocaleDateString();
            } catch {
              console.warn(
                `Invalid date value for field ${field.id}: ${field.value}`,
              );
            }

            let currentY = y; // Use calculated y

            if (textToDraw.includes("\n")) {
              const lines = textToDraw.split("\n");
              const scaledLineHeight = scaledAscent - scaledDescent;
              const lineHeightWithLeading = scaledLineHeight * 1.2;
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() !== "") {
                  page.drawText(lines[i], {
                    x: fieldX,
                    y: currentY,
                    font,
                    size: fontSize,
                    color: fontColor,
                  });
                }
                currentY -= lineHeightWithLeading;
              }
            } else {
              page.drawText(textToDraw, {
                x: fieldX,
                y: currentY,
                font,
                size: fontSize,
                color: fontColor,
              });
            }
            break;
          }

          case "signature": {
            if (field.value.startsWith("data:image")) {
              // Handle drawn signature (Image)
              try {
                const signatureBytes = await fetch(field.value).then((res) =>
                  res.arrayBuffer(),
                );
                const isPng = field.value.startsWith("data:image/png");
                const signatureImage = isPng
                  ? await pdfDoc.embedPng(signatureBytes)
                  : await pdfDoc.embedJpg(signatureBytes);

                const fieldWidthPt = field.size.width * PX_TO_PT * scaleFactor;
                const fieldHeightPt =
                  field.size.height * PX_TO_PT * scaleFactor;
                const fieldCenterX = fieldX + fieldWidthPt / 2;
                const fieldCenterY =
                  pageHeight -
                  (field.position.y * scaleFactor + fieldHeightPt / 2);

                // Apply the signature scale factor to the field dimensions
                const scale = field.signatureScale ?? 1.0;
                const scaledWidth = fieldWidthPt * scale;
                const scaledHeight = fieldHeightPt * scale;

                // Calculate bottom-left corner for the scaled box, centered on the original field center
                const imageX = fieldCenterX - scaledWidth / 2;
                const imageY = fieldCenterY - scaledHeight / 2;

                page.drawImage(signatureImage, {
                  x: imageX,
                  y: imageY,
                  width: scaledWidth, // Use scaled field width
                  height: scaledHeight, // Use scaled field height
                });
              } catch (error) {
                console.error(
                  `Error embedding or drawing signature image ${field.id}: `,
                  error,
                );
                page.drawText("[Signature Image Error]", {
                  x: fieldX,
                  y: y,
                  font: await pdfDoc.embedFont(StandardFonts.Helvetica),
                  size: 10,
                  color: rgb(1, 0, 0),
                });
              }
            } else {
              // Handle typed signature (Text)
              page.drawText(field.value, {
                x: fieldX,
                y: y,
                size: fontSize,
                font: font,
                color: fontColor,
              });
            }
            break;
          }
        }
      } catch (fieldError) {
        // Added field details to the error log
        console.error(
          `Error processing field ${field.id} ('${field.label || field.type}') Value: '${field.value}' Position: ${JSON.stringify(field.position)} Size: ${JSON.stringify(field.size)}:`,
          fieldError,
        );
        // Continue with other fields even if one fails
      }
    }

    // Save the PDF - using `updateFieldAppearances: false` as we drew manually
    // If we were mixing manual drawing and interactive fields, this might need adjustment.
    const modifiedPdfBytes = await pdfDoc.save({
      updateFieldAppearances: false,
    });

    // Create a blob from the PDF data
    return new Blob([modifiedPdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    toast.error("Error exporting PDF", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred.",
    });
    // Re-throw the error if needed by the caller
    throw error;
  }
}

/**
 * Selects or embeds the appropriate font based on font family, weight, and style.
 * Handles standard PDF fonts and attempts to load/embed custom fonts.
 *
 * @param pdfDoc - The PDF document instance
 * @param field - The field containing textStyles properties
 * @returns The PDFFont instance to use
 */
async function selectFontForField(
  pdfDoc: PDFDocument,
  field: DocumentField,
): Promise<PDFFont> {
  const fontFamily = field.textStyles?.fontFamily || "Helvetica"; // Default to Helvetica
  const isBold = field.textStyles?.fontWeight === "bold";
  const isItalic = field.textStyles?.fontStyle === "italic";

  let finalFont: PDFFont | null = null;

  // 1. Check for Custom Fonts specified by name
  const customFontPath = getFontPath(fontFamily);
  if (customFontPath) {
    const fontBytes = await loadFont(customFontPath);
    if (fontBytes) {
      try {
        // Embed the custom font (subsetting recommended for size)
        // Provide the font data as ArrayBuffer
        finalFont = await pdfDoc.embedFont(fontBytes, { subset: true });
        // Note: pdf-lib doesn't inherently support bold/italic variants of *custom*
        // embedded fonts unless separate font files for those weights/styles are loaded.
      } catch (embedError) {
        console.error(
          `Failed to embed custom font ${fontFamily} from ${customFontPath}:`,
          embedError,
        );
        // Fallback to standard fonts if embedding fails
      }
    } else {
      console.warn(
        `Custom font ${fontFamily} found path ${customFontPath}, but failed to load bytes. Falling back.`,
      );
    }
  }

  // 2. Fallback to Standard PDF Fonts if no custom font used or embedding failed
  if (!finalFont) {
    // Determine standard font based on family name and styles
    let standardFontType = StandardFonts.Helvetica; // Default fallback

    if (fontFamily.includes("Times") || fontFamily.includes("serif")) {
      if (isBold && isItalic)
        standardFontType = StandardFonts.TimesRomanBoldItalic;
      else if (isBold) standardFontType = StandardFonts.TimesRomanBold;
      else if (isItalic) standardFontType = StandardFonts.TimesRomanItalic;
      else standardFontType = StandardFonts.TimesRoman;
    } else if (
      fontFamily.includes("Courier") ||
      fontFamily.includes("monospace")
    ) {
      if (isBold && isItalic)
        standardFontType = StandardFonts.CourierBoldOblique;
      else if (isBold) standardFontType = StandardFonts.CourierBold;
      else if (isItalic) standardFontType = StandardFonts.CourierOblique;
      else standardFontType = StandardFonts.Courier;
    }
    // Use Helvetica/Arial/sans-serif as the catch-all default
    else {
      if (isBold && isItalic)
        standardFontType = StandardFonts.HelveticaBoldOblique;
      else if (isBold) standardFontType = StandardFonts.HelveticaBold;
      else if (isItalic) standardFontType = StandardFonts.HelveticaOblique;
      else standardFontType = StandardFonts.Helvetica; // Default Helvetica
    }

    finalFont = await pdfDoc.embedFont(standardFontType);
  }

  // Should always have a font by now (Helvetica is the final fallback)
  if (!finalFont) {
    console.error(
      "CRITICAL: Could not load any font (custom or standard), embedding Helvetica as last resort.",
    );
    finalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  return finalFont; // No need for non-null assertion due to the final fallback
}
