-- Add Trial Access and Need Support Categories Migration
-- This migration adds new category options to the invitation_category enum

-- First, we need to create a new enum with the additional values
DO $$ BEGIN
    CREATE TYPE invitation_category_new AS ENUM ('investment', 'story', 'testimonial', 'general', 'trial_access', 'need_support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing records to use the new enum
ALTER TABLE public.Invitations 
ALTER COLUMN category TYPE invitation_category_new 
USING category::text::invitation_category_new;

-- Drop the old enum and rename the new one
DROP TYPE invitation_category;
ALTER TYPE invitation_category_new RENAME TO invitation_category;

-- Add challenge domain, sub_category, and specific_challenge fields for detailed challenge tracking
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS challenge_domain TEXT;
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS challenge_sub_category TEXT;
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS challenge_specific TEXT;
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS challenge_other_text TEXT;

-- Add indexes for the new challenge fields
CREATE INDEX IF NOT EXISTS idx_invitations_challenge_domain ON public.Invitations(challenge_domain) WHERE challenge_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_challenge_sub_category ON public.Invitations(challenge_sub_category) WHERE challenge_sub_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_challenge_specific ON public.Invitations(challenge_specific) WHERE challenge_specific IS NOT NULL;

-- Update the invitation creation function to handle new fields
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
        category,
        challenge,
        challenge_domain,
        challenge_sub_category,
        challenge_specific,
        challenge_other_text,
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
        p_category,
        p_challenge,
        p_challenge_domain,
        p_challenge_sub_category,
        p_challenge_specific,
        p_challenge_other_text,
        v_token,
        v_expires_at,
        p_invitation_type,
        p_created_by,
        'pending'
    ) RETURNING id INTO v_invitation_id;
    
    RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql;

-- Create a view for admin to see all invitation types with challenge details
CREATE OR REPLACE VIEW admin_invitations_detailed AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.language,
    i.location,
    i.category,
    i.challenge,
    i.challenge_domain,
    i.challenge_sub_category,
    i.challenge_specific,
    i.challenge_other_text,
    i.token,
    i.status,
    i.invitation_type,
    i.created_at,
    i.expires_at,
    i.created_by,
    CASE 
        WHEN i.category = 'need_support' AND i.challenge_domain IS NOT NULL THEN true 
        ELSE false 
    END as has_challenge_details,
    CASE 
        WHEN i.category = 'need_support' THEN 
            COALESCE(
                i.challenge_domain || ' > ' || 
                COALESCE(i.challenge_sub_category, '') || ' > ' || 
                COALESCE(i.challenge_specific, ''),
                i.challenge
            )
        ELSE NULL
    END as challenge_summary
FROM public.Invitations i
ORDER BY i.created_at DESC;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_invitation_with_challenge_detailed TO authenticated;
GRANT SELECT ON admin_invitations_detailed TO authenticated; 