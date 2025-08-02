-- Create Invitations table
CREATE TABLE IF NOT EXISTS Invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL,
    location TEXT,
    video_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_invitations_email ON Invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_phone ON Invitations(phone);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON Invitations(status); 