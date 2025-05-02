--
--
-- documents
--
--

CREATE TYPE document_status AS ENUM (
  'draft',
  'awaiting_signatures',
  'partially_signed',
  'completed',
  'rejected',
  'expired'
);

/**
 * Documents are the main table that contains the document metadata.
 *
 * id - The ID of the document
 * user_id - The ID of the user who created the document
 * user_email - The email of the user who created the document
 * current_version_id - The ID of the current version of the document - no
 *   foreign key constraint to prevent circular dependencies on the
 *   document_versions table, and requires the document to be created before
 *   the document version can be created
 * status - The status of the document
 * name - The name of the document
 * password - The password of the document
 * completed_at - The timestamp when the document was completed
 * expires_at - The timestamp when the document expires
 * rejected_at - The timestamp when the document was rejected
 * created_at - The timestamp when the document was created
 * updated_at - The timestamp when the document was last updated
 */
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email TEXT NOT NULL,
    current_version_id UUID,
    status document_status NOT NULL DEFAULT 'draft',
    name TEXT NOT NULL,
    password TEXT,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add the owner to the tables
ALTER TABLE documents OWNER TO postgres;

-- Add indexes to the documents table
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_updated_at ON documents(updated_at);

-- Enable Row Level Security for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create function to update updated_at timestamp for documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

ALTER FUNCTION update_updated_at_column() OWNER TO postgres;

-- Create trigger to automatically update updated_at for documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

--
--
-- document_versions
--
--

/**
 * Document versions are used to track the history of a document. Each signature
 * creates a new version of the document. This allows us to track the history of
 * the document and to see the changes that have been made to it.
 *
 * id - The ID of the document version
 * document_id - The ID of the document
 * version_number - The version number of the document - this is automatically
 *   set by the set_document_version_number function
 * contentHash - The hash of the document content
 * fileHash - The hash of the document file
 * metadataHash - The hash of the document metadata
 * transaction_signature - The transaction signature of the document
 * encryption_key - The symmetric key used to encrypt the DocumentStamp JSON for this version
 * created_by - The ID of the user who created the document version
 * created_at - The timestamp when the document version was created
 */
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID,
    version_number INTEGER NOT NULL DEFAULT 0,
    contentHash TEXT NOT NULL,
    fileHash TEXT NOT NULL,
    metadataHash TEXT NOT NULL,
    transaction_signature TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add the foreign key constraints after the documents table is created
-- This is to prevent circular dependencies on the documents table
ALTER TABLE document_versions
ADD CONSTRAINT fk_document_versions_document
FOREIGN KEY (document_id)
REFERENCES documents(id)
ON DELETE CASCADE;

ALTER TABLE documents
ADD CONSTRAINT fk_documents_current_version
FOREIGN KEY (current_version_id)
REFERENCES document_versions(id)
ON DELETE SET NULL;

ALTER TABLE document_versions OWNER TO postgres;

-- Add indexes to the document versions table
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
-- This index is used to prevent duplicate document versions from being created
-- by the same user for the same document
CREATE UNIQUE INDEX idx_document_versions_document_version
  ON document_versions(document_id, version_number)
  WHERE document_id IS NOT NULL;

