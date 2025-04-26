# Document Creation

This doc will cover the implementation from beginning to end.

## Document Store

The flow contains a lot of information that is used across each step from the upload to review. To accomplish this, Zustand is used for a memory store.

For more information refer to the documentation at `docs/document-store.md`

## Step 1: Upload Document

The upload step (`src/app/(main)/docs/new/upload-step.tsx`) is the first step in the document creation flow. It handles the initial document upload and setup.

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

The assign signers step (`src/app/(main)/docs/new/signers-step.tsx`) allows users to add and manage signers for the document.

### Features

- Add signers with a name and email address.
- Add yourself as a signer (fetches user details from Supabase auth).
- Edit signer name/email via a dialog.
- Remove signers.
- Validate email addresses and names (using utility functions).
- Prevent duplicate signers (by email).

### Technical Details

- **Signer Management**:

  - Uses validation functions from `./utils.tsx`: `validateName`, `validateEmail`, `checkDuplicateEmail`.
  - Uses `toTitleCase` utility from `./utils.tsx` for formatting names.
  - **Adding Signers:**
    - Uses `handleAddSigner` triggered by form submission or button click.
    - Validates name and email, checks for duplicates.
    - Calls `addSigner` from `useDocumentStore` with `role: "participant"`, `mode: "transparent"`, and `isOwner: false`.
    - Clears input fields and errors on success, focuses name input.
  - **Adding Myself:**
    - Uses `handleAddMyself` function.
    - Fetches user details (`id`, `email`, `firstName`, `lastName`) using `getUser` from `@/lib/supabase/utils`.
    - Checks for duplicates based on email before calling `addSigner` with user details, `isOwner: true`, `role: "participant"`, and `mode: "transparent"`.
    - Updates `addedMyself` state.
  - **Removing Signers:**
    - Uses `handleRemoveSigner` function.
    - Checks if the removed signer is the owner and updates `addedMyself` state if necessary.
    - Calls `removeSigner` from `useDocumentStore`.
  - **Editing Signers (Dialog):**
    - Clicking the edit icon (`Pencil`) triggers `handleEditSigner`, setting `editingSignerId`, `editName`, and `editEmail` state, opening the Edit Signer Dialog (`Dialog` component).
    - Saving triggers `handleSaveEdit`:
      - Formats name using `toTitleCase`.
      - Validates email (using `validateEmail` and `checkDuplicateEmail` excluding self) _unless_ the signer `isOwner`.
      - Calls `updateSigner` from `useDocumentStore` with partial updates (`name`, `email`).
      - Closes the dialog and resets editing state.
    - Cancelling edit via `handleCancelEdit` resets editing state and closes the dialog.
  - Signer state (`signers` array) managed primarily through `useDocumentStore`.

- **State Management**:

  - Uses `useDocumentStore` actions: `addSigner`, `updateSigner`, `removeSigner`. Reads `signers`.
  - Local state (`useState`): `error` (general errors), `addedMyself` (boolean), `inputValue` (email input), `inputError` (email validation), `nameValue` (name input), `nameError` (name validation), `editingSignerId`, `editName`, `editEmail`, `editEmailError`.
  - `useEffect` checks if an owner exists in the `signers` list on mount/update to set initial `addedMyself` state.

- **Storage**:

  - Signer information stored temporarily in Zustand (`useDocumentStore`). Final persistence occurs during the API submission (Step 6).
  - Signer metadata stored includes: `id` (generated by store), `userId` (if added via 'Add Myself'), `name`, `email`, `isOwner`, `role`, `mode`, `color` (added by store).

- **Navigation**:
  - Does not have a "Back" button in the current code.
  - "Next" button triggers `handleContinue`, which checks if at least one signer exists (`signers.length === 0`) before calling `onStepComplete` (which likely triggers the navigation to the next step externally).

### Error Handling

- Displays validation errors inline for name (`nameError`) and email (`inputError`, `editEmailError`) inputs.
- Checks for duplicate emails via `checkDuplicateEmail`.
- Displays general errors via `error` state (e.g., "Failed to add signer", "Failed to remove signer", "Failed to add yourself", "Failed to update signer", "Please add at least one signer").
- Reports errors to Sentry via `captureException` in `handleAddSigner`, `handleRemoveSigner`, `handleAddMyself`, `handleSaveEdit`.
- No direct toast notifications within this component.

