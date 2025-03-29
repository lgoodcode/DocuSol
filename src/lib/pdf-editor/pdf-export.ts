import { toast } from "sonner";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import type { DocumentField, FieldType } from "@/lib/pdf-editor/document-types";
import { DEFAULT_PDF_WIDTH } from "@/lib/pdf-editor/constants";
import fontkit from "@pdf-lib/fontkit";

const PX_TO_PT = 0.75;
const DEFAULT_FONT_SIZE = 16;

// Font cache to avoid reloading fonts
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
 * Loads a font file and caches it
 *
 * @param fontPath - Path to the font file
 * @returns Promise resolving to the font data as ArrayBuffer
 */
async function loadFont(fontPath: string): Promise<ArrayBuffer> {
  // Check cache first
  if (fontCache[fontPath]) {
    return fontCache[fontPath];
  }

  try {
    const response = await fetch(fontPath);
    if (!response.ok) {
      throw new Error(`Failed to load font: ${response.statusText}`);
    }

    const fontData = await response.arrayBuffer();
    fontCache[fontPath] = fontData;
    return fontData;
  } catch (error) {
    console.error("Error loading font:", error);
    throw error;
  }
}

/**
 * Maps a font family name to a font file path
 *
 * @param fontFamily - The CSS font-family value
 * @returns The path to the font file or null if not found
 */
function getFontPath(fontFamily: string): string | null {
  const primaryFont = fontFamily.split(",")[0].trim();

  const fontMap: Record<string, string> = {
    Bastliga: "/src/fonts/bastliga.otf",
    CentralWell: "/src/fonts/centralwell.ttf",
    DancingFont: "/src/fonts/dancing.ttf",
  };

  return fontMap[primaryFont] || null;
}

/**
 * Converts app field type to PDF-lib field type
 *
 * @param fieldType - The app's field type
 * @returns The corresponding PDF-lib field type or null if not supported
 */
const mapFieldType = (fieldType: FieldType): string | null => {
  switch (fieldType) {
    case "text":
      return "text";
    // case "checkbox":
    //   return "checkbox";
    // case "radio":
    //   return "radio";
    // case "dropdown":
    //   return "dropdown";
    case "signature":
    case "initials":
      return "signature";
    case "date":
      return "date"; // Date fields are text fields with special formatting
    default:
      return null; // Some field types might not have direct equivalents
  }
};

/**
 * Exports the current PDF with form fields
 *
 * @param filename - The filename to use for the exported PDF
 * @param fields - The fields to add to the PDF
 * @returns A promise that resolves when the PDF is exported
 */
