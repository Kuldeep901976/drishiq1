-- Create OTP codes table
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL CHECK (purpose IN ('phone_verification', 'email_verification', 'password_reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_otp_codes_purpose ON otp_codes(purpose);
CREATE INDEX idx_otp_codes_verified ON otp_codes(verified);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX idx_otp_codes_created_at ON otp_codes(created_at);

-- Composite index for common queries
CREATE INDEX idx_otp_codes_email_purpose_verified ON otp_codes(email, purpose, verified);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own OTP codes
CREATE POLICY "Users can view their own OTP codes"
    ON otp_codes FOR SELECT
    USING (auth.email() = email);

-- RLS Policy: Only authenticated users can insert OTP codes
CREATE POLICY "Authenticated users can insert OTP codes"
    ON otp_codes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Users can only update their own OTP codes
CREATE POLICY "Users can update their own OTP codes"
    ON otp_codes FOR UPDATE
    USING (auth.email() = email);

-- RLS Policy: Allow service role to manage all OTP codes
CREATE POLICY "Service role can manage all OTP codes"
    ON otp_codes FOR ALL
    USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at
CREATE TRIGGER update_otp_codes_updated_at
    BEFORE UPDATE ON otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes
    WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON otp_codes TO authenticated;
GRANT ALL ON otp_codes TO service_role; 