-- Comprehensive User System with Profile, Sessions, Tokens, Bandwidth, and Storage Tracking
-- This migration creates a complete system for user management and resource tracking

-- 1. Enhanced User Profile Table with All Attributes
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'));
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS education_level TEXT CHECK (education_level IN ('high_school', 'bachelor', 'master', 'phd', 'other'));
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS preferred_communication TEXT CHECK (preferred_communication IN ('email', 'sms', 'push', 'in_app'));
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}';
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}';
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. User Subscription and Plan Management
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    plan_id UUID,
    plan_name TEXT NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise', 'custom')),
    status TEXT CHECK (status IN ('active', 'expired', 'cancelled', 'suspended', 'pending')) DEFAULT 'active',
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_method_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    credits_included INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    credits_remaining INTEGER DEFAULT 0,
    features JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Resource Usage Tracking
CREATE TABLE user_resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_end TIMESTAMP WITH TIME ZONE,
    
    -- Bandwidth tracking
    bandwidth_used_mb DECIMAL(15,2) DEFAULT 0,
    bandwidth_limit_mb DECIMAL(15,2),
    bandwidth_reset_date TIMESTAMP WITH TIME ZONE,
    
    -- Storage tracking
    storage_used_mb DECIMAL(15,2) DEFAULT 0,
    storage_limit_mb DECIMAL(15,2),
    storage_reset_date TIMESTAMP WITH TIME ZONE,
    
    -- API usage
    api_calls_made INTEGER DEFAULT 0,
    api_calls_limit INTEGER,
    api_calls_reset_date TIMESTAMP WITH TIME ZONE,
    
    -- Session tracking
    sessions_created INTEGER DEFAULT 0,
    sessions_limit INTEGER,
    sessions_reset_date TIMESTAMP WITH TIME ZONE,
    
    -- Token tracking
    tokens_used INTEGER DEFAULT 0,
    tokens_limit INTEGER,
    tokens_reset_date TIMESTAMP WITH TIME ZONE,
    
    -- Credits
    credits_used INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    credits_bonus INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Sessions with Resource Tracking
CREATE TABLE user_sessions_detailed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT,
    auth_provider TEXT NOT NULL,
    
    -- Session details
    session_type TEXT CHECK (session_type IN ('web', 'mobile', 'api', 'desktop')) DEFAULT 'web',
    device_type TEXT CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'unknown')) DEFAULT 'unknown',
    browser TEXT,
    os TEXT,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    
    -- Resource usage during session
    bandwidth_used_mb DECIMAL(15,2) DEFAULT 0,
    storage_used_mb DECIMAL(15,2) DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    
    -- Session timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    
    -- Session status
    is_active BOOLEAN DEFAULT TRUE,
    status TEXT CHECK (status IN ('active', 'idle', 'expired', 'terminated', 'error')) DEFAULT 'active',
    logout_reason TEXT,
    
    -- Performance metrics
    response_time_avg_ms DECIMAL(10,2),
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Files and Storage Management
CREATE TABLE user_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions_detailed(id) ON DELETE SET NULL,
    
    -- File details
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT NOT NULL,
    file_size_mb DECIMAL(10,2) GENERATED ALWAYS AS (file_size_bytes / 1048576.0) STORED,
    
    -- Storage info
    storage_bucket TEXT,
    storage_key TEXT,
    storage_provider TEXT CHECK (storage_provider IN ('local', 's3', 'supabase', 'gcs', 'azure')) DEFAULT 'local',
    
    -- File status
    status TEXT CHECK (status IN ('uploading', 'uploaded', 'processing', 'ready', 'error', 'deleted')) DEFAULT 'uploading',
    is_public BOOLEAN DEFAULT FALSE,
    is_encrypted BOOLEAN DEFAULT FALSE,
    
    -- Access control
    access_level TEXT CHECK (access_level IN ('private', 'shared', 'public')) DEFAULT 'private',
    shared_with UUID[],
    download_count INTEGER DEFAULT 0,
    
    -- Metadata
    tags TEXT[],
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 6. User API Tokens and Access Keys
CREATE TABLE user_api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    
    -- Token details
    token_name TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    token_prefix TEXT NOT NULL,
    token_type TEXT CHECK (token_type IN ('api_key', 'access_token', 'refresh_token', 'webhook_token')) DEFAULT 'api_key',
    
    -- Permissions
    permissions TEXT[],
    scopes TEXT[],
    allowed_ips INET[],
    allowed_domains TEXT[],
    
    -- Usage limits
    rate_limit_per_minute INTEGER,
    rate_limit_per_hour INTEGER,
    rate_limit_per_day INTEGER,
    usage_count INTEGER DEFAULT 0,
    
    -- Token status
    is_active BOOLEAN DEFAULT TRUE,
    is_revoked BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    created_from_ip INET,
    created_from_user_agent TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. User Activity and Analytics
