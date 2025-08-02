-- Payment System Migration
-- Comprehensive payment infrastructure with regional pricing and credit system

-- Regional pricing configuration
CREATE TABLE pricing_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL UNIQUE, -- 'US', 'EU', 'IN', 'GLOBAL', etc.
    region_name TEXT NOT NULL,
    currency_code TEXT NOT NULL, -- 'USD', 'EUR', 'INR', etc.
    currency_symbol TEXT NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    price_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Adjustment factor for regional pricing
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Base pricing plans
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT NOT NULL UNIQUE, -- 'basic', 'professional', 'enterprise'
    plan_name TEXT NOT NULL,
    plan_description TEXT,
    base_price_usd DECIMAL(10,2) NOT NULL, -- Base price in USD
    billing_cycle TEXT NOT NULL, -- 'monthly', 'yearly', 'one_time'
    credits_included INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb, -- Array of feature flags
    max_sessions_per_month INTEGER,
    max_users INTEGER, -- For enterprise plans
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regional pricing (calculated from base price and region multiplier)
CREATE TABLE regional_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES pricing_regions(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL, -- Price in regional currency
    currency_code TEXT NOT NULL,
    stripe_price_id TEXT, -- Stripe price ID for this region/plan combo
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, region_id)
);

-- User subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES pricing_plans(id),
    region_id UUID NOT NULL REFERENCES pricing_regions(id),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'unpaid'
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions and balances
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL, -- 'purchase', 'refund', 'deduction', 'bonus', 'expiry'
    amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
    balance_after INTEGER NOT NULL,
    description TEXT,
    session_id UUID, -- Reference to session that used credits
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Current credit balances (optimized for quick lookups)
CREATE TABLE credit_balances (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_credits INTEGER DEFAULT 0,
    available_credits INTEGER DEFAULT 0, -- Non-expired credits
    reserved_credits INTEGER DEFAULT 0, -- Credits reserved for active sessions
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency_code TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed', 'canceled'
    payment_method TEXT, -- 'card', 'bank_transfer', 'wallet', etc.
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit packages for one-time purchases
CREATE TABLE credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_code TEXT NOT NULL UNIQUE,
    package_name TEXT NOT NULL,
    credits_amount INTEGER NOT NULL,
    base_price_usd DECIMAL(10,2) NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    validity_days INTEGER DEFAULT 365, -- Credits expire after this many days
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regional credit package pricing
CREATE TABLE regional_credit_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES credit_packages(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES pricing_regions(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    currency_code TEXT NOT NULL,
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(package_id, region_id)
);

-- Session credit usage tracking
CREATE TABLE session_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL, -- External session ID
    credits_reserved INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    credits_refunded INTEGER DEFAULT 0,
    session_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_ended_at TIMESTAMP WITH TIME ZONE,
    session_duration_minutes INTEGER,
    session_type TEXT DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
    metadata JSONB
);

-- Billing history
CREATE TABLE billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    invoice_number TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency_code TEXT NOT NULL,
    description TEXT,
    billing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'canceled'
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_session_credits_user_id ON session_credits(user_id);
CREATE INDEX idx_session_credits_session_id ON session_credits(session_id);
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);

-- RLS Policies
ALTER TABLE pricing_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_credit_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Public read access to pricing information
CREATE POLICY "Public can view pricing regions" ON pricing_regions FOR SELECT TO anon, authenticated 
    USING (is_active = true);

CREATE POLICY "Public can view pricing plans" ON pricing_plans FOR SELECT TO anon, authenticated 
    USING (is_active = true);

CREATE POLICY "Public can view regional pricing" ON regional_pricing FOR SELECT TO anon, authenticated 
    USING (is_active = true);

CREATE POLICY "Public can view credit packages" ON credit_packages FOR SELECT TO anon, authenticated 
    USING (is_active = true);

CREATE POLICY "Public can view regional credit pricing" ON regional_credit_pricing FOR SELECT TO anon, authenticated 
    USING (is_active = true);

