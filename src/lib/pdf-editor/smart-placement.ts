import {
  DocumentField,
  FieldPosition,
  FieldType,
} from "@/lib/pdf-editor/document-types";

/**
 * Threshold distance in pixels for snapping to alignment guides
 */
const SNAP_THRESHOLD = 10;

/**
 * Represents an alignment line for visual feedback
 */
export interface AlignmentLine {
  type: "horizontal" | "vertical";
  position: number;
  start: number;
  end: number;
}

/**
 * Represents possible snap points for a field
 */
export interface SnapPoints {
  x: number | null;
  y: number | null;
  alignmentLines: AlignmentLine[];
}

/**
 * Calculates potential alignment guides for a field being dragged
 *
 * @param currentField - The field being dragged
 * @param allFields - All fields in the editor
 * @param currentPosition - The current position of the field
 * @param fieldSize - The size of the field
 * @returns The snap points and alignment lines for the field
 */
export function calculateSnapPoints(
  currentField: DocumentField | null,
  allFields: DocumentField[],
  currentPosition: FieldPosition,
  fieldSize: { width: number; height: number },
): SnapPoints {
  // Initialize snap points
  const result: SnapPoints = {
    x: null,
    y: null,
    alignmentLines: [],
  };

  // Filter out the current field and fields on different pages
  const otherFields = allFields.filter(
    (field) =>
      (!currentField || field.id !== currentField.id) &&
      field.position.page === currentPosition.page,
  );

  if (otherFields.length === 0) {
    return result;
  }

  // Calculate center points of current field
  const currentCenterX = currentPosition.x + fieldSize.width / 2;
  const currentCenterY = currentPosition.y + fieldSize.height / 2;

  // Calculate right and bottom edges of current field
  const currentRight = currentPosition.x + fieldSize.width;
  const currentBottom = currentPosition.y + fieldSize.height;

  // Check for horizontal alignment (left, center, right)
  let minHDist = SNAP_THRESHOLD;

  // Vertical lines to check for snapping
  const vLines = [];

  // Check each field for potential alignments
  for (const field of otherFields) {
    // Calculate other field's center and edges
    const otherCenterX = field.position.x + field.size.width / 2;
    const otherRight = field.position.x + field.size.width;

    // Check left edge alignment
    const leftDist = Math.abs(currentPosition.x - field.position.x);
    if (leftDist < minHDist) {
      minHDist = leftDist;
      result.x = field.position.x;
      vLines.push({
        type: "vertical",
        position: field.position.x,
        start: Math.min(currentPosition.y, field.position.y),
        end: Math.max(currentBottom, field.position.y + field.size.height),
      });
    }

    // Check center alignment
    const centerDist = Math.abs(currentCenterX - otherCenterX);
    if (centerDist < minHDist) {
      minHDist = centerDist;
      result.x = otherCenterX - fieldSize.width / 2;
      vLines.push({
        type: "vertical",
        position: otherCenterX,
        start: Math.min(currentPosition.y, field.position.y),
        end: Math.max(currentBottom, field.position.y + field.size.height),
      });
    }

    // Check right edge alignment
    const rightDist = Math.abs(currentRight - otherRight);
    if (rightDist < minHDist) {
      minHDist = rightDist;
      result.x = otherRight - fieldSize.width;
      vLines.push({
        type: "vertical",
        position: otherRight,
        start: Math.min(currentPosition.y, field.position.y),
        end: Math.max(currentBottom, field.position.y + field.size.height),
      });
    }
  }

  // Check for vertical alignment (top, center, bottom)
  let minVDist = SNAP_THRESHOLD;

  // Horizontal lines to check for snapping
  const hLines = [];

  // Check each field for potential alignments
  for (const field of otherFields) {
    // Calculate other field's center and bottom edge
    const otherCenterY = field.position.y + field.size.height / 2;
    const otherBottom = field.position.y + field.size.height;

    // Check top edge alignment
    const topDist = Math.abs(currentPosition.y - field.position.y);
    if (topDist < minVDist) {
      minVDist = topDist;
      result.y = field.position.y;
      hLines.push({
        type: "horizontal",
        position: field.position.y,
        start: Math.min(currentPosition.x, field.position.x),
        end: Math.max(currentRight, field.position.x + field.size.width),
      });
    }

    // Check center alignment
    const centerDist = Math.abs(currentCenterY - otherCenterY);
    if (centerDist < minVDist) {
      minVDist = centerDist;
      result.y = otherCenterY - fieldSize.height / 2;
      hLines.push({
        type: "horizontal",
        position: otherCenterY,
        start: Math.min(currentPosition.x, field.position.x),
        end: Math.max(currentRight, field.position.x + field.size.width),
      });
    }

    // Check bottom edge alignment
    const bottomDist = Math.abs(currentBottom - otherBottom);
    if (bottomDist < minVDist) {
      minVDist = bottomDist;
      result.y = otherBottom - fieldSize.height;
      hLines.push({
        type: "horizontal",
        position: otherBottom,
        start: Math.min(currentPosition.x, field.position.x),
        end: Math.max(currentRight, field.position.x + field.size.width),
      });
    }
  }

  // Add alignment lines to result
  if (result.x !== null) {
    result.alignmentLines.push(...(vLines as AlignmentLine[]));
  }

  if (result.y !== null) {
    result.alignmentLines.push(...(hLines as AlignmentLine[]));
  }

  return result;
}

