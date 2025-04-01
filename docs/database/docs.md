# Database

This document will cover the database tables and functions.

## Document Management Schema

The document management system is built on PostgreSQL via Supabase and consists of multiple tables that work together to handle document creation, versioning, and signing workflows.

### Enum Types

#### `document_status`

```sql
CREATE TYPE document_status AS ENUM (
  'draft',               -- Initial document state
  'awaiting_signatures', -- Document sent to signers but none have signed
  'partially_signed',    -- Some signers have signed
  'completed',           -- All signers have signed
  'rejected',            -- At least one signer has rejected
  'expired'              -- Document has passed expiration date
);
```

#### `document_signer_status`

```sql
CREATE TYPE document_signer_status AS ENUM (
  'pending',  -- Signer has not yet taken action
  'signed',   -- Signer has signed the document
  'rejected'  -- Signer has rejected the document
);
```

### Core Tables

#### `documents`

The main table storing document metadata.

| Column               | Type            | Description                                    |
| -------------------- | --------------- | ---------------------------------------------- |
| `id`                 | UUID            | Primary key                                    |
| `user_id`            | UUID            | Reference to auth.users(id) - document creator |
| `current_version_id` | UUID            | Reference to the latest document version       |
| `status`             | document_status | Current status of the document                 |
| `name`               | TEXT            | Document name                                  |
| `password`           | TEXT            | Optional password for document access          |
| `completed_at`       | TIMESTAMPTZ     | When the document was fully signed             |
| `expired_at`         | TIMESTAMPTZ     | When the document expires                      |
| `rejected_at`        | TIMESTAMPTZ     | When the document was rejected                 |
| `created_at`         | TIMESTAMPTZ     | Creation timestamp                             |
| `updated_at`         | TIMESTAMPTZ     | Last update timestamp                          |

**Indexes:**

- `idx_documents_user_id` - Indexes documents by creator
- `idx_documents_status` - Facilitates filtering by document status
- `idx_documents_created_at` - Supports chronological sorting

**RLS Policies:**

- Users can view their own documents
- Users can insert their own documents
- Users can update their own documents
- Users can delete their own documents

#### `document_versions`

Tracks document history with each signature creating a new version.

| Column                  | Type        | Description                            |
| ----------------------- | ----------- | -------------------------------------- |
| `id`                    | UUID        | Primary key                            |
| `document_id`           | UUID        | Reference to documents(id)             |
| `version_number`        | INTEGER     | Auto-incremented version number        |
| `hash`                  | TEXT        | Document content hash for verification |
| `transaction_signature` | TEXT        | Blockchain transaction signature       |
| `created_by`            | UUID        | User who created this version          |
| `created_at`            | TIMESTAMPTZ | Creation timestamp                     |

**Indexes:**

- `idx_document_versions_document_id` - Speeds up lookups by document
- Unique index on document_id + version_number to prevent duplicates

**Features:**

- Automatic version numbering (starts at 0 for initial version)
- Foreign key constraints to documents table
- Document versioning for complete audit trail

**RLS Policies:**

- Users can view versions of their documents
- Users can insert versions for their documents
- Users can update versions of their documents
- Users can delete versions of their documents

#### `document_signers`

Maps signers to documents and tracks signing status.

| Column             | Type                   | Description                              |
| ------------------ | ---------------------- | ---------------------------------------- |
| `id`               | UUID                   | Primary key                              |
| `document_id`      | UUID                   | Reference to documents(id)               |
| `user_id`          | UUID                   | Reference to auth.users(id)              |
| `order_index`      | INTEGER                | Position in signing order (-1 if none)   |
| `status`           | document_signer_status | Signing status (pending/signed/rejected) |
| `rejection_reason` | TEXT                   | Optional reason for rejection            |
| `signature_type`   | TEXT                   | Type of signature used                   |
| `signature_data`   | TEXT                   | Signature data                           |
| `signed_at`        | TIMESTAMPTZ            | When signed                              |
| `version_id`       | UUID                   | Version created by this signature        |
| `created_at`       | TIMESTAMPTZ            | Creation timestamp                       |
| `updated_at`       | TIMESTAMPTZ            | Last update timestamp                    |

**Indexes:**

- `idx_document_signers_document_id` - Quick lookup of all signers for a document
- `idx_document_signers_user_id` - Find all documents a user needs to sign
- `idx_document_signers_status` - Filter signers by status
- `idx_document_signers_version_id` - Associate signers with document versions

**RLS Policies:**

- Users can view signers for their documents OR where they are a signer
- Users can insert signers for their documents
- Users can update signers for their documents OR their own signing status
- Users can delete signers for their documents

### Automated Behavior

#### Triggers

1. **Document Updated At**

   - Automatically updates `updated_at` timestamp when documents are modified

2. **Document Version Numbering**

   - Automatically assigns the next version number when creating a new document version

3. **Document Status Updates**
   - Automatically updates document status based on signer statuses:
     - If any signer rejects: `rejected`
     - If all signers have signed: `completed`
     - If some signers have signed: `partially_signed`
     - If no signers have signed but signers exist: `awaiting_signatures`

### Transaction Functions

#### `create_document_with_version`

Creates a new document with its initial version in a single transaction.

**Parameters:**

- `p_name` - Document name
- `p_hash` - Document content hash
- `p_password` - Optional password

**Returns:**

- `document_id` - ID of the created document
- `version_id` - ID of the initial version
- `version_number` - Version number (0 for initial)

#### `add_document_signers`

Adds multiple signers to a document in a single transaction.

**Parameters:**

- `p_document_id` - Document ID
- `p_signers` - JSONB array of signer objects

**Returns:**

- Set of created document_signers records

#### `sign_document`

Signs a document by creating a new version and updating signer status.

**Parameters:**

- `p_document_id` - Document ID
- `p_signer_id` - Signer ID
- `p_user_id` - User ID of the signer
- `p_document_url` - URL to the signed document
- `p_hash` - Hash of the signed document
- `p_signature_type` - Optional signature type
- `p_signature_data` - Optional signature data

**Returns:**

- `version_id` - ID of the new version
- `version_number` - New version number
- `document_status` - Updated document status

#### `reject_document`

Rejects a document by updating signer status.

**Parameters:**

- `p_signer_id` - Signer ID
- `p_rejection_reason` - Optional rejection reason

**Returns:**

- `document_id` - Document ID
- `document_status` - Updated document status

#### `get_document_with_version`

Retrieves document details with hash from a specific version.

**Parameters:**

- `p_document_id` - Document ID
- `p_version` - Version number

**Returns:**

- Document metadata and hash information

### Data Flow

1. Document creation:

   - Create document and initial version using `create_document_with_version`
   - Add signers using `add_document_signers`
   - Document status changes to `awaiting_signatures`

2. Signing process:

   - Signer signs using `sign_document`
   - New version created with updated hash
   - Document status updates based on overall signing progress
   - When all signers complete, status changes to `completed`

3. Rejection:

   - Signer rejects using `reject_document`
   - Document status changes to `rejected`

4. Verification:
   - Retrieve document with hash using `get_document_with_version`
   - Verify hash against blockchain record
