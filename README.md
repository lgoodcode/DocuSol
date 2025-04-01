# DocuSol

This document is used to help keep track of the overall project as rapid changes are being made. It will also help any other person understand the structure and technical ins and outs of how this project works and is meant to be used.

# Setup

_Note: You will want to start by getting node v22.0.0 or greater to ensure all tooling works_

### PNPM

- run `npm install -g pnpm`
- confirm installation with `pnpm -v`
- run `pnpm install`

### OpenSSL

- [Download](https://slproweb.com/products/Win32OpenSSL.html) latest light version
- find the download and run the installer with default settings
- run `pnpm dev` and allow it to create certs when prompted
- should see a new certificates folder with 2 .pem files (intentionally ignored by github)

### Supabase

- run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex`
- run `scoop install supabase`
- run `supabase start`

_Note: if you follow these steps and encounter and error, it is possible the steps have grown out of date, please make updates accordingly_

# Project

## Introduction

DocuSol is a project that will take the concept of document signing, make it simple,
and easy to use and then decentralize the attestation authority by utilizing blockchain technology.

By including a copy of the audit stored as a hash on the blockchain, we create an immutable audit trail that can be securely and reliably used to identify whether a document was signed correctly without depending on a centralized authority such as DocuSign.

> Disclaimer:
> This is a beta product and isn't refined or have a concrete implementation or process as of yet.`

## Outline

Web based application that users can login into via email and password. This is important for the
current beta flow to allow signers to be identified and determine which fields within a document
are assigned to and only allow them to fill those fields respectively.

Will include two features:

1. Create a document
   1. Upload a PDF file and give the document a name
   2. Assign recipients to sign and fill fields for the document
   3. Edit the document by dragging in field blocks on pages of a document
   4. Review the document details
      1. Can specify an expiration date when the document becomes invalid
      2. Can specify a password to secure the document
   5. Send the document
      1. Will email the link to the recipients, which they can use to sign the document
         1. If a password is specified, they will be required to specify it to view the document (this is provided in the email)
2. Self-verify a document
   1. Any user can upload a completed document that was created through DocuSol and will determine whether the document is valid (successfully created and completed all signers)

## Architecture

### Frontend

NextJS, React, TypeScript, TailwindCSS, ShadcnUI, Zustand, @solana/web3.js (blockchain interaction)

Utilizing the ShadcnUI components to provide a consistent, sleek, and simple UI design. Some of the components are modified to work with the design or theme implementation.

It is a dark focused theme app with the ability to toggle between light and dark. Because of this, with the document canvas/pages having a white background and the components being dark themed

### Backend

Supabase and NextJS

Currently just utilizing the NextJS API to provide a secure way to interact with the frontend
and database

Supabase provides the auth and database. The middleware handles authentication and rate limiting.

Utilizing the Supabase CLI to host a local instance for developing.

### Blockchain

This is technically a part of the backend but creating a separate section to clearly define
how it is currently utilized.

Utilizing Solana as the blockchain to store the audit trail.

### Database

PostgreSQL via Supabase

The schema files are located in the Supabase folder at `/src/supabase/migrations`.

Refer to those files for understanding and identifying the database structure.

# Technical Flow

This section will provide details on the flow of the overall application

## Supabase S3 Storage

Currently utilizing the Supabase S3 which is a quick and easy way to get started with it.

Built a wrapper class, `StorageService` in `src/lib/supabase/storage.ts` to handle interacting with it.

### StorageService Class

The `StorageService` class provides a clean interface for interacting with Supabase storage, handling document uploads, downloads, and management.

#### Configuration

- Bucket name: `documents`
- URL expiration time: 3600 seconds (1 hour) (only applies to downloads)
- File path structure: `users/{userId}/{fileName}_V{version}`

#### Key Methods

##### File Path Management

- `getUserPath(userId: string)`: Generates the base path for a user's documents
- `getFilePath(userId: string, fileName: string, version: number)`: Creates the full file path including versioning

##### Upload Operations

- `getPresignedUrl(userId: string, fileName: string, version: number)`: Generates a presigned URL for secure file uploads
- `uploadFile(userId: string, fileName: string, fileData: Buffer | Blob, contentType: string, version: number)`: Handles direct file uploads to Supabase storage

##### File Management

- `verifyFileExists(filePath: string)`: Checks if a file exists in storage
- `deleteFile(filePath: string)`: Removes a file from storage
- `getDownloadUrl(filePath: string)`: Generates a temporary download URL for a file
- `listUserFiles(userId: string)`: Lists all files belonging to a user

#### Error Handling

- All methods include proper error handling
- Errors are thrown to bubble up
  - Implementors should be handling errors - keep the operations clean by only handling the logic
- Upload operations use upsert: false to prevent accidental overwrites

#### Security Features

- User-specific file paths to prevent unauthorized access
- Presigned URLs for secure uploads and downloads
- Temporary download URLs with expiration
- Content type validation during uploads

#### Usage Example

```typescript
const storageService = new StorageService(supabaseClient);

// Upload a file
await storageService.uploadFile(
  userId,
  "document.pdf",
  fileBuffer,
  "application/pdf",
  1,
);

// Get a download URL
const downloadUrl = await storageService.getDownloadUrl(filePath);
```

### Integration with Document Upload

The `StorageService` is used in the document upload process to:

1. Store the original PDF file
2. Generate secure download links for document preview
3. Manage file versions during document updates
4. Clean up files when documents are deleted
