import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DocumentState } from "@/lib/pdf-editor/document-types";
import { DocumentSigner } from "@/lib/types/stamp";
import type { DocumentField } from "@/lib/pdf-editor/document-types";

// Predefined set of distinct colors that work well for UI elements
export const colorPalette = [
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#f97316", // Orange
  "#0ea5e9", // Sky blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#0284c7", // Light blue
  "#059669", // Green
  "#d946ef", // Fuchsia
  "#6d28d9", // Purple
];

const keysToNotPersist: (keyof DocumentState)[] = [
  "documentPreviewUrl",
  "scale",
  "isDragging",
  "isResizing",
  "selectedFieldId",
  // "numPages", // Comment out or remove if numPages should be persisted
];

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      createdAt: Date.now(),

      documentId: "",
      documentName: "",
      documentDataUrl: null,
      documentPreviewUrl: null,
      documentContentHash: null,
      numPages: null,

      currentStep: "upload",
      viewType: "editor",
      scale: 1,
      isDragging: false,
      isResizing: false,

      signers: [],
      currentSignerId: null,

      fields: [],
      selectedFieldId: null,

      isEncrypted: false,
      encryptionPassword: "",
      isExpirationEnabled: false,
      expirationDate: undefined,
      senderMessage: "",

      formDocumentMetadata: null,

      // Document actions
      setCreatedAt: (createdAt) => set({ createdAt }),
      setDocumentId: (id) => set({ documentId: id }),
      setDocumentName: (name) => set({ documentName: name }),
      setDocumentDataUrl: (url) => set({ documentDataUrl: url }),
      setDocumentPreviewUrl: (url) => set({ documentPreviewUrl: url }),
      setNumPages: (num: number | null) => set({ numPages: num }),
      setDocumentContentHash: (hash) => set({ documentContentHash: hash }),
      // Document editor actions
      setCurrentStep: (step) => set({ currentStep: step }),
      setViewType: (viewType) => set({ viewType }),
      setScale: (scale) => set({ scale }),
      setDragging: (isDragging) => set({ isDragging }),
      setResizing: (isResizing) => set({ isResizing }),

      /**
       * Signer actions
       */

      addSigner: (signer) =>
        set((state) => {
          // If the first signer, set it as the current signer by default
          const newSigner = {
            ...signer,
            id: crypto.randomUUID(),
            color: colorPalette[state.signers.length],
          } as DocumentSigner;

          if (state.signers.length === 0) {
            return {
              signers: [newSigner],
              currentSignerId: newSigner.id,
            };
          }

          return { signers: [...state.signers, newSigner] };
        }),
      updateSigner: (id, updatedSigner) =>
        set((state) => {
          const newSigners = state.signers.map((signer) =>
            signer.id === id ? { ...signer, ...updatedSigner } : signer,
          );
          return { signers: newSigners };
        }),
      removeSigner: (id) =>
        set((state) => {
          // If the last signer, set the current signer to null
          const newSigners = state.signers.filter((signer) => signer.id !== id);

          if (newSigners.length === 0) {
            return {
              signers: [],
              currentSignerId: null,
              fields: [],
            };
          }

          // Remove all fields that were assigned to the removed signer
          const newFields = state.fields.filter(
            (field) => field.assignedTo !== id,
          );

          return { signers: newSigners, fields: newFields };
        }),
      clearSigners: () => set({ signers: [] }),
      setCurrentSignerId: (id) => set({ currentSignerId: id }),

      /**
       * Field actions
       */

      // When adding a field, we need to ensure that the field is assigned to a signer
      // as it is not possible to add a field without a signer. We also need to update the
      // selected field id to the id of the new field and give it focus.
      addField: (field) =>
        set((state) => {
          if (!state.currentSignerId) {
            throw new Error("No signer selected");
          }

          const newFieldId = crypto.randomUUID();
          const newField = {
            ...field,
            id: newFieldId,
            assignedTo: state.currentSignerId || "",
            textStyles: {},
          };

          return {
            fields: [...state.fields, newField],
            selectedFieldId: newFieldId,
          };
        }),
      updateField: (id: string, updates: Partial<DocumentField>) =>
        set((state) => ({
          fields: state.fields.map((field) =>
            field.id === id
              ? {
                  ...field,
                  ...updates,
                  ...(updates.textStyles && {
                    textStyles: {
                      ...field.textStyles,
                      ...updates.textStyles,
                    },
                  }),
                }
              : field,
          ),
        })),
      removeField: (id: string) =>
        set((state) => ({
          fields: state.fields.filter((field) => field.id !== id),
          selectedFieldId:
            state.selectedFieldId === id ? null : state.selectedFieldId,
        })),
      clearFields: () => set({ fields: [] }),
      setSelectedFieldId: (id: string | null) =>
        set((state) => {
          // Only update if the selection actually changes
          if (state.selectedFieldId === id) return {};
          return { selectedFieldId: id };
        }),
      clearSelectedFieldId: () => set({ selectedFieldId: null }),

      // Security and expiration actions
      setIsEncrypted: (isEncrypted) => set({ isEncrypted }),
      setEncryptionPassword: (encryptionPassword) =>
        set({ encryptionPassword }),
      setIsExpirationEnabled: (isExpirationEnabled) =>
        set({ isExpirationEnabled }),
      setExpirationDate: (expirationDate) => set({ expirationDate }),
      setSenderMessage: (senderMessage) => set({ senderMessage }),

      setFormDocumentMetadata: (metadata) =>
        set({ formDocumentMetadata: metadata }),

      resetDocumentState: (completed = false) =>
        set({
          documentId: "",
          documentName: "",
          documentDataUrl: null,
          documentPreviewUrl: null,
          signers: [],
          currentSignerId: null,
          fields: [],
          selectedFieldId: null,
          // Don't reset the current step if the document is completed, let it stay in the
          // sending step so that the user can see success message and manually navigate to
          // the document.
          currentStep: completed ? "sending" : "upload",
          isEncrypted: false,
          encryptionPassword: "",
          isExpirationEnabled: false,
          expirationDate: undefined,
          senderMessage: "",
          numPages: null,
        }),

      exportDocumentState: () => {
        const state = get();
        return {
          documentId: state.documentId,
          documentName: state.documentName,
          documentContentHash: state.documentContentHash,
          signers: state.signers,
          fields: state.fields,
          encryptionPassword: state.encryptionPassword,
          expirationDate: state.expirationDate,
          senderMessage: state.senderMessage,
        };
      },
    }),
    {
      name: "document-store",
      // Only persist certain parts of the state
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !keysToNotPersist.includes(key as keyof DocumentState),
          ),
        ),
    },
  ),
);
