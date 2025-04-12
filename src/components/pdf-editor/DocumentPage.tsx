import React, { memo, useRef } from "react";
import { Page } from "react-pdf";
import { useShallow } from "zustand/react/shallow";
import { Rnd, DraggableData, ResizableDelta, Position } from "react-rnd";

import { cn } from "@/lib/utils";
import { DEFAULT_PDF_WIDTH } from "@/lib/pdf-editor/constants";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { Fields } from "@/components/pdf-editor/field";
import type {
  FieldPosition,
  FieldType,
  DocumentField,
} from "@/lib/pdf-editor/document-types";
import { getFieldTemplate } from "@/lib/pdf-editor/fields";

interface DocumentPageProps {
  pageIndex: number;
  children?: React.ReactNode;
}

export const DocumentPage = memo(function DocumentPage({
  pageIndex,
  children,
}: DocumentPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const {
    fields,
    addField,
    updateField,
    signers,
    selectedFieldId,
    setSelectedFieldId,
    viewType,
    scale,
    isDragging,
    isResizing,
    setDragging,
    setResizing,
  } = useDocumentStore(
    useShallow((state) => ({
      fields: state.fields,
      addField: state.addField,
      updateField: state.updateField,
      signers: state.signers,
      selectedFieldId: state.selectedFieldId,
      setSelectedFieldId: state.setSelectedFieldId,
      viewType: state.viewType,
      scale: state.scale,
      isDragging: state.isDragging,
      isResizing: state.isResizing,
      setDragging: state.setDragging,
      setResizing: state.setResizing,
    })),
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

    addField({
      type: fieldType,
      position: newFieldPosition,
      size: fieldTemplate.defaultSize,
    });
  };

  const handleDragStart = (e: any, data: DraggableData) => {
    setSelectedFieldId(data.node.dataset.fieldId || "");
    setDragging(true);
  };

  const handleDragStop = (e: any, data: DraggableData) => {
    setDragging(false);
    const fieldId = data.node.dataset.fieldId;
    if (fieldId) {
      updateField({
        id: fieldId,
        position: {
          page: pageIndex,
          x: Math.round(data.x / scale),
          y: Math.round(data.y / scale),
        },
      });
    } else {
      console.error("Field ID not found on drag stop");
    }
  };

  return (
    <div
      ref={pageRef}
      className="document-page relative z-0 bg-white shadow-2xl dark:shadow-white/30"
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()}
      onDrop={handleDrop}
      data-page-index={pageIndex}
      style={{
        width: DEFAULT_PDF_WIDTH * scale,
        height: "auto",
      }}
    >
      <Page
        width={DEFAULT_PDF_WIDTH}
        pageNumber={pageIndex + 1}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-white">
            <span className="text-sm text-muted-foreground">
              Loading page...
            </span>
          </div>
        }
        inputRef={pageRef}
      />

      {fields
        .filter((field: DocumentField) => field.position.page === pageIndex)
        .map((field: DocumentField) => {
          const FieldComponent = Fields[field.type];
          const isSelected = field.id === selectedFieldId;
          const recipient = signers.find(
            (signer) => signer.id === field.assignedTo,
          );
          const recipientColor = recipient?.color || "#000000";

          if (!recipient) {
            console.warn(`Recipient not found for field ${field.id}`);
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
                  updateField({
                    id: field.id,
                    position: {
                      ...field.position,
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
                <FieldComponent fieldId={field.id} />
              </Rnd>
            );
          }

          if (viewType === "signer") {
            return (
              <div
                key={field.id}
                className={cn(
                  "absolute z-10 box-border text-black",
                  field.type === "date" && "min-w-fit",
                )}
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
                <FieldComponent fieldId={field.id} />
              </div>
            );
          }

          return null;
        })}

      {children}
    </div>
  );
});