### UI Components

- Main layout `div` with `motion` animations.
- Form for adding new signers (`Input` for name, `Input` for email, `Button` with `Plus` icon).
- Button to "Add Myself" (conditionally disabled based on `addedMyself` state).
- List of added signers (`Card` containing `CardContent`):
  - Displays name and email.
  - Edit button (`Pencil` icon) triggers the Edit Signer Dialog (only shown if `!signer.isOwner`).
  - Remove button (`Trash2` icon).
  - Uses `AnimatePresence` for smooth add/remove animations.
  - Shows an empty state message (`Search` icon) if no signers are added.
- Navigation button ("Next").
- `Dialog` component (`@/components/ui/dialog`) used for editing signers, containing form inputs and save/cancel buttons.

### Summary

- Email and name-based signer management with validation.
- Uses Dialogs for editing signers.
- Automatic "Add Myself" feature fetching user data.
- Role assignment (owner/participant) and mode (transparent) defaults.
- Real-time validation and duplicate checking.
- Error handling and Sentry reporting.
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
    - Renders the PDF using `react-pdf`.
    - Contains multiple `DocumentPage` components.
  - `DocumentPage` component (`@/components/pdf-editor/DocumentPage.tsx`):
    - Renders a single page of the PDF.
    - Handles dropping new fields onto the page (`handleDrop`).
    - **Crucially, it now renders the individual fields (`DocumentField`) belonging to that page.**
    - For each field in 'editor' mode, it wraps the specific field component (e.g., `TextField`) with `react-rnd` (`Rnd` component).
    - It manages the dragging (`onDragStop`), resizing (`onResizeStop`), and selection (`onClick`) logic for each field directly within the page's coordinate system, using `bounds="parent"` to constrain fields.
    - It fetches necessary state (scale, viewType, selectedFieldId, etc.) and actions (`updateField`, `setSelectedFieldId`) from `useDocumentStore`.
  - Individual field components (e.g., `SignatureField`, `TextField`):
    - Render the specific input/display for their type (text input, date picker, etc.).
    - Likely extend a simplified `BaseField.tsx`.
  - `BaseField.tsx` (`@/components/pdf-editor/field/BaseField.tsx`):
    - **Simplified:** No longer contains `react-rnd` or manages dragging/resizing/container logic.
    - Renders only the _inner content_ of a field (e.g., the input element, placeholder).
    - Relies on `DocumentPage` to provide the outer container (`Rnd` or `div`), positioning, and interaction handling.
    - Uses `useField` hook (`@/lib/pdf-editor/hooks/useField`) for field-specific data/callbacks (like `handleChange`, `handleBlur`).
  - `FieldsList` component manages viewing/editing properties of placed fields (likely remains unchanged by this refactor).
  - Overall field state management (`fields`, `addOrUpdateField`, `removeField`) through `useDocumentStore`.

- **State Management**:

  - Uses `useDocumentStore` for field state (`fields`, `addField`, `updateField`, `removeField`, `selectedFieldId`, `setSelectedFieldId`), document state (`documentDataUrl`), signer state (`signers`), and view state (`viewType`, `scale`, `isDragging`, `isResizing`, `setDragging`, `setResizing`).
  - `viewType` toggling between "editor" and "list" views (potentially dev-only).

- **Storage**:

  - Field information stored in document store (`useDocumentStore`).
  - Field metadata includes (reference `DocumentField` type in `document-types.ts`):
    - `id`
    - `type`
    - `position` (x, y, page)
    - `size` (width, height)
    - `assignedTo` (signer ID)
    - Potentially other type-specific properties (validation rules, required status, value).

- **Navigation**:

  - `handleBack` function navigates to the "signers" step (`setCurrentStep("signers")`).
  - `handleNext` function navigates to the "review" step (`setCurrentStep("review")`) and calls the `onStepComplete` callback.

### Error Handling

