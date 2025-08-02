-- Magic Links Table Migration
-- This migration creates the magic_links table for storing magic link data after phone verification

-- Magic links table
CREATE TABLE IF NOT EXISTS magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invitation_token TEXT,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for magic links
CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_invitation_token ON magic_links(invitation_token);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_links_used ON magic_links(used);

-- Enable Row Level Security
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Magic links policies (admin only access for now)
CREATE POLICY "Admins can view all magic links" ON magic_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert magic links" ON magic_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can update magic links" ON magic_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Functions for magic link management
CREATE OR REPLACE FUNCTION create_magic_link(
    p_email TEXT,
    p_invitation_token TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    magic_token TEXT;
    expiry_time TIMESTAMP WITH TIME ZONE;
    magic_id UUID;
BEGIN
    -- Generate unique token
    magic_token := gen_random_uuid();
    
    -- Set expiry to 24 hours from now
    expiry_time := NOW() + INTERVAL '24 hours';
    
    -- Insert magic link
    INSERT INTO magic_links (
        email,
        token,
        expires_at,
        invitation_token
    ) VALUES (
        p_email,
        magic_token,
        expiry_time,
        p_invitation_token
    ) RETURNING id INTO magic_id;
    
    RETURN QUERY
    SELECT 
        magic_id,
        magic_token,
        expiry_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify and use magic link
CREATE OR REPLACE FUNCTION verify_magic_link(p_token TEXT)
RETURNS TABLE (
    valid BOOLEAN,
    email TEXT,
    invitation_token TEXT,
    error_message TEXT
) AS $$
DECLARE
    magic_record magic_links%ROWTYPE;
BEGIN
    -- Find the magic link
    SELECT * INTO magic_record
    FROM magic_links
    WHERE token = p_token;
    
    -- Check if magic link exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 'Invalid magic link token';
        RETURN;
    END IF;
    
    -- Check if already used
    IF magic_record.used THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 'Magic link has already been used';
        RETURN;
    END IF;
    
    -- Check if expired
    IF magic_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT, 'Magic link has expired';
        RETURN;
    END IF;
    
    -- Mark as used
    UPDATE magic_links
    SET used = TRUE, used_at = NOW()
    WHERE token = p_token;
    
    -- Return success
    RETURN QUERY SELECT TRUE, magic_record.email, magic_record.invitation_token, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM magic_links
    WHERE expires_at < NOW() AND used = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger
CREATE TRIGGER update_magic_links_updated_at 
    BEFORE UPDATE ON magic_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO magic_links (email, token, expires_at, invitation_token) VALUES
-- ('test@example.com', gen_random_uuid(), NOW() + INTERVAL '24 hours', 'sample-invitation-token'); 