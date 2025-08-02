-- Invitation Types System Migration
-- This migration creates tables for different types of invitations and their management

-- Add invitation_type enum to existing Invitations table if not exists
DO $$ BEGIN
    CREATE TYPE invitation_category AS ENUM ('story', 'testimonial', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category field to Invitations table
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS category invitation_category DEFAULT 'general';



-- Create Story Management table
CREATE TABLE IF NOT EXISTS story_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.Invitations(id) ON DELETE CASCADE,
    story_title TEXT,
    story_category TEXT, -- 'success', 'challenge', 'transformation', 'insight'
    story_summary TEXT,
    featured_position INTEGER, -- For ordering on stories page
    is_featured BOOLEAN DEFAULT false,
    story_tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Testimonial Management table
CREATE TABLE IF NOT EXISTS testimonial_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.Invitations(id) ON DELETE CASCADE,
    testimonial_type TEXT, -- 'user', 'expert', 'celebrity', 'partner'
    testimonial_category TEXT, -- 'product', 'service', 'impact', 'transformation'
    featured_position INTEGER, -- For ordering on testimonials page
    is_featured BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    testimonial_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_category ON public.Invitations(category);

CREATE INDEX IF NOT EXISTS idx_story_invitations_invitation_id ON story_invitations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_testimonial_invitations_invitation_id ON testimonial_invitations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_story_invitations_featured ON story_invitations(is_featured, featured_position);
CREATE INDEX IF NOT EXISTS idx_testimonial_invitations_featured ON testimonial_invitations(is_featured, featured_position);

-- Create views for admin management

CREATE OR REPLACE VIEW admin_story_invitations AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.language,
    i.challenge,
    i.status,
    i.created_at,
    si.story_title,
    si.story_category,
    si.story_summary,
    si.featured_position,
    si.is_featured,
    si.story_tags
FROM public.Invitations i
LEFT JOIN story_invitations si ON i.id = si.invitation_id
WHERE i.category = 'story'
ORDER BY si.featured_position NULLS LAST, i.created_at DESC;

CREATE OR REPLACE VIEW admin_testimonial_invitations AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.language,
    i.challenge,
    i.status,
    i.created_at,
    ti.testimonial_type,
    ti.testimonial_category,
    ti.featured_position,
    ti.is_featured,
    ti.rating,
    ti.testimonial_summary
FROM public.Invitations i
LEFT JOIN testimonial_invitations ti ON i.id = ti.invitation_id
WHERE i.category = 'testimonial'
ORDER BY ti.featured_position NULLS LAST, i.created_at DESC;

-- Enable RLS on new tables
ALTER TABLE investment_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies


CREATE POLICY "Admins can manage story invitations" ON story_invitations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Admins can manage testimonial invitations" ON testimonial_invitations
    FOR ALL USING (auth.role() = 'admin');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON story_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON testimonial_invitations TO authenticated;

GRANT SELECT ON admin_story_invitations TO authenticated;
GRANT SELECT ON admin_testimonial_invitations TO authenticated;

-- Create functions for managing invitations

CREATE OR REPLACE FUNCTION create_story_invitation(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_language TEXT,
    p_challenge TEXT,
    p_story_title TEXT,
    p_story_category TEXT,
    p_story_summary TEXT,
    p_story_tags TEXT[]
) RETURNS UUID AS $$
DECLARE
    invitation_id UUID;
BEGIN
    -- Create the main invitation
    INSERT INTO public.Invitations (name, email, phone, language, challenge, category, status)
    VALUES (p_name, p_email, p_phone, p_language, p_challenge, 'story', 'pending')
    RETURNING id INTO invitation_id;
    
    -- Create the story invitation details
    INSERT INTO story_invitations (
        invitation_id, story_title, story_category, story_summary, story_tags
    ) VALUES (
        invitation_id, p_story_title, p_story_category, p_story_summary, p_story_tags
    );
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_testimonial_invitation(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_language TEXT,
    p_challenge TEXT,
    p_testimonial_type TEXT,
    p_testimonial_category TEXT,
    p_rating INTEGER,
    p_testimonial_summary TEXT
) RETURNS UUID AS $$
DECLARE
    invitation_id UUID;
BEGIN
    -- Create the main invitation
    INSERT INTO public.Invitations (name, email, phone, language, challenge, category, status)
    VALUES (p_name, p_email, p_phone, p_language, p_challenge, 'testimonial', 'pending')
    RETURNING id INTO invitation_id;
    
    -- Create the testimonial invitation details
    INSERT INTO testimonial_invitations (
        invitation_id, testimonial_type, testimonial_category, rating, testimonial_summary
    ) VALUES (
        invitation_id, p_testimonial_type, p_testimonial_category, p_rating, p_testimonial_summary
    );
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 