import { useState, memo } from "react";

import {
  BaseField,
  FieldRenderContentProps,
} from "@/components/pdf-editor/field/BaseField";
import { SignatureFieldEditor } from "@/components/pdf-editor/field/SignatureFieldEditor";
import { useField } from "@/lib/pdf-editor/hooks/useField";

interface SignatureFieldProps {
  fieldId: string;
  isInitials?: boolean;
}

export const SignatureField = memo(function SignatureField({
  fieldId,
  isInitials = false,
}: SignatureFieldProps) {
  const [showEditor, setShowEditor] = useState(false);

  const renderSignatureField = ({
    field,
    isSelected,
    viewType,
    handleChange,
    handleFocus,
    handleBlur,
    Placeholder,
  }: FieldRenderContentProps) => {
    const handleOpenChange = (open: boolean) => {
      setShowEditor(open);
      if (!open) {
        handleBlur();
      }
    };

    // When in signer mode and field is selected, show the signature editor
    if (viewType === "signer" && isSelected) {
      return (
        <div
          className="relative flex h-full w-full items-center justify-center"
          // Prevent opening editor when clicking on the dialog overlay but not the dialog content
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              target.id === "dialog-overlay" ||
              target.closest('[role="dialog"]')
            ) {
              return;
            }
            handleFocus();
            setShowEditor(true);
          }}
        >
          <SignatureFieldEditor
            field={field}
            open={showEditor}
            onOpenChange={handleOpenChange}
          />

          {field.value ? (
            field.value.startsWith("data:image") ? (
              <div className="flex h-full w-full items-center justify-center">
                <img
                  src={field.value}
                  alt={isInitials ? "Initials" : "Signature"}
                  style={{
                    transform: `scale(${field.signatureScale ?? 1.0})`,
                  }}
                />
              </div>
            ) : (
              <span
                style={{
                  fontFamily: field.textStyles?.fontFamily || "cursive",
                  fontSize: field.textStyles?.fontSize || "inherit",
                }}
              >
                {field.value}
              </span>
            )
          ) : (
            <Placeholder />
          )}
        </div>
      );
    }

    if (!field.value) {
      throw new Error("SignatureField value is undefined");
    }

    // Render image signature
    if (field.value.startsWith("data:image")) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-sm border border-border/30 p-1">
          <img
            src={field.value}
            alt={isInitials ? "Initials" : "Signature"}
            style={{
              transform: `scale(${field.signatureScale ?? 1.0})`,
            }}
          />
        </div>
      );
    }
    // Render text signature
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm border border-border/30 p-1">
        <span
          style={{
            fontFamily: field.textStyles?.fontFamily || "cursive",
            fontSize: field.textStyles?.fontSize || "inherit",
          }}
        >
          {field.value}
        </span>
      </div>
    );
  };

  return <BaseField id={fieldId} renderContent={renderSignatureField} />;
});