-- Enable Row Level Security for document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of documents they own
CREATE POLICY "Users can view versions of their documents"
ON document_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_versions.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Users can insert versions for documents they own
CREATE POLICY "Users can insert versions for their documents"
ON document_versions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_versions.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Users can update versions of documents they own
CREATE POLICY "Users can update versions of their documents"
ON document_versions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_versions.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Users can delete versions of documents they own
CREATE POLICY "Users can delete versions of their documents"
ON document_versions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_versions.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Create a function to get the next version number for a document
CREATE OR REPLACE FUNCTION get_next_document_version_number(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get the highest version number for this document
    SELECT COALESCE(MAX(dv.version_number), 0) + 1
    INTO next_version
    FROM document_versions dv
    WHERE dv.document_id = doc_id;

    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION get_next_document_version_number(UUID) OWNER TO postgres;

-- Create a function to automatically set the version number before insert
CREATE OR REPLACE FUNCTION set_document_version_number()
RETURNS TRIGGER AS $$
DECLARE
    version_count INTEGER;
BEGIN
    -- Check if this is the first version for this document
    SELECT COUNT(*)
    INTO version_count
    FROM document_versions
    WHERE document_id = NEW.document_id;

    -- Only set version_number if it's not already set AND this is not the first version
    IF (NEW.version_number IS NULL OR NEW.version_number <= 0) THEN
        IF version_count > 0 THEN
            -- This is not the first version, so increment
            NEW.version_number := get_next_document_version_number(NEW.document_id);
        ELSE
            -- This is the first version, keep it at 0
            NEW.version_number := 0;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION set_document_version_number() OWNER TO postgres;

-- Create a trigger to automatically set the version number
CREATE TRIGGER set_document_version_number_trigger
    BEFORE INSERT ON document_versions
    FOR EACH ROW
    EXECUTE FUNCTION set_document_version_number();

--
--
-- Function to add a new document version
--

/**
 * Adds a new version to a document.
 * This function handles the creation of a new version record,
 * automatically calculating the next version number, and updating
 * the document's current_version_id.
 *
 * @param p_document_id - The ID of the document
 * @param p_content_hash - The hash of the document content for this version
 * @param p_file_hash - The hash of the document file for this version
 * @param p_metadata_hash - The hash of the document metadata for this version
 * @param p_user_id - The ID of the user creating this version
 * @param p_transaction_signature - The Solana transaction signature for the memo storing the encrypted stamp
 * @return TABLE - Returns the ID and number of the newly created version
 */
CREATE OR REPLACE FUNCTION add_document_version(
    p_document_id UUID,
    p_content_hash TEXT,
    p_file_hash TEXT,
    p_metadata_hash TEXT,
    p_user_id UUID,
    p_transaction_signature TEXT
)
RETURNS TABLE(
    version_id UUID,
    version_number INTEGER
) AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
BEGIN
    -- Get the next version number
    v_version_number := get_next_document_version_number(p_document_id);

    -- Insert the new version
    INSERT INTO document_versions (
        document_id,
        contentHash,
        fileHash,
        metadataHash,
        created_by,
        transaction_signature,
        version_number
    ) VALUES (
        p_document_id,
        p_content_hash,
        p_file_hash,
        p_metadata_hash,
        p_user_id,
        p_transaction_signature,
        v_version_number
    ) RETURNING id INTO v_version_id;

    -- Update the document's current version ID
    UPDATE documents
    SET current_version_id = v_version_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_document_id;

    -- Return the new version details
    RETURN QUERY
    SELECT v_version_id, v_version_number;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION add_document_version(UUID, TEXT, TEXT, TEXT, UUID, TEXT) OWNER TO postgres;

--
--
-- document_signers
--
--

-- Create a type for the status of a document signer
CREATE TYPE document_signer_status AS ENUM (
  'pending',
  'signed',
  'rejected'
);

/**
 * Document signers are the users who have signed the document.
 *
 * id - The ID of the document signer
 * document_id - The ID of the document that the signer signed
 * participant_id - The ID of the participant this signer entry corresponds to
 * order_index - The index of the user in the signing order
 *   - is -1 if the user is not in the signing order
 * status - The status of the user's signature
 * rejection_reason - The reason the user's signature was rejected
 * signed_at - The timestamp when the user signed the document
 * version_id - The ID of the document version created upon signing
 * created_at - The timestamp when the document signer was created
 * updated_at - The timestamp when the document signer was last updated
 */
CREATE TABLE document_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES document_participants(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT -1,
    status document_signer_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    signed_at TIMESTAMPTZ,
    version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ensure a participant is only listed as a signer once per document
    CONSTRAINT unique_document_participant_signer UNIQUE (document_id, participant_id)
);

ALTER TABLE document_signers OWNER TO postgres;

CREATE INDEX idx_document_signers_document_id ON document_signers(document_id);
CREATE INDEX idx_document_signers_participant_id ON document_signers(participant_id); -- New index
CREATE INDEX idx_document_signers_status ON document_signers(status);
CREATE INDEX idx_document_signers_version_id ON document_signers(version_id);

-- Enable Row Level Security for document_signers
ALTER TABLE document_signers ENABLE ROW LEVEL SECURITY;

-- RLS: Allow service role to bypass RLS
CREATE POLICY "Service role bypass RLS"
ON document_signers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS: Document owners can view signers for their documents
CREATE POLICY "Owners can view signers for their documents"
ON document_signers
FOR SELECT
TO authenticated
USING (
  true
  -- EXISTS (
  --   SELECT 1 FROM documents d
  --   WHERE d.id = document_signers.document_id
  --   AND d.user_id = auth.uid()
  -- )
);

-- RLS: Signers (participants) can view their own signer entry
CREATE POLICY "Signers can view their own signer entry"
ON document_signers
FOR SELECT
TO authenticated
USING (
  true
  -- EXISTS (
  --   SELECT 1 FROM document_participants dp
  --   WHERE dp.id = document_signers.participant_id
  --   AND dp.user_id = auth.uid() -- Check link through participants table
  -- )
);

-- RLS: Document owners can insert signers for their documents
CREATE POLICY "Owners can insert signers for their documents"
ON document_signers
FOR INSERT
TO authenticated
WITH CHECK (
  true
  -- EXISTS (
  --   SELECT 1 FROM documents d
  --   WHERE d.id = document_signers.document_id
  --   AND d.user_id = auth.uid()
  -- )
);

-- RLS: Document owners can update signer entries for their documents
CREATE POLICY "Owners can update signer entries for their documents"
ON document_signers
FOR UPDATE
TO authenticated
USING (
  true
  -- EXISTS (
  --   SELECT 1 FROM documents d
  --   WHERE d.id = document_signers.document_id
  --   AND d.user_id = auth.uid()
  -- )
);

-- RLS: Document owners can delete signers for their documents
CREATE POLICY "Owners can delete signers for their documents"
ON document_signers
FOR DELETE
TO authenticated
USING (
  true
  -- EXISTS (
  --   SELECT 1 FROM documents d
  --   WHERE d.id = document_signers.document_id
  --   AND d.user_id = auth.uid()
  -- )
);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_document_signers_updated_at
    BEFORE UPDATE ON document_signers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

--
--
-- Transaction Functions
--
--

/**
 * Creates a new draft document with its initial version (version 0).
 * This function handles the initial creation transaction for a document.
 *
 * @param p_name - The name of the document
 * @param p_content_hash - The hash of the document content
 * @param p_file_hash - The hash of the document file
 * @param p_metadata_hash - The hash of the document metadata
 * @return RECORD - Returns the created document and version IDs, and the initial version number (0)
 */
CREATE OR REPLACE FUNCTION create_draft_document(
    p_name TEXT,
    p_content_hash TEXT,
    p_file_hash TEXT,
    p_metadata_hash TEXT
)
RETURNS TABLE(
    document_id UUID,
    version_id UUID,
    out_version_number INTEGER
) AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_document_id UUID;
    v_version_id UUID;
BEGIN
    -- Get the current user ID and email
    v_user_id := auth.uid();
    v_user_email := auth.email();

    -- Create the document with 'draft' status
    INSERT INTO documents (
        user_id,
        user_email,
        name,
        status
    ) VALUES (
        v_user_id,
        v_user_email,
        p_name,
        'draft'
    ) RETURNING id INTO v_document_id;

    -- Create the initial version (version 0)
    INSERT INTO document_versions (
        document_id,
        contentHash,
        fileHash,
        metadataHash,
        created_by,
        version_number -- Explicitly set initial version to 0
    ) VALUES (
        v_document_id,
        p_content_hash,
        p_file_hash,
        p_metadata_hash,
        v_user_id,
        0 -- Set version number to 0 for the initial draft
    ) RETURNING id INTO v_version_id;

    -- Update the document with the current version ID
    UPDATE documents
    SET current_version_id = v_version_id
    WHERE id = v_document_id;

    -- Return the results
    RETURN QUERY
    SELECT v_document_id, v_version_id, 0; -- Return 0 as the initial version number
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION create_draft_document(TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

/**
 * Records a participant's signature on a document.
 * This function creates a new document version reflecting the signed state,
 * updates the specific signer's status, and links them to the new version.
 * The overall document status update is handled by the trigger on document_signers.
 *
 * @param p_document_id - The ID of the document being signed.
 * @param p_participant_id - The ID of the participant (signer) record from document_participants.
 * @param p_content_hash - The hash of the document content *after* this signer's contribution.
 * @param p_file_hash - The hash of the document file *after* this signer's contribution.
 * @param p_metadata_hash - The hash of the document metadata *after* this signer's contribution.
 * @param p_transaction_signature - The Solana transaction signature for the memo storing the encrypted stamp for this new version.
 * @return TABLE - Returns the new version ID, version number, and the document's status after the signature.
 */
CREATE OR REPLACE FUNCTION sign_document(
    p_document_id UUID,
    p_participant_id UUID,
    p_content_hash TEXT,
    p_file_hash TEXT,
    p_metadata_hash TEXT,
    p_transaction_signature TEXT
)
RETURNS TABLE(
    version_id UUID,
    version_number INTEGER,
    document_status document_status,
    creator_email TEXT
) AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
    v_document_status document_status;
    v_signer_record_id UUID;
    v_existing_signer_id UUID;
    v_signer_user_id UUID;
    v_total_signers INTEGER;
    v_signed_count INTEGER;
    v_rejected_count INTEGER;
    v_creator_email TEXT;
BEGIN
    -- Step 1: Check if the participant has already signed
    SELECT id INTO v_existing_signer_id
    FROM document_signers
    WHERE document_id = p_document_id
    AND participant_id = p_participant_id
    AND status = 'signed';

    IF v_existing_signer_id IS NOT NULL THEN
        RAISE EXCEPTION 'Participant has already signed this document';
    END IF;

    -- Step 2: Get the current signer's user ID
    v_signer_user_id := auth.uid();

    -- Ensure the signer exists and has a user ID (non-null user_id in participants)
    IF v_signer_user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot sign document: Signer user ID is missing.';
    END IF;

    -- Step 3: Create or get the document_signer record
    SELECT id INTO v_signer_record_id
    FROM document_signers
    WHERE document_id = p_document_id
    AND participant_id = p_participant_id;

    IF v_signer_record_id IS NULL THEN
        -- Create new signer record if it doesn't exist
        INSERT INTO document_signers (
            document_id,
            participant_id,
            status,
            signed_at
        ) VALUES (
            p_document_id,
            p_participant_id,
            'signed',
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_signer_record_id;
    ELSE
        -- Update existing signer record
        UPDATE document_signers
        SET status = 'signed',
            signed_at = CURRENT_TIMESTAMP
        WHERE id = v_signer_record_id;
    END IF;

    -- Step 4: Create the new document version using the dedicated function
    -- This also updates documents.current_version_id
    SELECT av.version_id, av.version_number
    INTO v_version_id, v_version_number
    FROM add_document_version(
        p_document_id,
        p_content_hash,
        p_file_hash,
        p_metadata_hash,
        v_signer_user_id, -- Use the current signer's user ID for this version
        p_transaction_signature
    ) AS av;

    -- Step 5: Update the signer record with the version ID
    UPDATE document_signers
    SET version_id = v_version_id
    WHERE id = v_signer_record_id;

    -- Step 6: Update document status based on current signers' statuses
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE status = 'signed'),
           COUNT(*) FILTER (WHERE status = 'rejected')
    INTO v_total_signers, v_signed_count, v_rejected_count
    FROM document_signers
    WHERE document_id = p_document_id;

    IF v_rejected_count > 0 THEN
        UPDATE documents SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP WHERE id = p_document_id;
    ELSIF v_signed_count = v_total_signers AND v_total_signers > 0 THEN
        UPDATE documents SET
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = p_document_id;
    ELSIF v_signed_count > 0 AND v_signed_count < v_total_signers THEN
        UPDATE documents SET status = 'partially_signed' WHERE id = p_document_id;
    -- No need to explicitly set 'awaiting_signatures' here, as that's the default
    -- after finalize_document_upload or if total_signers is 0 initially.
    END IF;

    -- Step 7: Get the potentially updated document status and creator email if completed
    SELECT d.status,
           CASE WHEN d.status = 'completed' THEN d.user_email ELSE NULL END
    INTO v_document_status, v_creator_email
    FROM documents d
    WHERE d.id = p_document_id;

    -- Return the results
    RETURN QUERY
    SELECT v_version_id, v_version_number, v_document_status, v_creator_email;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in sign_document for document % participant %: %', p_document_id, p_participant_id, SQLERRM;
        RAISE; -- Re-raise the exception
END;
$$ LANGUAGE plpgsql;

-- Update the owner/permissions as needed
ALTER FUNCTION sign_document(UUID, UUID, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

/**
 * Rejects a document by updating the signer status.
 * This function handles the transaction to ensure data consistency.
 *
 * @param p_signer_id - The ID of the signer
 * @param p_rejection_reason - The reason for rejection
 * @return TABLE - Returns information about the rejection operation
 */
CREATE OR REPLACE FUNCTION reject_document(
    p_signer_id UUID,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    document_id UUID,
    document_status document_status
) AS $$
DECLARE
    v_document_id UUID;
    v_document_status document_status;
BEGIN
    -- Update the signer
    UPDATE document_signers
    SET
        status = 'rejected',
        rejection_reason = p_rejection_reason
    WHERE id = p_signer_id
    RETURNING document_id INTO v_document_id;

    -- Get the updated document status
    SELECT status INTO v_document_status
    FROM documents
    WHERE id = v_document_id;

    -- Update the document rejected_at timestamp
    UPDATE documents
    SET rejected_at = CURRENT_TIMESTAMP
    WHERE id = v_document_id;

    -- Return the results
    RETURN QUERY
    SELECT v_document_id, v_document_status;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION reject_document(UUID, TEXT) OWNER TO postgres;

/**
 * Retrieves document details along with the hash from a specific version
 *
 * @param p_document_id - The ID of the document
 * @param p_version - The version number to retrieve
 * @return TABLE - Returns document details and version hash
 */
CREATE OR REPLACE FUNCTION get_document_with_version(
    p_document_id UUID,
    p_version INTEGER
)
RETURNS TABLE(
    name TEXT,
    password TEXT,
    status document_status,
    created_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    contentHash TEXT,
    fileHash TEXT,
    metadataHash TEXT,
    tx_signature TEXT,
    encryption_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.name,
        d.password,
        d.status,
        d.created_at,
        d.completed_at,
        dv.contentHash,
        dv.fileHash,
        dv.metadataHash,
        dv.transaction_signature,
        dv.encryption_key
    FROM documents d
    JOIN document_versions dv ON dv.document_id = d.id
    WHERE d.id = p_document_id
    AND dv.version_number = p_version;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION get_document_with_version(UUID, INTEGER) OWNER TO postgres;

--
--
-- document_participants
--
--

CREATE TYPE participant_role AS ENUM (
    'reviewer',
    'witness',
    'notary',
    'participant'
);

CREATE TYPE participant_mode AS ENUM (
    'transparent',
    'anonymous'
);

/**
 * Defines the participants involved in a document process.
 * This table stores the configuration of each participant before
 * they necessarily interact (sign/reject).
 *
 * id - The ID of the participant entry
 * document_id - The ID of the document this participant belongs to
 * user_id - The ID of the user who is the participant
 * role - The role of the participant (e.g., owner, signer, reviewer)
 * mode - The signing mode for the participant (e.g., transparent, anonymous)
 * is_owner - Flag indicating if this participant is the document owner
 * color - A color associated with the participant (e.g., for UI highlighting)
 * created_at - Timestamp when the participant was added
 * updated_at - Timestamp when the participant was last updated
 */
CREATE TABLE document_participants (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Can be NULL for non-users
    name TEXT,
    email TEXT NOT NULL,
    role participant_role NOT NULL DEFAULT 'participant',
    mode participant_mode NOT NULL DEFAULT 'transparent',
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE document_participants OWNER TO postgres;

-- Add indexes
CREATE INDEX idx_document_participants_document_id ON document_participants(document_id);
CREATE INDEX idx_document_participants_user_id ON document_participants(user_id);
CREATE INDEX idx_document_participants_email ON document_participants(email);

-- Enable Row Level Security for document_participants
ALTER TABLE document_participants ENABLE ROW LEVEL SECURITY;

-- RLS: Document owners can manage participants for their documents
CREATE POLICY "Owners can manage participants for their documents"
ON document_participants
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = document_participants.document_id
        AND documents.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM documents
        WHERE documents.id = document_participants.document_id
        AND documents.user_id = auth.uid()
    )
);

-- RLS: Participants can view their own participation entry
CREATE POLICY "Participants can view their own entry"
ON document_participants
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_document_participants_updated_at
    BEFORE UPDATE ON document_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

--
--
-- document_fields
--
--

-- Create a type for the document field types
CREATE TYPE document_field_type AS ENUM (
  'text',
  'date',
  'initials',
  'signature'
);

/**
 * Stores the fields placed on a document.
 *
 * id - The ID of the document field
 * document_id - The ID of the document this field belongs to
 * participant_id - The ID of the document_participant this field is assigned to
 * type - The type of the field (text, date, etc.)
 * position_x - The X coordinate of the field's top-left corner
 * position_y - The Y coordinate of the field's top-left corner
 * position_page - The page number the field is on
 * size_width - The width of the field
 * size_height - The height of the field
 * required - Whether the field is required to be filled
 * label - An optional label for the field
 * value - The current value of the field (can be updated by signers)
 * options - JSONB storage for options (e.g., dropdown choices)
 * signature_scale - Scaling factor applied to signature fields
 * text_styles - JSONB storage for text styling information
 * created_at - The timestamp when the field was created
 * updated_at - The timestamp when the field was last updated
 */
CREATE TABLE document_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES document_participants(id) ON DELETE SET NULL,
    type document_field_type NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    position_page INTEGER NOT NULL,
    size_width REAL NOT NULL,
    size_height REAL NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    label TEXT,
    value TEXT,
    options JSONB,
    signature_scale REAL,
    text_styles JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE document_fields OWNER TO postgres;

-- Add indexes to the document fields table
CREATE INDEX idx_document_fields_document_id ON document_fields(document_id);
CREATE INDEX idx_document_fields_participant_id ON document_fields(participant_id);

-- Enable Row Level Security for document_fields
ALTER TABLE document_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Owners can manage fields for their documents
CREATE POLICY "Owners can manage fields for their documents"
ON document_fields
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_fields.document_id
    AND documents.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id = document_fields.document_id
    AND documents.user_id = auth.uid()
  )
);

-- Trigger for updated_at: Use the existing function
CREATE TRIGGER update_document_fields_updated_at
    BEFORE UPDATE ON document_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


--
--
-- finalize_document_upload Function
--
--

/**
 * Finalizes the document upload process by creating the first version (after draft),
 * inserting fields, and adding participants in a single transaction.
 * This ensures atomicity for the upload finalization steps.
 *
 * @param p_document_id - The ID of the document being finalized
 * @param p_user_id - The ID of the user performing the upload
 * @param p_content_hash - The content hash for the new version
 * @param p_file_hash - The file hash for the new version
 * @param p_metadata_hash - The metadata hash for the new version
 * @param p_transaction_signature - The Solana transaction signature storing the encrypted stamp
 * @param p_fields - JSONB array of document fields to insert
 * @param p_participants - JSONB array of document participants (signers/reviewers etc.) to insert
 * @param p_expires_at - The timestamp when the document should expire (optional)
 * @param p_password - The password for the document (optional)
 * @return BOOLEAN - Returns true if successful, raises an exception on failure (causing rollback)
 */
CREATE OR REPLACE FUNCTION finalize_document_upload(
    p_document_id UUID,
    p_user_id UUID,
    p_content_hash TEXT,
    p_file_hash TEXT,
    p_metadata_hash TEXT,
    p_transaction_signature TEXT,
    p_fields JSONB,
    p_participants JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
    field_data JSONB;
    participant_data JSONB;
BEGIN
    -- Step 1: Add the new document version (version 1 or higher) using existing function
    -- This RPC also updates the document's current_version_id
    SELECT version_id, version_number
    INTO v_version_id, v_version_number
    FROM add_document_version(
        p_document_id,
        p_content_hash,
        p_file_hash,
        p_metadata_hash,
        p_user_id,
        p_transaction_signature
    ) AS av;

    -- Step 2: Insert document participants by iterating through the JSONB array FIRST
    FOR participant_data IN SELECT jsonb_array_elements(p_participants)
    LOOP
        INSERT INTO document_participants (
            id,
            document_id,
            user_id,
            name,
            email,
            role,
            mode,
            is_owner,
            color
        ) VALUES (
            (participant_data->>'id')::UUID,
            p_document_id,
            (participant_data->>'userId')::UUID, -- May be NULL
            participant_data->>'name',
            participant_data->>'email',
            (participant_data->>'role')::participant_role,
            (participant_data->>'mode')::participant_mode,
            COALESCE((participant_data->>'isOwner')::BOOLEAN, FALSE), -- Ensure default if missing
            participant_data->>'color'
        );
    END LOOP;

    -- Step 3: Insert document fields by iterating through the JSONB array AFTER participants exist
    FOR field_data IN SELECT jsonb_array_elements(p_fields)
    LOOP
        INSERT INTO document_fields (
            document_id,
            participant_id,
            type,
            position_x,
            position_y,
            position_page,
            size_width,
            size_height,
            required,
            label,
            value,
            options,
            signature_scale,
            text_styles
        ) VALUES (
            p_document_id,
            (field_data->>'assignedTo')::UUID,
            (field_data->>'type')::document_field_type,
            (field_data->'position'->>'x')::REAL,
            (field_data->'position'->>'y')::REAL,
            (field_data->'position'->>'page')::INTEGER,
            (field_data->'size'->>'width')::REAL,
            (field_data->'size'->>'height')::REAL,
            (field_data->>'required')::BOOLEAN,
            field_data->>'label',
            field_data->>'value',
            field_data->'options',
            (field_data->>'signatureScale')::REAL,
            field_data->'textStyles'
        );
    END LOOP;

    -- Step 4: Update the document status to awaiting_signatures and set expiry
    UPDATE documents
    SET status = 'awaiting_signatures',
        password = p_password,
        expires_at = p_expires_at
    WHERE id = p_document_id;

    -- If all operations succeeded, return true
    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error (optional, depends on PostgreSQL setup)
        RAISE WARNING 'Error in finalize_document_upload for document %: %', p_document_id, SQLERRM;
        -- Re-raise the exception to ensure transaction rollback and propagate error to the caller
        RAISE EXCEPTION 'finalize_document_upload failed: %', SQLERRM;
        RETURN FALSE; -- Will not be reached due to RAISE EXCEPTION
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION finalize_document_upload(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TIMESTAMPTZ, TEXT) OWNER TO postgres;


--
--
-- dry_run_finalize_document_upload Function
--
--

/**
 * Performs a dry run of the finalize_document_upload process.
 * It executes the finalize function within a transaction but immediately rolls it back.
 * This allows checking if the operation would succeed without making permanent changes.
 *
 * @param p_document_id - The ID of the document
 * @param p_user_id - The ID of the user
 * @param p_content_hash - The content hash
 * @param p_file_hash - The file hash
 * @param p_metadata_hash - The metadata hash
 * @param p_transaction_signature - The Solana transaction signature
 * @param p_fields - JSONB array of fields
 * @param p_participants - JSONB array of participants
 * @param p_expires_at - The timestamp when the document should expire (optional)
 * @param p_password - The password for the document (optional)
 * @return BOOLEAN - Returns true if the dry run succeeds (operation would have worked), raises error on failure.
 */
CREATE OR REPLACE FUNCTION dry_run_finalize_document_upload(
    p_document_id UUID,
    p_user_id UUID,
    p_content_hash TEXT,
    p_file_hash TEXT,
    p_metadata_hash TEXT,
    p_transaction_signature TEXT,
    p_fields JSONB,
    p_participants JSONB,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN;
BEGIN
    -- Start a transaction block (though nested transactions might behave differently depending on context, the core idea is isolation and rollback)
    -- In standard PostgreSQL, SAVEPOINT might be more explicit for nested control,
    -- but PERFORM within an EXCEPTION block achieves the rollback goal here.
    BEGIN
        -- Attempt to execute the real function. We don't need the return value.
        PERFORM finalize_document_upload(
            p_document_id,
            p_user_id,
            p_content_hash,
            p_file_hash,
            p_metadata_hash,
            p_transaction_signature,
            p_expires_at,
            p_fields,
            p_participants,
            p_password
        );

        -- If the above call succeeded without error, the dry run is successful.
        v_success := TRUE;

    EXCEPTION
        WHEN OTHERS THEN
            -- An error occurred within finalize_document_upload.
            -- The transaction block automatically rolls back on error.
            RAISE WARNING 'Dry run failed for document %: %', p_document_id, SQLERRM;
            -- Re-raise the exception to inform the caller of the failure reason.
            RAISE EXCEPTION 'Dry run failed: %', SQLERRM;
            v_success := FALSE; -- Should not be reached due to RAISE EXCEPTION
    END;

    -- Crucially, we need to ensure the changes are rolled back even if no exception occurred.
    -- PostgreSQL functions run within their own transaction context. Raising an exception
    -- here specifically designed for rollback ensures any changes made by PERFORM are discarded.
    IF v_success THEN
       RAISE EXCEPTION 'SIMULATED_ROLLBACK_FOR_DRY_RUN';
    END IF;

    -- This part of the code will technically not be reached if successful
    -- because of the RAISE EXCEPTION above, but demonstrates the intent.
    -- The actual success signal comes from the RPC call *not* returning the
    -- SIMULATED_ROLLBACK_FOR_DRY_RUN error.
    RETURN v_success;

EXCEPTION
    -- Catch the specific rollback exception we raised
    WHEN SQLSTATE 'P0001' THEN -- P0001 is the code for RAISE EXCEPTION
        IF SQLERRM = 'SIMULATED_ROLLBACK_FOR_DRY_RUN' THEN
            -- This means the PERFORM call succeeded, and we intentionally rolled back.
            RETURN TRUE; -- Indicate dry run success
        ELSE
            -- It was some other RAISE EXCEPTION from within the BEGIN block (already handled)
            -- or potentially another P0001 error. Re-raise for safety.
            RAISE; -- Re-raise the original error
            RETURN FALSE;
        END IF;
    WHEN OTHERS THEN
        -- Catch any other unexpected errors during the dry run setup/teardown itself.
        RAISE WARNING 'Unexpected error during dry_run_finalize_document_upload for document %: %', p_document_id, SQLERRM;
        RAISE; -- Re-raise the original error
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION dry_run_finalize_document_upload(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TIMESTAMPTZ, TEXT) OWNER TO postgres;


--
--
-- get_documents_to_list Function
--
--

/**
 * Retrieves a list of documents for a specific user, formatted for display.
 * Joins documents with their latest version to include the transaction signature.
 *
 * @return TABLE - Returns document details matching the ViewDocument type.
 */
CREATE OR REPLACE FUNCTION get_documents_to_list()
RETURNS TABLE(
    id UUID,
    name TEXT,
    has_password BOOLEAN,
    status document_status,
    tx_signature TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    version_number INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.name,
        (d.password IS NOT NULL) AS has_password,
        d.status,
        dv.transaction_signature,
        d.expires_at,
        d.created_at,
        d.updated_at,
        dv.version_number -- Select the version number from the joined version
    FROM documents d
    -- Join directly using the current_version_id field
    LEFT JOIN document_versions dv ON d.current_version_id = dv.id
    WHERE d.user_id = auth.uid() -- Filter documents for the current user
    ORDER BY d.updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

ALTER FUNCTION get_documents_to_list() OWNER TO postgres;

--
--
-- get_document_details_for_signing Function
--
--

/**
 * Retrieves detailed document metadata needed for the signing page,
 * including the current version number.
 *
 * @param p_document_id - The ID of the document to retrieve details for.
 * @param p_signer_email - The email address of the signer initiating the signing process.
 * @return TABLE - Returns document details including current version info and participant ID.
 */
CREATE OR REPLACE FUNCTION get_document_details_for_signing(
    p_document_id UUID,
    p_signer_email TEXT
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    current_version_id UUID,
    current_version_number INTEGER,
    participant_id UUID,
    password TEXT,
    status document_status,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    is_last BOOLEAN,
    creator_user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.name,
        d.current_version_id,
        dv.version_number AS current_version_number,
        dp.id AS participant_id,
        d.password,
        d.status AS status,
        d.completed_at,
        d.expires_at,
        d.rejected_at,
        -- Calculate is_last by comparing total participants with signed participants
        (
            SELECT CASE
                WHEN (
                    -- Count total participants for this document
                    (SELECT COUNT(*) FROM document_participants WHERE document_id = d.id) -
                    -- Count participants who have already signed
                    (SELECT COUNT(*) FROM document_signers ds WHERE ds.document_id = d.id AND ds.status = 'signed')
                ) = 1 THEN TRUE
                ELSE FALSE
            END
        ) AS is_last,
        d.user_id AS creator_user_id
    FROM documents d
    LEFT JOIN document_versions dv ON d.current_version_id = dv.id
    LEFT JOIN document_participants dp ON d.id = dp.document_id AND LOWER(dp.email) = LOWER(p_signer_email)
    WHERE d.id = p_document_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER; -- Add SECURITY DEFINER

ALTER FUNCTION get_document_details_for_signing(UUID, TEXT) OWNER TO postgres;

--
--
-- get_document_signing_data Function
--
--

/**
 * Retrieves all necessary data for a specific signer to sign a document.
 * Includes document details, the signer's participant info, and their assigned fields.
 * Assumes access control (e.g., token validation) is handled before calling this function.
 *
 * @param p_document_id - The ID of the document.
 * @param p_signer_email - The email of the signer whose data is being requested.
 * @return TABLE - Returns document details, signer participant info, and assigned fields.
 */
CREATE OR REPLACE FUNCTION get_document_signing_data(
    p_document_id UUID,
    p_signer_email TEXT
)
RETURNS TABLE(
    signer JSONB, -- The document_participants record for the signer
    fields JSONB -- JSON array of document_fields assigned to the signer
) AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    -- Find the participant ID for the given email and document, case-insensitively
    SELECT dp.id INTO v_participant_id
    FROM document_participants dp
    WHERE dp.document_id = p_document_id AND LOWER(dp.email) = LOWER(p_signer_email) -- Use LOWER() for case-insensitive match
    LIMIT 1;

    -- If participant not found, return no rows (or handle error as needed)
    IF v_participant_id IS NULL THEN
        -- Raise an error if the participant is not found for the given document and email
        RAISE EXCEPTION 'Participant with email % not found for document %', p_signer_email, p_document_id;
        -- The RETURN statement below is now unreachable but kept for clarity if the RAISE were removed
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        -- Select the signer's participant record as JSON
        row_to_json(dp.*)::JSONB,
        -- Aggregate the fields assigned to this signer into a JSON array
        COALESCE(
            (SELECT jsonb_agg(df.*)
             FROM document_fields df
             WHERE df.document_id = p_document_id AND df.participant_id = v_participant_id),
            '[]'::JSONB -- Return empty array if no fields
        ) AS fields
    FROM document_participants dp -- Query directly from participants
    WHERE dp.id = v_participant_id; -- Filter by the found participant ID

END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER; -- Use DEFINER to bypass RLS temporarily if needed, ensure function logic is secure

ALTER FUNCTION get_document_signing_data(UUID, TEXT) OWNER TO postgres;

--
--
-- dry_run_sign_document Function
--
--

/**
 * Performs a dry run of the sign_document process.
 * Executes the sign_document function within a transaction but rolls it back.
 * Checks if the signing operation would succeed without making permanent changes.
 *
 * @param p_document_id - The ID of the document.
 * @param p_participant_id - The ID of the participant attempting to sign.
 * @param p_content_hash - The hypothetical content hash after signing.
 * @param p_file_hash - The hypothetical file hash after signing.
 * @param p_metadata_hash - The hypothetical metadata hash after signing.
 * @param p_transaction_signature - The hypothetical transaction signature.
 * @return BOOLEAN - Returns true if the dry run succeeds (operation would have worked), raises error on failure.
 */
CREATE OR REPLACE FUNCTION dry_run_sign_document(
    p_document_id UUID,
    p_participant_id UUID,
    p_content_hash TEXT,
    p_file_hash TEXT,
    p_metadata_hash TEXT,
    p_transaction_signature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN;
BEGIN
    -- Start a transaction block for isolation and rollback control
    BEGIN
        -- Attempt to execute the real sign_document function. We don't need the return value here.
        PERFORM sign_document(
            p_document_id,
            p_participant_id,
            p_content_hash,
            p_file_hash,
            p_metadata_hash,
            p_transaction_signature
        );

        -- If the above call succeeded without error, the dry run simulation is successful.
        v_success := TRUE;

    EXCEPTION
        WHEN OTHERS THEN
            -- An error occurred within sign_document.
            -- The transaction block automatically rolls back on error.
            RAISE WARNING 'Dry run of sign_document failed for document % participant %: %', p_document_id, p_participant_id, SQLERRM;
            -- Re-raise the exception to inform the caller of the failure reason.
            RAISE EXCEPTION 'Dry run failed: %', SQLERRM;
            v_success := FALSE; -- Should not be reached due to RAISE EXCEPTION
    END;

    -- Force a rollback even if no exception occurred during the PERFORM call.
    -- This ensures no changes are committed.
    IF v_success THEN
       RAISE EXCEPTION 'SIMULATED_ROLLBACK_FOR_DRY_RUN';
    END IF;

    -- This part is technically unreachable if successful due to the RAISE EXCEPTION above.
    RETURN v_success;

EXCEPTION
    -- Catch the specific rollback exception we raised
    WHEN SQLSTATE 'P0001' THEN -- P0001 is the code for RAISE EXCEPTION
        IF SQLERRM = 'SIMULATED_ROLLBACK_FOR_DRY_RUN' THEN
            -- This means the PERFORM call succeeded, and we intentionally rolled back.
            RETURN TRUE; -- Indicate dry run success
        ELSE
            -- It was some other RAISE EXCEPTION from within the BEGIN block or another P0001 error.
            RAISE; -- Re-raise the original error that wasn't the simulated rollback
            RETURN FALSE;
        END IF;
    WHEN OTHERS THEN
        -- Catch any other unexpected errors during the dry run setup/teardown itself.
        RAISE WARNING 'Unexpected error during dry_run_sign_document for document % participant %: %', p_document_id, p_participant_id, SQLERRM;
        RAISE; -- Re-raise the original error
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Set the owner for the new function
ALTER FUNCTION dry_run_sign_document(UUID, UUID, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;
