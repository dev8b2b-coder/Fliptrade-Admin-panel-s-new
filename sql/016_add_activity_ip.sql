-- Add IP address support to activities
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Optional index if you plan to filter by IP frequently
CREATE INDEX IF NOT EXISTS idx_activities_ip_address ON activities(ip_address);

