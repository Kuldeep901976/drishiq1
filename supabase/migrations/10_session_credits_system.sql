-- Session Credits System Migration
-- This migration creates tables for session management with credit deduction

-- Session types and pricing
CREATE TABLE session_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    credit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 30,
    max_duration_minutes INTEGER DEFAULT 120,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type_id UUID NOT NULL REFERENCES session_types(id),
    title TEXT,
    description TEXT,
    status TEXT CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled', 'expired')) DEFAULT 'scheduled',
    
    -- Credits and billing
    credits_deducted DECIMAL(10,2) DEFAULT 0,
    credits_per_minute DECIMAL(10,4) DEFAULT 0,
    billing_mode TEXT CHECK (billing_mode IN ('prepaid', 'postpaid', 'free')) DEFAULT 'prepaid',
    
    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    
    -- Session data
    session_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Session activities and events
CREATE TABLE session_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'start', 'pause', 'resume', 'end', 'extend', 'interrupt'
    activity_data JSONB DEFAULT '{}',
    credits_used DECIMAL(10,2) DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Credit transactions for sessions
CREATE TABLE session_credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('deduction', 'refund', 'bonus')) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Session usage statistics
CREATE TABLE session_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Session counts
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    cancelled_sessions INTEGER DEFAULT 0,
    
    -- Time tracking
    total_minutes INTEGER DEFAULT 0,
    active_minutes INTEGER DEFAULT 0,
    
    -- Credit usage
    credits_used DECIMAL(10,2) DEFAULT 0,
    credits_refunded DECIMAL(10,2) DEFAULT 0,
    
    -- Efficiency metrics
    avg_session_duration DECIMAL(10,2) DEFAULT 0,
    completion_rate DECIMAL(5,4) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, date)
);

-- Session reminders and notifications
CREATE TABLE session_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    reminder_type TEXT CHECK (reminder_type IN ('pre_session', 'low_credits', 'session_end', 'follow_up')) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
    reminder_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_user_sessions_scheduled_at ON user_sessions(scheduled_at);
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at);

CREATE INDEX idx_session_activities_session_id ON session_activities(session_id);
CREATE INDEX idx_session_activities_activity_type ON session_activities(activity_type);
CREATE INDEX idx_session_activities_timestamp ON session_activities(timestamp);

CREATE INDEX idx_session_credit_transactions_user_id ON session_credit_transactions(user_id);
CREATE INDEX idx_session_credit_transactions_session_id ON session_credit_transactions(session_id);
CREATE INDEX idx_session_credit_transactions_created_at ON session_credit_transactions(created_at);

CREATE INDEX idx_session_usage_stats_user_id ON session_usage_stats(user_id);
CREATE INDEX idx_session_usage_stats_date ON session_usage_stats(date);

CREATE INDEX idx_session_reminders_session_id ON session_reminders(session_id);
CREATE INDEX idx_session_reminders_scheduled_at ON session_reminders(scheduled_at);
CREATE INDEX idx_session_reminders_status ON session_reminders(status);

