-- Add missing columns to Invitations table to capture all form details
ALTER TABLE IF EXISTS Invitations 
ADD COLUMN IF NOT EXISTS invitation_category TEXT,
ADD COLUMN IF NOT EXISTS domain_of_life TEXT,
ADD COLUMN IF NOT EXISTS type_of_challenge TEXT,
ADD COLUMN IF NOT EXISTS specific_issue TEXT,
ADD COLUMN IF NOT EXISTS challenge_description TEXT,
ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_category ON Invitations(invitation_category);
CREATE INDEX IF NOT EXISTS idx_invitations_type ON Invitations(invitation_type);
CREATE INDEX IF NOT EXISTS idx_invitations_domain ON Invitations(domain_of_life);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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