-- User access policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own credit transactions" ON credit_transactions FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own credit balance" ON credit_balances FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own payment transactions" ON payment_transactions FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own session credits" ON session_credits FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own billing history" ON billing_history FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- Admin access policies
CREATE POLICY "Admins can manage pricing regions" ON pricing_regions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage pricing plans" ON pricing_plans FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage regional pricing" ON regional_pricing FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view all credit transactions" ON credit_transactions FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can view all payment transactions" ON payment_transactions FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage credit packages" ON credit_packages FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

CREATE POLICY "Admins can manage regional credit pricing" ON regional_credit_pricing FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));

-- Service access policies (for internal operations)
CREATE POLICY "Service can manage subscriptions" ON subscriptions FOR ALL TO authenticated 
    USING (current_setting('app.service_role', true) = 'true');

CREATE POLICY "Service can manage credit transactions" ON credit_transactions FOR ALL TO authenticated 
    USING (current_setting('app.service_role', true) = 'true');

CREATE POLICY "Service can manage credit balances" ON credit_balances FOR ALL TO authenticated 
    USING (current_setting('app.service_role', true) = 'true');

CREATE POLICY "Service can manage payment transactions" ON payment_transactions FOR ALL TO authenticated 
    USING (current_setting('app.service_role', true) = 'true');

CREATE POLICY "Service can manage session credits" ON session_credits FOR ALL TO authenticated 
    USING (current_setting('app.service_role', true) = 'true');

CREATE POLICY "Service can manage billing history" ON billing_history FOR ALL TO authenticated 
    USING (current_setting('app.service_role', true) = 'true');

-- Useful views for reporting
CREATE VIEW subscription_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_subscriptions,
    COUNT(DISTINCT user_id) as unique_subscribers,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
    SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled_subscriptions,
    p.plan_name,
    r.region_name,
    r.currency_code
FROM subscriptions s
JOIN pricing_plans p ON s.plan_id = p.id
JOIN pricing_regions r ON s.region_id = r.id
GROUP BY DATE(created_at), p.plan_name, r.region_name, r.currency_code
ORDER BY date DESC;

CREATE VIEW revenue_analytics AS
SELECT 
    DATE(created_at) as date,
    SUM(amount) as total_revenue,
    COUNT(*) as transaction_count,
    AVG(amount) as avg_transaction_value,
    currency_code,
    COUNT(DISTINCT user_id) as unique_customers
FROM payment_transactions
WHERE status = 'succeeded'
GROUP BY DATE(created_at), currency_code
ORDER BY date DESC;

CREATE VIEW credit_usage_analytics AS
SELECT 
    DATE(created_at) as date,
    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as credits_purchased,
    SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as credits_used,
    COUNT(DISTINCT user_id) as active_users,
    transaction_type
FROM credit_transactions
GROUP BY DATE(created_at), transaction_type
ORDER BY date DESC;

-- Functions for credit management
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT COALESCE(available_credits, 0) 
    FROM credit_balances 
    WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION deduct_credits(user_uuid UUID, amount INTEGER, description TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT available_credits INTO current_balance 
    FROM credit_balances 
    WHERE user_id = user_uuid;
    
    -- Check if user has enough credits
    IF current_balance IS NULL OR current_balance < amount THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance - amount;
    
    -- Update balance
    UPDATE credit_balances 
    SET available_credits = new_balance, 
        total_credits = total_credits - amount,
        last_updated = NOW()
    WHERE user_id = user_uuid;
    
    -- Record transaction
    INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description)
    VALUES (user_uuid, 'deduction', -amount, new_balance, description);
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION add_credits(user_uuid UUID, amount INTEGER, description TEXT DEFAULT NULL, expires_days INTEGER DEFAULT 365)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate expiry date
    expiry_date := NOW() + INTERVAL '1 day' * expires_days;
    
    -- Get current balance or create new record
    SELECT available_credits INTO current_balance 
    FROM credit_balances 
    WHERE user_id = user_uuid;
    
    IF current_balance IS NULL THEN
        current_balance := 0;
        INSERT INTO credit_balances (user_id, total_credits, available_credits)
        VALUES (user_uuid, 0, 0);
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + amount;
    
    -- Update balance
    UPDATE credit_balances 
    SET available_credits = new_balance,
        total_credits = total_credits + amount,
        last_updated = NOW()
    WHERE user_id = user_uuid;
    
    -- Record transaction
    INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description, expires_at)
    VALUES (user_uuid, 'purchase', amount, new_balance, description, expiry_date);
    
    RETURN TRUE;
