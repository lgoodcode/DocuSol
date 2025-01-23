CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    password TEXT,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    unsigned_hash TEXT NOT NULL UNIQUE,
    signed_hash TEXT UNIQUE,
    unsigned_transaction_signature TEXT,
    signed_transaction_signature TEXT,
    unsigned_document BYTEA NOT NULL,
    signed_document BYTEA,
    is_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documents OWNER TO postgres;

CREATE INDEX idx_documents_unsigned_hash ON documents(unsigned_hash);
CREATE INDEX idx_documents_signed_hash ON documents(signed_hash);
CREATE INDEX idx_documents_created_at ON documents(created_at);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Simplified policies without user authentication
CREATE POLICY "Allow read access" ON documents FOR SELECT USING (true);
CREATE POLICY "Allow insert" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update of unsigned documents" ON documents FOR UPDATE USING (signed_hash IS NULL);
CREATE POLICY "Allow delete of unsigned documents" ON documents FOR DELETE USING (signed_hash IS NULL);