export async function exportPdfWithFields(
  pdfDataUrl: string,
  filename: string,
  fields: DocumentField[],
): Promise<void> {
  try {
    const pdfDoc = await PDFDocument.load(pdfDataUrl);

    pdfDoc.registerFontkit(fontkit);

    // Load the default font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold,
    );
    const helveticaItalicFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaOblique,
    );
    const helveticaBoldItalicFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBoldOblique,
    );

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanBold,
    );
    const timesRomanItalicFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanItalic,
    );
    const timesRomanBoldItalicFont = await pdfDoc.embedFont(
      StandardFonts.TimesRomanBoldItalic,
    );

    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
    const courierItalicFont = await pdfDoc.embedFont(
      StandardFonts.CourierOblique,
    );
    const courierBoldItalicFont = await pdfDoc.embedFont(
      StandardFonts.CourierBoldOblique,
    );

    const fontUrl = "/src/fonts/dancing.ttf";
    const dancingFontBytes = await fetch(fontUrl).then((res) =>
      res.arrayBuffer(),
    );
    const dancingFont = await pdfDoc.embedFont(dancingFontBytes, {
      subset: true,
    });

    // Get the pages
    const pages = pdfDoc.getPages();

    // Add each field to the PDF
    for (const field of fields) {
      const pdfType = mapFieldType(field.type);
      if (!pdfType) continue; // Skip unsupported field types
      if (!field.value) continue; //Skip for fields of which value is missing

      // Get the page for this field
      const page = pages[field.position.page - 1];
      if (!page) continue;

      // Get page dimensions
      const { width, height } = page.getSize();

      const scaleFactor = width / DEFAULT_PDF_WIDTH;

      // Convert coordinates (PDF coordinate system has origin at bottom-left)
      const x = field.position.x * scaleFactor;
      const y =
        height -
        field.position.y * scaleFactor -
        field.size.height / 2 +
        helveticaFont.heightAtSize(getFontSize(field), { descender: true }) / 2;

      try {
        switch (pdfType) {
          case "text": {
            const font = await selectFontForField(pdfDoc, field);
            let currentY =
              y -
              helveticaFont.heightAtSize(getFontSize(field), {
                descender: true,
              }) /
                2 +
              font.heightAtSize(getFontSize(field), {
                descender: true,
              }) /
                2;

            // Handle multi-line text
            if (field.value.includes("\n")) {
              const lines = field.value.split("\n");
              const fontSize = getPdfFontSize(field);
              const lineHeight = helveticaFont.heightAtSize(fontSize) * 1.2;

              // Draw each line of text
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() === "") {
                  // Just move down for empty lines
                  currentY -= lineHeight;
                  continue;
                }

                page.drawText(lines[i], {
                  x,
                  y: currentY,
                  font: font,
                  size: fontSize,
                  color: getPdfFontColor(field),
                });

                // Move down for the next line
                currentY -= lineHeight;
              }
            } else {
              // Single line text
              page.drawText(field.value, {
                x,
                y: currentY,
                font: font,
                size: getPdfFontSize(field),
                color: getPdfFontColor(field),
              });
            }
            break;
          }

          case "date": {
            // Add date field
            const dateValue = new Date(field.value).toLocaleDateString();
            page.drawText(dateValue, {
              x,
              y,
              size: getPdfFontSize(field),
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });

            break;
          }

          case "signature": {
            if (field.value.startsWith("data:image")) {
              // Handle drawn signature
              try {
                const signatureBytes = await fetch(field.value).then((res) =>
                  res.arrayBuffer(),
                );
                const signatureImage = await pdfDoc.embedPng(signatureBytes);
                const signatureDims = signatureImage.scale(
                  (field.size.width * scaleFactor) / signatureImage.width,
                );

                page.drawImage(signatureImage, {
                  x,
                  y:
                    y -
                    signatureDims.height +
                    field.size.height / 2 -
                    helveticaFont.heightAtSize(12, { descender: true }) / 2,
                  width: signatureDims.width * scaleFactor,
                  height: signatureDims.height * scaleFactor,
                });
              } catch (error) {
                console.error("Error embedding signature image: ", error);
              }
            } else {
              // Handle typed signature with custom font if available
              const font = helveticaFont;
              const fontSize = 18 * PX_TO_PT;

              // Calculate vertical position adjustment for the font
              const fontHeight = font.heightAtSize(fontSize, {
                descender: true,
              });
              const yPos =
                y +
                fontHeight / 2 -
                helveticaFont.heightAtSize(12, { descender: true }) / 2;

              page.drawText(field.value, {
                x,
                y: yPos,
                size: fontSize,
                font: dancingFont,
                color: rgb(0, 0, 0),
              });
            }
            break;
          }

          // case "checkbox": {
          //   // Create a checkbox field
          //   const checkboxField = form.createCheckBox(fieldName);
          //   checkboxField.addToPage(page, {
          //     x,
          //     y,
          //     width: field.size.width,
          //     height: field.size.height,
          //     borderWidth: 1,
          //     borderColor: rgb(0.75, 0.75, 0.75),
          //   });

          //   // Set properties
          //   if (field.required) {
          //     checkboxField.enableRequired();
          //   }

          //   // Check the box if value is "true"
          //   if (field.value === "true") {
          //     checkboxField.check();
          //   }

          //   break;
          // }

          // case "radio": {
          //   // Create a radio group if it doesn't exist
          //   let radioGroup;
          //   const groupName = `group_${field.recipientId}`;

          //   try {
          //     radioGroup = form.getRadioGroup(groupName);
          //   } catch (e) {
          //     radioGroup = form.createRadioGroup(groupName);
          //   }

          //   // Add a button to the group
          //   radioGroup.addOptionToPage(field.id, page, {
          //     x,
          //     y,
          //     width: field.size.width,
          //     height: field.size.height,
          //     borderWidth: 1,
          //     borderColor: rgb(0.75, 0.75, 0.75),
          //   });

          //   // Set properties
          //   if (field.required) {
          //     radioGroup.enableRequired();
          //   }

          //   // Select the option if it matches the value
          //   if (field.value === field.id) {
          //     radioGroup.select(field.id);
          //   }

          //   break;
          // }

          // case "dropdown": {
          //   // Create a dropdown field
          //   const dropdownField = form.createDropdown(fieldName);
          //   dropdownField.addToPage(page, {
          //     x,
          //     y,
          //     width: field.size.width,
          //     height: field.size.height,
          //     borderWidth: 1,
          //     borderColor: rgb(0.75, 0.75, 0.75),
          //   });

          //   // Set options
          //   if (field.options && field.options.length > 0) {
          //     dropdownField.setOptions(field.options);
          //   }

          //   // Set properties
          //   if (field.required) {
          //     dropdownField.enableRequired();
          //   }

          //   // Select an option if value is provided
          //   if (field.value && field.options?.includes(field.value)) {
          //     dropdownField.select(field.value);
          //   }

          //   // Set appearance options
          //   dropdownField.setFontSize(12);

          //   break;
          // }
        }
      } catch (fieldError) {
        console.error(`Error adding field ${field.id}:`, fieldError);
        // Continue with other fields even if one fails
      }
    }

    // Save the PDF
    const modifiedPdfBytes = await pdfDoc.save({
      updateFieldAppearances: true, // Important for ensuring fields appear correctly
    });

    // Create a blob from the PDF data
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });

    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    link.click();

    // Clean up
    URL.revokeObjectURL(link.href);

    toast.success("PDF exported successfully with interactive form fields");
    return;
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw error;
  }
}

