# Document Creation

This doc will cover the implementation from beginning to end.

## Document Store

The flow contains a lot of information that is used across each step from the upload to review. To accomplish this, Zustand is used for a memory store.

For more information refer to the documentation at `docs/document-store.md`

## Step 1: Upload Document

The upload step is the first step in the document creation flow. It handles the initial document upload and setup.

### Features

- PDF file upload with validation
- Document naming
- File size and type restrictions

### Technical Details

- **File Validation**:

  - Maximum file size: Defined in `MAX_FILE_SIZE` constant
  - Accepted file types: PDF only
  - File type validation using MIME type checking

- **Document Processing**:

  - File is converted to data URL for preview and to store in the document store for persistence
  - Prior to uploading, the hash of the raw document buffer is generated using `PDFHash.getFileHash`
  - `uploadInitialDocument` in `src/app/(main)/docs/new/utils.tsx` is used to process the upload
    - Manually atomic by tracking the two changes and undoing the first if the second fails
    - `version` is static `0` for all new creations
    - File is uploaded via the `StorageService` class to S3
      - `documentUploaded` is used within the catch block to know if we failed on the document upload in S3 or the database. If it had succeeded and failed on the database, we want to undo the change and remove the file
    - `create_document_with_version` postgres function is used to add the document to the database
      - More information on this can be found in the `docs/database/docs.md` documentation
  - Document store is updated
  - Step is completed

  TODO: implement a cron job or something to cleanup S3 files of documents that were uploaded but never completed

- **State Management**:

  - Uses `useDocumentStore` for document metadata
  - Local state debounced for document name to prevent UI lag
  - Handles upload progress and error states

- **Storage**:
  - Document is uploaded to Supabase storage
  - Document metadata is stored in Supabase database
  - Document hash is prepared for blockchain storage

### Error Handling

- File size exceeded
- Invalid file type
- Duplicate document names
- Upload failures
- Network errors

### UI Components

- File upload component with drag-and-drop support
- Document name input with validation
- Upload progress indicator
- Error message display
- Animated transitions using Framer Motion

### Summary

- File type validation
- Size restrictions
- Secure file storage in Supabase
- Hash generation for blockchain verification

## Step 2: Assign Signers

The assign signers step allows users to add and manage signers for the document. This step is crucial for determining who will be involved in the signing process.

### Features

- Add signers by email address
- Add yourself as a signer
- Edit signer information
- Remove signers
- Validate email addresses
- Prevent duplicate signers

### Technical Details

- **Signer Management**:

  - Email validation using `isValidEmail` utility
  - Duplicate email checking with `checkDuplicateEmail` function
  - Signer state management through `useDocumentStore`
  - Automatic addition of document owner as a signer
  - Signer role assignment (owner/participant)
  - Signer mode configuration (transparent)

- **State Management**:

  - Uses `useDocumentStore` for signer list management
  - Local state for input validation and error handling
  - Error state management for various scenarios

- **Storage**:
  - Signer information stored in document store
  - Signer metadata includes:
    - Unique ID
    - Name
    - Email
    - Role
    - Mode
    - Owner status

### Error Handling

- Invalid email format
- Duplicate email addresses
- Empty email input
- Failed signer addition/removal
- Failed self-addition
- Failed signer updates
- Network errors during operations

### UI Components

- Email input field with validation
- Add/Remove signer buttons
- Signer list display
- Edit signer dialog
- Error message display
- Empty state handling
- Animated transitions using Framer Motion
- Responsive layout for different screen sizes

### Summary

- Email-based signer management
- Role-based access control
- Real-time validation
- User-friendly interface
- Error handling and feedback
- State persistence through document store
