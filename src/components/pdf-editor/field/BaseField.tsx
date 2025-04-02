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
      bounds="window"
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

        // Get the Rnd component's DOM node and its offset parent
        const rndNode = rndRef.current?.getSelfElement();
        const offsetParent = rndNode?.offsetParent as HTMLElement | null;
        if (!rndNode || !offsetParent) {
          console.error("Could not get Rnd node or offset parent.");
          return;
        }

        // Get the current page element
        const currentPageElement = document.querySelector(
          `[data-page-index="${field.position.page}"]`,
        ) as HTMLElement | null;
        if (!currentPageElement) {
          console.error("Could not find current page element.");
          return;
        }

        // Calculate the page's offset relative to the Rnd's offsetParent
        let pageOffsetLeft = 0;
        let pageOffsetTop = 0;
        let currentElement: HTMLElement | null = currentPageElement;

        // Traverse up the DOM tree from the page element until we reach the Rnd's offsetParent
        // or the body/html element if the offsetParent is not a direct ancestor.
        while (
          currentElement &&
          currentElement !== offsetParent &&
          currentElement.offsetParent // Ensure offsetParent exists to continue traversal
        ) {
          pageOffsetLeft += currentElement.offsetLeft;
          pageOffsetTop += currentElement.offsetTop;
          currentElement = currentElement.offsetParent as HTMLElement | null;
        }

        // If the loop finished because currentElement became null or didn't have an offsetParent before reaching the target offsetParent,
        // this indicates a potential issue or a complex layout. We might need a fallback or different calculation.
        // For now, we assume the common case where the page is within the offset parent hierarchy.

        // Get the page's unscaled dimensions
        const pageWidth = currentPageElement.offsetWidth;
        const pageHeight = currentPageElement.offsetHeight;

        // Get the field's current unscaled dimensions (react-rnd updates the style directly)
        const fieldWidth =
          parseInt(rndNode.style.width, 10) || field.size.width;
        const fieldHeight =
          parseInt(rndNode.style.height, 10) || field.size.height;

        // Calculate the boundaries in the unscaled coordinate system relative to the offset parent
        const minX = pageOffsetLeft;
        const minY = pageOffsetTop;
        // The maximum position is the page boundary minus the size of the field itself
        const maxX = pageOffsetLeft + pageWidth - fieldWidth;
        const maxY = pageOffsetTop + pageHeight - fieldHeight;

        // d.x and d.y are the final coordinates provided by react-rnd, relative to the offsetParent.
        // Constrain these coordinates within the calculated page boundaries.
        const validX = Math.max(minX, Math.min(d.x, maxX));
        const validY = Math.max(minY, Math.min(d.y, maxY));

        // Only update if the position actually changed to avoid unnecessary renders
        if (
          Math.round(validX) !== field.position.x ||
          Math.round(validY) !== field.position.y
        ) {
          updateField({
            id: id,
            position: {
              x: Math.round(validX),
              y: Math.round(validY),
              page: field.position.page, // Keep on same page
            },
            // Optionally update size if it changed during drag (though unlikely)
            // size: { width: fieldWidth, height: fieldHeight }
          });
        }
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
