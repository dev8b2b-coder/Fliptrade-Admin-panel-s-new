-- Insert sample data for testing
-- Run this after creating the admin user

-- Insert sample banks
INSERT INTO banks (id, name, is_active) VALUES
  ('bank-1', 'Bank of America', true),
  ('bank-2', 'Chase Bank', true),
  ('bank-3', 'Wells Fargo', true),
  ('bank-4', 'JPMorgan Chase', true),
  ('bank-5', 'Citibank', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- Insert sample deposits
INSERT INTO deposits (id, date, local_deposit, usdt_deposit, cash_deposit, local_withdraw, usdt_withdraw, cash_withdraw, submitted_by, submitted_by_name) VALUES
  ('dep-1', '2024-01-20', 75000, 45000, 25000, 0, 0, 0, '78220c5c-7d65-43b0-b434-ce58a3124306', 'Admin'),
  ('dep-2', '2024-01-19', 60000, 35000, 18000, 0, 0, 0, '78220c5c-7d65-43b0-b434-ce58a3124306', 'Admin'),
  ('dep-3', '2024-01-18', 92000, 55000, 32000, 0, 0, 0, '78220c5c-7d65-43b0-b434-ce58a3124306', 'Admin')
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date,
  local_deposit = EXCLUDED.local_deposit,
  usdt_deposit = EXCLUDED.usdt_deposit,
  cash_deposit = EXCLUDED.cash_deposit,
  local_withdraw = EXCLUDED.local_withdraw,
  usdt_withdraw = EXCLUDED.usdt_withdraw,
  cash_withdraw = EXCLUDED.cash_withdraw,
  submitted_by = EXCLUDED.submitted_by,
  submitted_by_name = EXCLUDED.submitted_by_name;

-- Insert sample client incentives
INSERT INTO client_incentives (id, deposit_id, client_name, amount) VALUES
  ('ci-1', 'dep-1', 'John Doe', 8000),
  ('ci-2', 'dep-1', 'Alice Johnson', 5500),
  ('ci-3', 'dep-1', 'Robert Chen', 4200),
  ('ci-4', 'dep-2', 'Maria Garcia', 6000),
  ('ci-5', 'dep-2', 'David Kim', 4800),
  ('ci-6', 'dep-3', 'Sarah Wilson', 7500),
  ('ci-7', 'dep-3', 'Michael Brown', 6200)
ON CONFLICT (id) DO UPDATE SET
  deposit_id = EXCLUDED.deposit_id,
  client_name = EXCLUDED.client_name,
  amount = EXCLUDED.amount;

-- Insert sample expenses
INSERT INTO expenses (id, deposit_id, type, amount, description) VALUES
  ('exp-1', 'dep-1', 'Salary', 12000, 'Monthly salary payments - January'),
  ('exp-2', 'dep-1', 'Promotion', 3500, 'Social media advertising campaign'),
  ('exp-3', 'dep-2', 'IB Commission', 8500, 'Q1 IB commission payments'),
  ('exp-4', 'dep-2', 'Miscellaneous', 2200, 'Office supplies and utilities'),
  ('exp-5', 'dep-3', 'Travel Expense', 4500, 'Business travel expenses'),
  ('exp-6', 'dep-3', 'Equipment', 3200, 'New office equipment purchase')
ON CONFLICT (id) DO UPDATE SET
  deposit_id = EXCLUDED.deposit_id,
  type = EXCLUDED.type,
  amount = EXCLUDED.amount,
  description = EXCLUDED.description;

-- Insert sample bank transactions
INSERT INTO bank_transactions (id, date, bank_id, deposit, withdraw, pnl, remaining, submitted_by, submitted_by_name) VALUES
  ('bt-1', '2024-01-20', 'bank-1', 150000, 0, 5000, 155000, '78220c5c-7d65-43b0-b434-ce58a3124306', 'Admin'),
  ('bt-2', '2024-01-19', 'bank-2', 120000, 20000, 3000, 103000, '78220c5c-7d65-43b0-b434-ce58a3124306', 'Admin'),
  ('bt-3', '2024-01-18', 'bank-3', 180000, 0, 8000, 188000, '78220c5c-7d65-43b0-b434-ce58a3124306', 'Admin')
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date,
  bank_id = EXCLUDED.bank_id,
  deposit = EXCLUDED.deposit,
  withdraw = EXCLUDED.withdraw,
  pnl = EXCLUDED.pnl,
  remaining = EXCLUDED.remaining,
  submitted_by = EXCLUDED.submitted_by,
  submitted_by_name = EXCLUDED.submitted_by_name;

-- Verify the data
SELECT 'Banks' as table_name, count(*) as count FROM banks
UNION ALL
SELECT 'Deposits', count(*) FROM deposits
UNION ALL
SELECT 'Client Incentives', count(*) FROM client_incentives
UNION ALL
SELECT 'Expenses', count(*) FROM expenses
UNION ALL
SELECT 'Bank Transactions', count(*) FROM bank_transactions;
