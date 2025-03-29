import { create } from "zustand";

import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { DocumentField } from "@/lib/pdf-editor/document-types";
import { DocumentSigner } from "@/lib/types/stamp";

const HISTORY_LIMIT = 20;

type ItemState = {
  fields: DocumentField[];
  signers: DocumentSigner[];
  currentSignerId: string | null;
};

interface HistoryState {
  past: ItemState[];
  future: ItemState[];
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
    const { fields, signers, currentSignerId } = useDocumentStore((state) => ({
      fields: state.fields,
      signers: state.signers,
      currentSignerId: state.currentSignerId,
    }));

    set((state) => {
      const newPast = [
        ...state.past,
        {
          fields: JSON.parse(JSON.stringify(fields)),
          signers: signers.map((s) => structuredClone(s)),
          currentSignerId,
        },
      ].slice(-HISTORY_LIMIT);

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
            currentSignerId: previousState.currentSignerId,
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
            currentSignerId: nextState.currentSignerId,
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
