import React from "react";
import { SignatureField } from "@/components/pdf-editor/field/SignatureField";

export function InitialsField({
  fieldId,
  viewType,
}: {
  fieldId: string;
  viewType: "editor" | "signer";
}) {
  return (
    <SignatureField fieldId={fieldId} isInitials={true} viewType={viewType} />
  );
}
