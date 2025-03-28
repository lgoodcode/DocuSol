import React, { memo, useCallback, useRef } from "react";

import {
  BaseField,
  FieldRenderContentProps,
} from "@/components/pdf-editor/field/BaseField";
import { TextFormatToolbar } from "@/components/pdf-editor/TextFormatToolbar";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { DocumentField } from "@/lib/pdf-editor/document-types";

// Format multiline text for display
const formatMultilineText = (text: string) => {
  return text.split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < text.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));
};

// Get styles based on field properties
const getTextStyle = (field: DocumentField) => {
  return {
    fontFamily: field.textStyles?.fontFamily || "inherit",
    fontSize: field.textStyles?.fontSize
      ? `${field.textStyles.fontSize}px`
      : "inherit",
    color: field.textStyles?.fontColor || "inherit",
    fontWeight: field.textStyles?.fontWeight || "inherit",
    fontStyle: field.textStyles?.fontStyle || "inherit",
  };
};

export const TextField = memo(function TextField({
  fieldId,
}: {
  fieldId: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTextField = useCallback(
    ({
      field,
      isSelected,
      viewType,
      handleChange,
      handleFocus,
      handleBlur,
    }: FieldRenderContentProps) => {
      // When in signer mode and field is selected, show editable textarea
      if (viewType === "signer" && isSelected) {
        // Don't blur if the focus is within our components
        const handleBlurEvent = (e: React.FocusEvent) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          // Check if the related target exists
          if (!relatedTarget) {
            handleBlur();
            return;
          }

          const isWithinComponents =
            containerRef.current?.contains(relatedTarget) ||
            relatedTarget.closest("#text-format-toolbar") ||
            textareaRef.current?.contains(relatedTarget);

          // Check if clicking on the advanced options dropdown (Radix UI Popover)
          const isWithinDropdown =
            relatedTarget.closest('[role="menu"]') ||
            relatedTarget.closest('[role="menuitem"]') ||
            relatedTarget.closest('[data-state="open"]') ||
            relatedTarget.getAttribute("data-radix-popper-content-wrapper") !==
              null;

          if (!isWithinComponents && !isWithinDropdown) {
            handleBlur();
          }
        };

        return (
          <div
            ref={containerRef}
            className="relative w-full"
            onBlur={handleBlurEvent}
          >
            <TextFormatToolbar field={field} />
            <AutoResizeTextarea
              ref={textareaRef}
              initialValue={field.value}
              onChange={handleChange}
              handleFocus={handleFocus}
              style={getTextStyle(field)}
              autoFocus
              className="min-h-[20px] w-full resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
            />
          </div>
        );
      }

      // If not in signer mode and field has no value, throw an error
      if (!field.value) {
        throw new Error("Field value is undefined");
      }

      return (
        <div
          id="text-field-content"
          className="h-full w-full"
          style={{
            fontSize: field.textStyles?.fontSize
              ? `${field.textStyles.fontSize}px`
              : "inherit",
            fontFamily: field.textStyles?.fontFamily || "inherit",
            color: field.textStyles?.fontColor || "inherit",
            fontWeight: field.textStyles?.fontWeight || "inherit",
            fontStyle: field.textStyles?.fontStyle || "inherit",
            // textAlign: field.textStyles?.textAlign || "left",
          }}
        >
          {formatMultilineText(field.value)}
        </div>
      );
    },
    [textareaRef],
  );

  return <BaseField id={fieldId} renderContent={renderTextField} />;
});
