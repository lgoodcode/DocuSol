import { create } from "zustand";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { DocumentField } from "@/lib/pdf-editor/document-types";
import { DocumentSigner } from "@/lib/types/stamp";

interface HistoryState {
  past: Array<{
    fields: DocumentField[];
    signers: DocumentSigner[];
    currentSigner: string | null;
  }>;
  future: Array<{
    fields: DocumentField[];
    signers: DocumentSigner[];
    currentSigner: string | null;
  }>;
  canUndo: boolean;
  canRedo: boolean;
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useEditorHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  saveState: () => {
    const currentState = useDocumentStore.getState();
    const { fields, signers } = currentState;

    set((state) => {
      const newPast = [
        ...state.past,
        {
          fields: JSON.parse(JSON.stringify(fields)),
          signers: signers.map((s) => structuredClone(s)),
        },
      ].slice(-20); // Limit history to 20 states

      return {
        past: newPast,
        future: [],
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const currentState = useDocumentStore.getState();
    const { fields, signers } = currentState;

    const newPast = [...past];
    const previousState = newPast.pop();

    if (previousState) {
      useDocumentStore.setState({
        fields: previousState.fields,
        signers: previousState.signers,
      });

      set((state) => ({
        past: newPast,
        future: [
          {
            fields: structuredClone(previousState.fields),
            signers: previousState.signers.map((s) => structuredClone(s)),
          },
          ...state.future,
        ],
        canUndo: newPast.length > 0,
        canRedo: true,
      }));
    }
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const currentState = useDocumentStore.getState();
    const { fields, signers } = currentState;

    const newFuture = [...future];
    const nextState = newFuture.shift();

    if (nextState) {
      useDocumentStore.setState({
        fields: nextState.fields,
        signers: nextState.signers,
      });

      set((state) => ({
        past: [
          ...state.past,
          {
            fields: structuredClone(nextState.fields),
            signers: nextState.signers.map((s) => structuredClone(s)),
          },
        ],
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      }));
    }
  },

  clear: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
