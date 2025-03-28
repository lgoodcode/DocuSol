# PDF Editor Components

This directory contains the components used in the PDF editor feature of DocuSol.

## Component Structure

### Main Components

- `PDFEditor.tsx` - The main container component for the PDF editor
- `DocumentCanvas.tsx` - Renders the PDF document and handles field placement
- `DocumentPage.tsx` - Renders an individual page of the PDF
- `FieldsPalette.tsx` - Lists available fields that can be added to the document
- `EditorToolbar.tsx` - Contains editing tools and actions
- `EditorHeader.tsx` - Contains document title and save/export options

### Field Components

- `field/FieldBlock.tsx` - Draggable field component used in the FieldsPalette
- `field/BaseField.tsx` - Base component for all field types in the document
- `field/FieldEditorWrapper.tsx` - Wrapper for field editors
- `field/TextFieldEditor.tsx` - Editor for text fields
- `field/DateFieldEditor.tsx` - Editor for date fields
- `field/SignatureFieldEditor.tsx` - Editor for signature fields

## Usage

### FieldBlock Component

The `FieldBlock` component is used within the `FieldsPalette` for dragging and creating fields:

```tsx
import { FieldBlock } from "./field/FieldBlock";

// In the FieldsPalette component:
<FieldBlock field={fieldTemplate} currentSigner={currentSignerId} />;
```

Properties:

- `field`: A field template object containing type, icon, label, and default size
- `currentSigner`: The ID of the currently selected signer (or null if none selected)

The component handles:

- Creating custom drag images
- Setting the correct data transfer properties
- Implementing drag-and-drop functionality
- Visual feedback about field availability based on signer selection