- Throws an error if `documentDataUrl` is missing from the store when the component mounts.
- Invalid field placement, overlap detection, required field validation, etc., are likely handled within the child components (`DocumentCanvas`, `DocumentPage`, `FieldsPalette`, `FieldsList`, individual field components) and potentially update the store or show local errors.
- Type errors in event handlers (`onDragStart`, `onDragStop`) in `DocumentPage` were addressed, potentially using `any` as a workaround due to `react-rnd` type complexities.

### UI Components

- Main layout container (`div` with flexbox).
- `DocumentCanvas`: Displays the interactive PDF document pages.
- `DocumentPage`: Renders each page and the interactive `Rnd` field components within it.
- `FieldsPalette`: (Conditionally rendered based on `viewType`) Displays available field types to drag onto the canvas.
- `FieldsList`: (Conditionally rendered based on `viewType`) Displays a list of fields already placed on the document.
- `Button` components for "Back" and "Next" navigation.
- Note: Specific field representations, error messages, empty states, and view toggling logic are handled within the child components (`DocumentCanvas`, `DocumentPage`, `FieldsPalette`, `FieldsList`).

### Summary

- Interactive field placement via drag-and-drop onto specific pages.
- `DocumentPage` now handles field rendering, positioning, dragging, and resizing using `react-rnd`.
- `BaseField` is simplified to render only inner field content.
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
  - Can edit signer name/email via a dialog (`EditSignerDialog`).
  - Can remove signers via a confirmation dialog (`DeleteSignerDialog`).
- Configure document settings using `react-hook-form`:
  - Document name review (read-only in this component).
  - Optional document encryption with password.
  - Optional document expiration date.
- Add a custom sender message for recipients.
- Reset the entire document creation process (via `ResetDocumentDialog`).
- Submit the document configuration to the store and proceed to the sending step.

### Technical Details

- **Recipient Review**:

  - Displays the list of signers from `useDocumentStore` in a table.
  - Edit button (`Edit2` icon) triggers `handleOpenEditSignerDialog`, passing the signer data and showing the `EditSignerDialog` component.
    - On save within the dialog, `handleSaveEditedSigner` calls `updateSigner` from the store and closes the dialog.
  - Remove button (`Trash2` icon) triggers `handleOpenDeleteSignerDialog`, passing the signer and showing the `DeleteSignerDialog` component.
    - On confirmation within the dialog, `handleConfirmDeleteSigner` calls `removeSigner` from the store and closes the dialog.
    - Remove button is disabled with a tooltip if only one signer remains (`isOnlySigner` state).

- **Document Settings Form**:

  - Uses `react-hook-form` (`useForm`) initialized with values from `useDocumentStore` (`documentName`, `isEncrypted`, etc.).
  - Uses `zodResolver` with `formDocumentMetadataSchema` for validation.
  - **Document Name**: Displays `documentName` from the store in a read-only `Input` field. (Editing logic/validation commented out).
  - **Encryption**: Controlled by `isEncrypted` field in the form.
    - `Switch` component updates the form field and calls `setIsEncrypted` in the store.
    - Conditionally displays password `Input`.
    - Password input updates the form field and calls `setEncryptionPassword` in the store.
    - Zod schema (`formDocumentMetadataSchema`) validates password length (min 6, max 100) if `isEncrypted` is true.
  - **Expiration**: Controlled by `isExpirationEnabled` field in the form.
    - `Switch` component updates the form field and calls `setIsExpirationEnabled` in the store.
    - Uses `Popover` + `Calendar` component for date selection.
    - `onSelect` updates the form field and calls `setExpirationDate` in the store.
    - Uses `isPastDate` helper to disable past dates.
    - Zod schema validates that `expirationDate` is set and not in the past if `isExpirationEnabled` is true.
  - **Sender Message**: Controlled by `senderMessage` field in the form.
    - `Textarea` component updates the form field and calls `setSenderMessage` in the store.
    - Zod schema validates character limit (max 1000).
    - UI notes that the message is not stored permanently or encrypted.

- **Form Handling & Submission**:

  - Form state managed by `react-hook-form`.
  - Component updates both the Zustand store and `react-hook-form` state on input changes.
  - `onSubmit` function triggered by the "Submit" button:
    - `react-hook-form` automatically validates against the Zod schema.
    - If valid, it calls `setFormDocumentMetadata` in the Zustand store with the validated form data (`FormDocumentMetadata` type).
    - Calls the `onStepComplete` callback (passed as a prop), which likely handles navigating to the next step (Sending Step).
    - Scrolls the window to the top.

