import { useCallback } from "react";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import type { DocumentField } from "@/lib/pdf-editor/document-types";

export function useField(fieldId: string) {
  const field = useDocumentStore(
    useCallback(
      (state) => state.fields.find((f) => f.id === fieldId),
      [fieldId],
    ),
  );

  if (!field) {
    throw new Error(`Field ${fieldId} not found`);
  }

  const isSelected = useDocumentStore(
    useCallback((state) => state.selectedFieldId === fieldId, [fieldId]),
  );
  const recipient = useDocumentStore(
    useCallback(
      (state) => {
        if (!field?.assignedTo) return null;
        return state.signers.find((r) => r.id === field.assignedTo) || null;
      },
      [field?.assignedTo],
    ),
  );
  const viewType = useDocumentStore((state) => state.viewType);
  const scale = useDocumentStore((state) => state.scale);
  const isDragging = useDocumentStore((state) => state.isDragging);
  const isResizing = useDocumentStore((state) => state.isResizing);

  const updateField = useDocumentStore((state) => state.updateField);
  const removeField = useDocumentStore((state) => state.removeField);
  const setSelectedFieldId = useDocumentStore(
    (state) => state.setSelectedFieldId,
  );
  const clearSelectedFieldId = useDocumentStore(
    (state) => state.clearSelectedFieldId,
  );
  const setIsDragging = useDocumentStore((state) => state.setDragging);
  const setIsResizing = useDocumentStore((state) => state.setResizing);

  const handleUpdate = useCallback(
    (updates: Partial<DocumentField>) =>
      updateField({ id: fieldId, ...updates }),
    [fieldId, updateField],
  );

  const handleDelete = useCallback(
    () => removeField(fieldId),
    [fieldId, removeField],
  );

  const handleSelect = useCallback(
    () => setSelectedFieldId(fieldId),
    [fieldId, setSelectedFieldId],
  );

  const handleFocus = useCallback(() => {
    setSelectedFieldId(fieldId);
  }, [fieldId, setSelectedFieldId]);

  const handleBlur = useCallback(() => {
    clearSelectedFieldId();
  }, [clearSelectedFieldId]);

  const handleChange = useCallback(
    (value: string) => {
      updateField({
        id: fieldId,
        value,
      });
    },
    [fieldId, updateField],
  );

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
    setIsDragging,
    setIsResizing,
  };
}
