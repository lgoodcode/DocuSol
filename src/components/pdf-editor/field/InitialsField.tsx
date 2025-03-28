import React from "react";
import { SignatureField } from "@/components/pdf-editor/field/SignatureField";

export function InitialsField({ fieldId }: { fieldId: string }) {
  return <SignatureField fieldId={fieldId} isInitials={true} />;
}
