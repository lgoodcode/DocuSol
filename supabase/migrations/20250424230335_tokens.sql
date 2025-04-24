-- Stores email verification tokens for documents. Key off of the email address of
-- the participant because the participant may not be a registered user.
CREATE TABLE email_verification_tokens (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    token uuid DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    email text NOT NULL,
    document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT NOW() NOT NULL,
    used_at timestamptz DEFAULT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_email ON email_verification_tokens(email);
CREATE INDEX idx_email_verification_tokens_document_id ON email_verification_tokens(document_id);

-- Enable Row Level Security (RLS)
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Allow service roles full access"
ON email_verification_tokens
FOR ALL
USING (true) -- Applies to roles like service_role
WITH CHECK (true);
