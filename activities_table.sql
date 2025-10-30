-- Create activities table for Fliptrade Admin Panel
-- This table will store all user activities for audit trail

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities(action);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically clean up old activities (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
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

-- Create a scheduled job to run cleanup every day at 2 AM
-- Note: This requires pg_cron extension to be enabled in Supabase
-- You can also run this manually or set up a cron job externally

-- Example: Enable pg_cron extension (run this in Supabase SQL editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Example: Schedule daily cleanup (uncomment if pg_cron is available)
-- SELECT cron.schedule('cleanup-activities', '0 2 * * *', 'SELECT cleanup_old_activities();');

-- Insert some sample data (optional - for testing)
INSERT INTO activities (action, user_name, user_id, type, details) VALUES
('System initialized', 'System', 'system', 'info', 'Activity logging system started'),
('User login', 'Admin User', 'admin-1', 'success', 'Admin user logged in successfully'),
('Deposit entry added', 'John Smith', 'user-1', 'success', 'Added deposit entry for 2024-01-15 with 2 client incentives'),
('Bank transaction updated', 'Sarah Johnson', 'user-2', 'info', 'Updated transaction: Deposit 50000 for bank HDFC'),
('Staff member archived', 'Admin User', 'admin-1', 'warning', 'Archived staff member: Mike Davis (mike@example.com)');

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
-- GRANT USAGE ON SEQUENCE activities_id_seq TO authenticated;

-- Create a view for recent activities (last 30 days)
CREATE OR REPLACE VIEW recent_activities AS
SELECT 
    id,
    action,
    user_name,
    user_id,
    type,
    details,
    timestamp,
    EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60 as minutes_ago,
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

-- Create a view for activity statistics
CREATE OR REPLACE VIEW activity_stats AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE type = 'success') as success_count,
    COUNT(*) FILTER (WHERE type = 'info') as info_count,
    COUNT(*) FILTER (WHERE type = 'warning') as warning_count,
    COUNT(*) FILTER (WHERE type = 'error') as error_count,
    COUNT(DISTINCT user_id) as unique_users
FROM activities 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
