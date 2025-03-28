import { memo, useMemo, useRef } from "react";
import { Rnd } from "react-rnd";

import { cn } from "@/lib/utils";
import { useField } from "@/lib/pdf-editor/hooks/useField";
import { FieldIcon } from "@/components/pdf-editor/field/FieldIcon";
import type {
  DocumentField,
  DocumentState,
} from "@/lib/pdf-editor/document-types";

export type FieldRenderContentProps = {
  field: DocumentField;
  isSelected: boolean;
  viewType: DocumentState["viewType"];
  Placeholder: () => React.ReactNode;
  handleChange: (value: string) => void;
  handleFocus: () => void;
  handleBlur: () => void;
};

interface BaseFieldProps {
  id: string;
  renderContent: (props: FieldRenderContentProps) => React.ReactNode;
}

export const BaseField = memo(function BaseField({
  id,
  renderContent,
}: BaseFieldProps) {
  const rndRef = useRef<Rnd>(null);
  const {
    field,
    recipient,
    isSelected,
    viewType,
    scale,
    isDragging,
    isResizing,
    handleChange,
    handleFocus,
    handleBlur,
    updateField,
    setIsDragging,
    setIsResizing,
  } = useField(id);

  if (!field) {
    throw new Error("Field not found");
  } else if (!recipient) {
    throw new Error("Recipient not found");
  }

  const Placeholder = () => {
    // If there is no value or field is not selected in signer mode, show placeholder
    const placeholder =
      field.label ||
      field.type.charAt(0).toUpperCase() + field.type.slice(1) + " Here";
    return (
      <div className="pointer-events-none flex h-full w-full select-none items-center justify-center rounded-sm">
        <FieldIcon type={field.type} />
        <div className="ml-2 text-sm">{placeholder}</div>
      </div>
    );
  };

  const FieldContent = useMemo(() => {
    // In signer mode, if field is selected, always show the editable content
    if ((viewType === "signer" && isSelected) || field.value) {
      return renderContent({
        field,
        isSelected,
        viewType,
        Placeholder,
        handleChange,
        handleFocus,
        handleBlur,
      });
    }

    return <Placeholder />;
  }, [field, isSelected, viewType, renderContent]);

  // For signer mode, render a non-draggable field
  if (viewType === "signer") {
    return (
      <div
        className={cn(
          "absolute z-20 text-black",
          field.type === "date" && "min-w-fit",
        )}
        data-field-id={id}
        data-field-type={field.type}
        onClick={handleFocus}
        style={{
          left: Math.round(field.position.x * scale),
          top: Math.round(field.position.y * scale),
          width: Math.round(field.size.width * scale),
          height: Math.round(field.size.height * scale),
          border: isSelected
            ? `1px solid ${recipient.color}`
            : `2px dashed ${recipient.color}`,
          boxShadow: isSelected
            ? `0 0 0 1px ${recipient.color}, 0 0 8px rgba(0, 0, 0, 0.1)`
            : "none",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {FieldContent}
      </div>
    );
  }

  // For editor mode, render a draggable field with Rnd
  return (
    <Rnd
      ref={rndRef}
      className="z-20 min-h-[40px] bg-white/30 text-black"
      disableDragging={false}
      enableResizing={true}
      bounds="parent"
      data-field-id={id}
      data-field-type={field.type}
      onClick={(e: React.MouseEvent) => {
        handleFocus();
      }}
      size={{
        width: field.size.width,
        height: field.size.height,
      }}
      position={{
        x: field.position.x,
        y: field.position.y,
      }}
      scale={scale}
      onDragStart={() => {
        handleFocus();
        setIsDragging(true);
      }}
      onDragStop={(e, d) => {
        setIsDragging(false);
        // Get the current page element
        const currentPageElement = document.querySelector(
          `[data-page-index="${field.position.page}"]`,
        );
        if (!currentPageElement) return;

        // Get the page bounds
        const pageRect = currentPageElement.getBoundingClientRect();

        // Calculate the maximum allowed position
        // We need to consider the scale factor when calculating boundaries
        const maxX = pageRect.width / scale - field.size.width;
        const maxY = pageRect.height / scale - field.size.height;

        // Constrain position within the current page
        const validX = Math.min(Math.max(0, d.x), maxX);
        const validY = Math.min(Math.max(0, d.y), maxY);

        updateField({
          id: id,
          position: {
            x: Math.round(validX),
            y: Math.round(validY),
            page: field.position.page, // Keep on same page
          },
        });
      }}
      onResizeStart={() => {
        handleFocus();
        setIsResizing(true);
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        setIsResizing(false);

        // Get the current page element
        const currentPageElement = document.querySelector(
          `[data-page-index="${field.position.page}"]`,
        );
        if (!currentPageElement) return;

        // Get the page bounds
        const pageRect = currentPageElement.getBoundingClientRect();

        // Get dimensions from the ref directly
        const width = parseInt(ref.style.width || "0", 10);
        const height = parseInt(ref.style.height || "0", 10);

        // Calculate the maximum allowed position to keep within page bounds
        const maxX = pageRect.width / scale - width;
        const maxY = pageRect.height / scale - height;

        // Constrain position within the current page
        const validX = Math.min(Math.max(0, position.x), maxX);
        const validY = Math.min(Math.max(0, position.y), maxY);

        updateField({
          id: id,
          position: {
            x: Math.round(validX),
            y: Math.round(validY),
            page: field.position.page,
          },
          size: {
            width,
            height,
          },
        });
      }}
      style={{
        border: isSelected
          ? `1px solid ${recipient.color}`
          : `2px dashed ${recipient.color}`,
        boxShadow: isSelected
          ? `0 0 0 1px ${recipient.color}, 0 0 8px rgba(0, 0, 0, 0.1)`
          : "none",
        transition: isDragging || isResizing ? "none" : "box-shadow 0.2s ease",
      }}
    >
      {FieldContent}
    </Rnd>
  );
});
