-- Create invitation_credits table to track credit allocations
CREATE TABLE IF NOT EXISTS invitation_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_id UUID NOT NULL REFERENCES "Invitation"(id) ON DELETE CASCADE,
    credits_allocated INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_credits_invitation_id ON invitation_credits(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_credits_status ON invitation_credits(status);
CREATE INDEX IF NOT EXISTS idx_invitation_credits_created_at ON invitation_credits(created_at);

-- Create unique constraint to ensure one credit record per invitation
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitation_credits_unique_invitation ON invitation_credits(invitation_id);

-- Add RLS policies
ALTER TABLE invitation_credits ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all credit records
CREATE POLICY "Admins can read all invitation credits" ON invitation_credits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for admins to insert credit records
CREATE POLICY "Admins can insert invitation credits" ON invitation_credits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for admins to update credit records
CREATE POLICY "Admins can update invitation credits" ON invitation_credits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy for admins to delete credit records
CREATE POLICY "Admins can delete invitation credits" ON invitation_credits
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitation_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invitation_credits_updated_at
    BEFORE UPDATE ON invitation_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_invitation_credits_updated_at();

-- Function to validate credit allocation
CREATE OR REPLACE FUNCTION validate_credit_allocation()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure credits_allocated is positive
    IF NEW.credits_allocated < 0 THEN
        RAISE EXCEPTION 'Credits allocated cannot be negative';
    END IF;
    
    -- Ensure credits_used is not negative
    IF NEW.credits_used < 0 THEN
        RAISE EXCEPTION 'Credits used cannot be negative';
    END IF;
    
    -- Ensure credits_used doesn't exceed credits_allocated
    IF NEW.credits_used > NEW.credits_allocated THEN
        RAISE EXCEPTION 'Credits used cannot exceed credits allocated';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate credit allocation
CREATE TRIGGER validate_credit_allocation_trigger
    BEFORE INSERT OR UPDATE ON invitation_credits
    FOR EACH ROW
    EXECUTE FUNCTION validate_credit_allocation(); 