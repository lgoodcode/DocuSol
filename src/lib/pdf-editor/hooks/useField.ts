import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { useDocumentSigningStore } from "@/app/sign/[id]/useDocumentSignStore";
import type {
  DocumentField,
  DocumentState,
} from "@/lib/pdf-editor/document-types";
import type { DocumentSigningState } from "@/app/sign/[id]/useDocumentSignStore";
import type { DocumentSigner } from "@/lib/types/stamp";

// Define the full return type expected by components using the original hook
interface UseFieldFullResult {
  field: DocumentField; // Field should exist if we reach the main return
  isSelected: boolean;
  recipient: DocumentSigner | undefined | null; // Renamed from signer for consistency
  viewType: "editor" | "signer"; // Pass viewType back out
  scale: number;
  isDragging?: boolean; // Optional for signer view
  isResizing?: boolean; // Optional for signer view
  updateField: (updates: Partial<DocumentField>) => void; // Wrapped update
  removeField?: () => void; // Made optional
  selectField: () => void; // Wrapped select
  handleChange: (value: string | { dataUrl: string; scale: number }) => void; // Wrapped update value/signature
  handleFocus: () => void; // Wrapped select
  handleBlur: () => void; // Wrapped clear selection
  setIsDragging?: (isDragging: boolean) => void; // Optional for signer view
  setIsResizing?: (isResizing: boolean) => void; // Optional for signer view
}

// Error result type
type UseFieldErrorResult = {
  field: undefined;
  // Include default/dummy values for the rest to satisfy consumers
  isSelected: false;
  recipient: undefined;
  viewType: "editor" | "signer";
  scale: 1;
  updateField: (updates: Partial<DocumentField>) => void;
  removeField?: () => void; // Added optional property
  selectField: () => void;
  handleChange: (value: string | { dataUrl: string; scale: number }) => void;
  handleFocus: () => void;
  handleBlur: () => void;
  setIsDragging?: (isDragging: boolean) => void; // Added optional property
  setIsResizing?: (isResizing: boolean) => void; // Added optional property
};

/**
 * Hook to get field data and associated signer based on view type.
 *
 * @param fieldId The ID of the field to retrieve.
 * @param viewType The current view context ('editor' or 'signer').
 * @returns An object containing the field data, assigned signer, and update action.
 */
