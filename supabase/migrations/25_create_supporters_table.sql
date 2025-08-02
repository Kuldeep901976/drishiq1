-- Create supporters table for matching seekers with supporters
CREATE TABLE IF NOT EXISTS supporters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('seeker', 'supporter')),
  domain TEXT,
  type TEXT,
  issue TEXT,
  open_to_all BOOLEAN DEFAULT false,
  other_text TEXT,
  email TEXT,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'contacted', 'completed')),
  matched_with UUID[] DEFAULT '{}',
  notes TEXT,
  
  -- Ensure at least one of domain/type/issue is provided if not open_to_all
  CONSTRAINT valid_supporter_data CHECK (
    open_to_all = true OR 
    domain IS NOT NULL OR 
    type IS NOT NULL OR 
    issue IS NOT NULL OR 
    other_text IS NOT NULL
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supporters_mode ON supporters(mode);
CREATE INDEX IF NOT EXISTS idx_supporters_status ON supporters(status);
CREATE INDEX IF NOT EXISTS idx_supporters_domain ON supporters(domain);
CREATE INDEX IF NOT EXISTS idx_supporters_type ON supporters(type);
CREATE INDEX IF NOT EXISTS idx_supporters_created_at ON supporters(created_at);
CREATE INDEX IF NOT EXISTS idx_supporters_open_to_all ON supporters(open_to_all);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_supporters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_supporters_updated_at
  BEFORE UPDATE ON supporters
  FOR EACH ROW
  EXECUTE FUNCTION update_supporters_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow authenticated users to insert their own supporter records
CREATE POLICY "Users can insert their own supporter records" ON supporters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own supporter records
CREATE POLICY "Users can view their own supporter records" ON supporters
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to update their own supporter records
CREATE POLICY "Users can update their own supporter records" ON supporters
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow service role to perform all operations (for API access)
CREATE POLICY "Service role can perform all operations" ON supporters
  FOR ALL USING (auth.role() = 'service_role');

-- Create a view for matching statistics
CREATE OR REPLACE VIEW supporter_matching_stats AS
SELECT 
  mode,
  status,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM supporters
GROUP BY mode, status, DATE_TRUNC('day', created_at)
ORDER BY date DESC, mode, status;

-- Create a function to get potential matches
CREATE OR REPLACE FUNCTION get_potential_matches(
  p_supporter_id UUID,
  p_mode TEXT,
  p_domain TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_issue TEXT DEFAULT NULL,
  p_open_to_all BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  mode TEXT,
  domain TEXT,
  type TEXT,
  issue TEXT,
  other_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.mode,
    s.domain,
    s.type,
    s.issue,
    s.other_text,
    s.created_at,
    CASE 
      WHEN s.open_to_all THEN 100
      WHEN s.domain = p_domain AND s.type = p_type AND s.issue = p_issue THEN 90
      WHEN s.domain = p_domain AND s.type = p_type THEN 80
      WHEN s.domain = p_domain THEN 70
      WHEN s.type = p_type THEN 60
      ELSE 50
    END as match_score
  FROM supporters s
  WHERE s.id != p_supporter_id
    AND s.mode != p_mode
    AND s.status = 'pending'
    AND (
      p_open_to_all = true OR
      s.open_to_all = true OR
      s.domain = p_domain OR
      s.type = p_type OR
      s.issue = p_issue
    )
  ORDER BY match_score DESC, s.created_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE supporters IS 'Stores supporter and seeker information for matching purposes';
COMMENT ON COLUMN supporters.mode IS 'Whether the person is seeking support or offering support';
COMMENT ON COLUMN supporters.domain IS 'Life domain (personal, professional, academic, etc.)';
COMMENT ON COLUMN supporters.type IS 'Type of challenge or support area';
COMMENT ON COLUMN supporters.issue IS 'Specific issue or challenge';
COMMENT ON COLUMN supporters.open_to_all IS 'Whether supporter is open to helping anyone regardless of specific criteria';
COMMENT ON COLUMN supporters.status IS 'Current status of the supporter/seeker record';
COMMENT ON COLUMN supporters.matched_with IS 'Array of UUIDs of matched supporters/seekers'; 