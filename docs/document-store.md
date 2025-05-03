# Document Store Documentation

## Overview

The document store is a centralized state management solution built using Zustand that manages the entire document creation and editing workflow in DocuSol. It handles document metadata, participants (signers, reviewers, etc.), fields, and security settings. It leverages types defined in `@/lib/types/stamp` and `@/lib/pdf-editor/document-types`.

## State Structure

### Document Metadata

- `createdAt`: Timestamp (in milliseconds) when the store instance was created (primarily for internal cleanup logic)
- `documentId`: Unique identifier for the document (usually a UUID from the backend)
- `documentName`: Name of the document
- `documentDataUrl`: URL to the document data (e.g., a base64 data URL)
- `documentPreviewUrl`: URL to the document preview image (often a temporary object URL)
- `documentContentHash`: Object containing hashes (`contentHash`, `fileHash`, `metadataHash`) of the document content, as defined by `DocumentContentHash` from `@/lib/types/stamp`.

### Editor State

- `currentStep`: Current step in the document creation flow (`"upload" | "signers" | "fields" | "review" | "sending"`)
- `viewType`: Current view mode ("editor" | "signer")
- `scale`: Current zoom level
- `isDragging`: Whether a field is being dragged
- `isResizing`: Whether a field is being resized

### Participants (Signers)

- `signers`: Array of document participants, using the `DocumentSigner` type from `@/lib/types/stamp`. Includes properties like `id`, `userId`, `name`, `email`, `role`, `mode`, `isOwner`, and `color`.
- `currentSignerId`: ID of the currently selected participant for field assignment.

### Fields

- `fields`: Array of document fields, using the `DocumentField` type from `@/lib/pdf-editor/document-types`. Includes properties like `id`, `type`, `position`, `size`, `assignedTo` (participant ID), `required`, `label`, `value`, `options`, `signatureScale`, and `textStyles`.
- `selectedFieldId`: ID of the currently selected field

### Security and Expiration

- `isEncrypted`: Whether the document is password protected
- `encryptionPassword`: Document password if encrypted
- `isExpirationEnabled`: Whether the document has an expiration date
- `expirationDate`: When the document expires
- `senderMessage`: Message to be sent with the document

### Review Step Data

- `formDocumentMetadata`: Stores validated metadata from the review step (`FormDocumentMetadata` type from `@/lib/pdf-editor/document-types`), containing `documentName`, encryption/expiration settings, and `senderMessage`. Used during the final sending process.

## Key Features

### Persistence

The store uses Zustand's `persist` middleware to save state to local storage, enabling draft recovery. Certain keys are excluded from persistence to avoid storing large or transient data:

- `documentPreviewUrl`
- `scale`
- `isDragging`
- `isResizing`
- `selectedFieldId`

Note: `createdAt` _is_ persisted to help manage stale drafts.

### Color Management

The store exports a predefined `colorPalette` array and automatically assigns a unique color from this palette to each new participant added via `addSigner`.

### Field Management

- Fields adhere to the `DocumentField` interface (`@/lib/pdf-editor/document-types`).
- Fields can be added (`addField`), updated (`updateField`), and removed (`removeField`).
- Fields are automatically assigned to the `currentSignerId`.
- Fields support text styling (`textStyles` object) and positioning (`position` object with x, y, page).
- Fields can be selected (`selectedFieldId`, `setSelectedFieldId`) and manipulated (drag, resize - managed by `isDragging`, `isResizing` state).

### Signer Management

- Signers (participants) adhere to the `DocumentSigner` interface (`@/lib/types/stamp`).
- Signers can be added (`addSigner`), updated (`updateSigner`), and removed (`removeSigner`). Removing a signer also removes all fields assigned to them.
- The first signer added is automatically set as the current signer (`currentSignerId`).
- Each signer gets a unique color from the `colorPalette`.
- Signers can be selected (`setCurrentSignerId`) for field assignment.

### Security Features

- Document encryption with password protection (`isEncrypted`, `encryptionPassword`).
- Document expiration date setting (`isExpirationEnabled`, `expirationDate`).
- Sender message support (`senderMessage`).
- These settings are typically managed via the `formDocumentMetadata` state during the review step.

### State Export

- The `exportDocumentState` action extracts a specific subset of the state (`DocumentStateExport` type) needed for finalizing and sending the document. This includes metadata, participants, fields, and security settings.

### State Reset

- The `resetDocumentState` action clears most of the store's state, preparing it for a new document. It can optionally keep the `currentStep` as `"sending"` if the reset occurs after successful completion.

## Usage Examples

### Adding a Signer (Participant)

