-- MVP Enhancements Migration
-- This migration creates tables for help system, feedback collection, and progress tracking

-- Help system - Knowledge base articles
CREATE TABLE help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES users(id),
    
    -- Content metadata
    content_type TEXT CHECK (content_type IN ('article', 'video', 'tutorial', 'faq')) DEFAULT 'article',
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_reading_time INTEGER DEFAULT 5, -- minutes
    
    -- SEO and organization
    slug TEXT UNIQUE NOT NULL,
    meta_description TEXT,
    keywords TEXT[],
    
    -- Status and visibility
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Help article views and interactions
CREATE TABLE help_article_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    session_id TEXT,
    
    -- View details
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    time_spent_seconds INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    
    -- User feedback
    was_helpful BOOLEAN DEFAULT NULL,
    feedback_text TEXT,
    
    -- Context
    referrer_url TEXT,
    search_query TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User feedback system
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    -- Feedback details
    feedback_type TEXT CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'complaint', 'compliment')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    
    -- Priority and impact
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    user_impact TEXT CHECK (user_impact IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    
    -- Technical details
    browser_info JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    page_url TEXT,
    user_agent TEXT,
    screenshot_url TEXT,
    
    -- Status tracking
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')) DEFAULT 'open',
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    -- Contact preferences
    contact_email TEXT,
    allow_follow_up BOOLEAN DEFAULT true,
    
    -- Timestamps
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feedback responses and communication
CREATE TABLE feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES user_feedback(id) ON DELETE CASCADE,
    responder_id UUID REFERENCES users(id),
    
    -- Response content
    message TEXT NOT NULL,
    response_type TEXT CHECK (response_type IN ('reply', 'status_update', 'resolution', 'follow_up')) DEFAULT 'reply',
    
    -- Visibility
    is_internal BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User progress tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Progress categories
    category TEXT NOT NULL, -- 'onboarding', 'feature_adoption', 'milestone', 'achievement'
    milestone_type TEXT NOT NULL,
    milestone_name TEXT NOT NULL,
    
    -- Progress details
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')) DEFAULT 'not_started',
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, category, milestone_type, milestone_name)
);

-- Progress steps and checkpoints
CREATE TABLE progress_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_id UUID NOT NULL REFERENCES user_progress(id) ON DELETE CASCADE,
    
    -- Step details
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_description TEXT,
    
    -- Step status
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'skipped')) DEFAULT 'pending',
    
    -- Completion details
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Step data
    step_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(progress_id, step_number)
);

-- Achievement system
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT NOT NULL,
    
    -- Achievement criteria
    criteria JSONB NOT NULL,
    points INTEGER DEFAULT 0,
    badge_color TEXT DEFAULT '#3B82F6',
    
    -- Rarity and rewards
    rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    reward_type TEXT CHECK (reward_type IN ('none', 'credits', 'feature_unlock', 'badge')) DEFAULT 'none',
    reward_value DECIMAL(10,2) DEFAULT 0,
    
    -- Visibility
    is_active BOOLEAN DEFAULT true,
    is_hidden BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Achievement details
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    progress_percentage DECIMAL(5,2) DEFAULT 100,
    
    -- Context
    trigger_event TEXT,
    trigger_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(user_id, achievement_id)
);

-- Notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT CHECK (notification_type IN (
        'info', 'success', 'warning', 'error', 
        'achievement', 'milestone', 'feedback_response', 
        'system_update', 'feature_announcement'
    )) NOT NULL,
    
    -- Action and routing
    action_url TEXT,
    action_text TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery channels
    email_sent BOOLEAN DEFAULT false,
    push_sent BOOLEAN DEFAULT false,
    in_app_shown BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feature usage analytics
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    -- Feature details
    feature_name TEXT NOT NULL,
    feature_category TEXT,
    action TEXT NOT NULL,
    
    -- Usage context
    session_id TEXT,
    page_url TEXT,
    user_agent TEXT,
    
    -- Performance metrics
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Usage data
    usage_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_help_articles_category ON help_articles(category);
