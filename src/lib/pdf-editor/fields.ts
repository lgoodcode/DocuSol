import {
  FormInput,
  Edit3,
  Calendar,
  Type,
  CheckSquare,
  CircleDot,
  CreditCard,
  FileUp,
  Stamp,
} from "lucide-react";

import { FieldTemplate } from "@/lib/pdf-editor/document-types";

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
  // {
  //   type: 'checkbox',
  //   icon: CheckSquare,
  //   label: 'Checkbox',
  //   defaultSize: { width: 60, height: 42 },
  //   category: 'basic',
  // },
  // {
  //   type: 'radio',
  //   icon: CircleDot,
  //   label: 'Radio buttons',
  //   defaultSize: { width: 180, height: 80 },
  //   category: 'advanced',
  // },
  // {
  //   type: 'dropdown',
  //   icon: ChevronDown,
  //   label: 'Dropdown',
  //   defaultSize: { width: 180, height: 42 },
  //   category: 'advanced',
  // },
  // {
  //   type: 'card',
  //   icon: CreditCard,
  //   label: 'Card details',
  //   defaultSize: { width: 300, height: 180 },
  //   category: 'advanced',
  // },
  // {
  //   type: 'file',
  //   icon: FileUp,
  //   label: 'Collect files',
  //   defaultSize: { width: 180, height: 80 },
  //   category: 'advanced',
  // },
  // {
  //   type: 'stamp',
  //   icon: Stamp,
  //   label: 'Stamp',
  //   defaultSize: { width: 150, height: 150 },
  //   category: 'advanced',
  // },
];

export const getFieldTemplate = (type: string): FieldTemplate | undefined => {
  return fieldTemplates.find((template) => template.type === type);
};
