import React, { memo, useRef, useMemo } from "react";
import { Page } from "react-pdf";
import { useShallow } from "zustand/react/shallow";

import { DEFAULT_PDF_WIDTH } from "@/lib/pdf-editor/constants";
import { Fields } from "@/components/pdf-editor/field";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import {
  FieldPosition,
  FieldType,
  DocumentField,
} from "@/lib/pdf-editor/document-types";

interface DocumentPageProps {
  pageIndex: number;
  scale: number;
  children?: React.ReactNode;
}

export const DocumentPage = memo(function DocumentPage({
  pageIndex,
  scale,
  children,
}: DocumentPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const { fields, addField } = useDocumentStore(
    useShallow((state) => ({
      fields: state.fields,
      addField: state.addField,
    })),
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("field-type") as FieldType;
    const dragScale = parseFloat(e.dataTransfer.getData("scale") || "1");
    const offsetX = parseFloat(e.dataTransfer.getData("offsetX") || "0");
    const offsetY = parseFloat(e.dataTransfer.getData("offsetY") || "0");

    if (!fieldType || !pageRef.current) return;

    // TODO: update to switch statement in case of covering all field types
    const newFieldSize =
      fieldType === "signature" || fieldType === "initials"
        ? { width: 200, height: 70 }
        : { width: 150, height: 40 };

    const pageRect = pageRef.current.getBoundingClientRect();

    // Calculate position accounting for scale and offset
    const x = (e.clientX - pageRect.left) / scale - offsetX / scale;
    const y = (e.clientY - pageRect.top) / scale - offsetY / scale;

    const newFieldPosition: FieldPosition = {
      x: Math.min(Math.max(x, 0), pageRect.width / scale - newFieldSize.width),
      y: Math.min(
        Math.max(y, 0),
        pageRect.height / scale - newFieldSize.height,
      ),
      page: pageIndex,
    };

    addField({
      type: fieldType,
      position: newFieldPosition,
      size: newFieldSize,
    });
  };

  // Memoize the fields rendering to prevent re-renders when selection changes
  const renderedFields = useMemo(() => {
    // Only render fields that belong to this page
    return fields
      .filter((field: DocumentField) => field.position.page === pageIndex)
      .map((field: DocumentField) => {
        const FieldComponent = Fields[field.type];
        return <FieldComponent key={field.id} fieldId={field.id} />;
      });
  }, [fields, pageIndex]);

  return (
    <div
      ref={pageRef}
      className="document-page relative z-0 bg-white shadow-2xl dark:shadow-white/30"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      data-page-index={pageIndex}
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
      />

      {/* Render memoized fields */}
      {renderedFields}

      {/* Render any additional children */}
      {children}
    </div>
  );
});
