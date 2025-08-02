-- Fix Invitation Fields Migration
-- This migration ensures all required fields for the invitation form are present

-- Add missing fields to Invitations table if they don't exist
ALTER TABLE IF EXISTS Invitations 
ADD COLUMN IF NOT EXISTS invitation_category TEXT,
ADD COLUMN IF NOT EXISTS domain_of_life TEXT,
ADD COLUMN IF NOT EXISTS type_of_challenge TEXT,
ADD COLUMN IF NOT EXISTS specific_issue TEXT,
ADD COLUMN IF NOT EXISTS challenge_description TEXT,
ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS challenge TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_category ON Invitations(invitation_category);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON Invitations(invitation_type);
CREATE INDEX IF NOT EXISTS idx_invitations_domain ON Invitations(domain_of_life);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON Invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON Invitations(expires_at);

-- Add trigger to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_invitations_updated_at ON Invitations;
CREATE TRIGGER update_invitations_updated_at 
    BEFORE UPDATE ON Invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN Invitations.invitation_category IS 'Type of invitation: Trial access or Need Support';
COMMENT ON COLUMN Invitations.domain_of_life IS 'Domain of life selected by user';
COMMENT ON COLUMN Invitations.type_of_challenge IS 'Type of challenge within the domain';
COMMENT ON COLUMN Invitations.specific_issue IS 'Specific issue within the challenge type';
COMMENT ON COLUMN Invitations.challenge_description IS 'User description of their biggest challenge';
COMMENT ON COLUMN Invitations.metadata IS 'Additional form data and context';
COMMENT ON COLUMN Invitations.token IS 'Unique invitation token for access';
COMMENT ON COLUMN Invitations.expires_at IS 'Invitation expiration timestamp';
COMMENT ON COLUMN Invitations.created_by IS 'User who created the invitation';

-- Ensure needy_individuals table has all required fields
ALTER TABLE IF EXISTS needy_individuals 
ADD COLUMN IF NOT EXISTS support_needs TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS urgency_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for needy_individuals
CREATE INDEX IF NOT EXISTS idx_needy_individuals_email ON needy_individuals(email);
CREATE INDEX IF NOT EXISTS idx_needy_individuals_status ON needy_individuals(status);
CREATE INDEX IF NOT EXISTS idx_needy_individuals_source ON needy_individuals(source);

-- Create a view for admin to see all invitation types
CREATE OR REPLACE VIEW admin_all_invitations AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.language,
    i.invitation_category,
    i.domain_of_life,
    i.type_of_challenge,
    i.specific_issue,
    i.challenge_description,
    i.status,
    i.invitation_type,
    i.category,
    i.token,
    i.expires_at,
    i.created_at,
    i.updated_at,
    i.metadata,
    CASE 
        WHEN i.invitation_category = 'Trial access' THEN 'trial'
        WHEN i.invitation_category = 'Need Support' THEN 'needy_support'
        ELSE i.invitation_type
    END as display_type
FROM Invitations i
ORDER BY i.created_at DESC;

-- Grant permissions
GRANT SELECT ON admin_all_invitations TO authenticated; 