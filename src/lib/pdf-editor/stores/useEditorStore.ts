import { create } from "zustand";
import { toast } from "sonner";
import { devtools } from "zustand/middleware";
import {
  EditorState,
  DocumentField,
  FieldPosition,
  FieldSize,
  FieldType,
  Recipient,
} from "@/lib/pdf-editor/types";

// Define the store type with state and actions
interface EditorStore extends EditorState {
  // Actions
  addField: (
    type: FieldType,
    position: FieldPosition,
    size?: FieldSize,
  ) => void;
  updateField: (field: Partial<DocumentField> & { id: string }) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  addRecipient: (recipientData: {
    name: string;
    email?: string;
    color?: string;
  }) => void;
  updateRecipient: (
    id: string,
    updates: Partial<Omit<Recipient, "id">>,
  ) => void;
  deleteRecipient: (id: string) => void;
  setCurrentRecipient: (id: string | null) => void;
  setScale: (scale: number) => void;
  setDragging: (isDragging: boolean) => void;
  setResizing: (isResizing: boolean) => void;
  setPdfFile: (pdfFile: Blob) => void;

  // Selectors
  getRecipientById: (id: string | null) => Recipient | null;
  getCurrentRecipient: () => Recipient | null;
  getFieldRecipient: (fieldId: string) => Recipient | null;
}

// Mock data for initial state
const initialRecipients: Recipient[] = [
  new Recipient({
    id: "unique_id",
    name: "John Doe",
    email: "john.doe@example.com",
  }),
  new Recipient({
    id: "unique_id_2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
  }),
];

// Initial state
const initialState: EditorState = {
  fields: [],
  pdfFile: null,
  selectedFieldId: null,
  recipients: initialRecipients,
  currentRecipient: initialRecipients[0].id,
  scale: 1,
  isDragging: false,
  isResizing: false,
};

// Create the store
export const useEditorStore = create<EditorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      addField: (type, position, size) => {
        const id = `field-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        const defaultSize = { width: 150, height: 40 };

        // Get the current recipient ID
        const currentRecipientId = get().currentRecipient;

        // Make sure we have a valid recipient ID
        if (!currentRecipientId) {
          toast.error("No recipient selected");
          return;
        }

        const field: DocumentField = {
          id,
          type,
          position,
          size: size || defaultSize,
          recipientId: currentRecipientId, // Store the recipient ID
          required: false,
        };

        toast.success(`${field.type} field added`);
        set((state) => ({
          fields: [...state.fields, field],
          selectedFieldId: field.id,
        }));
      },

      updateField: (field) =>
        set((state) => ({
          fields: state.fields.map((f) =>
            f.id === field.id ? { ...f, ...field } : f,
          ),
        })),

      deleteField: (id) => {
        toast.info("Field deleted");
        set((state) => ({
          fields: state.fields.filter((field) => field.id !== id),
          selectedFieldId:
            state.selectedFieldId === id ? null : state.selectedFieldId,
        }));
      },

      selectField: (id) => set({ selectedFieldId: id }),

      addRecipient: (recipientData) => {
        const newRecipient = new Recipient(recipientData);

        if (!newRecipient.isValid()) {
          toast.error("Invalid recipient data");
          return;
        }

        set((state) => ({
          recipients: [...state.recipients, newRecipient],
        }));

        toast.success(`Recipient ${newRecipient.name} added`);
      },

      updateRecipient: (id, updates) => {
        set((state) => {
          const recipients = [...state.recipients];
          const index = recipients.findIndex((r) => r.id === id);

          if (index === -1) return state;

          // Create a new instance with the updates
          recipients[index] = recipients[index].update(updates);

          return { recipients };
        });
      },

      deleteRecipient: (id) => {
        // Don't allow deleting the last recipient
        const { recipients, currentRecipient, fields } = get();

        if (recipients.length <= 1) {
          toast.error("Cannot delete the last recipient");
          return;
        }

        // If deleting current recipient, switch to another one
        let newCurrentRecipient = currentRecipient;
        if (currentRecipient === id) {
          const otherRecipient = recipients.find((r) => r.id !== id);
          newCurrentRecipient = otherRecipient ? otherRecipient.id : null;
        }

        // Update fields assigned to this recipient
        const updatedFields = fields.map((field) =>
          field.recipientId === id
            ? { ...field, recipientId: newCurrentRecipient }
            : field,
        );

        set({
          recipients: recipients.filter((r) => r.id !== id),
          currentRecipient: newCurrentRecipient,
          fields: updatedFields,
        });

        toast.info("Recipient deleted");
      },

      setCurrentRecipient: (id) => set({ currentRecipient: id }),

      setScale: (scale) => set({ scale }),

      setDragging: (isDragging) => set({ isDragging }),

      setResizing: (isResizing) => set({ isResizing }),

      setPdfFile: (pdfFile) => set({ pdfFile }),

      // Selectors
      getRecipientById: (id: string | null) => {
        if (!id) return null;
        return get().recipients.find((r) => r.id === id) || null;
      },

      getCurrentRecipient: () => {
        const state = get();
        if (!state.currentRecipient) return null;
        return (
          state.recipients.find((r) => r.id === state.currentRecipient) || null
        );
      },

      getFieldRecipient: (fieldId: string) => {
        const state = get();
        const field = state.fields.find((f) => f.id === fieldId);
        if (!field?.recipientId) return null;
        return state.recipients.find((r) => r.id === field.recipientId) || null;
      },
    }),
    { name: "editor-store" },
  ),
);
