import { CalendarIcon, PenIcon, PenToolIcon, TextIcon } from "lucide-react";

import { FieldType } from "@/lib/pdf-editor/document-types";

export const FieldIcon = ({
  type,
  size = 18,
}: {
  type: FieldType;
  size?: number;
}) => {
  switch (type) {
    case "text":
      return <TextIcon size={size} />;
    case "date":
      return <CalendarIcon size={size} />;
    case "signature":
      return <PenToolIcon size={size} transform="rotate(270)" />;
    case "initials":
      return <PenIcon size={size} />;
    default:
      return null;
  }
};
