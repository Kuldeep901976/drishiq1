-- Analytics System Migration
-- Comprehensive tracking for user interactions, UTM parameters, and attribution

-- User sessions tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    operating_system TEXT,
    country TEXT,
    city TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer TEXT,
    landing_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    page_views INTEGER DEFAULT 0,
    is_conversion BOOLEAN DEFAULT false,
    conversion_type TEXT,
    conversion_value DECIMAL(10,2)
);

-- Individual page views and interactions
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', 'invitation_request', etc.
    event_name TEXT NOT NULL,
    page_url TEXT,
    page_title TEXT,
    element_id TEXT,
    element_class TEXT,
    element_text TEXT,
    properties JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_ms INTEGER,
    error_occurred BOOLEAN DEFAULT false,
    error_message TEXT
);

-- UTM campaign tracking
CREATE TABLE utm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    utm_source TEXT NOT NULL,
    utm_medium TEXT NOT NULL,
    utm_campaign TEXT NOT NULL,
    utm_term TEXT,
    utm_content TEXT,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_audience TEXT,
    budget DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- Conversion funnels
CREATE TABLE conversion_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    steps JSONB NOT NULL, -- Array of steps: [{'name': 'Landing', 'event': 'page_view'}, ...]
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- User journey tracking
CREATE TABLE user_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    journey_stage TEXT NOT NULL, -- 'awareness', 'interest', 'consideration', 'conversion', 'retention'
    touchpoint TEXT NOT NULL, -- 'organic_search', 'social_media', 'email', 'direct', etc.
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    page_url TEXT,
    action_taken TEXT,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Attribution tracking
CREATE TABLE attribution_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversion_id UUID, -- Links to invitations, purchases, etc.
    conversion_type TEXT NOT NULL, -- 'invitation_request', 'story_submission', 'signup', etc.
    conversion_value DECIMAL(10,2),
    first_touch_source TEXT,
    first_touch_medium TEXT,
    first_touch_campaign TEXT,
    first_touch_timestamp TIMESTAMP WITH TIME ZONE,
    last_touch_source TEXT,
    last_touch_medium TEXT,
    last_touch_campaign TEXT,
    last_touch_timestamp TIMESTAMP WITH TIME ZONE,
    attribution_model TEXT DEFAULT 'last_touch', -- 'first_touch', 'last_touch', 'linear', 'time_decay'
    attribution_weight DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B testing framework
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name TEXT NOT NULL,
    description TEXT,
    page_url TEXT,
    variants JSONB NOT NULL, -- [{'name': 'A', 'weight': 50}, {'name': 'B', 'weight': 50}]
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
    success_metric TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- A/B test assignments
