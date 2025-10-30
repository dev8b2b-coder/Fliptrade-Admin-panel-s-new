-- Enable RLS for banks table
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all banks
CREATE POLICY "Authenticated users can view banks" ON banks
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert banks
CREATE POLICY "Authenticated users can insert banks" ON banks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update banks
CREATE POLICY "Authenticated users can update banks" ON banks
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete banks
CREATE POLICY "Authenticated users can delete banks" ON banks
  FOR DELETE USING (auth.role() = 'authenticated');
