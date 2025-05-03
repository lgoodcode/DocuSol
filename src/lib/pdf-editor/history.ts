// import { create } from "zustand";

// import { DocumentField } from "@/lib/pdf-editor/document-types";
// import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";

// // Define a command interface
// interface Command {
//   execute(): void;
//   undo(): void;
// }

// // Example command for adding a field
// class AddFieldCommand implements Command {
//   private field: DocumentField;

//   constructor(field: DocumentField) {
//     this.field = field;
//   }

//   execute() {
//     useDocumentStore.getState().addField(this.field);
//   }

//   undo() {
//     useDocumentStore.getState().removeField(this.field.id);
//   }
// }

// // Example command for updating a field
// class UpdateFieldCommand implements Command {
//   private fieldId: string;
//   private oldValues: Partial<DocumentField>;
//   private newValues: Partial<DocumentField>;

//   constructor(
//     fieldId: string,
//     oldValues: Partial<DocumentField>,
//     newValues: Partial<DocumentField>,
//   ) {
//     this.fieldId = fieldId;
//     this.oldValues = oldValues;
//     this.newValues = newValues;
//   }

//   execute() {
//     useDocumentStore
//       .getState()
//       .updateField({ id: this.fieldId, ...this.newValues });
//   }

//   undo() {
//     useDocumentStore
//       .getState()
//       .updateField({ id: this.fieldId, ...this.oldValues });
//   }
// }

// // Example of a more efficient field update command
// class UpdateFieldPropertiesCommand implements Command {
//   private fieldId: string;
//   private propertyChanges: Record<string, { oldValue: any; newValue: any }>;

//   constructor(
//     fieldId: string,
//     changes: Record<string, { oldValue: any; newValue: any }>,
//   ) {
//     this.fieldId = fieldId;
//     this.propertyChanges = changes;
//   }

//   execute() {
//     const field = useDocumentStore
//       .getState()
//       .fields.find((f) => f.id === this.fieldId);
//     if (!field) return;

//     const updates: Partial<DocumentField> = { id: this.fieldId };
//     Object.entries(this.propertyChanges).forEach(([key, { newValue }]) => {
//       updates[key] = newValue;
//     });

//     useDocumentStore.getState().updateField(updates);
//   }

//   undo() {
//     const field = useDocumentStore
//       .getState()
//       .fields.find((f) => f.id === this.fieldId);
//     if (!field) return;

//     const updates: Partial<DocumentField> = { id: this.fieldId };
//     Object.entries(this.propertyChanges).forEach(([key, { oldValue }]) => {
//       updates[key] = oldValue;
//     });

//     useDocumentStore.getState().updateField(updates);
//   }
// }

// class BatchCommand implements Command {
//   private commands: Command[];

//   constructor(commands: Command[]) {
//     this.commands = commands;
//   }

//   execute() {
//     this.commands.forEach((command) => command.execute());
//   }

//   undo() {
//     // Undo in reverse order
//     [...this.commands].reverse().forEach((command) => command.undo());
//   }
// }

// interface CommandHistoryState {
//   past: Command[];
//   future: Command[];
//   canUndo: boolean;
//   canRedo: boolean;
//   execute: (command: Command) => void;
//   undo: () => void;
//   redo: () => void;
//   clear: () => void;
// }

// export const useCommandHistoryStore = create<CommandHistoryState>(
//   (set, get) => ({
//     past: [],
//     future: [],
//     canUndo: false,
//     canRedo: false,

//     execute: (command) => {
//       command.execute();

//       set((state) => ({
//         past: [...state.past, command],
//         future: [],
//         canUndo: true,
//         canRedo: false,
//       }));
//     },

//     undo: () => {
//       const { past } = get();
//       if (past.length === 0) return;

//       const newPast = [...past];
//       const command = newPast.pop();

//       if (command) {
//         command.undo();

//         set((state) => ({
//           past: newPast,
//           future: [command, ...state.future],
//           canUndo: newPast.length > 0,
//           canRedo: true,
//         }));
//       }
//     },

//     redo: () => {
//       const { future } = get();
//       if (future.length === 0) return;

//       const newFuture = [...future];
//       const command = newFuture.shift();

//       if (command) {
//         command.execute();

//         set((state) => ({
//           past: [...state.past, command],
//           future: newFuture,
//           canUndo: true,
//           canRedo: newFuture.length > 0,
//         }));
//       }
//     },

//     clear: () => {
//       set({
//         past: [],
//         future: [],
//         canUndo: false,
//         canRedo: false,
//       });
//     },
//   }),
// );

// // Middleware for document store
// const historyMiddleware = (config: any) => (set: any, get: any, api: any) => {
//   const historyStore = useCommandHistoryStore.getState();

//   return config(
//     (...args: any[]) => {
//       // Capture state before update
//       const prevState = get();

//       // Apply the state update
//       set(...args);

//       // Capture state after update
//       const nextState = get();

//       // Create and execute appropriate command based on what changed
//       // This is a simplified example - you'd need to determine the specific command type
//       if (prevState.fields.length !== nextState.fields.length) {
//         // Field added or removed
//         // Create appropriate command and add to history
//       } else if (
//         JSON.stringify(prevState.fields) !== JSON.stringify(nextState.fields)
//       ) {
//         // Field updated
//         // Create appropriate command and add to history
//       }
//     },
//     get,
//     api,
//   );
// };