export const useField = (
  fieldId: string,
  viewType: "editor" | "signer",
): UseFieldFullResult | UseFieldErrorResult => {
  // Union type for return

  // Define selectors using useCallback to memoize them based on fieldId
  const editorSelector = useCallback(
    (state: DocumentState) => ({
      field: state.fields.find((f: DocumentField) => f.id === fieldId),
      isSelected: state.selectedFieldId === fieldId,
      recipient: state.fields.find((f: DocumentField) => f.id === fieldId)
        ?.assignedTo
        ? state.signers.find(
            (s) =>
              s.id ===
              state.fields.find((f: DocumentField) => f.id === fieldId)
                ?.assignedTo,
          )
        : undefined,
      scale: state.scale,
      isDragging: state.isDragging,
      isResizing: state.isResizing,
      _updateField: state.updateField,
      _removeField: state.removeField,
      _setSelectedFieldId: state.setSelectedFieldId,
      _clearSelectedFieldId: state.clearSelectedFieldId,
      _setDragging: state.setDragging,
      _setResizing: state.setResizing,
    }),
    [fieldId],
  );

  const signerSelector = useCallback(
    (state: DocumentSigningState) => ({
      field: state.fields.find((f: DocumentField) => f.id === fieldId),
      isSelected: state.selectedFieldId === fieldId,
      recipient:
        state.fields.find((f: DocumentField) => f.id === fieldId)
          ?.assignedTo === state.currentSigner?.id
          ? state.currentSigner
          : null,
      scale: state.scale,
      isDragging: undefined,
      isResizing: undefined,
      _updateField: state.updateField,
      _removeField: undefined,
      _setSelectedFieldId: state.setSelectedFieldId,
      _clearSelectedFieldId: state.clearSelectedFieldId,
      _setDragging: undefined,
      _setResizing: undefined,
    }),
    [fieldId],
  );

  // Call both hooks unconditionally
  const editorStoreData = useDocumentStore(useShallow(editorSelector));
  const signerStoreData = useDocumentSigningStore(useShallow(signerSelector));

  // Select the appropriate data based on viewType
  const storeData = viewType === "editor" ? editorStoreData : signerStoreData;

  // Destructure after selecting from store
  const {
    field,
    isSelected,
    recipient,
    scale,
    isDragging,
    isResizing,
    _updateField,
    _removeField,
    _setSelectedFieldId,
    _clearSelectedFieldId,
    _setDragging,
    _setResizing,
  } = storeData;

  // Re-implement handler wrappers using useCallback BEFORE the early return
  const handleUpdate = useCallback(
    (updates: Partial<DocumentField>) => _updateField(fieldId, updates),
    [fieldId, _updateField],
  );

  const handleDelete = useCallback(() => {
    // Ensure _removeField exists before calling (it's undefined for signer)
    if (_removeField) {
      _removeField(fieldId);
    } else {
      console.warn("Remove field action not available in this context");
    }
  }, [fieldId, _removeField]);

  const handleSelect = useCallback(() => {
    if (_setSelectedFieldId) {
      _setSelectedFieldId(fieldId);
    }
  }, [fieldId, _setSelectedFieldId]);

  const handleFocus = useCallback(() => {
    // Focus likely implies selection in this context
    if (_setSelectedFieldId) {
      _setSelectedFieldId(fieldId);
    }
  }, [fieldId, _setSelectedFieldId]);

  const handleBlur = useCallback(() => {
    if (_clearSelectedFieldId) {
      _clearSelectedFieldId();
    }
  }, [_clearSelectedFieldId]);

  const handleChange = useCallback(
    (value: string | { dataUrl: string; scale: number }) => {
      if (typeof value === "string") {
        // Handle simple value update (e.g., text field)
        _updateField(fieldId, { value });
      } else {
        // Handle signature/initials update which includes dataUrl and scale
        _updateField(fieldId, {
          value: value.dataUrl,
          signatureScale: value.scale,
        });
      }
    },
    [fieldId, _updateField],
  );

  // Handle case where field is not found
  if (!field) {
    console.warn(
      `useField: Field with ID ${fieldId} not found in ${viewType} store.`,
    );
    const dummyUpdate = () => {
      console.error("Cannot update non-existent field", fieldId);
    };
    const dummySelect = () => {
      console.warn("Cannot select non-existent field", fieldId);
    };
    const dummyChange = () => {
      console.error("Cannot change non-existent field", fieldId);
    };
    const dummyFocus = () => {
      console.warn("Cannot focus non-existent field", fieldId);
    };
    const dummyBlur = () => {};
    // Return an object matching the UseFieldErrorResult structure
    return {
      field: undefined,
      isSelected: false,
      recipient: undefined,
      viewType,
      scale: 1, // Default scale
      updateField: dummyUpdate,
      removeField: undefined,
      selectField: dummySelect,
      handleChange: dummyChange,
      handleFocus: dummyFocus,
      handleBlur: dummyBlur,
      setIsDragging: undefined,
      setIsResizing: undefined,
    };
  }

  // Construct the full return object matching the original structure
  return {
    field,
    isSelected,
    recipient,
    viewType,
    scale,
    isDragging,
    isResizing,
    updateField: handleUpdate,
    removeField: handleDelete,
    selectField: handleSelect,
    handleChange,
    handleFocus,
    handleBlur,
    setIsDragging: viewType === "editor" ? _setDragging : undefined, // Only return editor actions
    setIsResizing: viewType === "editor" ? _setResizing : undefined,
  };
};
