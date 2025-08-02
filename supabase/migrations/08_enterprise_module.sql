-- Enterprise Module Migration
-- This migration creates the enterprise user management system

-- Enterprise roles and permissions
CREATE TYPE enterprise_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'trial', 'expired', 'cancelled');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    size VARCHAR(50),
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Status and billing
    status organization_status DEFAULT 'trial',
    billing_email VARCHAR(255),
    tax_id VARCHAR(50),
    
    -- Limits and configuration
    max_users INTEGER DEFAULT 10,
    max_credits INTEGER DEFAULT 1000,
    features JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Indexes
    INDEX idx_organizations_slug (slug),
    INDEX idx_organizations_status (status),
    INDEX idx_organizations_created_by (created_by)
);

-- Organization members table
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role enterprise_role DEFAULT 'member',
    
    -- Permissions
    permissions JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    -- Invitation tracking
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id),
    INDEX idx_organization_members_org_id (organization_id),
    INDEX idx_organization_members_user_id (user_id),
    INDEX idx_organization_members_role (role)
);

-- Organization invitations table
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role enterprise_role DEFAULT 'member',
    
    -- Invitation details
    token VARCHAR(255) UNIQUE NOT NULL,
    status invitation_status DEFAULT 'pending',
    message TEXT,
    permissions JSONB DEFAULT '{}',
    
    -- Expiry and limits
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    
    -- Tracking
    invited_by UUID NOT NULL REFERENCES users(id),
    accepted_by UUID REFERENCES users(id),
    accepted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, email),
    INDEX idx_organization_invitations_org_id (organization_id),
    INDEX idx_organization_invitations_email (email),
    INDEX idx_organization_invitations_token (token),
    INDEX idx_organization_invitations_status (status)
);

-- Organization credit pools table
CREATE TABLE organization_credit_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Credit management
    total_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER DEFAULT 0,
    available_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
    
    -- Allocation rules
    allocation_rules JSONB DEFAULT '{}',
    auto_refill BOOLEAN DEFAULT FALSE,
    refill_threshold INTEGER DEFAULT 0,
    refill_amount INTEGER DEFAULT 0,
    
    -- Limits
    daily_limit INTEGER DEFAULT 0,
    weekly_limit INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 0,
    
    -- Usage tracking
    daily_used INTEGER DEFAULT 0,
    weekly_used INTEGER DEFAULT 0,
    monthly_used INTEGER DEFAULT 0,
    
    -- Reset dates
    daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
    weekly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 week'),
    monthly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_organization_credit_pools_org_id (organization_id),
    INDEX idx_organization_credit_pools_active (is_active)
);

-- User credit allocations table
CREATE TABLE user_credit_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_pool_id UUID NOT NULL REFERENCES organization_credit_pools(id) ON DELETE CASCADE,
    
    -- Allocation
    allocated_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER DEFAULT 0,
    available_credits INTEGER GENERATED ALWAYS AS (allocated_credits - used_credits) STORED,
    
    -- Limits
    daily_limit INTEGER DEFAULT 0,
    weekly_limit INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 0,
    
    -- Usage tracking
    daily_used INTEGER DEFAULT 0,
    weekly_used INTEGER DEFAULT 0,
    monthly_used INTEGER DEFAULT 0,
    
    -- Reset dates
    daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 day'),
    weekly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 week'),
    monthly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id, credit_pool_id),
    INDEX idx_user_credit_allocations_org_id (organization_id),
    INDEX idx_user_credit_allocations_user_id (user_id),
    INDEX idx_user_credit_allocations_pool_id (credit_pool_id)
);

-- Organization billing table
CREATE TABLE organization_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Billing details
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    billing_date INTEGER DEFAULT 1,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    
    -- Subscription details
    plan_name VARCHAR(100),
    plan_price_per_user DECIMAL(10,2),
    plan_base_price DECIMAL(10,2),
    plan_credit_allowance INTEGER DEFAULT 0,
    
    -- Usage tracking
    current_users INTEGER DEFAULT 0,
    current_credits_used INTEGER DEFAULT 0,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Payment information
    payment_method_id VARCHAR(255),
    last_payment_date TIMESTAMP WITH TIME ZONE,
    last_payment_amount DECIMAL(10,2),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_organization_billing_org_id (organization_id),
    INDEX idx_organization_billing_next_billing (next_billing_date)
);

-- Organization activity logs table
CREATE TABLE organization_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Activity details
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    activity_data JSONB DEFAULT '{}',
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_organization_activity_logs_org_id (organization_id),
    INDEX idx_organization_activity_logs_user_id (user_id),
    INDEX idx_organization_activity_logs_type (activity_type),
    INDEX idx_organization_activity_logs_timestamp (timestamp)
);

-- Create indexes for better performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_contact_email ON organizations(contact_email);
CREATE INDEX idx_organization_members_active ON organization_members(is_active);
CREATE INDEX idx_organization_invitations_expires_at ON organization_invitations(expires_at);

