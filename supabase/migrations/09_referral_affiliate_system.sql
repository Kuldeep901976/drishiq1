-- Referral & Affiliate System Migration
-- This migration creates tables for referral and affiliate tracking

-- Referral codes table
CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('user', 'affiliate')) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Referral tracking table
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL REFERENCES referral_codes(code),
    status TEXT CHECK (status IN ('pending', 'confirmed', 'rewarded', 'cancelled')) DEFAULT 'pending',
    reward_amount DECIMAL(10,2) DEFAULT 0,
    reward_currency TEXT DEFAULT 'USD',
    reward_type TEXT CHECK (reward_type IN ('credits', 'cash', 'subscription')) DEFAULT 'credits',
    conversion_event TEXT, -- 'signup', 'first_payment', 'first_session', etc.
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    rewarded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(referrer_id, referee_id)
);

-- Affiliate programs table
CREATE TABLE affiliate_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    commission_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.1000 for 10%
    commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
    fixed_amount DECIMAL(10,2) DEFAULT NULL,
    cookie_duration INTEGER DEFAULT 30, -- days
    minimum_payout DECIMAL(10,2) DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    terms_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Affiliate users table
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
    affiliate_code TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')) DEFAULT 'pending',
    commission_rate DECIMAL(5,4), -- Override program rate if needed
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    paid_earnings DECIMAL(10,2) DEFAULT 0,
    pending_earnings DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT,
    payment_details JSONB,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, program_id)
);

-- Affiliate commissions table
CREATE TABLE affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    transaction_id UUID, -- Links to payment transactions
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')) DEFAULT 'pending',
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Affiliate payouts table
CREATE TABLE affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT NOT NULL,
    payment_reference TEXT,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Referral rewards table
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type TEXT CHECK (reward_type IN ('credits', 'subscription', 'cash')) NOT NULL,
    reward_amount DECIMAL(10,2) NOT NULL,
    reward_currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'granted', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_active ON referral_codes(is_active);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_program_id ON affiliates(program_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);

CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);

CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);

CREATE INDEX idx_referral_rewards_referral_id ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);

-- Create views for analytics
CREATE VIEW referral_analytics AS
SELECT 
    r.referrer_id,
    u.email as referrer_email,
    COUNT(*) as total_referrals,
    COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed_referrals,
    COUNT(CASE WHEN r.status = 'rewarded' THEN 1 END) as rewarded_referrals,
    SUM(r.reward_amount) as total_rewards,
    AVG(r.reward_amount) as avg_reward
FROM referrals r
JOIN users u ON r.referrer_id = u.id
GROUP BY r.referrer_id, u.email;

CREATE VIEW affiliate_analytics AS
SELECT 
    a.id as affiliate_id,
    a.user_id,
    u.email as affiliate_email,
    ap.name as program_name,
    a.total_referrals,
    a.total_earnings,
    a.paid_earnings,
    a.pending_earnings,
    COUNT(ac.id) as total_commissions,
    SUM(CASE WHEN ac.status = 'approved' THEN ac.commission_amount ELSE 0 END) as approved_commissions,
    SUM(CASE WHEN ac.status = 'paid' THEN ac.commission_amount ELSE 0 END) as paid_commissions
FROM affiliates a
JOIN users u ON a.user_id = u.id
JOIN affiliate_programs ap ON a.program_id = ap.id
LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id
GROUP BY a.id, a.user_id, u.email, ap.name, a.total_referrals, a.total_earnings, a.paid_earnings, a.pending_earnings;

-- Update functions for automatic calculations
CREATE OR REPLACE FUNCTION update_referral_code_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE referral_codes 
        SET current_uses = current_uses + 1,
            updated_at = now()
        WHERE code = NEW.referral_code;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE referral_codes 
        SET current_uses = current_uses - 1,
            updated_at = now()
        WHERE code = OLD.referral_code;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_affiliate_earnings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE affiliates 
        SET pending_earnings = pending_earnings + NEW.commission_amount,
            total_earnings = total_earnings + NEW.commission_amount,
            updated_at = now()
        WHERE id = NEW.affiliate_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
            -- No change needed, already in pending_earnings
        ELSIF OLD.status = 'pending' AND NEW.status = 'paid' THEN
            UPDATE affiliates 
            SET pending_earnings = pending_earnings - NEW.commission_amount,
                paid_earnings = paid_earnings + NEW.commission_amount,
                updated_at = now()
            WHERE id = NEW.affiliate_id;
        ELSIF OLD.status = 'approved' AND NEW.status = 'paid' THEN
            UPDATE affiliates 
            SET pending_earnings = pending_earnings - NEW.commission_amount,
                paid_earnings = paid_earnings + NEW.commission_amount,
                updated_at = now()
            WHERE id = NEW.affiliate_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_referral_code_usage
    AFTER INSERT OR DELETE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_referral_code_usage();

CREATE TRIGGER trigger_update_affiliate_earnings
    AFTER INSERT OR UPDATE ON affiliate_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_earnings();

-- RLS Policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Referral codes policies
CREATE POLICY "Users can view their own referral codes" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view their referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "System can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON referrals
    FOR UPDATE USING (true);

-- Affiliate programs policies (public read)
CREATE POLICY "Anyone can view active affiliate programs" ON affiliate_programs
    FOR SELECT USING (is_active = true);

-- Affiliates policies
CREATE POLICY "Users can view their affiliate accounts" ON affiliates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create affiliate accounts" ON affiliates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their affiliate accounts" ON affiliates
    FOR UPDATE USING (auth.uid() = user_id);

-- Affiliate commissions policies
CREATE POLICY "Affiliates can view their commissions" ON affiliate_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM affiliates 
            WHERE id = affiliate_commissions.affiliate_id 
            AND user_id = auth.uid()
        )
    );

-- Affiliate payouts policies
CREATE POLICY "Affiliates can view their payouts" ON affiliate_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM affiliates 
            WHERE id = affiliate_payouts.affiliate_id 
            AND user_id = auth.uid()
        )
    );

-- Referral rewards policies
CREATE POLICY "Users can view their referral rewards" ON referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Insert default affiliate program
INSERT INTO affiliate_programs (name, description, commission_rate, commission_type, cookie_duration, minimum_payout, is_active, terms_url)
VALUES (
    'DrishiQ Partner Program',
    'Earn commissions by referring new users to DrishiQ',
    0.2000, -- 20% commission
    'percentage',
    30, -- 30 days cookie duration
    50.00, -- $50 minimum payout
    true,
    '/terms/affiliate'
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON referral_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_programs_updated_at BEFORE UPDATE ON affiliate_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON affiliate_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_payouts_updated_at BEFORE UPDATE ON affiliate_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referral_rewards_updated_at BEFORE UPDATE ON referral_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 