-- Email System Migration
-- This migration creates tables for email logging and tracking

-- Email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    email_type TEXT NOT NULL CHECK (email_type IN ('invitation', 'welcome', 'reminder', 'notification')),
    subject TEXT NOT NULL,
    token TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for email logs
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_token ON email_logs(token);

-- Email templates table for storing reusable email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for email templates
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Insert default email templates
INSERT INTO email_templates (template_name, subject, html_content, text_content, variables) VALUES
(
    'invitation',
    'Your DrishiQ Invitation - See Through the Challenge',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0B4422 0%, #083318 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">DrishiQ</h1>
            <p style="color: #90EE90; margin: 10px 0 0 0; font-size: 16px;">See Through the Challenge</p>
        </div>
        
        <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #0B4422; margin-bottom: 20px;">Welcome to DrishiQ, {{name}}!</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
                Thank you for your interest in joining our invite-only community. We''re excited to have you on board!
            </p>
            
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0;">
                <h3 style="color: #0B4422; margin-top: 0;">Your Invitation Link</h3>
                <p style="color: #666; margin-bottom: 20px;">
                    Click the button below to access your personalized DrishiQ experience:
                </p>
                <a href="{{invitationLink}}" 
                   style="display: inline-block; background: #0B4422; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Access DrishiQ
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>What to expect:</strong><br>
                • Personalized guidance based on your preferences<br>
                • AI-powered insights to help you see through challenges<br>
                • A community of forward-thinking individuals<br>
                • Tools for reflection, growth, and decision-making
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    This invitation link is unique to you and will expire in 7 days.<br>
                    If you have any questions, please contact our support team.
                </p>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>DrishiQ</strong> - Intelligence of Perception<br>
                See Through the Challenge
            </p>
        </div>
    </div>',
    'Welcome to DrishiQ, {{name}}!

Thank you for your interest in joining our invite-only community. We''re excited to have you on board!

Your Invitation Link: {{invitationLink}}

What to expect:
• Personalized guidance based on your preferences
• AI-powered insights to help you see through challenges
• A community of forward-thinking individuals
• Tools for reflection, growth, and decision-making

This invitation link is unique to you and will expire in 7 days.

DrishiQ - Intelligence of Perception
See Through the Challenge',
    '{"name": "string", "invitationLink": "string"}'
);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Email logs policies (admin only access)
CREATE POLICY "Admins can view all email logs" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert email logs" ON email_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can update email logs" ON email_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Email templates policies (admin only access)
CREATE POLICY "Admins can view all email templates" ON email_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage email templates" ON email_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Functions for email management
CREATE OR REPLACE FUNCTION get_email_template(template_name TEXT)
RETURNS TABLE (
    id UUID,
    subject TEXT,
    html_content TEXT,
    text_content TEXT,
    variables JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        et.id,
        et.subject,
        et.html_content,
        et.text_content,
        et.variables
    FROM email_templates et
    WHERE et.template_name = get_email_template.template_name
    AND et.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log email sending
CREATE OR REPLACE FUNCTION log_email_sent(
    recipient_email TEXT,
    recipient_name TEXT,
    email_type TEXT,
    subject TEXT,
    token TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    email_id UUID;
BEGIN
    INSERT INTO email_logs (
        recipient_email,
        recipient_name,
        email_type,
        subject,
        token,
        status
    ) VALUES (
        recipient_email,
        recipient_name,
        email_type,
        subject,
        token,
        'sent'
    ) RETURNING id INTO email_id;
    
    RETURN email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update triggers
CREATE TRIGGER update_email_logs_updated_at 
    BEFORE UPDATE ON email_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 