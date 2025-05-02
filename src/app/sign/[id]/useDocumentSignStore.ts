import { create } from "zustand";
import { toast } from "sonner";

import { exportPdfWithFields } from "@/lib/pdf-editor/pdf-export";
import type { DocumentField } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";

// Define the state structure
export interface DocumentSigningState {
  documentDataUrl: string | null;
  numPages: number | null;
  fields: DocumentField[];
  currentSigner: DocumentSigner | null;
  selectedFieldId: string | null;
  scale: number;
  isLoading: boolean;
  error: string | null;
  // isSaving: boolean; // Removed - will be local state
  // Define actions
  setDocumentDataUrl: (url: string | null) => void;
  setNumPages: (num: number | null) => void;
  setFields: (fields: DocumentField[]) => void;
  updateField: (
    id: string,
    updates: Partial<Pick<DocumentField, "value">>,
  ) => void;
  setCurrentSigner: (signer: DocumentSigner | null) => void;
  setSelectedFieldId: (id: string | null) => void;
  clearSelectedFieldId: () => void;
  setScale: (scale: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // setIsSaving: (saving: boolean) => void; // Removed
  resetStore: () => void;
  exportAndDownloadSignedPdf: (filename: string) => Promise<Blob>;
}

// Default initial state
const initialState: Omit<
  DocumentSigningState,
  | // Action functions...
  "setDocumentDataUrl"
  | "setNumPages"
  | "setFields"
  | "updateField"
  | "setCurrentSigner"
  | "setSelectedFieldId"
  | "setScale"
  | "setLoading"
  | "setError"
  | "resetStore"
  | "clearSelectedFieldId"
  | "exportAndDownloadSignedPdf"
> = {
  documentDataUrl: null,
  numPages: null,
  fields: [],
  currentSigner: null,
  selectedFieldId: null,
  scale: 1,
  isLoading: true,
  error: null,
};

export const useDocumentSigningStore = create<DocumentSigningState>(
  (set, get) => ({
    ...initialState,
    setDocumentDataUrl: (url) => set({ documentDataUrl: url, isLoading: !url }),
    setNumPages: (num) => set({ numPages: num }),
    setFields: (fields) => set({ fields }),
    updateField: (id, updates) =>
      set((state) => ({
        fields: state.fields.map((field) =>
          field.id === id ? { ...field, ...updates } : field,
        ),
      })),
    setCurrentSigner: (signer) => set({ currentSigner: signer }),
    setSelectedFieldId: (id) => set({ selectedFieldId: id }),
    clearSelectedFieldId: () => set({ selectedFieldId: null }),
    setScale: (scale) => set({ scale }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error, isLoading: false }),
    resetStore: () => set(initialState),
    exportAndDownloadSignedPdf: async (filename: string) => {
      const { documentDataUrl, fields } = get();
      if (!documentDataUrl) {
        throw new Error("Document data URL is not set.");
      }

      try {
        return await exportPdfWithFields(documentDataUrl, filename, fields);
      } catch (error) {
        console.error("Error exporting signed PDF:", error);
        toast.error("Failed to export document.", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        });
        throw error; // Re-throw error so the calling component knows it failed
      }
    },
  }),
);

/**
 * Selector to check if all required fields assigned to the current signer are filled.
 */
export const selectCanCompleteSigning = (
  state: DocumentSigningState,
): boolean => {
  const { fields, currentSigner } = state;
  if (!currentSigner) return false; // No signer loaded yet

  // Filter fields assigned to the current signer that are required
  const requiredFieldsForSigner = fields.filter(
    (field) => field.assignedTo === currentSigner.id && field.required,
  );

  // Check if all of these required fields have a non-empty value
  return requiredFieldsForSigner.every(
    (field) => field.value && field.value.trim() !== "",
  );
};

// Expose field update logic separately if needed by specific field components
export const updateStoreField = (
  id: string,
  updates: Partial<Pick<DocumentField, "value">>,
) => useDocumentSigningStore.getState().updateField(id, updates);