END;
$$;

-- Default data
INSERT INTO pricing_regions (region_code, region_name, currency_code, currency_symbol, tax_rate, price_multiplier) VALUES
('US', 'United States', 'USD', '$', 0.00, 1.00),
('EU', 'European Union', 'EUR', '€', 0.20, 0.85),
('IN', 'India', 'INR', '₹', 0.18, 0.25),
('GB', 'United Kingdom', 'GBP', '£', 0.20, 0.80),
('CA', 'Canada', 'CAD', 'C$', 0.05, 1.10),
('AU', 'Australia', 'AUD', 'A$', 0.10, 1.15),
('SG', 'Singapore', 'SGD', 'S$', 0.07, 1.05),
('GLOBAL', 'Global', 'USD', '$', 0.00, 1.00);

INSERT INTO pricing_plans (plan_code, plan_name, plan_description, base_price_usd, billing_cycle, credits_included, features, max_sessions_per_month, max_users) VALUES
('free', 'Free Trial', 'Get started with basic features', 0.00, 'monthly', 10, '["basic_sessions", "community_support"]', 5, 1),
('basic', 'Basic Plan', 'Perfect for individuals', 19.99, 'monthly', 100, '["basic_sessions", "email_support", "basic_analytics"]', 50, 1),
('professional', 'Professional Plan', 'For growing professionals', 49.99, 'monthly', 300, '["premium_sessions", "priority_support", "advanced_analytics", "custom_branding"]', 150, 1),
('enterprise', 'Enterprise Plan', 'For teams and organizations', 199.99, 'monthly', 1000, '["enterprise_sessions", "dedicated_support", "full_analytics", "team_management", "api_access"]', 500, 50),
('basic_annual', 'Basic Annual', 'Basic plan paid annually', 199.99, 'yearly', 1200, '["basic_sessions", "email_support", "basic_analytics"]', 50, 1),
('professional_annual', 'Professional Annual', 'Professional plan paid annually', 499.99, 'yearly', 3600, '["premium_sessions", "priority_support", "advanced_analytics", "custom_branding"]', 150, 1),
('enterprise_annual', 'Enterprise Annual', 'Enterprise plan paid annually', 1999.99, 'yearly', 12000, '["enterprise_sessions", "dedicated_support", "full_analytics", "team_management", "api_access"]', 500, 50);

INSERT INTO credit_packages (package_code, package_name, credits_amount, base_price_usd, bonus_credits, validity_days) VALUES
('small', 'Small Credit Pack', 50, 9.99, 5, 365),
('medium', 'Medium Credit Pack', 150, 24.99, 25, 365),
('large', 'Large Credit Pack', 350, 49.99, 75, 365),
('mega', 'Mega Credit Pack', 750, 99.99, 150, 365);

-- Calculate and insert regional pricing
INSERT INTO regional_pricing (plan_id, region_id, price, currency_code)
SELECT 
    p.id as plan_id,
    r.id as region_id,
    ROUND(p.base_price_usd * r.price_multiplier, 2) as price,
    r.currency_code
FROM pricing_plans p
CROSS JOIN pricing_regions r
WHERE p.is_active = true AND r.is_active = true;

-- Calculate and insert regional credit pricing
INSERT INTO regional_credit_pricing (package_id, region_id, price, currency_code)
SELECT 
    cp.id as package_id,
    r.id as region_id,
    ROUND(cp.base_price_usd * r.price_multiplier, 2) as price,
    r.currency_code
FROM credit_packages cp
CROSS JOIN pricing_regions r
WHERE cp.is_active = true AND r.is_active = true; 