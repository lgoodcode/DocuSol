# Document Creation

This doc will cover the implementation from beginning to end.

## Document Store

The flow contains a lot of information that is used across each step from the upload to review. To accomplish this, Zustand is used for a memory store.

For more information refer to the documentation at `docs/document-store.md`

## Step 1: Upload Document

The upload step (`src/app/(main)/docs/new/upload-file-step.tsx`) is the first step in the document creation flow. It handles the initial document upload and setup.

### Features

- PDF file upload with validation
- Document naming
- File size and type restrictions

### Technical Details

- **File Validation**:

  - Maximum file size: Defined in `MAX_FILE_SIZE` constant (`@/constants`)
  - Accepted file types: PDF only (`file.type === "application/pdf"`)
  - Uses `formatFileSize` from `@/lib/utils/format-file-size` for error messages.

- **Document Processing**:

  - File is converted to data URL using `fileToDataUrl` utility (`@/lib/utils`) for preview and stored in the document store (`setDocumentDataUrl`).
  - Document name is handled via `localDocumentName` state, debounced to update the store (`setDocumentName`).
  - Prior to uploading, the hash of the raw document buffer is generated using `PDFHash.getFileHash(Buffer.from(await file.arrayBuffer()))`.
  - `uploadInitialDocument` in `src/app/(main)/docs/new/utils.tsx` is used to process the upload:
    - Manually atomic by tracking the two changes (storage upload, DB insert) and undoing the first if the second fails.
    - `version` is static `0` for all new creations.
    - File is uploaded via the `StorageService` class (`@/lib/supabase/storage`) to Supabase Storage.
      - `documentUploaded` flag within the function tracks success/failure points for potential rollback.
    - `create_document_with_version` postgres function is used to add the document metadata to the database.
      - More information on this can be found in the `docs/database/docs.md` documentation.
  - The returned `documentId` from `uploadInitialDocument` is saved to the store (`setDocumentId`).
  - On successful upload, navigates to the next step (`setCurrentStep("signers")`) and calls `onStepComplete`.

  TODO: implement a cron job or something to cleanup S3 files of documents that were uploaded but never completed

- **State Management**:

  - Uses `useDocumentStore` (`@/lib/pdf-editor/stores/useDocumentStore`) for document metadata (`storeDocumentName`, `setDocumentName`, `setDocumentDataUrl`, `setCurrentStep`, `setDocumentId`).
  - Local state managed by `useState`: `file`, `error`, `isUploading`, `localDocumentName`.
  - `useEffect` synchronizes `localDocumentName` from `storeDocumentName` on mount.

- **Storage**:

  - Document file is uploaded to Supabase Storage.
  - Document metadata (name, ID, hash, etc.) is stored in Supabase database (`documents` table).
  - Document hash is prepared for potential future blockchain storage/verification.

- **Navigation**:
  - "Upload" button triggers `handleUpload`.
  - On success, `handleUpload` calls `setCurrentStep("signers")`.

### Error Handling

- File size exceeded (`file.size > MAX_FILE_SIZE`).
- Invalid file type (`file.type !== "application/pdf"`).
- Upload failures caught in `handleUpload`:
  - Checks for specific error message "The resource already exists" for duplicate document names.
  - Other errors are logged and reported to Sentry via `captureException`.
  - Sets `error` state for display in the UI.
- Uses `sonner` implicitly via `captureException` potentially, but no direct `toast` calls in this component.

### UI Components

- Main layout `div` with `motion` animations from `framer-motion`.
- `Card` component containing the main content.
- Error message display block (conditionally rendered based on `error` state) using `XCircle` icon from `lucide-react`.
- Conditional rendering based on `isUploading`:
  - Shows loading indicator (`Loader2` icon from `lucide-react`).
  - Shows form fields when not uploading.
- Form fields:
  - `Label` and `Input` for "Document Name".
  - `FileUpload` component (`@/components/ui/file-upload`) for drag-and-drop/file selection.
- `Button` for triggering the upload.

### Summary

- Validates PDF file type and size.
- Debounced input for document name.
- Calculates file hash.
- Uses atomic utility function (`uploadInitialDocument`) for storage and database operations.
- Secure file storage in Supabase.
- Hash generation for future verification.
- Error handling and reporting.
- Clear UI feedback for loading and error states.

## Step 2: Assign Signers

