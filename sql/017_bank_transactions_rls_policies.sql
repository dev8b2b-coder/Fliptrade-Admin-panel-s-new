-- Enable RLS for bank_transactions table (if not already enabled)
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all bank transactions
CREATE POLICY "Authenticated users can view bank transactions" ON bank_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert bank transactions
CREATE POLICY "Authenticated users can insert bank transactions" ON bank_transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update bank transactions
CREATE POLICY "Authenticated users can update bank transactions" ON bank_transactions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to delete bank transactions
CREATE POLICY "Authenticated users can delete bank transactions" ON bank_transactions
  FOR DELETE USING (auth.role() = 'authenticated');
