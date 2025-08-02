-- Session Credits System Migration
-- This migration creates the session management system with credit deduction

-- Session types and configurations
CREATE TYPE session_type AS ENUM ('interview', 'consultation', 'training', 'demo', 'trial');
CREATE TYPE session_status AS ENUM ('scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired');
CREATE TYPE credit_transaction_type AS ENUM ('deduction', 'refund', 'bonus', 'adjustment');

-- Session templates table
CREATE TABLE session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type session_type NOT NULL,
    duration_minutes INTEGER NOT NULL,
    credit_cost INTEGER NOT NULL,
    description TEXT,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES session_templates(id) ON DELETE SET NULL,
    session_type session_type NOT NULL,
    status session_status DEFAULT 'scheduled',
    
    -- Session details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    
    -- Credit management
    credits_deducted INTEGER DEFAULT 0,
    credits_refunded INTEGER DEFAULT 0,
    net_credits INTEGER GENERATED ALWAYS AS (credits_deducted - credits_refunded) STORED,
    
    -- Session data
    session_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Tracking
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session credit transactions table
CREATE TABLE session_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type credit_transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Context
    reason TEXT,
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    
    -- Admin tracking
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session activities table (for detailed tracking)
CREATE TABLE session_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optional user context
    user_id UUID REFERENCES users(id),
    
    INDEX idx_session_activities_session_id (session_id),
    INDEX idx_session_activities_timestamp (timestamp)
);

-- Session limits table (for controlling usage)
CREATE TABLE session_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type session_type NOT NULL,
    
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, session_type)
);

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_scheduled_at ON user_sessions(scheduled_at);
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX idx_user_sessions_type ON user_sessions(session_type);

CREATE INDEX idx_session_credit_transactions_session_id ON session_credit_transactions(session_id);
CREATE INDEX idx_session_credit_transactions_user_id ON session_credit_transactions(user_id);
CREATE INDEX idx_session_credit_transactions_created_at ON session_credit_transactions(created_at);

CREATE INDEX idx_session_limits_user_id ON session_limits(user_id);
CREATE INDEX idx_session_limits_reset_dates ON session_limits(daily_reset_at, weekly_reset_at, monthly_reset_at);

-- Add RLS policies
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_limits ENABLE ROW LEVEL SECURITY;

-- Session templates policies (public read, admin write)
CREATE POLICY "Anyone can view active session templates" ON session_templates
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage session templates" ON session_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Session credit transactions policies
CREATE POLICY "Users can view their own credit transactions" ON session_credit_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create credit transactions" ON session_credit_transactions
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all credit transactions" ON session_credit_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Session activities policies
CREATE POLICY "Users can view their own session activities" ON session_activities
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM user_sessions 
            WHERE user_sessions.id = session_activities.session_id 
            AND user_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "System can create session activities" ON session_activities
    FOR INSERT WITH CHECK (TRUE);

-- Session limits policies
CREATE POLICY "Users can view their own session limits" ON session_limits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage session limits" ON session_limits
    FOR ALL WITH CHECK (TRUE);

-- Create functions for session management
CREATE OR REPLACE FUNCTION update_session_limits()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset daily limits
    UPDATE session_limits 
    SET 
        daily_used = 0,
        daily_reset_at = NOW() + INTERVAL '1 day'
    WHERE daily_reset_at <= NOW();
    
    -- Reset weekly limits
    UPDATE session_limits 
    SET 
        weekly_used = 0,
        weekly_reset_at = NOW() + INTERVAL '1 week'
    WHERE weekly_reset_at <= NOW();
    
    -- Reset monthly limits
    UPDATE session_limits 
    SET 
        monthly_used = 0,
        monthly_reset_at = NOW() + INTERVAL '1 month'
    WHERE monthly_reset_at <= NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle session completion
CREATE OR REPLACE FUNCTION complete_session(session_id UUID)
RETURNS JSONB AS $$
DECLARE
    session_record user_sessions%ROWTYPE;
    actual_duration INTEGER;
    refund_amount INTEGER := 0;
    result JSONB;
