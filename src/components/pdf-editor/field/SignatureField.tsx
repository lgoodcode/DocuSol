import { useState, memo, useCallback } from "react";

import {
  BaseField,
  FieldRenderContentProps,
} from "@/components/pdf-editor/field/BaseField";
import { SignatureFieldEditor } from "@/components/pdf-editor/field/SignatureFieldEditor";
import { useField } from "@/lib/pdf-editor/hooks/useField";

interface SignatureFieldProps {
  fieldId: string;
  viewType: "editor" | "signer";
  isInitials?: boolean;
}

export const SignatureField = memo(function SignatureField({
  fieldId,
  viewType,
  isInitials = false,
}: SignatureFieldProps) {
  const [showEditor, setShowEditor] = useState(false);
  const { isSelected, handleBlur: fieldHandleBlur } = useField(
    fieldId,
    viewType,
  );

  const activateEditor = useCallback(() => {
    if (viewType === "signer" && !showEditor) {
      setShowEditor(true);
    }
  }, [viewType, showEditor]);

  const renderSignatureField = ({
    field,
    handleChange,
    handleFocus,
    Placeholder,
  }: FieldRenderContentProps) => {
    const handleOpenChange = (open: boolean) => {
      setShowEditor(open);
    };

    if (viewType === "signer" && isSelected) {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <SignatureFieldEditor
            field={field}
            open={showEditor}
            onOpenChange={handleOpenChange}
            viewType={viewType}
            handleBlur={fieldHandleBlur}
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
      return <Placeholder />;
    }

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

  return (
    <BaseField
      id={fieldId}
      viewType={viewType}
      renderContent={renderSignatureField}
      onActivate={activateEditor}
    />
  );
});
