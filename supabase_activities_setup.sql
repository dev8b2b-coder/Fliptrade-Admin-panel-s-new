-- Simple SQL script for Supabase Activities Table Setup
-- Run this in your Supabase SQL Editor

-- 1. Create the activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error')),
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to insert activities" ON activities;
DROP POLICY IF EXISTS "Allow authenticated users to view activities" ON activities;
DROP POLICY IF EXISTS "Allow authenticated users to update activities" ON activities;
DROP POLICY IF EXISTS "Allow authenticated users to delete activities" ON activities;

-- Allow all authenticated users to insert activities
CREATE POLICY "Allow authenticated users to insert activities" ON activities
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow all authenticated users to view activities
CREATE POLICY "Allow authenticated users to view activities" ON activities
    FOR SELECT TO authenticated
    USING (true);

-- Allow all authenticated users to update activities
CREATE POLICY "Allow authenticated users to update activities" ON activities
    FOR UPDATE TO authenticated
    USING (true);

-- Allow all authenticated users to delete activities
CREATE POLICY "Allow authenticated users to delete activities" ON activities
    FOR DELETE TO authenticated
    USING (true);

-- 5. Insert sample data for testing
INSERT INTO activities (action, user_name, user_id, type, details) VALUES
('System initialized', 'System', 'system', 'info', 'Activity logging system started'),
('User login', 'Admin User', 'admin-1', 'success', 'Admin user logged in successfully'),
('Deposit entry added', 'John Smith', 'user-1', 'success', 'Added deposit entry for 2024-01-15'),
('Bank transaction updated', 'Sarah Johnson', 'user-2', 'info', 'Updated transaction: Deposit 50000'),
('Staff member archived', 'Admin User', 'admin-1', 'warning', 'Archived staff member: Mike Davis');

-- 6. Create a function to clean up old activities (older than 30 days)
DROP FUNCTION IF EXISTS cleanup_old_activities();
CREATE FUNCTION cleanup_old_activities()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM activities 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a view for recent activities
DROP VIEW IF EXISTS recent_activities;
CREATE VIEW recent_activities AS
SELECT 
    id,
    action,
    user_name,
    user_id,
    type,
    details,
    timestamp,
    CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60 < 1 THEN 'Just now'
        WHEN EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60 < 60 THEN 
            FLOOR(EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60)::TEXT || 'm ago'
        WHEN EXTRACT(EPOCH FROM (NOW() - timestamp)) / 3600 < 24 THEN 
            FLOOR(EXTRACT(EPOCH FROM (NOW() - timestamp)) / 3600)::TEXT || 'h ago'
        ELSE 
            FLOOR(EXTRACT(EPOCH FROM (NOW() - timestamp)) / 86400)::TEXT || 'd ago'
    END as time_ago
FROM activities 
WHERE timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- 8. Create a view for activity statistics
DROP VIEW IF EXISTS activity_stats;
CREATE VIEW activity_stats AS
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE type = 'success') as success,
    COUNT(*) FILTER (WHERE type = 'info') as info,
    COUNT(*) FILTER (WHERE type = 'warning') as warning,
    COUNT(*) FILTER (WHERE type = 'error') as error
FROM activities 
WHERE timestamp >= NOW() - INTERVAL '30 days';

-- Success message
SELECT 'Activities table setup completed successfully!' as message;
