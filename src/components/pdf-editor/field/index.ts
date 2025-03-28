import { TextField } from "./TextField";
import { DateField } from "./DateField";
import { SignatureField } from "./SignatureField";
import { InitialsField } from "./InitialsField";

import { FieldType } from "@/lib/pdf-editor/document-types";

export const Fields: Record<FieldType, React.ComponentType<any>> = {
  text: TextField,
  date: DateField,
  initials: InitialsField,
  signature: SignatureField,
};