```typescript
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { DocumentSigner } from "@/lib/types/stamp";

const addSigner = useDocumentStore((state) => state.addSigner);

// Note: addSigner expects properties excluding 'id' and 'color', which are auto-generated.
// You might need to provide default values for other required fields from DocumentSigner.
addSigner({
  name: "Jane Doe",
  email: "jane@example.com",
  role: "participant", // Default role might vary
  mode: "transparent", // Default mode might vary
  isOwner: false,
  // userId might be added later if the user exists
});
```

### Adding a Field

```typescript
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";

const addField = useDocumentStore((state) => state.addField);
const currentSignerId = useDocumentStore.getState().currentSignerId;

if (currentSignerId) {
  addField({
    type: "signature",
    position: { x: 100, y: 100, page: 1 },
    size: { width: 200, height: 50 },
    // Other properties like 'required', 'label' can be added
  });
} else {
  console.error("Cannot add field: No signer selected");
}
```

### Updating Field Properties (e.g., Text Styles)

```typescript
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";

const updateField = useDocumentStore((state) => state.updateField);
const selectedFieldId = useDocumentStore.getState().selectedFieldId;

if (selectedFieldId) {
  updateField({
    id: selectedFieldId, // Ensure you have the ID of the field to update
    textStyles: {
      fontSize: 14,
      fontColor: "#333333",
      fontWeight: "bold",
    },
    // You can update other properties like position, size, value, etc.
    // position: { x: 110, y: 105, page: 1 }
  });
}
```

### Setting Document Security (via Form Metadata)

```typescript
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import { FormDocumentMetadata } from "@/lib/pdf-editor/document-types";

const setFormDocumentMetadata = useDocumentStore(
  (state) => state.setFormDocumentMetadata,
);
const currentMetadata = useDocumentStore.getState().formDocumentMetadata;

// Usually done after validating form input
const validatedMetadata: FormDocumentMetadata = {
  ...(currentMetadata || { documentName: "" }), // Preserve existing if needed
  documentName: "Updated Document Name",
  isEncrypted: true,
  encryptionPassword: "secure-password-123",
  isExpirationEnabled: true,
  expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  senderMessage: "Please review and sign this document.",
};

setFormDocumentMetadata(validatedMetadata);

// Individual setters still exist but might be less common now
// const setIsEncrypted = useDocumentStore((state) => state.setIsEncrypted);
// setIsEncrypted(true);
```

### Exporting State for Sending

```typescript
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";

const exportStateForAPI = () => {
  const documentStateToExport = useDocumentStore
    .getState()
    .exportDocumentState();
  console.log("State to send:", documentStateToExport);
  // Now send documentStateToExport to the backend API
  // (e.g., to call finalize_document_upload)
};
```

## Best Practices

1. Always use the store's actions (e.g., `addField`, `updateSigner`) to modify state rather than directly mutating it.
2. Use the `useShallow` hook from Zustand (`import { useShallow } from 'zustand/react/shallow'`) when selecting multiple values from the store in a component to prevent unnecessary re-renders if unrelated parts of the state change.
3. Call `resetDocumentState()` when starting a new document creation flow or after successfully sending a document to ensure a clean state for the next operation.
4. Ensure a participant (`currentSignerId`) is selected before attempting to add fields (`addField`).
5. Use the `formDocumentMetadata` state slice, populated during the review step, as the source of truth for final document settings when calling `exportDocumentState`.
6. Handle field selection (`setSelectedFieldId`) and manipulation logic (drag/resize updates via `updateField`) primarily through the store's actions and state.
7. Leverage the store's security features (`isEncrypted`, `isExpirationEnabled`) by setting them within the `formDocumentMetadata`.
8. Refer to `DocumentSigner` (`@/lib/types/stamp`) and `DocumentField` (`@/lib/pdf-editor/document-types`) for the exact structure of participants and fields stored.

## Related Components and Types

- `@/lib/pdf-editor/document-types`: Defines `DocumentField`, `FormDocumentMetadata`, `DocumentStateExport`, etc.
- `@/lib/types/stamp`: Defines `DocumentSigner`, `DocumentContentHash`, etc.
- `FieldsPalette`: Component allowing users to drag-and-drop new field types onto the document. Likely uses `addField`.
- `FieldsList` / `ParticipantsList`: Components for displaying, selecting, and managing existing fields and participants. Use `updateField`, `removeField`, `setSelectedFieldId`, `updateSigner`, `removeSigner`, `setCurrentSignerId`.
- `DocumentPage`: Component responsible for rendering a single page of the PDF document and overlaying the interactive `DocumentField` components.
- `ReviewStepForm`: Component handling the form for `FormDocumentMetadata` (name, security, expiry, message). Uses `setFormDocumentMetadata`.
- `useField`: Potentially a hook abstracting common field interactions (selection, updates).
