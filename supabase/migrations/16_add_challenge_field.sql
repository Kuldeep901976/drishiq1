-- Add Challenge Field Migration
-- This migration adds the challenge field to the Invitations table for storing optional challenge/problem descriptions

-- Add challenge field to Invitations table
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS challenge TEXT;

-- Add index for challenge field searches (optional, for admin filtering)
CREATE INDEX IF NOT EXISTS idx_invitations_challenge ON public.Invitations(challenge) WHERE challenge IS NOT NULL;

-- Update the invitation creation function to handle challenge field
CREATE OR REPLACE FUNCTION create_invitation_with_challenge(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_language TEXT,
    p_location TEXT DEFAULT NULL,
    p_challenge TEXT DEFAULT NULL,
    p_invitation_type TEXT DEFAULT 'regular',
    p_created_by UUID DEFAULT NULL,
    p_expiry_days INTEGER DEFAULT 7
)
RETURNS UUID AS $$
DECLARE
    v_invitation_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate unique token
    v_token := 'INV-' || substr(md5(random()::text), 1, 8) || '-' || substr(md5(random()::text), 1, 4);
    
    -- Calculate expiry date
    v_expires_at := NOW() + (p_expiry_days || ' days')::INTERVAL;
    
    -- Insert invitation
    INSERT INTO public.Invitations (
        name,
        email,
        phone,
        language,
        location,
        challenge,
        token,
        expires_at,
        invitation_type,
        created_by,
        status
    ) VALUES (
        p_name,
        p_email,
        p_phone,
        p_language,
        p_location,
        p_challenge,
        v_token,
        v_expires_at,
        p_invitation_type,
        p_created_by,
        'pending'
    ) RETURNING id INTO v_invitation_id;
    
    RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for admin to see invitations with challenges
CREATE OR REPLACE VIEW admin_invitations_with_challenges AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.language,
    i.location,
    i.challenge,
    i.token,
    i.status,
    i.invitation_type,
    i.created_at,
    i.expires_at,
    i.created_by,
    CASE 
        WHEN i.challenge IS NOT NULL AND i.challenge != '' THEN true 
        ELSE false 
    END as has_challenge,
    CASE 
        WHEN i.challenge IS NOT NULL AND i.challenge != '' THEN 
            CASE 
                WHEN length(i.challenge) > 100 THEN substr(i.challenge, 1, 100) || '...'
                ELSE i.challenge
            END
        ELSE NULL
    END as challenge_preview
FROM public.Invitations i
ORDER BY i.created_at DESC;

-- Add RLS policy for challenge field access
-- (This assumes RLS is already enabled on the Invitations table)
-- Admins can see all challenges, users can only see their own
CREATE POLICY "Users can view their own invitation challenges" ON public.Invitations
    FOR SELECT USING (
        email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Grant permissions
GRANT SELECT ON admin_invitations_with_challenges TO authenticated;
GRANT EXECUTE ON FUNCTION create_invitation_with_challenge TO authenticated; 