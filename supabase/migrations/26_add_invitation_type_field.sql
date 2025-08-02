-- Add invitation_type field to Invitations table
-- This field will be used for the new invitation dashboard system

-- Add invitation_type enum
DO $$ BEGIN
    CREATE TYPE invitation_type_enum AS ENUM ('trial', 'need_support', 'testimonials', 'bulk_uploaded', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add invitation_type field to Invitations table
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS invitation_type invitation_type_enum DEFAULT 'general';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_invitation_type ON public.Invitations(invitation_type);

-- Update existing invitations to have appropriate types
-- Map existing categories to new invitation types
UPDATE public.Invitations 
SET invitation_type = CASE 
    WHEN category = 'testimonial' THEN 'testimonials'
    WHEN category = 'story' THEN 'general'
    WHEN category = 'investment' THEN 'general'
    ELSE 'general'
END
WHERE invitation_type IS NULL OR invitation_type = 'general';

-- Insert some test data for demonstration
INSERT INTO public.Invitations (name, email, phone, language, challenge, status, invitation_type, created_at)
VALUES 
    ('John Doe', 'john@example.com', '+1234567890', 'en', 'Looking for trial access', 'pending', 'trial', NOW() - INTERVAL '2 days'),
    ('Jane Smith', 'jane@example.com', '+1234567891', 'en', 'Need support with platform', 'pending', 'need_support', NOW() - INTERVAL '1 day'),
    ('Bob Wilson', 'bob@example.com', '+1234567892', 'en', 'Want to share testimonial', 'approved', 'testimonials', NOW() - INTERVAL '3 days'),
    ('Alice Brown', 'alice@example.com', '+1234567893', 'en', 'Bulk upload request', 'pending', 'bulk_uploaded', NOW() - INTERVAL '4 days'),
    ('Charlie Davis', 'charlie@example.com', '+1234567894', 'en', 'Trial access needed', 'used', 'trial', NOW() - INTERVAL '5 days'),
    ('Diana Evans', 'diana@example.com', '+1234567895', 'en', 'Support request', 'approved', 'need_support', NOW() - INTERVAL '6 days'),
    ('Frank Garcia', 'frank@example.com', '+1234567896', 'en', 'Testimonial submission', 'pending', 'testimonials', NOW() - INTERVAL '7 days'),
    ('Grace Harris', 'grace@example.com', '+1234567897', 'en', 'Bulk upload inquiry', 'expired', 'bulk_uploaded', NOW() - INTERVAL '8 days')
ON CONFLICT (email) DO NOTHING; 