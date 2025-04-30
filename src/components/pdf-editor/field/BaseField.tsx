import { memo, useMemo } from "react";

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
  viewType: DocumentState["viewType"];
  renderContent: (props: FieldRenderContentProps) => React.ReactNode;
  onActivate?: () => void;
}

export const BaseField = memo(function BaseField({
  id,
  viewType,
  renderContent,
  onActivate,
}: BaseFieldProps) {
  const {
    field,
    recipient,
    isSelected,
    handleChange,
    handleFocus,
    handleBlur,
  } = useField(id, viewType);

  if (!field) {
    throw new Error("Field not found");
  } else if (!recipient) {
    throw new Error("Recipient not found for field " + id);
  }

  const Placeholder = () => {
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
    if (field.value || (viewType === "signer" && isSelected)) {
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
  }, [
    field,
    isSelected,
    viewType,
    renderContent,
    handleChange,
    handleFocus,
    handleBlur,
  ]);

  const handleActivationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFocus();
    if (onActivate) {
      onActivate();
    }
  };

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      onClick={viewType === "signer" ? handleActivationClick : undefined}
    >
      {FieldContent}
    </div>
  );
});
