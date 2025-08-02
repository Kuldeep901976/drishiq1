-- Create testimonials table for managing user testimonials with approval workflow
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_id UUID NOT NULL REFERENCES "Invitation"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    approved BOOLEAN NOT NULL DEFAULT false,
    published BOOLEAN NOT NULL DEFAULT false,
    user_consent BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMP WITH TIME ZONE,
    consent_requested BOOLEAN NOT NULL DEFAULT false,
    consent_request_date TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    featured_position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_testimonials_invitation_id ON testimonials(invitation_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(published);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_consent ON testimonials(user_consent);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured, featured_position);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at);

-- Create unique constraint to ensure one testimonial per invitation
CREATE UNIQUE INDEX IF NOT EXISTS idx_testimonials_unique_invitation ON testimonials(invitation_id);

-- Add RLS policies
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all testimonials
CREATE POLICY "Admins can read all testimonials" ON testimonials
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for admins to insert testimonials
CREATE POLICY "Admins can insert testimonials" ON testimonials
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for admins to update testimonials
CREATE POLICY "Admins can update testimonials" ON testimonials
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for admins to delete testimonials
CREATE POLICY "Admins can delete testimonials" ON testimonials
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for users to read published testimonials
CREATE POLICY "Users can read published testimonials" ON testimonials
    FOR SELECT USING (
        published = true AND user_consent = true
    );

-- Policy for users to update their own testimonials (consent)
CREATE POLICY "Users can update their own testimonial consent" ON testimonials
    FOR UPDATE USING (
        invitation_id IN (
            SELECT id FROM "Invitation" 
            WHERE email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_testimonials_updated_at();

-- Function to validate testimonial workflow
CREATE OR REPLACE FUNCTION validate_testimonial_workflow()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure published testimonials are approved and have user consent
    IF NEW.published = true THEN
        IF NEW.approved = false THEN
            RAISE EXCEPTION 'Testimonial must be approved before publishing';
        END IF;
        
        IF NEW.user_consent = false THEN
            RAISE EXCEPTION 'User consent required before publishing';
        END IF;
    END IF;
    
    -- Ensure rating is within valid range
    IF NEW.rating < 1 OR NEW.rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    
    -- Set consent date when user gives consent
    IF NEW.user_consent = true AND OLD.user_consent = false THEN
        NEW.consent_date = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate testimonial workflow
CREATE TRIGGER validate_testimonial_workflow_trigger
    BEFORE INSERT OR UPDATE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION validate_testimonial_workflow();

-- Function to get testimonial statistics
CREATE OR REPLACE FUNCTION get_testimonial_stats()
RETURNS TABLE (
    total_testimonials BIGINT,
    pending_approval BIGINT,
    approved BIGINT,
    published BIGINT,
    needs_consent BIGINT,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_testimonials,
        COUNT(*) FILTER (WHERE approved = false) as pending_approval,
        COUNT(*) FILTER (WHERE approved = true) as approved,
        COUNT(*) FILTER (WHERE published = true) as published,
        COUNT(*) FILTER (WHERE approved = true AND user_consent = false) as needs_consent,
        ROUND(AVG(rating)::numeric, 2) as average_rating
    FROM testimonials;
END;
$$ LANGUAGE plpgsql; 