import type { LucideIcon } from "lucide-react";

import type { DocumentSigner } from "@/lib/types/stamp";

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

  // Document editor state
  currentStep: "upload" | "signers" | "fields" | "review";
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

  // Actions
  setDocumentId: (id: string) => void;
  setDocumentName: (name: string) => void;
  setDocumentDataUrl: (url: string | null) => void;
  setDocumentPreviewUrl: (url: string) => void;

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

  reset: () => void;
  export: () => DocumentStateExport;
}

/** All the values from the DocumentState that can be exported */
export interface DocumentStateExport {
  documentId: string | null;
  documentName: string;
  documentDataUrl: string | null;
  documentPreviewUrl: string | null;
  signers: DocumentSigner[];
  fields: DocumentField[];
  isEncrypted: boolean;
  encryptionPassword?: string;
  isExpirationEnabled: boolean;
  expirationDate?: Date;
  senderMessage: string;
}