The assign signers step (`src/app/(main)/docs/new/assign-signers-step.tsx`) allows users to add and manage signers for the document.

### Features

- Add signers with a name and email address.
- Add yourself as a signer (fetches user details).
- Edit signer name/email inline.
- Remove signers.
- Validate email addresses and names.
- Prevent duplicate signers (by email).

### Technical Details

- **Signer Management**:

  - Uses validation functions from `./utils.tsx`: `validateName`, `validateEmail`, `checkDuplicateEmail`.
  - Uses `toTitleCase` utility from `./utils.tsx` for names.
  - **Adding Signers:**
    - Uses `handleAddSigner` function triggered by form submission or button click.
    - Validates name and email, checks for duplicates.
    - Calls `addSigner` from `useDocumentStore` with role "participant" and owner status false.
  - **Adding Myself:**
    - Uses `handleAddMyself` function.
    - Fetches user details using `getUser` from `@/lib/supabase/utils`.
    - Checks for duplicates before calling `addSigner` with role "owner" and owner status true.
  - **Removing Signers:**
    - Uses `handleRemoveSigner` function.
    - Calls `removeSigner` from `useDocumentStore`.
    - Updates `addedMyself` state if the owner is removed.
  - **Editing Signers (Inline):**
    - Clicking the edit icon triggers `handleEditSigner`, setting `editingSignerId`, `editName`, and `editEmail` state.
    - Saving triggers `handleSaveEdit`:
      - Validates email (if not owner) using `validateEmail` and `checkDuplicateEmail` (excluding self).
      - Calls `updateSigner` from `useDocumentStore` with partial updates (name, email).
      - Cancelling edit via `handleCancelEdit` resets editing state.
  - Signer state management primarily through `useDocumentStore`.

- **State Management**:

  - Uses `useDocumentStore` actions: `addSigner`, `updateSigner`, `removeSigner`, `setCurrentStep`. Reads `signers`.
  - Local state managed by `useState`: `error` (general errors), `addedMyself` (boolean), `inputValue` (email input), `inputError` (email validation), `nameValue` (name input), `nameError` (name validation), `editingSignerId`, `editName`, `editEmail`, `editEmailError`.
  - `useEffect` checks if owner exists in `signers` list to set initial `addedMyself` state.

- **Storage**:

  - Signer information stored temporarily in Zustand (`useDocumentStore`). Persisted later in the process.
  - Signer metadata includes: `id` (generated by store), `name`, `email`, `isOwner`, `role`, `mode`.

- **Navigation**:
  - "Back" button calls `setCurrentStep("upload")`.
  - "Continue" button triggers `handleContinue`, which checks if at least one signer exists before calling `setCurrentStep("fields")` and `onStepComplete`.

### Error Handling

- Displays validation errors for name (`nameError`) and email (`inputError`, `editEmailError`) inputs.
- Checks for duplicate emails via `checkDuplicateEmail`.
- Displays general errors via `error` state (e.g., "Failed to add signer", "Failed to remove signer", "Failed to add yourself", "Failed to update signer", "Please add at least one signer").
- Reports errors to Sentry via `captureException` in `handleAddSigner`, `handleRemoveSigner`, `handleAddMyself`, `handleSaveEdit`.
- Uses `sonner` implicitly via `captureException` potentially, but no direct `toast` calls in this component.

### UI Components

- Main layout `div` with `motion` animations.
- `Card` containing the main content.
- Error message display block (`XCircle` icon).
- Form for adding new signers (`Input` for name, `Input` for email, `Button` with `Plus` icon).
- Button to "Add Myself" (conditionally enabled based on `addedMyself` state).
- List of added signers:
  - Displays name and email.
  - Edit functionality (conditionally shows input fields or text, `Pencil` icon triggers edit mode).
  - Remove button (`Trash2` icon).
- Navigation buttons ("Back", "Continue").
- Note: `Dialog` components are imported but not directly used for editing within this step's current implementation.

### Summary

- Email and name-based signer management with validation.
- Inline editing capabilities for signers.
- Automatic "Add Myself" feature.
- Role assignment (owner/participant).
- Real-time validation and duplicate checking.
- Error handling and reporting.
- State persistence through document store.

## Step 3: Editing

The editing step (`src/app/(main)/docs/new/editing-step.tsx`) allows users to add and manage form fields on the document. This step is crucial for preparing the document for the signing process.