CREATE INDEX idx_help_articles_status ON help_articles(status);
CREATE INDEX idx_help_articles_is_featured ON help_articles(is_featured);
CREATE INDEX idx_help_articles_published_at ON help_articles(published_at);
CREATE INDEX idx_help_articles_view_count ON help_articles(view_count);

CREATE INDEX idx_help_article_views_article_id ON help_article_views(article_id);
CREATE INDEX idx_help_article_views_user_id ON help_article_views(user_id);
CREATE INDEX idx_help_article_views_viewed_at ON help_article_views(viewed_at);

CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_priority ON user_feedback(priority);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at);

CREATE INDEX idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX idx_feedback_responses_responder_id ON feedback_responses(responder_id);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_category ON user_progress(category);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_user_progress_last_activity_at ON user_progress(last_activity_at);

CREATE INDEX idx_progress_steps_progress_id ON progress_steps(progress_id);
CREATE INDEX idx_progress_steps_step_number ON progress_steps(step_number);
CREATE INDEX idx_progress_steps_status ON progress_steps(status);

CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_is_active ON achievements(is_active);
CREATE INDEX idx_achievements_rarity ON achievements(rarity);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_notification_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);

CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX idx_feature_usage_created_at ON feature_usage(created_at);

-- Create views for analytics
CREATE VIEW user_engagement_summary AS
SELECT 
    up.user_id,
    u.email,
    COUNT(up.id) as total_milestones,
    COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_milestones,
    COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress_milestones,
    AVG(up.completion_percentage) as avg_completion_percentage,
    COUNT(ua.id) as total_achievements,
    COALESCE(SUM(a.points), 0) as total_points
FROM user_progress up
JOIN users u ON up.user_id = u.id
LEFT JOIN user_achievements ua ON up.user_id = ua.user_id
LEFT JOIN achievements a ON ua.achievement_id = a.id
GROUP BY up.user_id, u.email;

CREATE VIEW help_content_analytics AS
SELECT 
    ha.id,
    ha.title,
    ha.category,
    ha.view_count,
    ha.helpful_count,
    ha.not_helpful_count,
    CASE 
        WHEN (ha.helpful_count + ha.not_helpful_count) = 0 THEN 0
        ELSE ROUND(ha.helpful_count::DECIMAL / (ha.helpful_count + ha.not_helpful_count) * 100, 2)
    END as helpfulness_percentage,
    COUNT(hav.id) as unique_viewers,
    AVG(hav.time_spent_seconds) as avg_time_spent,
    AVG(hav.scroll_percentage) as avg_scroll_percentage
FROM help_articles ha
LEFT JOIN help_article_views hav ON ha.id = hav.article_id
WHERE ha.status = 'published'
GROUP BY ha.id, ha.title, ha.category, ha.view_count, ha.helpful_count, ha.not_helpful_count;

CREATE VIEW feedback_analytics AS
SELECT 
    DATE(created_at) as date,
    feedback_type,
    COUNT(*) as total_feedback,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_feedback,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_feedback,
    AVG(CASE 
        WHEN resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 
    END) as avg_resolution_hours
FROM user_feedback
GROUP BY DATE(created_at), feedback_type
ORDER BY DATE(created_at) DESC;

