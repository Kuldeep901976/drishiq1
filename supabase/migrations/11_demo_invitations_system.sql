-- Demo Invitations System Migration
-- This migration creates tables for demo invitations and stakeholder management

-- Demo invitation categories
CREATE TABLE demo_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    features JSONB DEFAULT '{}',
    duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Demo invitations (extends the existing invitations table)
CREATE TABLE demo_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
    demo_category_id UUID REFERENCES demo_categories(id),
    stakeholder_type TEXT CHECK (stakeholder_type IN ('investor', 'partner', 'customer', 'media', 'analyst', 'advisor', 'board_member', 'other')) NOT NULL,
    company_name TEXT,
    title TEXT,
    purpose TEXT,
    
    -- Demo session configuration
    demo_features JSONB DEFAULT '{}',
    custom_branding JSONB DEFAULT '{}',
    session_duration_minutes INTEGER DEFAULT 30,
    max_participants INTEGER DEFAULT 1,
    
    -- Scheduling
    preferred_time_slots JSONB DEFAULT '[]',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    demo_url TEXT,
    meeting_id TEXT,
    
    -- Status tracking
    status TEXT CHECK (status IN ('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'pending',
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and feedback
    admin_notes TEXT,
    demo_notes TEXT,
    feedback_collected BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Demo sessions (actual demo executions)
CREATE TABLE demo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_invitation_id UUID NOT NULL REFERENCES demo_invitations(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id),
    
    -- Session details
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    
    -- Participants
    host_user_id UUID REFERENCES users(id),
    participants JSONB DEFAULT '[]',
    actual_participants INTEGER DEFAULT 0,
    
    -- Demo execution
    features_demonstrated JSONB DEFAULT '[]',
    questions_asked JSONB DEFAULT '[]',
    issues_encountered JSONB DEFAULT '[]',
    
    -- Outcomes
    engagement_score INTEGER CHECK (engagement_score >= 1 AND engagement_score <= 10),
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
    likelihood_to_recommend INTEGER CHECK (likelihood_to_recommend >= 1 AND likelihood_to_recommend <= 10),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    next_steps TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled', 'interrupted')) DEFAULT 'active',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Demo feedback and analytics
CREATE TABLE demo_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demo_session_id UUID NOT NULL REFERENCES demo_sessions(id) ON DELETE CASCADE,
    demo_invitation_id UUID NOT NULL REFERENCES demo_invitations(id) ON DELETE CASCADE,
    
    -- Feedback ratings
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    ease_of_use INTEGER CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
    feature_relevance INTEGER CHECK (feature_relevance >= 1 AND feature_of_use >= 1 AND feature_relevance <= 5),
    presentation_quality INTEGER CHECK (presentation_quality >= 1 AND presentation_quality <= 5),
    
    -- Qualitative feedback
    what_liked TEXT,
    what_disliked TEXT,
    suggestions TEXT,
    additional_comments TEXT,
    
    -- Interest and next steps
    interest_level TEXT CHECK (interest_level IN ('very_high', 'high', 'medium', 'low', 'very_low')),
    timeline_to_decide TEXT,
    budget_range TEXT,
    decision_makers TEXT,
    
    -- Contact preferences
    preferred_contact_method TEXT,
    follow_up_frequency TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Demo templates and configurations
CREATE TABLE demo_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    demo_category_id UUID REFERENCES demo_categories(id),
    
    -- Template configuration
    template_config JSONB DEFAULT '{}',
    script_outline JSONB DEFAULT '{}',
    key_features JSONB DEFAULT '[]',
    demo_flow JSONB DEFAULT '[]',
    
    -- Branding and customization
    branding_config JSONB DEFAULT '{}',
    custom_css TEXT,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Demo analytics and metrics
CREATE TABLE demo_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    demo_category_id UUID REFERENCES demo_categories(id),
    
    -- Volume metrics
    invitations_sent INTEGER DEFAULT 0,
    demos_scheduled INTEGER DEFAULT 0,
    demos_completed INTEGER DEFAULT 0,
    demos_cancelled INTEGER DEFAULT 0,
    no_shows INTEGER DEFAULT 0,
    
    -- Engagement metrics
    avg_duration_minutes DECIMAL(10,2) DEFAULT 0,
    avg_engagement_score DECIMAL(3,2) DEFAULT 0,
    avg_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    avg_likelihood_to_recommend DECIMAL(3,2) DEFAULT 0,
    
    -- Conversion metrics
    follow_ups_requested INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    trials_started INTEGER DEFAULT 0,
    
    -- Stakeholder breakdown
    stakeholder_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(date, demo_category_id)
);

-- Create indexes for performance
CREATE INDEX idx_demo_invitations_invitation_id ON demo_invitations(invitation_id);
CREATE INDEX idx_demo_invitations_demo_category_id ON demo_invitations(demo_category_id);
CREATE INDEX idx_demo_invitations_stakeholder_type ON demo_invitations(stakeholder_type);
CREATE INDEX idx_demo_invitations_status ON demo_invitations(status);
CREATE INDEX idx_demo_invitations_scheduled_at ON demo_invitations(scheduled_at);
CREATE INDEX idx_demo_invitations_created_at ON demo_invitations(created_at);

CREATE INDEX idx_demo_sessions_demo_invitation_id ON demo_sessions(demo_invitation_id);
CREATE INDEX idx_demo_sessions_session_id ON demo_sessions(session_id);
CREATE INDEX idx_demo_sessions_host_user_id ON demo_sessions(host_user_id);
CREATE INDEX idx_demo_sessions_started_at ON demo_sessions(started_at);
CREATE INDEX idx_demo_sessions_status ON demo_sessions(status);

CREATE INDEX idx_demo_feedback_demo_session_id ON demo_feedback(demo_session_id);
CREATE INDEX idx_demo_feedback_demo_invitation_id ON demo_feedback(demo_invitation_id);
CREATE INDEX idx_demo_feedback_overall_rating ON demo_feedback(overall_rating);
CREATE INDEX idx_demo_feedback_interest_level ON demo_feedback(interest_level);

CREATE INDEX idx_demo_templates_demo_category_id ON demo_templates(demo_category_id);
CREATE INDEX idx_demo_templates_is_active ON demo_templates(is_active);
CREATE INDEX idx_demo_templates_is_default ON demo_templates(is_default);

CREATE INDEX idx_demo_analytics_date ON demo_analytics(date);
CREATE INDEX idx_demo_analytics_demo_category_id ON demo_analytics(demo_category_id);

-- Create views for analytics
CREATE VIEW demo_conversion_funnel AS
SELECT 
    dc.name as category,
    COUNT(di.id) as total_invitations,
    COUNT(CASE WHEN di.status = 'scheduled' THEN 1 END) as scheduled,
    COUNT(CASE WHEN di.status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN di.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN di.status = 'cancelled' THEN 1 END) as cancelled,
    COUNT(CASE WHEN di.status = 'no_show' THEN 1 END) as no_shows,
    ROUND(
        COUNT(CASE WHEN di.status = 'completed' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(di.id), 0) * 100, 2
    ) as completion_rate
FROM demo_categories dc
LEFT JOIN demo_invitations di ON dc.id = di.demo_category_id
GROUP BY dc.id, dc.name;

CREATE VIEW demo_performance_metrics AS
SELECT 
    di.stakeholder_type,
    dc.name as category,
    COUNT(ds.id) as total_demos,
    AVG(ds.duration_minutes) as avg_duration,
    AVG(ds.engagement_score) as avg_engagement,
    AVG(ds.satisfaction_score) as avg_satisfaction,
    AVG(ds.likelihood_to_recommend) as avg_nps,
    COUNT(CASE WHEN ds.follow_up_required = true THEN 1 END) as follow_ups_needed,
    ROUND(
        COUNT(CASE WHEN ds.follow_up_required = true THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(ds.id), 0) * 100, 2
    ) as follow_up_rate
FROM demo_invitations di
JOIN demo_categories dc ON di.demo_category_id = dc.id
LEFT JOIN demo_sessions ds ON di.id = ds.demo_invitation_id
WHERE ds.status = 'completed'
GROUP BY di.stakeholder_type, dc.name;

-- Functions for demo management
CREATE OR REPLACE FUNCTION create_demo_invitation(
    p_email TEXT,
    p_stakeholder_type TEXT,
    p_company_name TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_purpose TEXT DEFAULT NULL,
    p_demo_category_id UUID DEFAULT NULL,
    p_session_duration INTEGER DEFAULT 30,
    p_max_participants INTEGER DEFAULT 1
) RETURNS UUID AS $$
DECLARE
    v_invitation_id UUID;
    v_demo_invitation_id UUID;
    v_demo_token TEXT;
BEGIN
    -- Generate demo token
    v_demo_token := 'DEMO-' || substr(md5(random()::text), 1, 8) || '-' || substr(md5(random()::text), 1, 4);
    
    -- Create base invitation
    INSERT INTO invitations (
        email,
        token,
        invited_by,
        expires_at,
        is_used,
        metadata
    ) VALUES (
        p_email,
        v_demo_token,
        '00000000-0000-0000-0000-000000000000', -- System user
        now() + interval '30 days',
        false,
        jsonb_build_object(
            'type', 'demo',
            'stakeholder_type', p_stakeholder_type,
            'company_name', p_company_name
        )
    ) RETURNING id INTO v_invitation_id;
    
    -- Create demo invitation
    INSERT INTO demo_invitations (
        invitation_id,
        demo_category_id,
        stakeholder_type,
        company_name,
        title,
        purpose,
        session_duration_minutes,
        max_participants,
        status,
        demo_url,
        metadata
    ) VALUES (
        v_invitation_id,
        p_demo_category_id,
        p_stakeholder_type,
        p_company_name,
        p_title,
        p_purpose,
        p_session_duration,
        p_max_participants,
        'pending',
        '/demo/' || v_demo_token,
        jsonb_build_object(
            'created_via', 'api',
            'auto_generated', true
        )
    ) RETURNING id INTO v_demo_invitation_id;
    
    RETURN v_demo_invitation_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION schedule_demo(
    p_demo_invitation_id UUID,
    p_scheduled_at TIMESTAMP WITH TIME ZONE,
    p_meeting_id TEXT DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Update demo invitation
    UPDATE demo_invitations 
    SET 
        scheduled_at = p_scheduled_at,
        meeting_id = p_meeting_id,
        admin_notes = p_admin_notes,
        status = 'scheduled',
        confirmation_sent_at = now(),
        updated_at = now()
    WHERE id = p_demo_invitation_id;
    
    -- Update analytics
    INSERT INTO demo_analytics (
        date,
        demo_category_id,
        demos_scheduled
    ) 
    SELECT 
        CURRENT_DATE,
        di.demo_category_id,
        1
    FROM demo_invitations di
    WHERE di.id = p_demo_invitation_id
    ON CONFLICT (date, demo_category_id) DO UPDATE SET
        demos_scheduled = demo_analytics.demos_scheduled + 1,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_demo_session(
    p_demo_session_id UUID,
    p_engagement_score INTEGER DEFAULT NULL,
    p_satisfaction_score INTEGER DEFAULT NULL,
    p_likelihood_to_recommend INTEGER DEFAULT NULL,
    p_follow_up_required BOOLEAN DEFAULT false,
    p_next_steps TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_demo_session RECORD;
    v_duration INTEGER;
BEGIN
    -- Get session details
    SELECT * INTO v_demo_session FROM demo_sessions WHERE id = p_demo_session_id;
    
    -- Calculate duration
    v_duration := EXTRACT(EPOCH FROM (now() - v_demo_session.started_at)) / 60;
    
    -- Update demo session
    UPDATE demo_sessions
    SET 
        ended_at = now(),
        duration_minutes = v_duration,
        engagement_score = p_engagement_score,
        satisfaction_score = p_satisfaction_score,
        likelihood_to_recommend = p_likelihood_to_recommend,
        follow_up_required = p_follow_up_required,
        next_steps = p_next_steps,
        status = 'completed',
        updated_at = now()
    WHERE id = p_demo_session_id;
    
    -- Update demo invitation status
    UPDATE demo_invitations
    SET 
        status = 'completed',
        updated_at = now()
    WHERE id = v_demo_session.demo_invitation_id;
    
    -- Update analytics
    INSERT INTO demo_analytics (
        date,
        demo_category_id,
        demos_completed,
        avg_duration_minutes,
        avg_engagement_score,
        avg_satisfaction_score,
        avg_likelihood_to_recommend,
        follow_ups_requested
    )
    SELECT 
        CURRENT_DATE,
        di.demo_category_id,
        1,
        v_duration,
        COALESCE(p_engagement_score, 0),
        COALESCE(p_satisfaction_score, 0),
        COALESCE(p_likelihood_to_recommend, 0),
        CASE WHEN p_follow_up_required THEN 1 ELSE 0 END
    FROM demo_invitations di
    WHERE di.id = v_demo_session.demo_invitation_id
    ON CONFLICT (date, demo_category_id) DO UPDATE SET
        demos_completed = demo_analytics.demos_completed + 1,
        avg_duration_minutes = (demo_analytics.avg_duration_minutes * demo_analytics.demos_completed + v_duration) / (demo_analytics.demos_completed + 1),
        avg_engagement_score = (demo_analytics.avg_engagement_score * demo_analytics.demos_completed + COALESCE(p_engagement_score, 0)) / (demo_analytics.demos_completed + 1),
        avg_satisfaction_score = (demo_analytics.avg_satisfaction_score * demo_analytics.demos_completed + COALESCE(p_satisfaction_score, 0)) / (demo_analytics.demos_completed + 1),
        avg_likelihood_to_recommend = (demo_analytics.avg_likelihood_to_recommend * demo_analytics.demos_completed + COALESCE(p_likelihood_to_recommend, 0)) / (demo_analytics.demos_completed + 1),
        follow_ups_requested = demo_analytics.follow_ups_requested + CASE WHEN p_follow_up_required THEN 1 ELSE 0 END,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE demo_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_analytics ENABLE ROW LEVEL SECURITY;

-- Demo categories are public read
CREATE POLICY "Anyone can view active demo categories" ON demo_categories
    FOR SELECT USING (is_active = true);

-- Demo invitations policies
CREATE POLICY "Users can view their demo invitations" ON demo_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invitations i
            WHERE i.id = demo_invitations.invitation_id
            AND i.email = auth.email()
        )
    );

-- Demo sessions policies
CREATE POLICY "Users can view their demo sessions" ON demo_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM demo_invitations di
            JOIN invitations i ON di.invitation_id = i.id
            WHERE di.id = demo_sessions.demo_invitation_id
            AND (i.email = auth.email() OR demo_sessions.host_user_id = auth.uid())
        )
    );

