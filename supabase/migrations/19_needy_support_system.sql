-- Needy Support System Migration
-- This migration creates tables for managing needy individuals and support credit allocations

-- Needy individuals table
CREATE TABLE needy_individuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Location and demographics
    country TEXT,
    state TEXT,
    city TEXT,
    postal_code TEXT,
    language TEXT DEFAULT 'en',
    
    -- Financial and social status
    income_level TEXT CHECK (income_level IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    employment_status TEXT CHECK (employment_status IN ('unemployed', 'part_time', 'full_time', 'student', 'retired', 'disabled')),
    education_level TEXT CHECK (education_level IN ('none', 'primary', 'secondary', 'bachelor', 'master', 'phd')),
    
    -- Support needs and preferences
    support_needs TEXT[], -- Array of needs like ['education', 'healthcare', 'employment', 'housing']
    preferred_invitation_types TEXT[], -- Array of invitation types they're interested in
    urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- Contact preferences
    contact_preference TEXT CHECK (contact_preference IN ('email', 'phone', 'sms', 'whatsapp')) DEFAULT 'email',
    contact_time TEXT CHECK (contact_time IN ('morning', 'afternoon', 'evening', 'anytime')) DEFAULT 'anytime',
    
    -- Status and tracking
    status TEXT CHECK (status IN ('active', 'inactive', 'contacted', 'enrolled', 'completed')) DEFAULT 'active',
    priority_score INTEGER DEFAULT 0, -- Calculated based on various factors
    last_contact_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Verification and validation
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    
    -- Metadata
    source TEXT, -- How they were added: 'manual', 'bulk_upload', 'referral', 'application'
    tags TEXT[], -- Custom tags for categorization
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support credit allocations table
CREATE TABLE support_credit_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    needy_id UUID NOT NULL REFERENCES needy_individuals(id) ON DELETE CASCADE,
    
    -- Credit allocation details
    allocated_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER DEFAULT 0,
    available_credits INTEGER GENERATED ALWAYS AS (allocated_credits - used_credits) STORED,
    
    -- Allocation purpose and restrictions
    purpose TEXT CHECK (purpose IN ('general', 'education', 'healthcare', 'employment', 'housing', 'specific_invitation')) DEFAULT 'general',
    invitation_type_restriction TEXT[], -- Restrict to specific invitation types
    max_credits_per_invitation INTEGER DEFAULT 1,
    
    -- Validity and expiration
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Tracking
    created_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(supporter_id, needy_id, purpose)
);