- **Document Reset**:

  - "Reset" button (`RefreshCcw` icon) triggers showing `ResetDocumentDialog` by setting `isResetDialogOpen` state.
  - On confirmation within the dialog, `handleReset` function is called:
    - Calls `useResetDocument` hook (from `./utils.tsx`).
      - Hook handles deleting the document from the database (`documents` table via `supabase.from('documents').delete()`) and the corresponding file from Storage (`StorageService.deleteFile`) with retries (`withRetry`).
    - Clears the Zustand store via `resetDocumentState()` (this is the defined action in the store).
    - Navigates back to the "upload" step via `setCurrentStep("upload")`.
    - Scrolls window to top.
    - Shows success/error toast notification via `sonner`.

- **State Management**:

  - Reads/writes configuration values (`documentName`, `signers`, security settings, message) from/to `useDocumentStore`.
  - `react-hook-form` manages form state, validation, and submission state.
  - Local state (`useState`): `isResetDialogOpen`, `isResetting`, `isEditSignerDialogOpen`, `currentSignerToEdit`, `isDeleteSignerDialogOpen`, `currentSignerToDelete`.
  - Derived state: `isOnlySigner` (from `signers.length`).

- **Navigation**:
  - "Back" button (`handleBack`) navigates to the "fields" step via `setCurrentStep("fields")`.
  - "Submit" button triggers the `onSubmit` handler, which calls `onStepComplete` to proceed.

### Error Handling

- Form validation errors displayed inline via `react-hook-form`'s `FormMessage` component.
- Handles potential errors during document reset (`handleReset` try/catch), signer updates (`handleSaveEditedSigner` try/catch), and signer deletion (`handleConfirmDeleteSigner` try/catch).
- The `onSubmit` function implicitly relies on `react-hook-form`'s error handling; explicit try/catch isn't present there as validation happens before the handler runs.
- Reports errors to Sentry using `captureException` in relevant `catch` blocks.
- Displays toast notifications (`toast.success`, `toast.error`) for success/error states of reset, signer edit, and signer delete actions using `sonner`.

### UI Components

