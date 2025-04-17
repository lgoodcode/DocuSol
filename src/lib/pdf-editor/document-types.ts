import * as z from "zod";
import type { LucideIcon } from "lucide-react";

import type { DocumentSigner, DocumentContentHash } from "@/lib/types/stamp";

export type FieldType = "text" | "date" | "initials" | "signature";

export type FieldSize = {
  width: number;
  height: number;
};

export type FieldPosition = {
  x: number;
  y: number;
  page: number;
};

export type FieldTemplate = {
  type: FieldType;
  icon: LucideIcon;
  label: string;
  defaultSize: FieldSize;
};

export interface DocumentField {
  id: string;
  type: FieldType;
  position: FieldPosition;
  size: FieldSize;
  /** Signer ID */
  assignedTo: string;
  required?: boolean;
  label?: string;
  value?: string;
  options?: string[];
  signatureScale?: number;
  textStyles?: {
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
  };
}

export interface DocumentState {
  // Used to determine if the document store is stale - the cron job will
  // have cleaned up the abandoned draft documents after this time
  createdAt: number;

  // Document metadata
  documentId: string | null;
  documentName: string;
  documentDataUrl: string | null;
  documentPreviewUrl: string | null;
  documentContentHash: DocumentContentHash | null;

  // Document editor state
  currentStep: "upload" | "signers" | "fields" | "review" | "sending";
  viewType: "editor" | "signer";
  scale: number;
  isDragging: boolean;
  isResizing: boolean;

  // Signers information
  signers: DocumentSigner[];
  currentSignerId: string | null;

  // Fields information
  fields: DocumentField[];
  selectedFieldId?: string;

  // Security and expiration settings
  isEncrypted: boolean;
  encryptionPassword?: string;
  isExpirationEnabled: boolean;
  expirationDate?: Date;
  senderMessage: string;

  // Form metadata from the review step - used in the sending step
  formDocumentMetadata: FormDocumentMetadata | null;

  // Actions
  setCreatedAt: (createdAt: number) => void;
  setDocumentId: (id: string) => void;
  setDocumentName: (name: string) => void;
  setDocumentDataUrl: (url: string | null) => void;
  setDocumentPreviewUrl: (url: string) => void;
  setDocumentContentHash: (hash: DocumentContentHash) => void;

  // Document editor actions
  setCurrentStep: (step: DocumentState["currentStep"]) => void;
  setViewType: (viewType: DocumentState["viewType"]) => void;
  setScale: (scale: number) => void;
  setDragging: (isDragging: boolean) => void;
  setResizing: (isResizing: boolean) => void;

  // Signer actions
  addSigner: (signer: Omit<DocumentSigner, "id" | "color">) => void;
  updateSigner: (id: string, signer: Partial<DocumentSigner>) => void;
  removeSigner: (id: string) => void;
  clearSigners: () => void;
  setCurrentSignerId: (id: string) => void;

  // Field actions
  addField: (field: Omit<DocumentField, "id" | "assignedTo" | "scale">) => void;
  updateField: (field: Partial<DocumentField>) => void;
  removeField: (id: string) => void;
  clearFields: () => void;
  setSelectedFieldId: (id: string) => void;
  clearSelectedFieldId: () => void;

  // Security and expiration actions
  setIsEncrypted: (isEncrypted: boolean) => void;
  setEncryptionPassword: (password: string) => void;
  setIsExpirationEnabled: (isEnabled: boolean) => void;
  setExpirationDate: (date?: Date) => void;
  setSenderMessage: (message: string) => void;

  getFormDocumentMetadata: () => FormDocumentMetadata | null;
  setFormDocumentMetadata: (metadata: FormDocumentMetadata) => void;

  resetDocumentState: () => void;
  exportDocumentState: () => DocumentStateExport;
}

/** All the values from the DocumentState that can be exported */
export interface DocumentStateExport {
  documentId: string | null;
  documentName: string;
  documentContentHash: DocumentContentHash | null;
  signers: DocumentSigner[];
  fields: DocumentField[];
  encryptionPassword?: string;
  expirationDate?: Date;
  senderMessage: string;
}

export const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const formDocumentMetadataSchema = z.object({
  documentName: z
    .string()
    .min(1, "Document name is required")
    .max(200, "Document name should not exceed 200 characters"),
  isEncrypted: z.boolean().default(false),
  encryptionPassword: z
    .string()
    .optional()
    .refine((password) => !password || password.length >= 6, {
      message: "Password must be at least 6 characters",
    })
    .refine((password) => !password || password.length <= 100, {
      message: "Password must be less than 100 characters",
    }),
  isExpirationEnabled: z.boolean().default(false),
  expirationDate: z
    .date({ coerce: true })
    .optional()
    .refine((date) => !date || !isPastDate(date), {
      message: "Expiration date cannot be in the past",
    }),
  senderMessage: z
    .string()
    .max(1000, "Message should not exceed 1000 characters")
    .optional(),
});

export type FormDocumentMetadata = z.infer<typeof formDocumentMetadataSchema>;
