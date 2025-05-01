import React, { memo, useRef, useState } from "react";
import { Page } from "react-pdf";
import { Rnd, DraggableData, ResizableDelta, Position } from "react-rnd";

import { cn } from "@/lib/utils";
import { DEFAULT_PDF_WIDTH } from "@/lib/pdf-editor/constants";
import { Fields } from "@/components/pdf-editor/field";
import type {
  FieldPosition,
  FieldType,
  DocumentField,
  FieldSize,
} from "@/lib/pdf-editor/document-types";
import { getFieldTemplate } from "@/lib/pdf-editor/fields";
import type { DocumentSigner } from "@/lib/types/stamp";

// Interface for individual props
interface DocumentPageProps {
  pageIndex: number;
  fields: DocumentField[];
  updateField: (
    id: string,
    updates: Partial<Pick<DocumentField, "position" | "size" | "value">>,
  ) => void;
  addField?: (field: Omit<DocumentField, "id" | "assignedTo">) => void; // Optional: Only needed for editor
  signers?: DocumentSigner[]; // Optional: Only needed for editor view within page
  currentSigner?: DocumentSigner | null; // Optional: Only for signer view
  selectedFieldId: string | null;
  setSelectedFieldId: (id: string | null) => void;
  viewType: "editor" | "signer"; // Explicitly pass viewType
  scale: number;
  isDragging?: boolean; // Optional: Editor only
  isResizing?: boolean; // Optional: Editor only
  setDragging?: (dragging: boolean) => void; // Optional: Editor only
  setResizing?: (resizing: boolean) => void; // Optional: Editor only
  children?: React.ReactNode;
}

