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
 * document_url - The URL of the document
 * hash - The hash of the document
 * transaction_signature - The transaction signature of the document
 * created_by - The ID of the user who created the document version
 * created_at - The timestamp when the document version was created
 */
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID,
    version_number INTEGER,
    document_url TEXT NOT NULL,
    hash TEXT NOT NULL,
    transaction_signature TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE document_versions OWNER TO postgres;

-- Add indexes to the document versions table
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
-- This index is used to prevent duplicate document versions from being created
-- by the same user for the same document
CREATE UNIQUE INDEX idx_document_versions_document_version
  ON document_versions(document_id, version_number)
  WHERE document_id IS NOT NULL;

-- No RLS policies - only server can access and modify
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Create a function to get the next version number for a document
CREATE OR REPLACE FUNCTION get_next_document_version_number(doc_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get the highest version number for this document
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM document_versions
    WHERE document_id = doc_id;

    RETURN next_version;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION get_next_document_version_number(UUID) OWNER TO postgres;

-- Create a function to automatically set the version number before insert
CREATE OR REPLACE FUNCTION set_document_version_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set version_number if it's not already set
    IF NEW.version_number IS NULL OR NEW.version_number <= 0 THEN
        NEW.version_number := get_next_document_version_number(NEW.document_id);
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
 * current_version_id - The ID of the current version of the document - no
 *   foreign key constraint to prevent circular dependencies on the
 *   document_versions table, and requires the document to be created before
 *   the document version can be created
 * status - The status of the document
 * name - The name of the document
 * password - The password of the document
 * filename - The original filename of the document
 * completed_at - The timestamp when the document was completed
 * expired_at - The timestamp when the document expired
 * rejected_at - The timestamp when the document was rejected
 * created_at - The timestamp when the document was created
 * updated_at - The timestamp when the document was last updated
 */
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    current_version_id UUID,
    status document_status NOT NULL DEFAULT 'draft',
    name TEXT NOT NULL,
    password TEXT,
    filename TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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

-- Add the owner to the tables
ALTER TABLE documents OWNER TO postgres;

-- Add indexes to the documents table
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);

-- No RLS policies - only server can access and modify
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

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
 * user_id - The ID of the user who signed the document
 * order_index - The index of the user in the signing order
 *   - is -1 if the user is not in the signing order
 * status - The status of the user's signature
 * rejection_reason - The reason the user's signature was rejected
 * signature_type - The type of signature the user used
 * signature_data - The data of the user's signature
 * signed_at - The timestamp when the user signed the document
 * version_id - The ID of the document version
 * created_at - The timestamp when the document signer was created
 * updated_at - The timestamp when the document signer was last updated
 */
CREATE TABLE document_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    order_index INTEGER NOT NULL DEFAULT -1,
    status document_signer_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    signature_type TEXT,
    signature_data TEXT,
    signed_at TIMESTAMPTZ,
    version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE document_signers OWNER TO postgres;

CREATE INDEX idx_document_signers_document_id ON document_signers(document_id);
CREATE INDEX idx_document_signers_user_id ON document_signers(user_id);
CREATE INDEX idx_document_signers_status ON document_signers(status);
CREATE INDEX idx_document_signers_version_id ON document_signers(version_id);

-- No RLS policies - only server can access and modify
ALTER TABLE document_signers ENABLE ROW LEVEL SECURITY;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_document_signers_updated_at
    BEFORE UPDATE ON document_signers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to update document status based on signers' statuses
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
DECLARE
    total_signers INTEGER;
    signed_count INTEGER;
    rejected_count INTEGER;
    doc_id UUID;
BEGIN
    -- Determine which document ID to use based on the operation
    IF TG_OP = 'DELETE' THEN
        doc_id := OLD.document_id;
    ELSE
        doc_id := NEW.document_id;
    END IF;

    -- Count total signers, signed and rejected for this document
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE status = 'signed'),
           COUNT(*) FILTER (WHERE status = 'rejected')
    INTO total_signers, signed_count, rejected_count
    FROM document_signers
    WHERE document_id = doc_id;

    -- Update document status based on signers' statuses
    IF rejected_count > 0 THEN
        UPDATE documents SET status = 'rejected' WHERE id = doc_id;
    ELSIF signed_count = total_signers AND total_signers > 0 THEN
        UPDATE documents SET
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = doc_id;
    ELSIF signed_count > 0 AND signed_count < total_signers THEN
        UPDATE documents SET status = 'partially_signed' WHERE id = doc_id;
    ELSIF total_signers > 0 THEN
        UPDATE documents SET status = 'awaiting_signatures' WHERE id = doc_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION update_document_status() OWNER TO postgres;

-- Create triggers to update document status when signers change
CREATE TRIGGER update_document_status_on_signer_change
    AFTER INSERT OR UPDATE OR DELETE ON document_signers
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();

--
--
-- Transaction Functions
--
--