-- Functions for progress tracking
CREATE OR REPLACE FUNCTION update_user_progress(
    p_user_id UUID,
    p_category TEXT,
    p_milestone_type TEXT,
    p_milestone_name TEXT,
    p_step_number INTEGER DEFAULT NULL,
    p_completion_percentage DECIMAL DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_progress_id UUID;
    v_total_steps INTEGER;
    v_completed_steps INTEGER;
    v_new_percentage DECIMAL;
BEGIN
    -- Get or create progress record
    INSERT INTO user_progress (
        user_id, category, milestone_type, milestone_name, 
        total_steps, status, started_at, last_activity_at
    ) VALUES (
        p_user_id, p_category, p_milestone_type, p_milestone_name,
        COALESCE(p_step_number, 1), 'in_progress', 
        CASE WHEN p_step_number IS NOT NULL THEN now() END,
        now()
    )
    ON CONFLICT (user_id, category, milestone_type, milestone_name) DO UPDATE SET
        last_activity_at = now(),
        status = CASE WHEN user_progress.status = 'not_started' THEN 'in_progress' ELSE user_progress.status END,
        started_at = CASE WHEN user_progress.started_at IS NULL THEN now() ELSE user_progress.started_at END
    RETURNING id, total_steps INTO v_progress_id, v_total_steps;
    
    -- Update specific step if provided
    IF p_step_number IS NOT NULL THEN
        INSERT INTO progress_steps (
            progress_id, step_number, step_name, status, completed_at
        ) VALUES (
            v_progress_id, p_step_number, 'Step ' || p_step_number, 'completed', now()
        )
        ON CONFLICT (progress_id, step_number) DO UPDATE SET
            status = 'completed',
            completed_at = now(),
            updated_at = now();
            
        -- Calculate completion percentage based on completed steps
        SELECT COUNT(*) INTO v_completed_steps
        FROM progress_steps 
        WHERE progress_id = v_progress_id AND status = 'completed';
        
        v_new_percentage := (v_completed_steps::DECIMAL / v_total_steps::DECIMAL) * 100;
    ELSE
        v_new_percentage := COALESCE(p_completion_percentage, 0);
    END IF;
    
    -- Update progress record
    UPDATE user_progress 
    SET 
        completion_percentage = v_new_percentage,
        current_step = GREATEST(current_step, COALESCE(p_step_number, current_step)),
        status = CASE 
            WHEN v_new_percentage >= 100 THEN 'completed'
            WHEN v_new_percentage > 0 THEN 'in_progress'
            ELSE status
        END,
        completed_at = CASE WHEN v_new_percentage >= 100 THEN now() ELSE completed_at END,
        updated_at = now()
    WHERE id = v_progress_id;
    
    -- Check for achievements
    PERFORM check_user_achievements(p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_user_achievements(p_user_id UUID) RETURNS VOID AS $$
DECLARE
    v_achievement RECORD;
    v_criteria JSONB;
    v_earned BOOLEAN;
BEGIN
    -- Loop through all active achievements
    FOR v_achievement IN 
        SELECT * FROM achievements WHERE is_active = true
    LOOP
        -- Check if user already has this achievement
        IF EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = v_achievement.id
        ) THEN
            CONTINUE;
        END IF;
        
        v_earned := false;
        v_criteria := v_achievement.criteria;
        
        -- Check different achievement criteria types
        IF v_criteria ->> 'type' = 'milestone_completion' THEN
            -- Check if user completed required milestones
            IF EXISTS (
                SELECT 1 FROM user_progress 
                WHERE user_id = p_user_id 
                AND status = 'completed'
                AND (
                    v_criteria ->> 'category' IS NULL OR 
                    category = v_criteria ->> 'category'
                )
                HAVING COUNT(*) >= (v_criteria ->> 'required_count')::INTEGER
            ) THEN
                v_earned := true;
            END IF;
        ELSIF v_criteria ->> 'type' = 'session_count' THEN
            -- Check session completion count
            IF EXISTS (
                SELECT 1 FROM user_sessions 
                WHERE user_id = p_user_id 
                AND status = 'completed'
                HAVING COUNT(*) >= (v_criteria ->> 'required_count')::INTEGER
            ) THEN
                v_earned := true;
            END IF;
        ELSIF v_criteria ->> 'type' = 'feedback_submission' THEN
            -- Check feedback submission
            IF EXISTS (
                SELECT 1 FROM user_feedback 
                WHERE user_id = p_user_id
                HAVING COUNT(*) >= (v_criteria ->> 'required_count')::INTEGER
            ) THEN
                v_earned := true;
            END IF;
        END IF;
        
        -- Award achievement if earned
        IF v_earned THEN
            INSERT INTO user_achievements (
                user_id, achievement_id, earned_at, trigger_event
            ) VALUES (
                p_user_id, v_achievement.id, now(), 'auto_check'
            );
            
            -- Create notification
            INSERT INTO notifications (
                user_id, title, message, notification_type, metadata
            ) VALUES (
                p_user_id,
                'Achievement Unlocked!',
                'Congratulations! You earned the "' || v_achievement.name || '" achievement.',
                'achievement',
                jsonb_build_object('achievement_id', v_achievement.id)
            );
            
            -- Award points/credits if applicable
            IF v_achievement.reward_type = 'credits' AND v_achievement.reward_value > 0 THEN
                UPDATE users 
                SET credits = credits + v_achievement.reward_value
                WHERE id = p_user_id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_feature_usage(
    p_user_id UUID,
    p_feature_name TEXT,
    p_action TEXT,
    p_feature_category TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_usage_data JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO feature_usage (
        user_id, feature_name, action, feature_category,
        success, response_time_ms, usage_data
    ) VALUES (
        p_user_id, p_feature_name, p_action, p_feature_category,
        p_success, p_response_time_ms, p_usage_data
    );
    
    -- Update user progress for feature adoption
    PERFORM update_user_progress(
        p_user_id,
        'feature_adoption',
        'feature_usage',
        p_feature_name,
        NULL,
        NULL
    );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Help articles policies (public read for published)
CREATE POLICY "Anyone can view published help articles" ON help_articles
    FOR SELECT USING (status = 'published' AND is_public = true);

-- Help article views policies
CREATE POLICY "Users can view their own article views" ON help_article_views
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create article views" ON help_article_views
    FOR INSERT WITH CHECK (true);

-- User feedback policies
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON user_feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Feedback responses policies
CREATE POLICY "Users can view responses to their feedback" ON feedback_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_feedback 
            WHERE id = feedback_responses.feedback_id 
            AND user_id = auth.uid()
        )
    );

