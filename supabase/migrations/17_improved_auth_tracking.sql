-- Improved Authentication and Session Tracking System
-- This migration creates a comprehensive system for tracking all auth events

-- 1. Authentication Events Table (Track ALL attempts)
CREATE TABLE auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'signup_attempt', 'signup_success', 'signup_failed',
        'signin_attempt', 'signin_success', 'signin_failed',
        'password_reset_attempt', 'password_reset_success', 'password_reset_failed',
        'email_verification_attempt', 'email_verification_success', 'email_verification_failed',
        'phone_verification_attempt', 'phone_verification_success', 'phone_verification_failed',
        'social_signin_attempt', 'social_signin_success', 'social_signin_failed',
        'logout', 'session_expired', 'account_locked', 'account_unlocked'
    )),
    auth_provider TEXT CHECK (auth_provider IN ('email', 'google', 'facebook', 'linkedin', 'phone')),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Sessions Table (Detailed session tracking)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT,
    auth_provider TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    logout_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhanced User Profile Table
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS last_sign_in TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS sign_in_count INTEGER DEFAULT 0;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS failed_signin_attempts INTEGER DEFAULT 0;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.User ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{}';

-- 4. User Activity Log Table
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    activity_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Security Events Table
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'suspicious_login', 'multiple_failed_attempts', 'unusual_location',
        'password_change', 'email_change', 'phone_change',
        'two_factor_enabled', 'two_factor_disabled', 'account_locked',
        'account_unlocked', 'session_hijacking_attempt'
    )),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    ip_address INET,
    location_info JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX idx_auth_events_event_type ON auth_events(event_type);
CREATE INDEX idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX idx_auth_events_email ON auth_events(email);
CREATE INDEX idx_auth_events_success ON auth_events(success);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_session_id ON user_activity_log(session_id);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

-- Enable RLS
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_events
CREATE POLICY "Users can view own auth events" ON auth_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all auth events" ON auth_events
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON user_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view own activity" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all activity" ON user_activity_log
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for security_events
CREATE POLICY "Users can view own security events" ON security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all security events" ON security_events
    FOR ALL USING (auth.role() = 'service_role');

-- Functions for automatic updates

-- Function to update user's last sign in and increment count
CREATE OR REPLACE FUNCTION update_user_signin_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'signin_success' THEN
        UPDATE public.User 
        SET 
            last_sign_in = NOW(),
            sign_in_count = sign_in_count + 1,
            failed_signin_attempts = 0
        WHERE id = NEW.user_id;
    ELSIF NEW.event_type = 'signin_failed' THEN
        UPDATE public.User 
        SET failed_signin_attempts = failed_signin_attempts + 1
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth events
CREATE TRIGGER trigger_update_user_signin_stats
    AFTER INSERT ON auth_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_signin_stats();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE user_sessions 
    SET 
        is_active = FALSE,
        ended_at = NOW(),
        logout_reason = 'session_expired'
    WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user session summary
CREATE OR REPLACE FUNCTION get_user_session_summary(p_user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    active_sessions BIGINT,
    last_signin TIMESTAMP WITH TIME ZONE,
    failed_attempts INTEGER,
    account_locked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(us.id)::BIGINT as total_sessions,
        COUNT(us.id) FILTER (WHERE us.is_active = TRUE)::BIGINT as active_sessions,
        u.last_sign_in,
        u.failed_signin_attempts,
        (u.account_locked_until IS NOT NULL AND u.account_locked_until > NOW()) as account_locked
    FROM public.User u
    LEFT JOIN user_sessions us ON u.id = us.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id, u.last_sign_in, u.failed_signin_attempts, u.account_locked_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO auth_events (user_id, email, event_type, auth_provider, success, created_at)
VALUES 
    (NULL, 'test@example.com', 'signin_attempt', 'email', FALSE, NOW() - INTERVAL '1 hour'),
    (NULL, 'test@example.com', 'signin_failed', 'email', FALSE, NOW() - INTERVAL '30 minutes');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON auth_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON user_activity_log TO authenticated;
GRANT SELECT ON security_events TO authenticated;

GRANT ALL ON auth_events TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON user_activity_log TO service_role;
GRANT ALL ON security_events TO service_role; 