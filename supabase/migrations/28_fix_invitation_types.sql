-- Fix Invitation Types Migration
-- This migration ensures the invitation_type field has the correct values for our dashboard

-- First, let's see what values currently exist
-- SELECT DISTINCT invitation_type FROM Invitations;

-- Update existing invitation_type values to match our dashboard expectations
UPDATE Invitations 
SET invitation_type = CASE 
    WHEN invitation_type = 'trial' THEN 'trial'
    WHEN invitation_type = 'needy_support' OR invitation_type = 'need_support' THEN 'need_support'
    WHEN invitation_type = 'testimonial' OR invitation_type = 'testimonials' THEN 'testimonials'
    WHEN invitation_type = 'bulk_upload' OR invitation_type = 'bulk_uploaded' THEN 'bulk_uploaded'
    WHEN invitation_category = 'Trial access' THEN 'trial'
    WHEN invitation_category = 'Need Support' THEN 'need_support'
    ELSE 'general'
END
WHERE invitation_type IS NOT NULL;

-- Also update based on invitation_category if invitation_type is null or general
UPDATE Invitations 
SET invitation_type = CASE 
    WHEN invitation_category = 'Trial access' THEN 'trial'
    WHEN invitation_category = 'Need Support' THEN 'need_support'
    ELSE 'general'
END
WHERE invitation_type IS NULL OR invitation_type = 'general';

-- Ensure we have the correct enum type
DO $$ BEGIN
    CREATE TYPE invitation_type_enum AS ENUM ('trial', 'need_support', 'testimonials', 'bulk_uploaded', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the column to use the enum type
ALTER TABLE Invitations 
ALTER COLUMN invitation_type TYPE invitation_type_enum 
USING invitation_type::invitation_type_enum;

-- Add more test data with correct types
INSERT INTO Invitations (name, email, phone, language, challenge, status, invitation_type, created_at)
VALUES 
    ('Sarah Johnson', 'sarah.trial@example.com', '+1234567898', 'en', 'Looking for trial access to evaluate platform', 'pending', 'trial', NOW() - INTERVAL '1 day'),
    ('Mike Chen', 'mike.support@example.com', '+1234567899', 'en', 'Need technical support with features', 'pending', 'need_support', NOW() - INTERVAL '2 days'),
    ('Lisa Rodriguez', 'lisa.testimonial@example.com', '+1234567900', 'en', 'Want to share success story', 'approved', 'testimonials', NOW() - INTERVAL '3 days'),
    ('David Kim', 'david.bulk@example.com', '+1234567901', 'en', 'Bulk upload for enterprise team', 'pending', 'bulk_uploaded', NOW() - INTERVAL '4 days'),
    ('Emma Wilson', 'emma.trial2@example.com', '+1234567902', 'en', 'Trial access for research project', 'used', 'trial', NOW() - INTERVAL '5 days'),
    ('Tom Anderson', 'tom.support2@example.com', '+1234567903', 'en', 'Support request for integration', 'approved', 'need_support', NOW() - INTERVAL '6 days'),
    ('Maria Garcia', 'maria.testimonial2@example.com', '+1234567904', 'en', 'Testimonial about transformation', 'pending', 'testimonials', NOW() - INTERVAL '7 days'),
    ('James Brown', 'james.bulk2@example.com', '+1234567905', 'en', 'Bulk upload for organization', 'expired', 'bulk_uploaded', NOW() - INTERVAL '8 days')
ON CONFLICT (email) DO NOTHING;

-- Create a view for easy admin access
CREATE OR REPLACE VIEW admin_invitations_dashboard AS
SELECT 
    id,
    name,
    email,
    phone,
    language,
    challenge,
    status,
    invitation_type,
    created_at,
    updated_at,
    token,
    expires_at
FROM Invitations
ORDER BY created_at DESC;

-- Grant permissions
GRANT SELECT ON admin_invitations_dashboard TO authenticated; 