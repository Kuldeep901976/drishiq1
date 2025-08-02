-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions TEXT[] DEFAULT ARRAY['manage_invitations', 'manage_stories', 'manage_users', 'view_analytics'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert a test admin user (replace with your actual user ID)
-- You can find your user ID by checking the auth.users table in Supabase dashboard
INSERT INTO admin_users (user_id, email, role, permissions, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with your actual user ID
    'admin@drishiq.com', -- Replace with your email
    'admin',
    ARRAY['manage_invitations', 'manage_stories', 'manage_users', 'view_analytics'],
    true
) ON CONFLICT (user_id) DO NOTHING; 