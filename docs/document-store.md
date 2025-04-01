# Document Store Documentation

## Overview

The document store is a centralized state management solution built using Zustand that manages the entire document creation and editing workflow in DocuSol. It handles document metadata, signers, fields, and security settings.

## State Structure

### Document Metadata

- `documentId`: Unique identifier for the document
- `documentName`: Name of the document
- `documentDataUrl`: URL to the document data
- `documentPreviewUrl`: URL to the document preview

### Editor State

- `currentStep`: Current step in the document creation flow ("upload" | "signers" | "fields" | "review")
- `viewType`: Current view mode ("editor" | "signer")
- `scale`: Current zoom level
- `isDragging`: Whether a field is being dragged
- `isResizing`: Whether a field is being resized

### Signers

- `signers`: Array of document signers
- `currentSignerId`: ID of the currently selected signer

### Fields

- `fields`: Array of document fields
- `selectedFieldId`: ID of the currently selected field

### Security and Expiration

- `isEncrypted`: Whether the document is password protected
- `encryptionPassword`: Document password if encrypted
- `isExpirationEnabled`: Whether the document has an expiration date
- `expirationDate`: When the document expires
- `senderMessage`: Message to be sent with the document

## Key Features

### Persistence

The store uses Zustand's persist middleware to save state to local storage. Certain keys are excluded from persistence:

- `documentPreviewUrl`
- `scale`
- `isDragging`
- `isResizing`
- `selectedFieldId`

### Color Management

The store includes a predefined color palette for signers, ensuring consistent and visually distinct colors for each signer.

### Field Management

- Fields can be added, updated, and removed
- Fields are automatically assigned to the current signer
- Fields support text styling and positioning
- Fields can be selected and manipulated (drag, resize)

### Signer Management

- Signers can be added, updated, and removed
- The first signer is automatically set as the current signer
- Each signer gets a unique color from the palette
- Signers can be selected for field assignment

### Security Features

- Document encryption with password protection
- Document expiration date setting
- Sender message support

## Usage Examples

### Adding a Signer

```typescript
const addSigner = useDocumentStore((state) => state.addSigner);
addSigner({
  name: "John Doe",
  email: "john@example.com",
  orderIndex: 1,
});
```

### Adding a Field

```typescript
const addField = useDocumentStore((state) => state.addField);
addField({
  type: "signature",
  position: { x: 100, y: 100, page: 1 },
  size: { width: 200, height: 50 },
});
```

### Updating Field Properties

```typescript
const updateField = useDocumentStore((state) => state.updateField);
updateField({
  id: "field-1",
  textStyles: {
    fontSize: 14,
    fontColor: "#000000",
  },
});
```

### Setting Document Security

```typescript
const setIsEncrypted = useDocumentStore((state) => state.setIsEncrypted);
const setEncryptionPassword = useDocumentStore(
  (state) => state.setEncryptionPassword,
);

setIsEncrypted(true);
setEncryptionPassword("secure-password");
```

## Best Practices

1. Always use the store's actions to modify state rather than directly mutating it
2. Use the `useShallow` hook from Zustand when selecting multiple values to prevent unnecessary re-renders
3. Reset the store when starting a new document to ensure a clean state
4. Handle field selection and manipulation through the store's actions
5. Use the store's security features to protect sensitive documents

## Related Components

- `FieldsPalette`: Component for adding new fields
- `FieldsList`: Component for displaying and managing existing fields
- `DocumentPage`: Component for rendering document pages with fields
- `useField`: Hook for field-specific operations