-- Support credit transactions table
CREATE TABLE support_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES support_credit_allocations(id) ON DELETE CASCADE,
    supporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    needy_id UUID NOT NULL REFERENCES needy_individuals(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type TEXT CHECK (transaction_type IN ('allocation', 'usage', 'refund', 'expiry', 'adjustment')) NOT NULL,
    credits_amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Context
    invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
    invitation_type TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Admin tracking
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Needy invitation requests table
CREATE TABLE needy_invitation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    needy_id UUID NOT NULL REFERENCES needy_individuals(id) ON DELETE CASCADE,
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('story', 'testimonial')),
    
    -- Request details
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'sent', 'completed')) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    requested_credits INTEGER DEFAULT 1,
    
    -- Allocation details
    allocated_credits INTEGER DEFAULT 0,
    supporter_id UUID REFERENCES users(id),
    allocation_id UUID REFERENCES support_credit_allocations(id),
    
    -- Request context
    reason TEXT,
    urgency_notes TEXT,
    admin_notes TEXT,
    
    -- Processing
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk upload tracking table
CREATE TABLE needy_bulk_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    
    -- Upload status
    status TEXT CHECK (status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
    error_message TEXT,
    
    -- Processing details
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Uploader
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulk upload errors table
CREATE TABLE needy_bulk_upload_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES needy_bulk_uploads(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    field_name TEXT,
    error_message TEXT NOT NULL,
    raw_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_needy_individuals_status ON needy_individuals(status);
CREATE INDEX idx_needy_individuals_priority_score ON needy_individuals(priority_score);
CREATE INDEX idx_needy_individuals_urgency_level ON needy_individuals(urgency_level);
CREATE INDEX idx_needy_individuals_country ON needy_individuals(country);
CREATE INDEX idx_needy_individuals_support_needs ON needy_individuals USING GIN(support_needs);
CREATE INDEX idx_needy_individuals_preferred_invitation_types ON needy_individuals USING GIN(preferred_invitation_types);

CREATE INDEX idx_support_credit_allocations_supporter_id ON support_credit_allocations(supporter_id);
CREATE INDEX idx_support_credit_allocations_needy_id ON support_credit_allocations(needy_id);
CREATE INDEX idx_support_credit_allocations_active ON support_credit_allocations(is_active);
CREATE INDEX idx_support_credit_allocations_valid_to ON support_credit_allocations(valid_to);

CREATE INDEX idx_support_credit_transactions_allocation_id ON support_credit_transactions(allocation_id);
CREATE INDEX idx_support_credit_transactions_supporter_id ON support_credit_transactions(supporter_id);
CREATE INDEX idx_support_credit_transactions_needy_id ON support_credit_transactions(needy_id);
CREATE INDEX idx_support_credit_transactions_created_at ON support_credit_transactions(created_at);

CREATE INDEX idx_needy_invitation_requests_needy_id ON needy_invitation_requests(needy_id);
CREATE INDEX idx_needy_invitation_requests_status ON needy_invitation_requests(status);
CREATE INDEX idx_needy_invitation_requests_invitation_type ON needy_invitation_requests(invitation_type);
CREATE INDEX idx_needy_invitation_requests_priority ON needy_invitation_requests(priority);

CREATE INDEX idx_needy_bulk_uploads_status ON needy_bulk_uploads(status);
CREATE INDEX idx_needy_bulk_uploads_uploaded_by ON needy_bulk_uploads(uploaded_by);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_needy_individuals_updated_at 
    BEFORE UPDATE ON needy_individuals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_credit_allocations_updated_at 
    BEFORE UPDATE ON support_credit_allocations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_needy_invitation_requests_updated_at 
    BEFORE UPDATE ON needy_invitation_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_needy_bulk_uploads_updated_at 
    BEFORE UPDATE ON needy_bulk_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for easy reporting
CREATE OR REPLACE VIEW needy_support_summary AS
SELECT 
    n.id as needy_id,
    n.full_name,
    n.email,
    n.phone,
    n.status as needy_status,
    n.urgency_level,
    n.priority_score,
    COUNT(DISTINCT sca.id) as total_allocations,
    SUM(sca.allocated_credits) as total_allocated_credits,
    SUM(sca.used_credits) as total_used_credits,
    SUM(sca.available_credits) as total_available_credits,
    COUNT(DISTINCT nir.id) as total_invitation_requests,
    COUNT(DISTINCT CASE WHEN nir.status = 'pending' THEN nir.id END) as pending_requests,
    COUNT(DISTINCT CASE WHEN nir.status = 'sent' THEN nir.id END) as sent_invitations
FROM needy_individuals n
LEFT JOIN support_credit_allocations sca ON n.id = sca.needy_id AND sca.is_active = true
LEFT JOIN needy_invitation_requests nir ON n.id = nir.needy_id
GROUP BY n.id, n.full_name, n.email, n.phone, n.status, n.urgency_level, n.priority_score;

CREATE OR REPLACE VIEW supporter_impact_summary AS
SELECT 
    u.id as supporter_id,
    u.email as supporter_email,
    u.full_name as supporter_name,
    COUNT(DISTINCT sca.needy_id) as total_needy_supported,
    SUM(sca.allocated_credits) as total_credits_allocated,
    SUM(sca.used_credits) as total_credits_used,
    SUM(sca.available_credits) as total_credits_available,
    COUNT(DISTINCT sct.id) as total_transactions,
    MAX(sct.created_at) as last_transaction_date
FROM users u
LEFT JOIN support_credit_allocations sca ON u.id = sca.supporter_id AND sca.is_active = true
LEFT JOIN support_credit_transactions sct ON u.id = sct.supporter_id
GROUP BY u.id, u.email, u.full_name;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION calculate_needy_priority_score(needy_uuid UUID)
RETURNS INTEGER
LANGUAGE PLPGSQL
AS $$
DECLARE
    score INTEGER := 0;
    needy_record RECORD;
BEGIN
    -- Get needy individual record
    SELECT * INTO needy_record FROM needy_individuals WHERE id = needy_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Base score from urgency level
    CASE needy_record.urgency_level
        WHEN 'critical' THEN score := score + 100;
        WHEN 'high' THEN score := score + 75;
        WHEN 'medium' THEN score := score + 50;
        WHEN 'low' THEN score := score + 25;
    END CASE;
    
    -- Score from income level (lower income = higher priority)
    CASE needy_record.income_level
        WHEN 'very_low' THEN score := score + 50;
        WHEN 'low' THEN score := score + 40;
        WHEN 'medium' THEN score := score + 30;
        WHEN 'high' THEN score := score + 20;
        WHEN 'very_high' THEN score := score + 10;
    END CASE;
    
    -- Score from employment status
    CASE needy_record.employment_status
        WHEN 'unemployed' THEN score := score + 30;
        WHEN 'part_time' THEN score := score + 20;
        WHEN 'student' THEN score := score + 25;
        WHEN 'disabled' THEN score := score + 35;
        WHEN 'retired' THEN score := score + 15;
        WHEN 'full_time' THEN score := score + 10;
    END CASE;
    
    -- Score from education level (lower education = higher priority)
    CASE needy_record.education_level
        WHEN 'none' THEN score := score + 40;
        WHEN 'primary' THEN score := score + 30;
        WHEN 'secondary' THEN score := score + 20;
        WHEN 'bachelor' THEN score := score + 10;
        WHEN 'master' THEN score := score + 5;
        WHEN 'phd' THEN score := score + 0;
    END CASE;
    
    -- Bonus for verified individuals
    IF needy_record.is_verified THEN
        score := score + 10;
    END IF;
    
    -- Bonus for recent activity
    IF needy_record.last_contact_date IS NOT NULL AND 
       needy_record.last_contact_date > NOW() - INTERVAL '30 days' THEN
        score := score + 15;
    END IF;
    
    RETURN score;
END;
$$;

-- Function to allocate support credits
CREATE OR REPLACE FUNCTION allocate_support_credits(
    supporter_uuid UUID,
    needy_uuid UUID,
    credits_amount INTEGER,
    purpose_text TEXT DEFAULT 'general',
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    notes_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE PLPGSQL
AS $$
DECLARE
    allocation_uuid UUID;
    current_user_uuid UUID;
BEGIN
    -- Get current user (assuming this is called from authenticated context)
    current_user_uuid := auth.uid();
    
    -- Create allocation
    INSERT INTO support_credit_allocations (
        supporter_id,
        needy_id,
        allocated_credits,
        purpose,
        valid_to,
        notes,
        created_by
    ) VALUES (
        supporter_uuid,
        needy_uuid,
        credits_amount,
        purpose_text,
        valid_until,
        notes_text,
        current_user_uuid
    ) RETURNING id INTO allocation_uuid;
    
    -- Record transaction
    INSERT INTO support_credit_transactions (
        allocation_id,
        supporter_id,
        needy_id,
        transaction_type,
        credits_amount,
        balance_before,
        balance_after,
        description,
        created_by
    ) VALUES (
        allocation_uuid,
        supporter_uuid,
        needy_uuid,
        'allocation',
        credits_amount,
        0,
        credits_amount,
        'Initial credit allocation',
        current_user_uuid
    );
    
    RETURN allocation_uuid;
END;
$$;

-- Function to use support credits for invitation
CREATE OR REPLACE FUNCTION use_support_credits_for_invitation(
    needy_uuid UUID,
    invitation_type_text TEXT,
    credits_needed INTEGER DEFAULT 1,
    reason_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
AS $$
DECLARE
    allocation_record RECORD;
    available_credits INTEGER;
    current_user_uuid UUID;
BEGIN
    -- Get current user
    current_user_uuid := auth.uid();
    
    -- Find available allocation for this needy individual
    SELECT sca.* INTO allocation_record
    FROM support_credit_allocations sca
    WHERE sca.needy_id = needy_uuid
        AND sca.is_active = true
        AND sca.available_credits >= credits_needed
        AND (sca.valid_to IS NULL OR sca.valid_to > NOW())
        AND (sca.invitation_type_restriction IS NULL OR 
             invitation_type_text = ANY(sca.invitation_type_restriction))
    ORDER BY sca.available_credits DESC, sca.created_at ASC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if we have enough credits
    available_credits := allocation_record.available_credits;
    IF available_credits < credits_needed THEN
        RETURN FALSE;
    END IF;
    
    -- Update allocation
    UPDATE support_credit_allocations
    SET used_credits = used_credits + credits_needed,
        updated_at = NOW()
    WHERE id = allocation_record.id;
    
    -- Record transaction
    INSERT INTO support_credit_transactions (
        allocation_id,
        supporter_id,
        needy_id,
        transaction_type,
        credits_amount,
        balance_before,
        balance_after,
        invitation_type,
        description,
        created_by
    ) VALUES (
        allocation_record.id,
        allocation_record.supporter_id,
        needy_uuid,
        'usage',
        credits_needed,
        available_credits,
        available_credits - credits_needed,
        invitation_type_text,
        reason_text,
        current_user_uuid
    );
    
    RETURN TRUE;
END;
$$;

-- Enable RLS
ALTER TABLE needy_individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE needy_invitation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE needy_bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE needy_bulk_upload_errors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for needy_individuals
CREATE POLICY "Admins can manage all needy individuals" ON needy_individuals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Supporters can view needy individuals they support" ON needy_individuals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_credit_allocations 
            WHERE support_credit_allocations.needy_id = needy_individuals.id
            AND support_credit_allocations.supporter_id = auth.uid()
        )
    );

-- RLS Policies for support_credit_allocations
CREATE POLICY "Admins can manage all allocations" ON support_credit_allocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Supporters can view their own allocations" ON support_credit_allocations
    FOR SELECT USING (supporter_id = auth.uid());

CREATE POLICY "Supporters can update their own allocations" ON support_credit_allocations
    FOR UPDATE USING (supporter_id = auth.uid());

-- RLS Policies for support_credit_transactions
CREATE POLICY "Admins can view all transactions" ON support_credit_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Supporters can view their own transactions" ON support_credit_transactions
    FOR SELECT USING (supporter_id = auth.uid());

-- RLS Policies for needy_invitation_requests
CREATE POLICY "Admins can manage all requests" ON needy_invitation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- RLS Policies for bulk uploads
CREATE POLICY "Admins can manage bulk uploads" ON needy_bulk_uploads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own uploads" ON needy_bulk_uploads
    FOR SELECT USING (uploaded_by = auth.uid());

-- RLS Policies for bulk upload errors
CREATE POLICY "Admins can view all upload errors" ON needy_bulk_upload_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view errors from their uploads" ON needy_bulk_upload_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM needy_bulk_uploads 
            WHERE needy_bulk_uploads.id = needy_bulk_upload_errors.upload_id
            AND needy_bulk_uploads.uploaded_by = auth.uid()
        )
    ); 