### Features

- Interactive PDF canvas for field placement.
- Field type selection and customization.
- Real-time field preview.
- Field list management.

### Technical Details

- **Field Management**:

  - Primarily handled by child components: `DocumentCanvas`, `FieldsPalette`, `FieldsList`.
  - `FieldsPalette` component:
    - Displays available field blocks based on `fields.ts` (`FieldTemplate` type).
    - Allows dragging fields (`FieldBlock` component, uses `handleDragStart`).
    - Manages the currently selected recipient for field assignment.
  - `DocumentCanvas` component:
    - Renders the PDF using potentially `react-pdf` or similar.
    - Handles dropping fields onto pages (`DocumentPage` component, `handleDrop` function).
    - Displays placed fields.
  - Field components (e.g., `SignatureField`, `TextField`) likely extend a `BaseField.tsx`:
    - Renders placeholder and different views (editor vs. signer).
    - Uses `useField` hook (`@/lib/pdf-editor/hooks/useField`) for field-specific data/logic.
  - `FieldsList` component manages viewing/editing properties of placed fields.
  - Overall state management through `useDocumentStore`.

- **State Management**:

  - Uses `useDocumentStore` for field state (`fields`, `addOrUpdateField`, `removeField`), document state (`documentDataUrl`), and view state (`viewType`).
  - `viewType` toggling between "editor" and "list" views (potentially dev-only).

- **Storage**:

  - Field information stored in document store (`useDocumentStore`).
  - Field metadata includes (reference `DocumentField` type in `document-types.ts`):
    - `id`
    - `type`
    - `pageIndex`
    - `rect` (position and dimensions)
    - `signerId` (associated signer)
    - Potentially other type-specific properties (validation rules, required status).

- **Navigation**:

  - `handleBack` function navigates to the "signers" step (`setCurrentStep("signers")`).
  - `handleNext` function navigates to the "review" step (`setCurrentStep("review")`) and calls the `onStepComplete` callback.

### Error Handling

- Throws an error if `documentDataUrl` is missing from the store when the component mounts.
- Invalid field placement, overlap detection, required field validation, etc., are likely handled within the child components (`DocumentCanvas`, `FieldsPalette`, `FieldsList`, individual field components) and potentially update the store or show local errors.

### UI Components

- Main layout container (`div` with flexbox).
- `DocumentCanvas`: Displays the interactive PDF document.
- `FieldsPalette`: (Conditionally rendered based on `viewType`) Displays available field types to drag onto the canvas.
- `FieldsList`: (Conditionally rendered based on `viewType`) Displays a list of fields already placed on the document.
- `Button` components for "Back" and "Next" navigation.
- Note: Specific field representations, error messages, empty states, and view toggling logic are handled within the child components (`DocumentCanvas`, `FieldsPalette`, `FieldsList`).

### Summary

- Interactive field placement via drag-and-drop.
- Multiple field type support.
- Real-time field management and state updates via Zustand.
- Relies heavily on specialized child components for core functionality.
- User-friendly interface for document preparation.
- Error handling and validation within child components.
- State persistence through document store.

## Step 4: Review

The review step (`src/app/(main)/docs/new/review-step.tsx`) is the final stage before submitting the document for signing. It allows the user to review all previously entered information and configure final settings.

### Features

- Review document recipients (signers).
  - Can edit and update signer name/email via a dialog.
  - Can remove signers via a confirmation dialog.
- Configure document settings:
  - Document name review (read-only currently).
  - Optional document encryption with password.
  - Optional document expiration date.
- Add a custom sender message for recipients.
- Reset the entire document creation process (with confirmation).
- Submit the document for processing (currently simulated).

### Technical Details

- **Recipient Review**:

  - Displays the list of signers from `useDocumentStore`.
  - Edit button triggers `handleOpenEditSignerDialog`, showing `EditSignerDialog`.
    - On save, `handleSaveEditedSigner` calls `updateSigner` from the store.
  - Remove button triggers `handleOpenDeleteSignerDialog`, showing `DeleteSignerDialog`.
    - On confirm, `handleConfirmDeleteSigner` calls `removeSigner` from the store.
    - Remove button is disabled if only one signer remains (`isOnlySigner` state).

