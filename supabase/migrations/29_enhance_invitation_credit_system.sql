-- Enhance Invitation Credit System Migration
-- This migration adds credit management fields to the Invitations table

-- Add credit-related fields to Invitations table
ALTER TABLE public.Invitations 
ADD COLUMN IF NOT EXISTS credits_allocated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS supporter_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS needy_id UUID REFERENCES needy_individuals(id),
ADD COLUMN IF NOT EXISTS credit_allocation_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS credit_usage_date TIMESTAMP WITH TIME ZONE;

-- Add testimonials-specific fields
ALTER TABLE public.Invitations 
ADD COLUMN IF NOT EXISTS testimonial_rating INTEGER CHECK (testimonial_rating >= 1 AND testimonial_rating <= 5),
ADD COLUMN IF NOT EXISTS testimonial_content TEXT,
ADD COLUMN IF NOT EXISTS testimonial_category TEXT CHECK (testimonial_category IN ('product', 'service', 'impact', 'transformation')),
ADD COLUMN IF NOT EXISTS is_featured_testimonial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_position INTEGER DEFAULT 0;

-- Add bulk upload tracking fields
ALTER TABLE public.Invitations 
ADD COLUMN IF NOT EXISTS bulk_upload_id UUID REFERENCES needy_bulk_uploads(id),
ADD COLUMN IF NOT EXISTS upload_row_number INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_credits_allocated ON public.Invitations(credits_allocated);
CREATE INDEX IF NOT EXISTS idx_invitations_credits_used ON public.Invitations(credits_used);
CREATE INDEX IF NOT EXISTS idx_invitations_supporter_id ON public.Invitations(supporter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_needy_id ON public.Invitations(needy_id);
CREATE INDEX IF NOT EXISTS idx_invitations_testimonial_rating ON public.Invitations(testimonial_rating);
CREATE INDEX IF NOT EXISTS idx_invitations_is_featured_testimonial ON public.Invitations(is_featured_testimonial);
CREATE INDEX IF NOT EXISTS idx_invitations_featured_position ON public.Invitations(featured_position);
CREATE INDEX IF NOT EXISTS idx_invitations_bulk_upload_id ON public.Invitations(bulk_upload_id);

-- Create view for credit management
CREATE OR REPLACE VIEW invitation_credit_summary AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.invitation_type,
    i.status,
    i.credits_allocated,
    i.credits_used,
    (i.credits_allocated - i.credits_used) as available_credits,
    i.supporter_id,
    u.name as supporter_name,
    i.needy_id,
    ni.full_name as needy_name,
    i.credit_allocation_date,
    i.credit_usage_date,
    i.created_at
FROM public.Invitations i
LEFT JOIN users u ON i.supporter_id = u.id
LEFT JOIN needy_individuals ni ON i.needy_id = ni.id
WHERE i.credits_allocated > 0
ORDER BY i.created_at DESC;

-- Create view for testimonials management
CREATE OR REPLACE VIEW testimonials_management AS
SELECT 
    i.id,
    i.name,
    i.email,
    i.phone,
    i.language,
    i.status,
    i.testimonial_rating,
    i.testimonial_content,
    i.testimonial_category,
    i.is_featured_testimonial,
    i.featured_position,
    i.created_at,
    i.updated_at
FROM public.Invitations i
WHERE i.invitation_type = 'testimonials'
ORDER BY i.is_featured_testimonial DESC, i.featured_position ASC, i.created_at DESC;

-- Create function to allocate credits to invitation
CREATE OR REPLACE FUNCTION allocate_credits_to_invitation(
    p_invitation_id UUID,
    p_supporter_id UUID,
    p_needy_id UUID DEFAULT NULL,
    p_credits INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM public.Invitations 
    WHERE id = p_invitation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;
    
    -- Check if credits already allocated
    IF invitation_record.credits_allocated > 0 THEN
        RAISE EXCEPTION 'Credits already allocated to this invitation';
    END IF;
    
    -- Update invitation with credit allocation
    UPDATE public.Invitations 
    SET 
        credits_allocated = p_credits,
        supporter_id = p_supporter_id,
        needy_id = p_needy_id,
        credit_allocation_date = NOW(),
        status = 'approved'
    WHERE id = p_invitation_id;
    
    -- Insert credit transaction record
    INSERT INTO support_credit_transactions (
        allocation_id,
        supporter_id,
        needy_id,
        transaction_type,
        credits_amount,
        balance_before,
        balance_after,
        invitation_id,
        invitation_type,
        description
    ) VALUES (
        NULL, -- No specific allocation for invitation credits
        p_supporter_id,
        p_needy_id,
        'allocation',
        p_credits,
        0,
        p_credits,
        p_invitation_id,
        invitation_record.invitation_type,
        'Credit allocated for invitation: ' || invitation_record.name
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to use credits for invitation
CREATE OR REPLACE FUNCTION use_credits_for_invitation(
    p_invitation_id UUID,
    p_credits_used INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation_record 
    FROM public.Invitations 
    WHERE id = p_invitation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitation not found';
    END IF;
    
    -- Check if enough credits are available
    IF (invitation_record.credits_allocated - invitation_record.credits_used) < p_credits_used THEN
        RAISE EXCEPTION 'Insufficient credits available';
    END IF;
    
    -- Update invitation with credit usage
    UPDATE public.Invitations 
    SET 
        credits_used = credits_used + p_credits_used,
        credit_usage_date = NOW(),
        status = 'used'
    WHERE id = p_invitation_id;
    
    -- Insert credit transaction record
    INSERT INTO support_credit_transactions (
        allocation_id,
        supporter_id,
        needy_id,
        transaction_type,
        credits_amount,
        balance_before,
        balance_after,
        invitation_id,
        invitation_type,
        description
    ) VALUES (
        NULL,
        invitation_record.supporter_id,
        invitation_record.needy_id,
        'usage',
        p_credits_used,
        invitation_record.credits_allocated - invitation_record.credits_used,
        invitation_record.credits_allocated - invitation_record.credits_used - p_credits_used,
        p_invitation_id,
        invitation_record.invitation_type,
        'Credits used for invitation: ' || invitation_record.name
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update testimonial
CREATE OR REPLACE FUNCTION update_testimonial(
    p_invitation_id UUID,
    p_rating INTEGER,
    p_content TEXT,
    p_category TEXT,
    p_is_featured BOOLEAN DEFAULT FALSE,
    p_featured_position INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validate rating
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 1 and 5';
    END IF;
    
    -- Validate category
    IF p_category NOT IN ('product', 'service', 'impact', 'transformation') THEN
        RAISE EXCEPTION 'Invalid testimonial category';
    END IF;
    
    -- Update testimonial fields
    UPDATE public.Invitations 
    SET 
        testimonial_rating = p_rating,
        testimonial_content = p_content,
        testimonial_category = p_category,
        is_featured_testimonial = p_is_featured,
        featured_position = p_featured_position,
        updated_at = NOW()
    WHERE id = p_invitation_id AND invitation_type = 'testimonials';
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON invitation_credit_summary TO authenticated;
GRANT SELECT ON testimonials_management TO authenticated;
GRANT EXECUTE ON FUNCTION allocate_credits_to_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION use_credits_for_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION update_testimonial TO authenticated;

-- Enable RLS on new fields
ALTER TABLE public.Invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for credit management
CREATE POLICY "Admins can manage invitation credits" ON public.Invitations
    FOR ALL USING (auth.role() = 'admin');

CREATE POLICY "Users can view their own invitation credits" ON public.Invitations
    FOR SELECT USING (auth.uid() = supporter_id OR auth.uid() = created_by); 