CREATE TABLE user_activity_detailed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions_detailed(id) ON DELETE SET NULL,
    
    -- Activity details
    activity_type TEXT NOT NULL,
    activity_category TEXT CHECK (activity_category IN ('auth', 'profile', 'session', 'file', 'api', 'payment', 'support', 'other')),
    activity_subcategory TEXT,
    
    -- Resource usage for this activity
    bandwidth_used_mb DECIMAL(15,2) DEFAULT 0,
    storage_used_mb DECIMAL(15,2) DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    
    -- Activity data
    activity_data JSONB DEFAULT '{}',
    result_status TEXT CHECK (result_status IN ('success', 'error', 'warning', 'info')) DEFAULT 'success',
    error_message TEXT,
    
    -- Context
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    device_info JSONB DEFAULT '{}',
    
    -- Performance
    response_time_ms INTEGER,
    server_load DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. User Notifications and Communication
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.User(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type TEXT CHECK (notification_type IN ('email', 'sms', 'push', 'in_app', 'webhook')) NOT NULL,
    notification_category TEXT CHECK (notification_category IN ('auth', 'billing', 'security', 'usage', 'feature', 'support', 'marketing')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery status
    status TEXT CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery details
    recipient_email TEXT,
    recipient_phone TEXT,
    delivery_attempts INTEGER DEFAULT 0,
    error_message TEXT,
    
    -- Priority and scheduling
    priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- User interaction
    action_taken TEXT,
    action_data JSONB DEFAULT '{}',
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_plan_type ON user_subscriptions(plan_type);

CREATE INDEX idx_user_resource_usage_user_id ON user_resource_usage(user_id);
CREATE INDEX idx_user_resource_usage_period ON user_resource_usage(period_start, period_end);

CREATE INDEX idx_user_sessions_detailed_user_id ON user_sessions_detailed(user_id);
CREATE INDEX idx_user_sessions_detailed_session_token ON user_sessions_detailed(session_token);
CREATE INDEX idx_user_sessions_detailed_is_active ON user_sessions_detailed(is_active);
CREATE INDEX idx_user_sessions_detailed_expires_at ON user_sessions_detailed(expires_at);

CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_user_files_status ON user_files(status);
CREATE INDEX idx_user_files_storage_provider ON user_files(storage_provider);
CREATE INDEX idx_user_files_created_at ON user_files(created_at);

CREATE INDEX idx_user_api_tokens_user_id ON user_api_tokens(user_id);
CREATE INDEX idx_user_api_tokens_token_hash ON user_api_tokens(token_hash);
CREATE INDEX idx_user_api_tokens_is_active ON user_api_tokens(is_active);

CREATE INDEX idx_user_activity_detailed_user_id ON user_activity_detailed(user_id);
CREATE INDEX idx_user_activity_detailed_session_id ON user_activity_detailed(session_id);
CREATE INDEX idx_user_activity_detailed_activity_type ON user_activity_detailed(activity_type);
CREATE INDEX idx_user_activity_detailed_created_at ON user_activity_detailed(created_at);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_status ON user_notifications(status);
CREATE INDEX idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX idx_user_notifications_created_at ON user_notifications(created_at);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_detailed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own subscriptions" ON user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own resource usage" ON user_resource_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON user_sessions_detailed
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON user_files
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own API tokens" ON user_api_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON user_activity_detailed
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON user_notifications
    FOR ALL USING (auth.uid() = user_id);

-- Service role policies for admin functions
CREATE POLICY "Service role can manage all subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all resource usage" ON user_resource_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all sessions" ON user_sessions_detailed
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all files" ON user_files
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all API tokens" ON user_api_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all activity" ON user_activity_detailed
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all notifications" ON user_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic updates

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_percentage INTEGER := 0;
    total_fields INTEGER := 15; -- Total number of profile fields
    filled_fields INTEGER := 0;
BEGIN
    -- Count filled fields
    IF NEW.first_name IS NOT NULL AND NEW.first_name != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.date_of_birth IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.city IS NOT NULL AND NEW.city != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.country IS NOT NULL AND NEW.country != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.occupation IS NOT NULL AND NEW.occupation != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.company IS NOT NULL AND NEW.company != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.job_title IS NOT NULL AND NEW.job_title != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.industry IS NOT NULL AND NEW.industry != '' THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.experience_level IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.education_level IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN filled_fields := filled_fields + 1; END IF;
    
    -- Calculate percentage
    completion_percentage := ROUND((filled_fields::DECIMAL / total_fields) * 100);
    
    -- Update the completion percentage and timestamp
    NEW.profile_completion_percentage := completion_percentage;
    NEW.profile_updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profile completion
CREATE TRIGGER trigger_update_profile_completion
    BEFORE INSERT OR UPDATE ON public.User
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Function to track resource usage
CREATE OR REPLACE FUNCTION track_resource_usage(
    p_user_id UUID,
    p_bandwidth_mb DECIMAL DEFAULT 0,
    p_storage_mb DECIMAL DEFAULT 0,
    p_api_calls INTEGER DEFAULT 0,
    p_tokens INTEGER DEFAULT 0,
    p_credits INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    -- Update current period usage
    INSERT INTO user_resource_usage (
        user_id,
        bandwidth_used_mb,
        storage_used_mb,
        api_calls_made,
        tokens_used,
        credits_used
    ) VALUES (
        p_user_id,
        p_bandwidth_mb,
        p_storage_mb,
        p_api_calls,
        p_tokens,
        p_credits
    )
    ON CONFLICT (user_id) DO UPDATE SET
        bandwidth_used_mb = user_resource_usage.bandwidth_used_mb + EXCLUDED.bandwidth_used_mb,
        storage_used_mb = user_resource_usage.storage_used_mb + EXCLUDED.storage_used_mb,
        api_calls_made = user_resource_usage.api_calls_made + EXCLUDED.api_calls_made,
        tokens_used = user_resource_usage.tokens_used + EXCLUDED.tokens_used,
        credits_used = user_resource_usage.credits_used + EXCLUDED.credits_used,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user dashboard summary
CREATE OR REPLACE FUNCTION get_user_dashboard_summary(p_user_id UUID)
RETURNS TABLE (
    profile_completion INTEGER,
    subscription_status TEXT,
    credits_remaining INTEGER,
    bandwidth_used_mb DECIMAL,
    bandwidth_limit_mb DECIMAL,
    storage_used_mb DECIMAL,
    storage_limit_mb DECIMAL,
    active_sessions INTEGER,
    total_files INTEGER,
    api_tokens_count INTEGER,
    unread_notifications INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.profile_completion_percentage,
        COALESCE(us.status, 'no_subscription') as subscription_status,
        COALESCE(us.credits_remaining, 0) as credits_remaining,
        COALESCE(uru.bandwidth_used_mb, 0) as bandwidth_used_mb,
        COALESCE(uru.bandwidth_limit_mb, 0) as bandwidth_limit_mb,
        COALESCE(uru.storage_used_mb, 0) as storage_used_mb,
        COALESCE(uru.storage_limit_mb, 0) as storage_limit_mb,
        COUNT(usd.id)::INTEGER as active_sessions,
        COUNT(uf.id)::INTEGER as total_files,
        COUNT(uat.id)::INTEGER as api_tokens_count,
        COUNT(un.id)::INTEGER as unread_notifications
    FROM public.User u
    LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
    LEFT JOIN user_resource_usage uru ON u.id = uru.user_id
    LEFT JOIN user_sessions_detailed usd ON u.id = usd.user_id AND usd.is_active = TRUE
    LEFT JOIN user_files uf ON u.id = uf.user_id AND uf.status != 'deleted'
    LEFT JOIN user_api_tokens uat ON u.id = uat.user_id AND uat.is_active = TRUE
    LEFT JOIN user_notifications un ON u.id = un.user_id AND un.status = 'delivered'
    WHERE u.id = p_user_id
    GROUP BY u.profile_completion_percentage, us.status, us.credits_remaining, 
             uru.bandwidth_used_mb, uru.bandwidth_limit_mb, uru.storage_used_mb, uru.storage_limit_mb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_resource_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions_detailed TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_api_tokens TO authenticated;
GRANT SELECT, INSERT ON user_activity_detailed TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_notifications TO authenticated;

GRANT ALL ON user_subscriptions TO service_role;
GRANT ALL ON user_resource_usage TO service_role;
GRANT ALL ON user_sessions_detailed TO service_role;
GRANT ALL ON user_files TO service_role;
GRANT ALL ON user_api_tokens TO service_role;
GRANT ALL ON user_activity_detailed TO service_role;
GRANT ALL ON user_notifications TO service_role; 