-- User progress policies
CREATE POLICY "Users can view their own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create progress" ON user_progress
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update progress" ON user_progress
    FOR UPDATE USING (true);

-- Progress steps policies
CREATE POLICY "Users can view their progress steps" ON progress_steps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_progress 
            WHERE id = progress_steps.progress_id 
            AND user_id = auth.uid()
        )
    );

-- Achievements policies (public read)
CREATE POLICY "Anyone can view active achievements" ON achievements
    FOR SELECT USING (is_active = true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Feature usage policies
CREATE POLICY "Users can view their own feature usage" ON feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can track feature usage" ON feature_usage
    FOR INSERT WITH CHECK (true);

-- Insert default help articles
INSERT INTO help_articles (title, content, excerpt, category, slug, status, is_featured, published_at, author_id)
VALUES 
    ('Getting Started with DrishiQ', 'Complete guide to getting started...', 'Learn the basics of DrishiQ', 'Getting Started', 'getting-started', 'published', true, now(), '00000000-0000-0000-0000-000000000000'),
    ('How to Create Your First Session', 'Step-by-step guide to creating sessions...', 'Create and manage your sessions', 'Sessions', 'create-first-session', 'published', true, now(), '00000000-0000-0000-0000-000000000000'),
    ('Understanding Credits System', 'Learn about DrishiQ credits...', 'How credits work in DrishiQ', 'Billing', 'credits-system', 'published', false, now(), '00000000-0000-0000-0000-000000000000'),
    ('Troubleshooting Common Issues', 'Solutions to common problems...', 'Fix common issues quickly', 'Troubleshooting', 'troubleshooting', 'published', false, now(), '00000000-0000-0000-0000-000000000000');

-- Insert default achievements
INSERT INTO achievements (name, description, category, criteria, points, rarity, reward_type, reward_value, is_active)
VALUES 
    ('First Steps', 'Complete your first onboarding milestone', 'onboarding', '{"type": "milestone_completion", "category": "onboarding", "required_count": 1}', 10, 'common', 'credits', 5, true),
    ('Session Master', 'Complete 10 sessions successfully', 'sessions', '{"type": "session_count", "required_count": 10}', 50, 'uncommon', 'credits', 25, true),
    ('Feedback Hero', 'Submit your first feedback', 'community', '{"type": "feedback_submission", "required_count": 1}', 15, 'common', 'credits', 10, true),
    ('Power User', 'Complete 100 sessions', 'sessions', '{"type": "session_count", "required_count": 100}', 200, 'rare', 'credits', 100, true);

-- Create updated_at triggers
CREATE TRIGGER update_help_articles_updated_at BEFORE UPDATE ON help_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_feedback_updated_at BEFORE UPDATE ON user_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_steps_updated_at BEFORE UPDATE ON progress_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 