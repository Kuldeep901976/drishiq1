-- Admin Invitations Policy Migration
-- This migration adds admin policies for the Invitations table to allow admins to manage invitations

-- Enable RLS on Invitations table if not already enabled
ALTER TABLE public.Invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own invitation challenges" ON public.Invitations;

-- Create comprehensive policies for Invitations table
-- Admins can perform all operations
CREATE POLICY "Admins can manage all invitations" ON public.Invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Users can view their own invitations
CREATE POLICY "Users can view their own invitations" ON public.Invitations
    FOR SELECT USING (
        email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Users can insert their own invitations
CREATE POLICY "Users can insert their own invitations" ON public.Invitations
    FOR INSERT WITH CHECK (
        email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Users can update their own invitations
CREATE POLICY "Users can update their own invitations" ON public.Invitations
    FOR UPDATE USING (
        email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.Invitations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 