-- Create views for analytics
CREATE VIEW session_analytics AS
SELECT 
    us.user_id,
    u.email,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN us.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN us.status = 'cancelled' THEN 1 END) as cancelled_sessions,
    SUM(us.duration_minutes) as total_minutes,
    SUM(us.credits_deducted) as total_credits_used,
    AVG(us.duration_minutes) as avg_session_duration,
    AVG(us.credits_deducted) as avg_credits_per_session,
    (COUNT(CASE WHEN us.status = 'completed' THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100 as completion_rate
FROM user_sessions us
JOIN users u ON us.user_id = u.id
GROUP BY us.user_id, u.email;

CREATE VIEW daily_session_stats AS
SELECT 
    DATE(us.created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN us.status = 'completed' THEN 1 END) as completed_sessions,
    SUM(us.duration_minutes) as total_minutes,
    SUM(us.credits_deducted) as total_credits_used,
    AVG(us.duration_minutes) as avg_session_duration,
    COUNT(DISTINCT us.user_id) as active_users
FROM user_sessions us
GROUP BY DATE(us.created_at)
ORDER BY DATE(us.created_at) DESC;

-- Functions for session management
CREATE OR REPLACE FUNCTION start_session(
    p_user_id UUID,
    p_session_type_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now()
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_session_type RECORD;
    v_user_credits DECIMAL(10,2);
    v_required_credits DECIMAL(10,2);
BEGIN
    -- Get session type details
    SELECT * INTO v_session_type FROM session_types WHERE id = p_session_type_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session type not found or inactive';
    END IF;
    
    -- Check user credits
    SELECT credits INTO v_user_credits FROM users WHERE id = p_user_id;
    
    IF v_user_credits IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate required credits (minimum for session type)
    v_required_credits := v_session_type.credit_cost;
    
    IF v_user_credits < v_required_credits THEN
        RAISE EXCEPTION 'Insufficient credits. Required: %, Available: %', v_required_credits, v_user_credits;
    END IF;
    
    -- Create session
    INSERT INTO user_sessions (
        user_id,
        session_type_id,
        title,
        description,
        status,
        credits_per_minute,
        billing_mode,
        scheduled_at,
        started_at,
        session_data,
        metadata
    ) VALUES (
        p_user_id,
        p_session_type_id,
        p_title,
        p_description,
        'active',
        v_session_type.credit_cost / v_session_type.duration_minutes,
        'prepaid',
        p_scheduled_at,
        now(),
        v_session_type.features,
        '{}'::jsonb
    ) RETURNING id INTO v_session_id;
    
    -- Log session start activity
    INSERT INTO session_activities (
        session_id,
        activity_type,
        activity_data,
        credits_used
    ) VALUES (
        v_session_id,
        'start',
        jsonb_build_object('session_type', v_session_type.name),
        0
    );
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION end_session(
    p_session_id UUID,
    p_reason TEXT DEFAULT 'completed'
) RETURNS VOID AS $$
DECLARE
    v_session RECORD;
    v_duration_minutes INTEGER;
    v_credits_to_deduct DECIMAL(10,2);
    v_user_credits DECIMAL(10,2);
BEGIN
    -- Get session details
    SELECT * INTO v_session FROM user_sessions WHERE id = p_session_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active session not found';
    END IF;
    
    -- Calculate duration
    v_duration_minutes := EXTRACT(EPOCH FROM (now() - v_session.started_at)) / 60;
    
    -- Calculate credits to deduct
    v_credits_to_deduct := v_duration_minutes * v_session.credits_per_minute;
    
    -- Get current user credits
    SELECT credits INTO v_user_credits FROM users WHERE id = v_session.user_id;
    
    -- Update session
    UPDATE user_sessions 
    SET 
        status = CASE WHEN p_reason = 'completed' THEN 'completed' ELSE 'cancelled' END,
        ended_at = now(),
        duration_minutes = v_duration_minutes,
        credits_deducted = v_credits_to_deduct
    WHERE id = p_session_id;
    
    -- Deduct credits from user
    UPDATE users 
    SET credits = credits - v_credits_to_deduct
    WHERE id = v_session.user_id;
    
    -- Log credit transaction
    INSERT INTO session_credit_transactions (
        user_id,
        session_id,
        transaction_type,
        amount,
        description,
        balance_before,
        balance_after
    ) VALUES (
        v_session.user_id,
        p_session_id,
        'deduction',
        v_credits_to_deduct,
        'Session credit deduction',
        v_user_credits,
        v_user_credits - v_credits_to_deduct
    );
    
    -- Log session end activity
    INSERT INTO session_activities (
        session_id,
        activity_type,
        activity_data,
        credits_used
    ) VALUES (
        p_session_id,
        'end',
        jsonb_build_object('reason', p_reason, 'duration_minutes', v_duration_minutes),
        v_credits_to_deduct
    );
    
    -- Update daily usage stats
    INSERT INTO session_usage_stats (
        user_id,
        date,
        total_sessions,
        completed_sessions,
        cancelled_sessions,
        total_minutes,
        active_minutes,
        credits_used,
        avg_session_duration,
        completion_rate
    ) VALUES (
        v_session.user_id,
        CURRENT_DATE,
        1,
        CASE WHEN p_reason = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN p_reason = 'cancelled' THEN 1 ELSE 0 END,
        v_duration_minutes,
        v_duration_minutes,
        v_credits_to_deduct,
        v_duration_minutes,
        CASE WHEN p_reason = 'completed' THEN 1.0 ELSE 0.0 END
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        total_sessions = session_usage_stats.total_sessions + 1,
        completed_sessions = session_usage_stats.completed_sessions + CASE WHEN p_reason = 'completed' THEN 1 ELSE 0 END,
        cancelled_sessions = session_usage_stats.cancelled_sessions + CASE WHEN p_reason = 'cancelled' THEN 1 ELSE 0 END,
        total_minutes = session_usage_stats.total_minutes + v_duration_minutes,
        active_minutes = session_usage_stats.active_minutes + v_duration_minutes,
        credits_used = session_usage_stats.credits_used + v_credits_to_deduct,
        avg_session_duration = (session_usage_stats.total_minutes + v_duration_minutes) / (session_usage_stats.total_sessions + 1),
        completion_rate = (session_usage_stats.completed_sessions + CASE WHEN p_reason = 'completed' THEN 1 ELSE 0 END)::FLOAT / (session_usage_stats.total_sessions + 1)::FLOAT,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to extend session
CREATE OR REPLACE FUNCTION extend_session(
    p_session_id UUID,
    p_additional_minutes INTEGER
) RETURNS VOID AS $$
DECLARE
    v_session RECORD;
    v_additional_credits DECIMAL(10,2);
    v_user_credits DECIMAL(10,2);
BEGIN
    -- Get session details
    SELECT * INTO v_session FROM user_sessions WHERE id = p_session_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active session not found';
    END IF;
    
    -- Calculate additional credits needed
    v_additional_credits := p_additional_minutes * v_session.credits_per_minute;
    
    -- Check user credits
    SELECT credits INTO v_user_credits FROM users WHERE id = v_session.user_id;
    
    IF v_user_credits < v_additional_credits THEN
        RAISE EXCEPTION 'Insufficient credits to extend session. Required: %, Available: %', v_additional_credits, v_user_credits;
    END IF;
    
    -- Log session extension activity
    INSERT INTO session_activities (
        session_id,
        activity_type,
        activity_data,
        credits_used
    ) VALUES (
        p_session_id,
        'extend',
        jsonb_build_object('additional_minutes', p_additional_minutes),
        v_additional_credits
    );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- Session types are public read
CREATE POLICY "Anyone can view active session types" ON session_types
    FOR SELECT USING (is_active = true);

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Session activities policies
CREATE POLICY "Users can view their session activities" ON session_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_sessions 
            WHERE id = session_activities.session_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can create session activities" ON session_activities
    FOR INSERT WITH CHECK (true);

-- Credit transactions policies
CREATE POLICY "Users can view their credit transactions" ON session_credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create credit transactions" ON session_credit_transactions
    FOR INSERT WITH CHECK (true);

-- Usage stats policies
CREATE POLICY "Users can view their usage stats" ON session_usage_stats
    FOR SELECT USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can view their reminders" ON session_reminders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_sessions 
            WHERE id = session_reminders.session_id 
            AND user_id = auth.uid()
        )
    );

-- Insert default session types
INSERT INTO session_types (name, description, credit_cost, duration_minutes, max_duration_minutes, features, is_active)
VALUES 
    ('Quick Session', 'Short 15-minute session for quick tasks', 5.00, 15, 30, '{"basic_features": true, "priority_support": false}', true),
    ('Standard Session', 'Regular 30-minute session', 10.00, 30, 60, '{"basic_features": true, "priority_support": true, "advanced_tools": true}', true),
    ('Extended Session', 'Long 60-minute session for complex tasks', 18.00, 60, 120, '{"basic_features": true, "priority_support": true, "advanced_tools": true, "premium_features": true}', true),
    ('Enterprise Session', 'Premium session with all features', 25.00, 60, 180, '{"basic_features": true, "priority_support": true, "advanced_tools": true, "premium_features": true, "enterprise_features": true}', true);

-- Create updated_at triggers
CREATE TRIGGER update_session_types_updated_at BEFORE UPDATE ON session_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_usage_stats_updated_at BEFORE UPDATE ON session_usage_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 