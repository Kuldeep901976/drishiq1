-- Add country code and share challenge fields to Invitations table
-- This migration adds country code support and a free text challenge field

-- Add country code field
ALTER TABLE public.Invitations 
ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91';

-- Add share challenge field for both trial access and need support
ALTER TABLE public.Invitations 
ADD COLUMN IF NOT EXISTS share_challenge TEXT;

-- Create index for country code
CREATE INDEX IF NOT EXISTS idx_invitations_country_code ON public.Invitations(country_code);

-- Update the create_invitation_with_challenge_detailed function to include new fields
CREATE OR REPLACE FUNCTION create_invitation_with_challenge_detailed(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_language TEXT,
    p_location TEXT DEFAULT NULL,
    p_category invitation_category DEFAULT 'general',
    p_challenge TEXT DEFAULT NULL,
    p_challenge_domain TEXT DEFAULT NULL,
    p_challenge_sub_category TEXT DEFAULT NULL,
    p_challenge_specific TEXT DEFAULT NULL,
    p_challenge_other_text TEXT DEFAULT NULL,
    p_invitation_type TEXT DEFAULT 'regular',
    p_created_by UUID DEFAULT NULL,
    p_expiry_days INTEGER DEFAULT 7,
    p_country_code TEXT DEFAULT '+91',
    p_share_challenge TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    invitation_id UUID;
    invitation_token TEXT;
BEGIN
    -- Generate unique token
    invitation_token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert invitation with all fields
    INSERT INTO public.Invitations (
        name,
        email,
        phone,
        language,
        location,
        category,
        challenge,
        challenge_domain,
        challenge_sub_category,
        challenge_specific,
        challenge_other_text,
        invitation_type,
        created_by,
        token,
        expires_at,
        country_code,
        share_challenge
    ) VALUES (
        p_name,
        p_email,
        p_phone,
        p_language,
        p_location,
        p_category,
        p_challenge,
        p_challenge_domain,
        p_challenge_sub_category,
        p_challenge_specific,
        p_challenge_other_text,
        p_invitation_type,
        p_created_by,
        invitation_token,
        NOW() + INTERVAL '1 day' * p_expiry_days,
        p_country_code,
        p_share_challenge
    ) RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql; 