CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL UNIQUE,
    chain TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE users OWNER TO postgres;

CREATE INDEX idx_users_wallet_address ON users(wallet_address);

-- No RLS policies so only the service role key can access the table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


CREATE OR REPLACE FUNCTION get_or_create_wallet(
    p_wallet_address text,
    p_chain text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id uuid;
BEGIN
    -- Try inserting first - optimistic approach
    INSERT INTO users (
        wallet_address,
        chain
    )
    VALUES (
        LOWER(TRIM(p_wallet_address)),  -- Normalize wallet address
        p_chain
    )
    ON CONFLICT (wallet_address) DO NOTHING
    RETURNING id INTO v_wallet_id;

    -- If insert failed (conflict), get existing record
    IF v_wallet_id IS NULL THEN
        SELECT id INTO v_wallet_id
        FROM users
        WHERE wallet_address = LOWER(TRIM(p_wallet_address));
    END IF;

    RETURN v_wallet_id;
END;
$$;