-- Demo feedback policies
CREATE POLICY "Users can view their demo feedback" ON demo_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM demo_sessions ds
            JOIN demo_invitations di ON ds.demo_invitation_id = di.id
            JOIN invitations i ON di.invitation_id = i.id
            WHERE ds.id = demo_feedback.demo_session_id
            AND i.email = auth.email()
        )
    );

CREATE POLICY "Users can create demo feedback" ON demo_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM demo_sessions ds
            JOIN demo_invitations di ON ds.demo_invitation_id = di.id
            JOIN invitations i ON di.invitation_id = i.id
            WHERE ds.id = demo_feedback.demo_session_id
            AND i.email = auth.email()
        )
    );

-- Demo templates are public read
CREATE POLICY "Anyone can view active demo templates" ON demo_templates
    FOR SELECT USING (is_active = true);

-- Insert default demo categories
INSERT INTO demo_categories (name, description, features, duration_minutes, is_active)
VALUES 
    ('Product Overview', 'Comprehensive product demonstration covering all major features', '{"full_feature_access": true, "custom_data": true, "qa_session": true}', 45, true),
    ('Technical Deep Dive', 'Technical demonstration for developers and IT professionals', '{"api_access": true, "integration_demo": true, "technical_qa": true}', 60, true),
    ('Business Use Cases', 'Business-focused demonstration showing ROI and use cases', '{"business_metrics": true, "roi_calculator": true, "case_studies": true}', 30, true),
    ('Quick Preview', 'Short overview demonstration for busy stakeholders', '{"basic_features": true, "quick_tour": true}', 15, true),
    ('Custom Demo', 'Tailored demonstration based on specific requirements', '{"custom_configuration": true, "personalized_data": true, "extended_qa": true}', 90, true);

-- Insert default demo templates
INSERT INTO demo_templates (name, description, demo_category_id, template_config, script_outline, key_features, demo_flow, is_active, is_default)
SELECT 
    'Default ' || dc.name || ' Template',
    'Default template for ' || dc.name || ' demonstrations',
    dc.id,
    jsonb_build_object(
        'theme', 'professional',
        'branding', 'drishiq',
        'interactive', true
    ),
    jsonb_build_object(
        'introduction', '5 minutes',
        'demo', (dc.duration_minutes - 15) || ' minutes',
        'qa', '10 minutes'
    ),
    dc.features,
    jsonb_build_array(
        'Welcome and introductions',
        'Business context and pain points',
        'Product demonstration',
        'Questions and answers',
        'Next steps and follow-up'
    ),
    true,
    true
FROM demo_categories dc;

-- Create updated_at triggers
CREATE TRIGGER update_demo_categories_updated_at BEFORE UPDATE ON demo_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demo_invitations_updated_at BEFORE UPDATE ON demo_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demo_sessions_updated_at BEFORE UPDATE ON demo_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demo_templates_updated_at BEFORE UPDATE ON demo_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demo_analytics_updated_at BEFORE UPDATE ON demo_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 