- Main layout `div` with `motion` animations.
- `Card` components for sectioning (Recipients, Settings, Message).
- `Table` for displaying recipients (`Badge` for role).
- Action buttons within table rows: `Button` with `Edit2` icon (triggers edit dialog), `Button` with `Trash2` icon (triggers delete dialog).
- `TooltipProvider`, `Tooltip`, `TooltipContent` for disabled remove button hint.
- `Form` component (`@/components/ui/form`) wrapping settings and message sections.
- `react-hook-form` field components (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`).
- Input components: `Input`, `Switch`, `Popover` + `Calendar` (`CalendarIcon`), `Textarea`.
- `Info` icon with `Tooltip` for encryption password details.
- Action buttons: "Back", "Reset" (`RefreshCcw` icon), "Submit".
- `Dialog` components: `ResetDocumentDialog`, `EditSignerDialog`, `DeleteSignerDialog`.

### Summary

- Final review step combining recipient management and document settings.
- Uses Dialogs for editing and confirming deletion of recipients.
- Implements robust form validation for settings using `react-hook-form` and `zod`.
- Updates Zustand store with validated form metadata upon submission (`setFormDocumentMetadata`).
- Provides a comprehensive document reset feature with database/storage cleanup.
- Uses Sentry for error reporting and `sonner` for user feedback toasts.
- Prepares the application state for the final sending/API submission step.

## Step 5: Sending (Frontend Trigger)

After the Review step is successfully submitted (via `onStepComplete` being called), the application navigates to the Sending step (`src/app/(main)/docs/new/sending-step.tsx`). This component automatically triggers the final submission process to the backend API.

### Features

- Automatically initiates the document submission process on mount.
- Performs final client-side validation checks before sending.
- Calls the backend API endpoint (`/api/docs/upload`) via a helper function (`sendDraftDocument`).
- Displays submission status (submitting, success, error) with relevant UI feedback.
- Provides options for navigation (Dashboard, New Document) or retrying on success/failure.
- Includes a development-only "Back" button.

### Technical Details

- **Automatic Submission**: Uses `useEffect` hooks. The first sets `isMounted` to true. The second runs when `isMounted` becomes true or `submissionStatus` changes back to `idle`. It calls the async `submitDocument` function if `submissionStatus` is `idle`.
- **Final Validation**: Before calling the API helper, `submitDocument` performs several checks using the data exported via `exportDocumentState()`:
  - Ensures `documentContentHash` exists.
  - Ensures at least one signer exists (`signers.length > 0`).
  - If fields exist (`fields.length > 0`), ensures every signer is assigned at least one field (`allSignersHaveFields` check using `Set`).
  - Throws an error if any check fails, preventing the API call.
- **API Call**:
  - Calls the async `sendDraftDocument` helper function (from `./utils.tsx`).
  - Passes the exported `documentState` and potential `DRY_RUN` options (defined as a constant in the component, currently `{ memo: true, email: true, database: true }` if `TESTING` is true).
  - `sendDraftDocument` is responsible for making the `POST` request to `/api/docs/upload`.
- **State Management**:
  - Reads state via `exportDocumentState()` from `useDocumentStore`.
  - Calls `resetDocumentState(true)` on successful submission (unless it's a dry run) to clear the store but keep the step as "sending".
  - Calls `setCurrentStep('review')` if the dev "Back" button is used.
  - Uses local state (`useState`) for: `error` (string message), `isMounted` (boolean), `submissionStatus` (`"idle" | "submitting" | "success" | "error"`).
- **Navigation**:
  - Uses `useRouter` from `next-nprogress-bar` for navigation.
  - `handleGoToDashboard`: Navigates to `/docs/list`.
  - `handleStartNewDocument`: Calls `resetDocumentState()` (full reset) and navigates to `/docs/new`.
  - `handleRetry`: Resets `submissionStatus` to `idle`, triggering the `useEffect` to try submission again.
  - `handleBack` (Dev only): Calls `setCurrentStep('review')`.

### Error Handling

- Catches errors within the `submitDocument` function (including validation errors and errors from `sendDraftDocument`).
- Sets the `error` state with the error message.
- Sets `submissionStatus` to `error`.
- Reports caught exceptions to Sentry via `captureException`.
- Displays the `error` message within a destructive `Alert` component in the UI when `submissionStatus` is `error`.

### UI Components

- Main layout `motion.div`.
- `Card` containing the status display.
- Conditional rendering based on `submissionStatus`:
  - **"submitting"**: Shows `Loader2` icon (spinning) and descriptive text.
  - **"success"**: Shows `CheckCircle` icon (green), success message, and buttons for "Go to My Documents" and "Start a New Document".
  - **"error"**: Shows `XCircle` icon (destructive), failure message, `Alert` with the specific error, and buttons for "Retry Submission" and "Go to Dashboard".
- Development-only "Back" button (`ChevronLeft` icon) in the `CardHeader` (conditionally rendered based on `IS_PROD`).

### Summary

- Acts as the trigger and status display for the final API submission.
- Performs essential client-side checks before initiating the API call.
- Provides clear visual feedback to the user about the submission progress (loading, success, failure).
- Handles errors gracefully, allowing the user to retry or navigate away.
- Resets the document store state appropriately after a successful submission.

## Step 6: Finalization and Submission (API)

Once the user completes the review step and clicks "Submit" in the UI, the frontend gathers the finalized document state (using `useDocumentStore.getState().exportDocumentState()`) and sends it to the backend API endpoint for processing via the Sending Step (Step 5).

- **Route:** `POST /api/docs/upload` (`src/app/api/docs/upload/route.ts`)
- **Purpose:** This API route handles the final stage of document creation. It takes the state exported from the frontend store, creates the initial `DocumentStamp`, stores it on the Solana blockchain via a memo transaction, saves the document details (participants, fields, versions) to the Supabase database using an RPC function, generates unique signing links, and sends invitation emails to participants.
- **Authentication:** Requires an authenticated user session (verified via `getUser` from `@/lib/supabase/utils`).

### Request Body

The endpoint expects a JSON body conforming to the `uploadRequestSchema`. This schema extends the `documentStateExportSchema` (defined in `@/lib/pdf-editor/document-types`) with an additional optional `dryRun` object for testing purposes:

```typescript
// Zod Schema Definition
const uploadRequestSchema = documentStateExportSchema.extend({
  dryRun: z.object({
    memo: z.boolean().optional().default(false), // If true, skips Solana transaction
    email: z.boolean().optional().default(false), // If true, skips sending emails
    database: z.boolean().optional().default(false), // If true, calls dry_run RPC instead of finalization RPC
  }),
});

// Expected Payload Structure
interface UploadRequestBody extends DocumentStateExport {
  dryRun?: {
    memo?: boolean;
    email?: boolean;
    database?: boolean;
  };
}
```

- **Payload Properties:** Includes `documentId`, `documentName`, `documentContentHash`, `signers` (participants array), `fields` array, `encryptionPassword`, `expirationDate`, and the `dryRun` object.

### Process Flow

1.  **Authentication & Validation:** Verifies the user session and validates the incoming request body against `uploadRequestSchema` using Zod.
2.  **Stamp Creation:** Constructs the initial `DocumentStamp` object (version `STAMP_VERSION`) based on the validated request data. Sets the initial state to `SignatureState.AWAITING_SIGNATURES` and populates fields like `contentHash`, `hashHistory`, `signers`, `rules`, and `metadata` (including `creator`, `documentId`, initial version 1, `createdAt`, and `password`).
3.  **Serialization:** Serializes and obfuscates the constructed `DocumentStamp` using `ObfuscatedStampSerializer` (`@/lib/utils/serializer`).
4.  **Solana Memo:** (Skipped if `dryRun.memo` is true)
    - Formats the obfuscated stamp string with a version prefix (e.g., `v0:...`).
    - Sends a transaction to the Solana blockchain containing this formatted string in the memo field using `sendMemoTransaction` (`@/lib/utils/solana`).
    - Stores the resulting Solana transaction signature.
5.  **Database Finalization:** (Uses `dry_run_finalize_document_upload` RPC if `dryRun.database` is true, otherwise `finalize_document_upload` RPC)
    - Calls the appropriate Supabase RPC function (`finalize_document_upload` or `dry_run_finalize_document_upload`).
    - Passes necessary parameters: `p_document_id`, `p_user_id`, hash components (`p_content_hash`, `p_file_hash`, `p_metadata_hash`), `p_transaction_signature`, `p_fields` (as JSONB), `p_participants` (as JSONB), `p_password`, `p_expires_at`.
    - **RPC Logic (`finalize_document_upload`):** See `docs/database/docs.md` or the migration file (`supabase/migrations/20250217003255_docs.sql`) for details. In summary:
      - Adds a new version record (`document_versions`) via `add_document_version` (version >= 1).
      - Inserts participant records (`document_participants`).
      - Inserts field records (`document_fields`), linking to participants.
      - Updates the main `documents` record status to `awaiting_signatures`, sets `password` and `expires_at`.
    - **RPC Logic (`dry_run_finalize_document_upload`):** Executes the finalization logic within a transaction but forces a rollback, checking for potential errors without committing changes.
6.  **Link Generation:** Generates unique, token-based signing links for each participant using `generateSigningLinkForParticipants` (`./utils.ts`).
7.  **Email Notifications:** (Skipped if `dryRun.email` is true)
    - Constructs email payloads containing participant details and their unique signing link.
    - Uses `sendEmails` (`@/lib/utils/email`) to dispatch invitation emails.

### Success Response

On successful completion (including successful dry runs), returns a 200 OK JSON response:

```json
{
  "success": true,
  "dryRun": {
    /* object mirroring the input dryRun flags */
  },
  "transactionSignature": "{solana_tx_signature_or_placeholder_if_dry_run}"
}
```

### Error Handling

- Uses a helper `createErrorResponse` function for consistent JSON error responses.
- Returns 400 Bad Request for Zod validation errors, detailing the specific issues.
- Catches errors during Solana transaction submission, database RPC execution, link generation, and email sending.
- Returns 500 Internal Server Error for unexpected server-side issues.
- Specifically handles dry run failures reported by the database RPC, providing a clearer 400 error message.
- Reports all caught exceptions to Sentry via `captureException`.
