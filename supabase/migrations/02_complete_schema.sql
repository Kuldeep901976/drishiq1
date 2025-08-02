-- DrishiQ Complete Database Schema
-- Extends the basic schema with all required features

-- Enhanced users table with new fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'regular' CHECK (user_type IN ('regular', 'enterprise', 'admin', 'demo'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS affiliate_id TEXT;

-- Enhanced invitations table
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'regular' CHECK (invitation_type IN ('regular', 'demo', 'enterprise', 'referral', 'story_reward'));
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.Invitations ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0;

-- Story submissions table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  story_title TEXT NOT NULL,
  story_content TEXT NOT NULL,
  category TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  admin_notes TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  invitation_granted BOOLEAN DEFAULT FALSE,
  uniqueness_score INTEGER DEFAULT 0
);

-- Invitation requests table (for non-invited users)
CREATE TABLE IF NOT EXISTS public.invitation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  interests TEXT[],
  issues TEXT[],
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  priority_score INTEGER DEFAULT 0,
  auto_approved BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID
);

-- Plans and subscriptions
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  price_usd DECIMAL(10,2) NOT NULL,
  credits_included INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB,
  target_region TEXT[]
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_id TEXT,
  credits_remaining INTEGER NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE
);

-- Sessions table (for tracking credit usage)
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'completed', 'abandoned')),
  credits_used INTEGER DEFAULT 1,
  session_data JSONB,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  feedback TEXT
);

-- Analytics tracking
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.users(id) NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES public.users(id),
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Affiliate tracking
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code TEXT UNIQUE NOT NULL,
  affiliate_name TEXT NOT NULL,
  affiliate_email TEXT NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_user_id UUID REFERENCES public.users(id) NOT NULL,
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB
);

-- Demo invitations
CREATE TABLE IF NOT EXISTS public.demo_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  demo_name TEXT NOT NULL,
  features_enabled TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_credits ON public.users(credits);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON public.users(plan_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_category ON public.stories(category);
CREATE INDEX IF NOT EXISTS idx_invitation_requests_status ON public.invitation_requests(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Enable RLS on new tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Stories policies
CREATE POLICY "Users can submit stories" ON public.stories
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can read all stories" ON public.stories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Sessions policies
CREATE POLICY "Users can read own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Analytics policies (admin only)
CREATE POLICY "Admins can read analytics" ON public.user_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Insert default plans
INSERT INTO public.plans (name, description, price_usd, credits_included, validity_days, features) VALUES
('Starter', 'Perfect for individuals getting started', 9.99, 10, 30, '{"support": "email", "priority": "standard"}'),
('Professional', 'For regular users and small teams', 29.99, 50, 30, '{"support": "priority", "priority": "high", "analytics": true}'),
('Enterprise', 'For organizations and large teams', 99.99, 200, 30, '{"support": "dedicated", "priority": "highest", "analytics": true, "custom_features": true}')
ON CONFLICT DO NOTHING;

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
('daily_auto_approve_limit', '51', 'Maximum number of invitation requests auto-approved daily'),
('invitation_expiry_days', '7', 'Number of days invitation tokens remain valid'),
('story_review_weekly', 'true', 'Whether to conduct weekly story reviews'),
('demo_invitation_max_validity_hours', '24', 'Maximum validity for demo invitations')
ON CONFLICT DO NOTHING; 