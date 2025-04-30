import { create } from "zustand";

import type { DocumentField } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";

// Define the state structure
export interface DocumentSigningState {
  documentDataUrl: string | null;
  numPages: number | null; // Added numPages
  fields: DocumentField[];
  currentSigner: DocumentSigner | null; // Store the specific signer for this session
  selectedFieldId: string | null;
  scale: number;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean; // To track signing progress
  // Define actions
  setDocumentDataUrl: (url: string | null) => void;
  setNumPages: (num: number | null) => void; // Added setNumPages
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
  setIsSaving: (saving: boolean) => void;
  resetStore: () => void;
}

// Default initial state
const initialState: Omit<
  DocumentSigningState,
  | "setDocumentDataUrl"
  | "setNumPages"
  | "setFields"
  | "updateField"
  | "setCurrentSigner"
  | "setSelectedFieldId"
  | "setScale"
  | "setLoading"
  | "setError"
  | "setIsSaving"
  | "resetStore"
  | "clearSelectedFieldId"
> = {
  documentDataUrl: null,
  numPages: null,
  fields: [],
  currentSigner: null,
  selectedFieldId: null,
  scale: 1,
  isLoading: true,
  error: null,
  isSaving: false,
};

export const useDocumentSigningStore = create<DocumentSigningState>((set) => ({
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
  setIsSaving: (saving) => set({ isSaving: saving }),
  resetStore: () => set(initialState),
}));

// Expose field update logic separately if needed by specific field components
export const updateStoreField = (
  id: string,
  updates: Partial<Pick<DocumentField, "value">>,
) => useDocumentSigningStore.getState().updateField(id, updates);
