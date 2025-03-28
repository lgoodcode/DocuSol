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
  scale?: number;
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
  addSigner: (signer: Omit<DocumentSigner, "id" | "color">) => void; // Color is set in the store
  updateSigner: (id: string, signer: Partial<DocumentSigner>) => void;
  removeSigner: (id: string) => void;
  clearSigners: () => void;
  setCurrentSignerId: (id: string) => void;

  // Field actions
  addField: (field: Omit<DocumentField, "id" | "assignedTo">) => void;
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

  // Reset store
  reset: () => void;
}

export interface EditorState {
  fields: DocumentField[];
  pdfFile: Blob | null;
  selectedFieldId: string | null;
  recipients: Signer[];
  currentRecipient: string | null;
  scale: number;
  isDragging: boolean;
  isResizing: boolean;
}

export type FieldTemplate = {
  type: FieldType;
  icon: LucideIcon;
  label: string;
  defaultSize: FieldSize;
};

export class Signer {
  index: number;
  name: string;
  email: string;
  color: string;

  // Predefined set of distinct colors that work well for UI elements
  private static colorPalette = [
    "#4f46e5", // Indigo
    "#0ea5e9", // Sky blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#a855f7", // Purple
    "#f43f5e", // Rose
    "#0284c7", // Light blue
    "#059669", // Green
    "#d946ef", // Fuchsia
    "#6d28d9", // Purple
  ];

  /**
   * Creates a new Recipient instance
   *
   * @param params - The recipient parameters
   */
  constructor(params: {
    index: number;
    name: string;
    email?: string;
    color?: string;
  }) {
    this.index = params.index;
    this.name = params.name.trim();
    this.email = (params.email || "").trim();
    this.color =
      params.color ||
      Signer.colorPalette[params.index % Signer.colorPalette.length];
  }
}