CREATE TABLE ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL REFERENCES user_sessions(session_id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    converted BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    UNIQUE(test_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at);
CREATE INDEX idx_user_sessions_utm_source ON user_sessions(utm_source);
CREATE INDEX idx_user_sessions_utm_campaign ON user_sessions(utm_campaign);

CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

CREATE INDEX idx_user_journeys_user_id ON user_journeys(user_id);
CREATE INDEX idx_user_journeys_session_id ON user_journeys(session_id);
CREATE INDEX idx_user_journeys_journey_stage ON user_journeys(journey_stage);
CREATE INDEX idx_user_journeys_created_at ON user_journeys(created_at);

CREATE INDEX idx_attribution_models_user_id ON attribution_models(user_id);
CREATE INDEX idx_attribution_models_conversion_type ON attribution_models(conversion_type);
CREATE INDEX idx_attribution_models_created_at ON attribution_models(created_at);

-- RLS Policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can view all analytics" ON user_sessions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view all events" ON analytics_events FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage UTM campaigns" ON utm_campaigns FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage conversion funnels" ON conversion_funnels FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view user journeys" ON user_journeys FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view attribution models" ON attribution_models FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage A/B tests" ON ab_tests FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view A/B test assignments" ON ab_test_assignments FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Users can view their own data
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own events" ON analytics_events FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own journeys" ON user_journeys FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- Public insert policies for tracking
CREATE POLICY "Allow public session tracking" ON user_sessions FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow public event tracking" ON analytics_events FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow public journey tracking" ON user_journeys FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow public attribution tracking" ON attribution_models FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow A/B test assignments" ON ab_test_assignments FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

-- Analytics views for reporting
CREATE VIEW analytics_dashboard AS
SELECT 
    DATE(user_sessions.created_at) as date,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_sessions.user_id) as unique_users,
    COUNT(DISTINCT user_sessions.session_id) as unique_sessions,
    AVG(user_sessions.duration_seconds) as avg_session_duration,
    SUM(user_sessions.page_views) as total_page_views,
    COUNT(CASE WHEN user_sessions.is_conversion THEN 1 END) as conversions,
    ROUND(COUNT(CASE WHEN user_sessions.is_conversion THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate,
    user_sessions.utm_source,
    user_sessions.utm_medium,
    user_sessions.utm_campaign
FROM user_sessions
GROUP BY DATE(user_sessions.created_at), user_sessions.utm_source, user_sessions.utm_medium, user_sessions.utm_campaign
ORDER BY date DESC;

CREATE VIEW top_pages AS
SELECT 
    page_url,
    COUNT(*) as page_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    AVG(processing_time_ms) as avg_load_time,
    COUNT(CASE WHEN error_occurred THEN 1 END) as error_count
FROM analytics_events
WHERE event_type = 'page_view'
GROUP BY page_url
ORDER BY page_views DESC;

CREATE VIEW conversion_funnel_analysis AS
SELECT 
    cf.name as funnel_name,
    step.step_name,
    step.step_order,
    COUNT(DISTINCT ae.session_id) as sessions_at_step,
    ROUND(COUNT(DISTINCT ae.session_id) * 100.0 / LAG(COUNT(DISTINCT ae.session_id)) OVER (PARTITION BY cf.name ORDER BY step.step_order), 2) as conversion_rate
FROM conversion_funnels cf
CROSS JOIN LATERAL (
    SELECT 
        idx - 1 as step_order,
        step->>'name' as step_name,
        step->>'event' as step_event
    FROM jsonb_array_elements(cf.steps) WITH ORDINALITY AS t(step, idx)
) step
LEFT JOIN analytics_events ae ON ae.event_name = step.step_event
GROUP BY cf.name, step.step_name, step.step_order
ORDER BY cf.name, step.step_order;

-- Default campaigns for common sources
INSERT INTO utm_campaigns (campaign_name, utm_source, utm_medium, utm_campaign, description, is_active) VALUES
('Organic Search', 'google', 'organic', 'organic_search', 'Organic search traffic from Google', true),
('Direct Traffic', 'direct', 'none', 'direct', 'Direct website visits', true),
('Social Media', 'social', 'social', 'social_general', 'General social media traffic', true),
('Email Marketing', 'email', 'email', 'email_general', 'General email marketing campaigns', true),
('Referral Traffic', 'referral', 'referral', 'referral_general', 'Traffic from other websites', true);

-- Default conversion funnel
INSERT INTO conversion_funnels (name, steps, description, is_active) VALUES
('Invitation Request Funnel', 
 '[
    {"name": "Landing Page", "event": "page_view", "url": "/"},
    {"name": "Interest Selection", "event": "interest_selection"},
    {"name": "Form Submission", "event": "invitation_request_submit"},
    {"name": "Success Page", "event": "invitation_request_success"}
 ]'::jsonb, 
 'Default funnel for invitation requests', true),
('Story Submission Funnel',
 '[
    {"name": "Landing Page", "event": "page_view", "url": "/"},
    {"name": "Story Form", "event": "story_form_view"},
    {"name": "Story Submission", "event": "story_submit"},
    {"name": "Success Page", "event": "story_submit_success"}
 ]'::jsonb,
 'Default funnel for story submissions', true); 