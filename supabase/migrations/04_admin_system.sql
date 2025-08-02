-- Create admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id)
);

-- Create admin actions log table
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_users(user_id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_id UUID,
    target_type VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin settings table
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
('auto_approval_threshold', '51', 'Number of invitation requests per day to trigger auto-approval'),
('max_invitation_expiry_days', '30', 'Maximum days an invitation can be valid'),
('story_auto_publish', 'false', 'Whether to automatically publish approved stories'),
('email_notifications', 'true', 'Whether to send email notifications for admin actions'),
('maintenance_mode', 'false', 'Whether the system is in maintenance mode'),
('max_sessions_per_user', '10', 'Maximum sessions per user per month'),
('story_review_required', 'true', 'Whether stories require admin review before publishing');

-- Create indexes for performance
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_action ON admin_actions(action);
CREATE INDEX idx_admin_actions_target_id ON admin_actions(target_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at);

CREATE INDEX idx_admin_settings_key ON admin_settings(key);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Super admins can view all admin users"
    ON admin_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role = 'super_admin' 
            AND au.is_active = true
        )
    );

CREATE POLICY "Users can view their own admin record"
    ON admin_users FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Super admins can insert admin users"
    ON admin_users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role = 'super_admin' 
            AND au.is_active = true
        )
    );

CREATE POLICY "Super admins can update admin users"
    ON admin_users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role = 'super_admin' 
            AND au.is_active = true
        )
    );

-- RLS Policies for admin_actions
CREATE POLICY "Admins can view all admin actions"
    ON admin_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "Admins can insert admin actions"
    ON admin_actions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

-- RLS Policies for admin_settings
CREATE POLICY "Admins can view admin settings"
    ON admin_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "Admins can update admin settings"
    ON admin_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au 
            WHERE au.user_id = auth.uid() 
            AND au.role IN ('super_admin', 'admin') 
            AND au.is_active = true
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_updated_at_column();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_action VARCHAR(100),
    p_target_id UUID DEFAULT NULL,
    p_target_type VARCHAR(50) DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    action_id UUID;
BEGIN
    INSERT INTO admin_actions (admin_id, action, target_id, target_type, details)
    VALUES (auth.uid(), p_action, p_target_id, p_target_type, p_details)
    RETURNING id INTO action_id;
    
    RETURN action_id;
END;
$$ language 'plpgsql';

-- Add admin columns to existing tables
ALTER TABLE invitation_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE invitation_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invitation_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE stories ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS sessions_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);

-- Create admin dashboard view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM invitation_requests) as total_invitations,
    (SELECT COUNT(*) FROM invitation_requests WHERE status = 'pending') as pending_invitations,
    (SELECT COUNT(*) FROM invitation_requests WHERE status = 'approved') as approved_invitations,
    (SELECT COUNT(*) FROM stories) as total_stories,
    (SELECT COUNT(*) FROM stories WHERE status = 'pending') as pending_stories,
    (SELECT COUNT(*) FROM stories WHERE status IN ('approved', 'published')) as approved_stories,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
    (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as today_signups,
    (SELECT COUNT(*) FROM invitation_requests WHERE created_at >= CURRENT_DATE) as today_invitations;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_users TO authenticated;
GRANT SELECT, INSERT ON admin_actions TO authenticated;
GRANT SELECT, UPDATE ON admin_settings TO authenticated;
GRANT SELECT ON admin_dashboard_stats TO authenticated;

GRANT ALL ON admin_users TO service_role;
GRANT ALL ON admin_actions TO service_role;
GRANT ALL ON admin_settings TO service_role;
GRANT ALL ON admin_dashboard_stats TO service_role; 