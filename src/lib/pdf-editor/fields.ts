import { FormInput, Edit3, Calendar, Type } from "lucide-react";

import type { FieldTemplate } from "@/lib/pdf-editor/document-types";

export const getFieldTemplate = (
  type: FieldTemplate["type"],
): FieldTemplate => {
  const template = fieldTemplates.find((template) => template.type === type);
  if (!template) {
    throw new Error(`Field template not found for type: ${type}`);
  }
  return template;
};

export const fieldTemplates: FieldTemplate[] = [
  {
    type: "text",
    icon: FormInput,
    label: "Text field",
    defaultSize: { width: 180, height: 42 },
  },
  {
    type: "signature",
    icon: Edit3,
    label: "Signature",
    defaultSize: { width: 180, height: 42 },
  },
  {
    type: "date",
    icon: Calendar,
    label: "Date",
    defaultSize: { width: 150, height: 42 },
  },
  {
    type: "initials",
    icon: Type,
    label: "Initials",
    defaultSize: { width: 150, height: 42 },
  },
];