- **Document Settings**:

  - Uses `react-hook-form` with `zod` schema (`documentMetadataSchemaWithValidation`) for validation.
  - **Document Name**: Displays `documentName` from the store (read-only `Input`).
  - **Encryption**:
    - Controlled by `isEncrypted` state/store value and `Switch` component.
    - Updates store via `setIsEncrypted`.
    - Conditionally displays password `Input`.
    - Password stored via `encryptionPassword` state/store value (`setEncryptionPassword`).
    - Zod schema validates password length (min 6 chars) if enabled.
  - **Expiration**:
    - Controlled by `isExpirationEnabled` state/store value and `Switch` component.
    - Updates store via `setIsExpirationEnabled`.
    - Uses `Popover` + `Calendar` component for date selection.
    - Date stored via `expirationDate` state/store value (`setExpirationDate`).
    - Uses `isPastDate` helper function to disable past dates in `Calendar`.
    - Zod schema validates that a date is selected if enabled.
  - **Sender Message**:
    - Uses `Textarea` component.
    - Stored via `senderMessage` state/store value (`setSenderMessage`).
    - Zod schema validates character limit (1000 chars).
    - Message is noted as not stored permanently or encrypted.

- **Form Handling**:

  - Form state managed by `react-hook-form` (`documentMetadataForm`).
  - Input changes (`onChange`, `onCheckedChange`, `onSelect`) update the Zustand store directly _and_ the `react-hook-form` state.
  - `onSubmit` function:
    - Validates form data against the Zod schema.
    - Currently simulates submission success/failure with `setTimeout`. (TODO: Implement actual submission logic).

- **Document Reset**:

  - "Reset" button triggers showing `ResetDocumentDialog` by setting `isResetDialogOpen` state.
  - On confirmation, `handleReset` function is called:
    - Calls `useResetDocument` hook (from `./utils.tsx`).
      - This hook handles deleting the document from DB (`documents` table) and Storage (`StorageService.deleteFile`) with retries (`withRetry`).
    - Clears the Zustand store via `reset()`.
    - Navigates back to the "upload" step (`setCurrentStep("upload")`).
    - Shows success/error toast notification via `sonner`.

- **State Management**:

  - Reads/writes configuration values to `useDocumentStore`.
  - `react-hook-form` manages form state and validation.
  - Local state (`useState`): `isSubmitting`, `isResetDialogOpen`, `isResetting`, `isEditSignerDialogOpen`, `currentSignerToEdit`, `isDeleteSignerDialogOpen`, `currentSignerToDelete`.
  - Derived state: `isOnlySigner` (from `signers.length`).

- **Navigation**:
  - "Back" button (`handleBack`) navigates to the "fields" step (`setCurrentStep("fields")`).
  - "Submit" button triggers the `onSubmit` handler.

### Error Handling

- Form validation errors displayed via `react-hook-form` (`FormMessage`).
- Handles potential errors during document reset (`handleReset` try/catch), submission (`onSubmit` try/catch), signer updates (`handleSaveEditedSigner` try/catch), and signer deletion (`handleConfirmDeleteSigner` try/catch).
- Reports errors to Sentry using `captureException` in all `catch` blocks.
- Displays toast notifications for success/error states using `sonner` (`toast.success`, `toast.error`).

### UI Components

- Main layout `div` with `motion` animations.
- `Card` components for sectioning (Recipients, Settings, Message).
- `Table` for displaying recipients (`Badge` for role).
- Action buttons within the table row (`Button` with `Edit2` icon, `Button` with `Trash2` icon).
  - Tooltip (`TooltipProvider`, `Tooltip`, `TooltipContent`) for disabled remove button.
- `Form` component (`@/components/ui/form`) encapsulating settings and message.
- Form field components (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`).
- Input components: `Input`, `Switch`, `Popover` + `Calendar` (`CalendarIcon`), `Textarea`.
- `Info` icon with `Tooltip` for encryption details.
- Action buttons: "Back", "Reset" (`RefreshCcw` icon), "Submit".
- `Dialog` components: `ResetDocumentDialog`, `EditSignerDialog`, `DeleteSignerDialog`.

### Summary

- Final review of recipients and document settings.
- Configuration of optional encryption and expiration.
- Optional non-persistent sender message.
- Robust form validation using `react-hook-form` and `zod`.
- Comprehensive error handling with Sentry reporting and user feedback via toasts.
- Document reset functionality with confirmation and cleanup.
- Prepares document metadata for final submission (simulation currently).