/**
 * Renders alignment guides on a canvas overlay
 *
 * @param ctx - The canvas 2D rendering context
 * @param alignmentLines - The alignment lines to render
 * @param scale - The current viewport scale
 */
export function renderAlignmentGuides(
  ctx: CanvasRenderingContext2D,
  alignmentLines: AlignmentLine[],
  scale: number = 1.0,
): void {
  if (!ctx || alignmentLines.length === 0) return;

  // Set up the line style
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = "#4f46e5"; // Indigo color
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 3]); // Dashed line

  // Draw each alignment line
  for (const line of alignmentLines) {
    ctx.beginPath();

    if (line.type === "horizontal") {
      ctx.moveTo(line.start * scale, line.position * scale);
      ctx.lineTo(line.end * scale, line.position * scale);
    } else {
      ctx.moveTo(line.position * scale, line.start * scale);
      ctx.lineTo(line.position * scale, line.end * scale);
    }

    ctx.stroke();
  }

  // Reset line style
  ctx.setLineDash([]);
}

/**
 * Suggests optimal spacing between fields based on common patterns
 *
 * @param fieldType - The type of field being placed
 * @param nearbyFields - Fields in the vicinity
 * @returns Suggested spacing in pixels
 */
export function suggestOptimalSpacing(
  fieldType: FieldType,
  nearbyFields: DocumentField[],
): number {
  // Default spacing values based on field type
  const defaultSpacing: Record<FieldType, number> = {
    text: 20,
    signature: 30,
    date: 20,
    initials: 20,
  };

  // Return default spacing if no nearby fields
  if (nearbyFields.length === 0) {
    return defaultSpacing[fieldType] || 20;
  }

  // Analyze existing spacing patterns in nearby fields
  const spacings: number[] = [];

  // Extract vertical and horizontal spacings between fields
  for (let i = 0; i < nearbyFields.length; i++) {
    for (let j = i + 1; j < nearbyFields.length; j++) {
      const field1 = nearbyFields[i];
      const field2 = nearbyFields[j];

      // Only consider fields on the same line or column
      const isHorizontallyAligned =
        Math.abs(field1.position.y - field2.position.y) < 10;
      const isVerticallyAligned =
        Math.abs(field1.position.x - field2.position.x) < 10;

      if (isHorizontallyAligned) {
        // Calculate horizontal spacing
        const spacing = Math.abs(
          field1.position.x + field1.size.width - field2.position.x,
        );
        if (spacing > 0 && spacing < 100) spacings.push(spacing);
      }

      if (isVerticallyAligned) {
        // Calculate vertical spacing
        const spacing = Math.abs(
          field1.position.y + field1.size.height - field2.position.y,
        );
        if (spacing > 0 && spacing < 100) spacings.push(spacing);
      }
    }
  }

  // If we found existing spacing patterns, use the average
  if (spacings.length > 0) {
    const avgSpacing =
      spacings.reduce((sum, val) => sum + val, 0) / spacings.length;
    return Math.round(avgSpacing);
  }

  // Fall back to default spacing
  return defaultSpacing[fieldType] || 20;
}