/**
 * Creates a new document with its initial version.
 * This function handles the entire transaction to ensure data consistency.
 *
 * @param p_user_id - The ID of the user creating the document
 * @param p_name - The name of the document
 * @param p_filename - The original filename
 * @param p_mime_type - The MIME type of the document
 * @param p_document_url - The URL where the document is stored
 * @param p_hash - The hash of the document
 * @param p_password - Optional password for the document
 * @return RECORD - Returns the created document and version records
 */
CREATE OR REPLACE FUNCTION create_document_with_version(
    p_user_id UUID,
    p_name TEXT,
    p_filename TEXT,
    p_mime_type TEXT,
    p_document_url TEXT,
    p_hash TEXT,
    p_password TEXT DEFAULT NULL
)
RETURNS TABLE(
    document_id UUID,
    version_id UUID,
    version_number INTEGER
) AS $$
DECLARE
    v_document_id UUID;
    v_version_id UUID;
    v_version_number INTEGER;
BEGIN
    -- Create the document
    INSERT INTO documents (
        user_id,
        name,
        filename,
        mime_type,
        password,
        status
    ) VALUES (
        p_user_id,
        p_name,
        p_filename,
        p_mime_type,
        p_password,
        'draft'
    ) RETURNING id INTO v_document_id;

    -- Create the initial version
    INSERT INTO document_versions (
        document_id,
        document_url,
        hash,
        created_by
    ) VALUES (
        v_document_id,
        p_document_url,
        p_hash,
        p_user_id
    ) RETURNING id, version_number INTO v_version_id, v_version_number;

    -- Update the document with the current version
    UPDATE documents
    SET current_version_id = v_version_id
    WHERE id = v_document_id;

    -- Return the results
    RETURN QUERY
    SELECT v_document_id, v_version_id, v_version_number;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION create_document_with_version(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

/**
 * Adds signers to a document.
 * This function handles the transaction to ensure data consistency.
 *
 * @param p_document_id - The ID of the document
 * @param p_signers - An array of JSON objects containing signer information
 * @return TABLE - Returns the created signer records
 */
CREATE OR REPLACE FUNCTION add_document_signers(
    p_document_id UUID,
    p_signers JSONB
)
RETURNS SETOF document_signers AS $$
DECLARE
    v_signer JSONB;
    v_result document_signers;
    v_order_index INTEGER;
BEGIN
    v_order_index := 1;

    -- Loop through each signer in the array
    FOR v_signer IN SELECT jsonb_array_elements(p_signers)
    LOOP
        -- Insert the signer
        INSERT INTO document_signers (
            document_id,
            user_id,
            order_index,
            status
        ) VALUES (
            p_document_id,
            (v_signer->>'user_id')::UUID,
            COALESCE((v_signer->>'order_index')::INTEGER, v_order_index),
            'pending'
        ) RETURNING * INTO v_result;

        -- Return the result
        RETURN NEXT v_result;

        -- Increment the order index
        v_order_index := v_order_index + 1;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION add_document_signers(UUID, JSONB) OWNER TO postgres;

/**
 * Signs a document by creating a new version and updating the signer status.
 * This function handles the transaction to ensure data consistency.
 *
 * @param p_document_id - The ID of the document
 * @param p_signer_id - The ID of the signer
 * @param p_user_id - The ID of the user signing the document
 * @param p_document_url - The URL of the signed document
 * @param p_hash - The hash of the signed document
 * @param p_signature_type - The type of signature used
 * @param p_signature_data - The signature data
 * @return TABLE - Returns information about the signing operation
 */
CREATE OR REPLACE FUNCTION sign_document(
    p_document_id UUID,
    p_signer_id UUID,
    p_user_id UUID,
    p_document_url TEXT,
    p_hash TEXT,
    p_signature_type TEXT DEFAULT NULL,
    p_signature_data TEXT DEFAULT NULL
)
RETURNS TABLE(
    version_id UUID,
    version_number INTEGER,
    document_status document_status
) AS $$
DECLARE
    v_version_id UUID;
    v_version_number INTEGER;
    v_document_status document_status;
BEGIN
    -- Create a new version
    INSERT INTO document_versions (
        document_id,
        document_url,
        hash,
        created_by
    ) VALUES (
        p_document_id,
        p_document_url,
        p_hash,
        p_user_id
    ) RETURNING id, version_number INTO v_version_id, v_version_number;

    -- Update the signer
    UPDATE document_signers
    SET
        status = 'signed',
        signature_type = p_signature_type,
        signature_data = p_signature_data,
        signed_at = CURRENT_TIMESTAMP,
        version_id = v_version_id
    WHERE id = p_signer_id;

    -- Update the document with the current version
    UPDATE documents
    SET current_version_id = v_version_id
    WHERE id = p_document_id
    RETURNING status INTO v_document_status;

    -- Return the results
    RETURN QUERY
    SELECT v_version_id, v_version_number, v_document_status;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION sign_document(UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT) OWNER TO postgres;

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

