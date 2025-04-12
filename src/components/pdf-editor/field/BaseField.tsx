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
  renderContent: (props: FieldRenderContentProps) => React.ReactNode;
}

export const BaseField = memo(function BaseField({
  id,
  renderContent,
}: BaseFieldProps) {
  const {
    field,
    recipient,
    isSelected,
    viewType,
    handleChange,
    handleFocus,
    handleBlur,
  } = useField(id);

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
    // Simplified logic: show content if it has value, or if selected in signer mode
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
    // Otherwise, always show the placeholder content inside the Rnd/div handled by DocumentPage
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

  return (
    <div className="flex h-full w-full items-center justify-center">
      {FieldContent}
    </div>
  );
});