BEGIN
    -- Get session record
    SELECT * INTO session_record FROM user_sessions WHERE id = session_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Session not found');
    END IF;
    
    -- Calculate actual duration
    actual_duration := EXTRACT(EPOCH FROM (NOW() - session_record.started_at)) / 60;
    
    -- Calculate refund if session was shorter than expected
    IF actual_duration < session_record.duration_minutes THEN
        refund_amount := CEIL((session_record.duration_minutes - actual_duration) * 
                            session_record.credits_deducted / session_record.duration_minutes);
    END IF;
    
    -- Update session
    UPDATE user_sessions 
    SET 
        status = 'completed',
        ended_at = NOW(),
        actual_duration_minutes = actual_duration,
        credits_refunded = refund_amount,
        updated_at = NOW()
    WHERE id = session_id;
    
    -- Process refund if applicable
    IF refund_amount > 0 THEN
        -- Update user credits
        UPDATE users 
        SET credits = credits + refund_amount
        WHERE id = session_record.user_id;
        
        -- Log transaction
        INSERT INTO session_credit_transactions (
            session_id, user_id, transaction_type, amount, 
            balance_before, balance_after, reason
        ) VALUES (
            session_id, session_record.user_id, 'refund', refund_amount,
            (SELECT credits FROM users WHERE id = session_record.user_id) - refund_amount,
            (SELECT credits FROM users WHERE id = session_record.user_id),
            'Session completed early - partial refund'
        );
    END IF;
    
    -- Log activity
    INSERT INTO session_activities (session_id, activity_type, activity_data, user_id)
    VALUES (
        session_id, 'session_completed', 
        jsonb_build_object(
            'actual_duration', actual_duration,
            'planned_duration', session_record.duration_minutes,
            'refund_amount', refund_amount
        ),
        session_record.user_id
    );
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'actual_duration', actual_duration,
        'refund_amount', refund_amount
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update session limits
CREATE TRIGGER update_session_limits_trigger
    AFTER INSERT ON user_sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_session_limits();

-- Insert default session templates
INSERT INTO session_templates (name, type, duration_minutes, credit_cost, description, features) VALUES
('Quick Interview', 'interview', 15, 5, 'Short interview session perfect for quick assessments', 
 '{"recording": true, "transcription": false, "ai_analysis": false}'),
('Standard Interview', 'interview', 30, 10, 'Standard interview session with full features', 
 '{"recording": true, "transcription": true, "ai_analysis": true}'),
('Extended Interview', 'interview', 60, 18, 'Extended interview session for comprehensive evaluation', 
 '{"recording": true, "transcription": true, "ai_analysis": true, "detailed_report": true}'),
('Consultation Call', 'consultation', 45, 15, 'Professional consultation session', 
 '{"recording": true, "transcription": true, "follow_up": true}'),
('Training Session', 'training', 90, 25, 'Interactive training session with materials', 
 '{"recording": true, "transcription": true, "materials": true, "certification": true}'),
('Demo Session', 'demo', 20, 3, 'Product demonstration session', 
 '{"recording": false, "interactive": true, "materials": true}'),
('Trial Session', 'trial', 10, 0, 'Free trial session for new users', 
 '{"recording": false, "limited_features": true}');

-- Create views for analytics
CREATE VIEW session_analytics AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(s.id) as total_sessions,
    COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_sessions,
    SUM(s.credits_deducted) as total_credits_used,
    SUM(s.credits_refunded) as total_credits_refunded,
    AVG(s.actual_duration_minutes) as avg_session_duration,
    MAX(s.created_at) as last_session_date
FROM users u
LEFT JOIN user_sessions s ON u.id = s.user_id
GROUP BY u.id, u.email;

CREATE VIEW daily_session_stats AS
SELECT 
    DATE(created_at) as session_date,
    session_type,
    COUNT(*) as session_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    SUM(credits_deducted) as total_credits_used,
    AVG(actual_duration_minutes) as avg_duration
FROM user_sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), session_type
ORDER BY session_date DESC, session_type; 