-- Add RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_credit_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Organization owners can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Users can create organizations" ON organizations
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Organization members policies
CREATE POLICY "Members can view their organization members" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can manage organization members" ON organization_members
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Organization invitations policies
CREATE POLICY "Members can view organization invitations" ON organization_invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can manage organization invitations" ON organization_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Credit pools policies
CREATE POLICY "Members can view organization credit pools" ON organization_credit_pools
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "Admins can manage organization credit pools" ON organization_credit_pools
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- User credit allocations policies
CREATE POLICY "Users can view their own credit allocations" ON user_credit_allocations
    FOR SELECT USING (
        user_id = auth.uid() OR 
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

CREATE POLICY "Admins can manage user credit allocations" ON user_credit_allocations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Organization billing policies
CREATE POLICY "Owners can view organization billing" ON organization_billing
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Owners can manage organization billing" ON organization_billing
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Activity logs policies
CREATE POLICY "Members can view organization activity logs" ON organization_activity_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "System can create activity logs" ON organization_activity_logs
    FOR INSERT WITH CHECK (TRUE);

-- Create functions for enterprise management
CREATE OR REPLACE FUNCTION create_organization_with_owner(
    org_name VARCHAR(255),
    org_slug VARCHAR(100),
    owner_id UUID
) RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, slug, created_by)
    VALUES (org_name, org_slug, owner_id)
    RETURNING id INTO org_id;
    
    -- Add owner as member
    INSERT INTO organization_members (organization_id, user_id, role, invited_by)
    VALUES (org_id, owner_id, 'owner', owner_id);
    
    -- Create default credit pool
    INSERT INTO organization_credit_pools (organization_id, name, description, total_credits)
    VALUES (org_id, 'Default Pool', 'Default credit pool for the organization', 1000);
    
    -- Log activity
    INSERT INTO organization_activity_logs (organization_id, user_id, activity_type, activity_description)
    VALUES (org_id, owner_id, 'organization_created', 'Organization created');
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION accept_organization_invitation(
    invitation_token VARCHAR(255),
    accepting_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    invitation_record organization_invitations%ROWTYPE;
    result JSONB;
BEGIN
    -- Get invitation record
    SELECT * INTO invitation_record 
    FROM organization_invitations 
    WHERE token = invitation_token AND status = 'pending' AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = invitation_record.organization_id 
        AND user_id = accepting_user_id
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'User is already a member');
    END IF;
    
    -- Add user to organization
    INSERT INTO organization_members (
        organization_id, user_id, role, permissions, 
        invited_by, invited_at
    ) VALUES (
        invitation_record.organization_id, 
        accepting_user_id, 
        invitation_record.role, 
        invitation_record.permissions,
        invitation_record.invited_by,
        invitation_record.created_at
    );
    
    -- Update invitation status
    UPDATE organization_invitations 
    SET 
        status = 'accepted',
        accepted_by = accepting_user_id,
        accepted_at = NOW(),
        used_count = used_count + 1,
        updated_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Log activity
    INSERT INTO organization_activity_logs (
        organization_id, user_id, activity_type, activity_description
    ) VALUES (
        invitation_record.organization_id, 
        accepting_user_id, 
        'member_joined', 
        'User accepted invitation and joined organization'
    );
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'organization_id', invitation_record.organization_id,
        'role', invitation_record.role
    );
END;
$$ LANGUAGE plpgsql;

-- Create views for analytics
CREATE VIEW organization_analytics AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.status,
    COUNT(DISTINCT om.user_id) as total_members,
    COUNT(DISTINCT CASE WHEN om.is_active = TRUE THEN om.user_id END) as active_members,
    COUNT(DISTINCT CASE WHEN om.role = 'owner' THEN om.user_id END) as owners,
    COUNT(DISTINCT CASE WHEN om.role = 'admin' THEN om.user_id END) as admins,
    COUNT(DISTINCT CASE WHEN om.role = 'manager' THEN om.user_id END) as managers,
    COUNT(DISTINCT CASE WHEN om.role = 'member' THEN om.user_id END) as members,
    COUNT(DISTINCT CASE WHEN om.role = 'viewer' THEN om.user_id END) as viewers,
    COALESCE(SUM(cp.total_credits), 0) as total_credits,
    COALESCE(SUM(cp.used_credits), 0) as used_credits,
    COALESCE(SUM(cp.available_credits), 0) as available_credits,
    o.created_at,
    MAX(om.last_activity_at) as last_activity_at
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN organization_credit_pools cp ON o.id = cp.organization_id AND cp.is_active = TRUE
GROUP BY o.id, o.name, o.status, o.created_at;

CREATE VIEW organization_member_analytics AS
SELECT 
    om.organization_id,
    om.user_id,
    u.email,
    u.name,
    om.role,
    om.is_active,
    om.joined_at,
    om.last_activity_at,
    COALESCE(SUM(uca.allocated_credits), 0) as allocated_credits,
    COALESCE(SUM(uca.used_credits), 0) as used_credits,
    COALESCE(SUM(uca.available_credits), 0) as available_credits,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_sessions,
    COALESCE(SUM(s.credits_deducted), 0) as total_credits_used_in_sessions
FROM organization_members om
JOIN users u ON om.user_id = u.id
LEFT JOIN user_credit_allocations uca ON om.organization_id = uca.organization_id AND om.user_id = uca.user_id
LEFT JOIN user_sessions s ON om.user_id = s.user_id
GROUP BY om.organization_id, om.user_id, u.email, u.name, om.role, om.is_active, om.joined_at, om.last_activity_at; 