export const DocumentPage = memo(function DocumentPage({
  pageIndex,
  fields,
  updateField,
  addField, // Added prop
  signers = [], // Default if not provided
  currentSigner = null, // Default if not provided
  selectedFieldId,
  setSelectedFieldId,
  viewType,
  scale,
  isDragging = false, // Default if not provided
  isResizing = false, // Default if not provided
  setDragging = () => {}, // Default if not provided
  setResizing = () => {}, // Default if not provided
  children,
}: DocumentPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [justDragged, setJustDragged] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (viewType !== "editor" || !addField) return;

    e.preventDefault();
    const fieldType = e.dataTransfer.getData("field-type") as FieldType;
    const fieldTemplate = getFieldTemplate(fieldType);
    const offsetX = parseFloat(e.dataTransfer.getData("offsetX") || "0");
    const offsetY = parseFloat(e.dataTransfer.getData("offsetY") || "0");

    if (!fieldType || !pageRef.current) return;

    const pageRect = pageRef.current.getBoundingClientRect();
    const x = (e.clientX - pageRect.left) / scale - offsetX / scale;
    const y = (e.clientY - pageRect.top) / scale - offsetY / scale;

    const newFieldPosition: FieldPosition = {
      x: Math.round(
        Math.min(
          Math.max(x, 0),
          pageRect.width / scale - fieldTemplate.defaultSize.width,
        ),
      ),
      y: Math.round(
        Math.min(
          Math.max(y, 0),
          pageRect.height / scale - fieldTemplate.defaultSize.height,
        ),
      ),
      page: pageIndex,
    };

    // Call the passed addField function
    addField({
      type: fieldType,
      position: newFieldPosition,
      size: fieldTemplate.defaultSize,
      // Default value can be added here if needed
    });
  };

  const handleDragStart = (e: any, data: DraggableData) => {
    if (viewType !== "editor") return;
    setSelectedFieldId(data.node.dataset.fieldId || "");
    setDragging(true);
  };

  const handleDragStop = (e: any, data: DraggableData) => {
    if (viewType !== "editor") return;
    setDragging(false);
    const fieldId = data.node.dataset.fieldId;
    if (fieldId) {
      setJustDragged(true);
      updateField(fieldId, {
        position: {
          page: pageIndex,
          x: Math.round(data.x),
          y: Math.round(data.y),
        },
      });
      setSelectedFieldId(fieldId);
      setTimeout(() => setJustDragged(false), 0);
    } else {
      console.error("Field ID not found on drag stop");
    }
  };

  return (
    <div
      ref={pageRef}
      className="document-page relative z-0 bg-white shadow-2xl dark:shadow-white/30"
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
        if (viewType === "editor") e.preventDefault();
      }}
      onDrop={handleDrop}
      data-page-index={pageIndex}
      style={{
        width: DEFAULT_PDF_WIDTH * scale,
        height: "auto",
      }}
      onClick={() => {
        if (!justDragged) {
          setSelectedFieldId(null);
        }
      }}
    >
      <Page
        width={DEFAULT_PDF_WIDTH}
        pageNumber={pageIndex + 1}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={viewType === "editor"} // Annotations likely only relevant for editor
        loading={
          <div className="flex h-full min-h-[300px] w-full items-center justify-center bg-gray-200">
            <span className="text-sm text-muted-foreground">
              Loading page {pageIndex + 1}...
            </span>
          </div>
        }
      />

      {fields
        .filter((field: DocumentField) => field.position.page === pageIndex)
        .map((field: DocumentField) => {
          const FieldComponent = Fields[field.type];
          if (!FieldComponent) {
            console.warn(`Component not found for field type: ${field.type}`);
            return null;
          }
          const isSelected = field.id === selectedFieldId;

          // Determine recipient and assignment status
          const isAssignedToCurrentSigner =
            currentSigner && field.assignedTo === currentSigner.id;
          const recipient =
            viewType === "editor"
              ? signers.find((signer) => signer.id === field.assignedTo)
              : isAssignedToCurrentSigner
                ? currentSigner
                : null;

          const recipientColor = recipient?.color || "#cccccc";

          // Corrected condition: Skip if signer view AND NOT assigned to current signer
          if (viewType === "signer" && !isAssignedToCurrentSigner) {
            return null;
          }

          if (viewType === "editor") {
            return (
              <Rnd
                key={field.id}
                className="absolute z-20 box-border min-h-[40px] bg-white/30 text-black"
                bounds="parent"
                enableResizing={true}
                disableDragging={false}
                size={{
                  width: field.size.width * scale,
                  height: field.size.height * scale,
                }}
                position={{
                  x: field.position.x * scale,
                  y: field.position.y * scale,
                }}
                minWidth={40 * scale}
                minHeight={40 * scale}
                dragGrid={[1, 1]}
                resizeGrid={[1, 1]}
                data-field-id={field.id}
                data-field-type={field.type}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedFieldId(field.id);
                }}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
                onResizeStart={(
                  e:
                    | React.MouseEvent<HTMLElement>
                    | React.TouchEvent<HTMLElement>,
                ) => {
                  e.stopPropagation();
                  setSelectedFieldId(field.id);
                  setResizing(true);
                }}
                onResizeStop={(
                  e: MouseEvent | TouchEvent,
                  direction: string,
                  ref: HTMLElement,
                  delta: ResizableDelta,
                  position: Position,
                ) => {
                  e.stopPropagation();
                  setResizing(false);
                  updateField(field.id, {
                    position: {
                      page: pageIndex,
                      x: Math.round(position.x / scale),
                      y: Math.round(position.y / scale),
                    },
                    size: {
                      width: Math.round(parseInt(ref.style.width, 10) / scale),
                      height: Math.round(
                        parseInt(ref.style.height, 10) / scale,
                      ),
                    },
                  });
                }}
                style={{
                  border: isSelected
                    ? `1px solid ${recipientColor}`
                    : `2px dashed ${recipientColor}`,
                  boxShadow: isSelected
                    ? `0 0 0 1px ${recipientColor}, 0 0 8px rgba(0, 0, 0, 0.1)`
                    : "none",
                  transition:
                    isDragging || isResizing ? "none" : "box-shadow 0.2s ease",
                }}
              >
                <FieldComponent
                  fieldId={field.id}
                  viewType="editor"
                  scale={scale}
                  recipient={recipient}
                />
              </Rnd>
            );
          } else if (viewType === "signer") {
            const style = {
              left: Math.round(field.position.x * scale),
              top: Math.round(field.position.y * scale),
              width: Math.round(field.size.width * scale),
              height: Math.round(field.size.height * scale),
              borderColor: recipientColor,
              ...(isSelected && { zIndex: 25 }),
              borderWidth: "1px",
              borderStyle: isSelected ? "solid" : "dashed",
            };

            return (
              <div
                key={field.id}
                className={cn(
                  "absolute z-10 box-border text-black",
                  field.type === "date" && "min-w-fit",
                  isSelected ? "ring-2 ring-offset-1" : "hover:bg-blue-100/50",
                  "cursor-pointer transition-all duration-150 ease-in-out",
                )}
                style={style}
                data-field-id={field.id}
                data-field-type={field.type}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedFieldId(field.id);
                }}
                style={{
                  left: Math.round(field.position.x * scale),
                  top: Math.round(field.position.y * scale),
                  width: Math.round(field.size.width * scale),
                  height: Math.round(field.size.height * scale),
                  border: isSelected
                    ? `1px solid ${recipientColor}`
                    : `2px dashed ${recipientColor}`,
                  boxShadow: isSelected
                    ? `0 0 0 1px ${recipientColor}, 0 0 8px rgba(0, 0, 0, 0.1)`
                    : "none",
                  transition: "box-shadow 0.2s ease",
                }}
              >
                <FieldComponent
                  fieldId={field.id}
                  viewType="signer"
                  scale={scale}
                  recipient={currentSigner} // Use currentSigner directly
                />
              </div>
            );
          }

          return null; // Should not happen
        })}

      {children}
    </div>
  );
});