/**
 * Selects the appropriate font based on font family, weight, and style
 *
 * @param pdfDoc - The PDF document
 * @param field - The field with font properties
 * @returns The appropriate font for the field
 */
async function selectFontForField(pdfDoc: PDFDocument, field: DocumentField) {
  // Default to Helvetica if no font family is specified
  const fontFamily = field.textStyles?.fontFamily || "inherit";
  const isBold = field.textStyles?.fontWeight === "bold";
  const isItalic = field.textStyles?.fontStyle === "italic";

  // Check for specific font families
  if (
    fontFamily.includes("Arial") ||
    fontFamily === "inherit" ||
    fontFamily.includes("sans-serif")
  ) {
    // Arial/Helvetica family
    if (isBold && isItalic) {
      return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    } else if (isBold) {
      return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    } else if (isItalic) {
      return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    } else {
      return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  } else if (fontFamily.includes("Times") || fontFamily.includes("serif")) {
    // Times Roman family
    if (isBold && isItalic) {
      return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    } else if (isBold) {
      return await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    } else if (isItalic) {
      return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    } else {
      return await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }
  } else if (
    fontFamily.includes("Courier") ||
    fontFamily.includes("monospace")
  ) {
    // Courier family
    if (isBold && isItalic) {
      return await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
    } else if (isBold) {
      return await pdfDoc.embedFont(StandardFonts.CourierBold);
    } else if (isItalic) {
      return await pdfDoc.embedFont(StandardFonts.CourierOblique);
    } else {
      return await pdfDoc.embedFont(StandardFonts.Courier);
    }
  } else if (fontFamily.includes("Georgia")) {
    // Georgia is similar to Times Roman
    if (isBold && isItalic) {
      return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    } else if (isBold) {
      return await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    } else if (isItalic) {
      return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    } else {
      return await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }
  } else if (fontFamily.includes("Verdana")) {
    // Verdana is similar to Helvetica
    if (isBold && isItalic) {
      return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    } else if (isBold) {
      return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    } else if (isItalic) {
      return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    } else {
      return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }

  // For custom fonts or unrecognized fonts, fall back to Helvetica
  if (isBold && isItalic) {
    return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  } else if (isBold) {
    return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  } else if (isItalic) {
    return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  } else {
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}
