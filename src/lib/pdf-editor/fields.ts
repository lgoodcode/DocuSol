import { FormInput, Edit3, Calendar, Type } from "lucide-react";

import type { FieldTemplate } from "@/lib/pdf-editor/document-types";

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
    defaultSize: { width: 200, height: 80 },
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
    defaultSize: { width: 100, height: 60 },
  },
];

export const getFieldTemplate = (type: string): FieldTemplate | undefined => {
  return fieldTemplates.find((template) => template.type === type);
};
