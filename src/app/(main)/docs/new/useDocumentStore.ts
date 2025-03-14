import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SignerRole } from "@/lib/types/stamp";

// Define the types for our document store
export type DocumentSigner = {
  id?: string;
  name: string;
  email: string;
  isMyself: boolean;
  role: SignerRole;
};

export type DocumentField = {
  id: string;
  type: "signature" | "text" | "date" | "checkbox";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: boolean;
  label?: string;
  value?: string;
  assignedTo?: number; // Index of the signer this field is assigned to
};

interface DocumentState {
  // Document metadata
  documentId?: string;
  documentName: string;
  documentFile?: File | null;
  documentPreviewUrl?: string;

  // Security and expiration settings
  isEncrypted: boolean;
  encryptionPassword?: string;
  isExpirationEnabled: boolean;
  expirationDate?: Date;
  senderMessage: string;

  // Signers information
  signers: DocumentSigner[];

  // Fields information
  fields: DocumentField[];

  // Current step tracking
  currentStep: "upload" | "signers" | "fields" | "review";

  // Actions
  setDocumentId: (id: string) => void;
  setDocumentName: (name: string) => void;
  setDocumentFile: (file: File | null) => void;
  setDocumentPreviewUrl: (url: string) => void;
  setCurrentStep: (step: DocumentState["currentStep"]) => void;

  // Security and expiration actions
  setIsEncrypted: (isEncrypted: boolean) => void;
  setEncryptionPassword: (password: string) => void;
  setIsExpirationEnabled: (isEnabled: boolean) => void;
  setExpirationDate: (date?: Date) => void;
  setSenderMessage: (message: string) => void;

  // Signer actions
  addSigner: (signer: Omit<DocumentSigner, "id">) => void;
  updateSigner: (index: number, signer: Partial<DocumentSigner>) => void;
  removeSigner: (index: number) => void;
  clearSigners: () => void;

  // Field actions
  addField: (field: Omit<DocumentField, "id">) => void;
  updateField: (id: string, field: Partial<DocumentField>) => void;
  removeField: (id: string) => void;
  clearFields: () => void;

  // Reset store
  reset: () => void;
}

// Create the store with persistence
export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documentId: undefined,
      // Initial state
      documentName: "",
      documentFile: undefined,
      signers: [],
      fields: [],
      currentStep: "upload",

      // Initial security and expiration state
      isEncrypted: false,
      encryptionPassword: "",
      isExpirationEnabled: false,
      expirationDate: undefined,
      senderMessage: "",

      // Document actions
      setDocumentId: (id) => set({ documentId: id }),
      setDocumentName: (name) => set({ documentName: name }),
      setDocumentFile: (file) => set({ documentFile: file }),
      setDocumentPreviewUrl: (url) => set({ documentPreviewUrl: url }),
      setCurrentStep: (step) => set({ currentStep: step }),

      // Security and expiration actions
      setIsEncrypted: (isEncrypted) => set({ isEncrypted }),
      setEncryptionPassword: (encryptionPassword) =>
        set({ encryptionPassword }),
      setIsExpirationEnabled: (isExpirationEnabled) =>
        set({ isExpirationEnabled }),
      setExpirationDate: (expirationDate) => set({ expirationDate }),
      setSenderMessage: (senderMessage) => set({ senderMessage }),

      // Signer actions
      addSigner: (signer) =>
        set((state) => ({
          signers: [...state.signers, { ...signer, id: crypto.randomUUID() }],
        })),
      updateSigner: (index, updatedSigner) =>
        set((state) => {
          const newSigners = [...state.signers];
          newSigners[index] = { ...newSigners[index], ...updatedSigner };
          return { signers: newSigners };
        }),
      removeSigner: (index) =>
        set((state) => ({
          signers: state.signers.filter((_, i) => i !== index),
        })),
      clearSigners: () => set({ signers: [] }),

      // Field actions
      addField: (field) =>
        set((state) => ({
          fields: [...state.fields, { ...field, id: crypto.randomUUID() }],
        })),
      updateField: (id, updatedField) =>
        set((state) => ({
          fields: state.fields.map((field) =>
            field.id === id ? { ...field, ...updatedField } : field,
          ),
        })),
      removeField: (id) =>
        set((state) => ({
          fields: state.fields.filter((field) => field.id !== id),
        })),
      clearFields: () => set({ fields: [] }),

      // Reset the entire store
      reset: () =>
        set({
          documentId: undefined,
          documentName: "",
          documentFile: undefined,
          documentPreviewUrl: undefined,
          signers: [],
          fields: [],
          currentStep: "upload",
          isEncrypted: false,
          encryptionPassword: "",
          isExpirationEnabled: false,
          expirationDate: undefined,
          senderMessage: "",
        }),
    }),
    {
      name: "document-store",
      // Only persist certain parts of the state
      partialize: (state) => ({
        documentId: state.documentId,
        documentName: state.documentName,
        documentFile: state.documentFile,
        documentPreviewUrl: state.documentPreviewUrl,
        signers: state.signers,
        fields: state.fields,
        currentStep: state.currentStep,
        isEncrypted: state.isEncrypted,
        encryptionPassword: state.encryptionPassword,
        isExpirationEnabled: state.isExpirationEnabled,
        expirationDate: state.expirationDate,
        senderMessage: state.senderMessage,
      }),
    },
  ),
);
