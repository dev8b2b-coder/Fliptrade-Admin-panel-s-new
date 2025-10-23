# 🗄️ Database Documentation - Admin Panel System

## 📊 Current Status

**⚠️ IMPORTANT:** This application is currently **NOT connected to Supabase**. All data is stored in **local React state** using mock data defined in `/components/admin-context.tsx`.

### Current Implementation
- **Data Storage**: In-memory React state
- **Persistence**: None (data resets on page refresh)
- **Authentication**: Mock authentication (no real backend)
- **API Calls**: Simulated with setTimeout()

---

## 🎯 Proposed Supabase Database Schema

Below is the recommended database structure for migrating to Supabase:

### 1️⃣ **staff** (Users/Employees Table)

Stores all user accounts, roles, and permissions.

**Columns:**
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Manager', 'Accountant', 'Viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_staff_role ON staff(role);
```

**Current Mock Data Structure:**
```typescript
interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Accountant' | 'Viewer';
  permissions: UserPermissions;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isArchived?: boolean;
  archivedAt?: string;
}
```

**Relationships:**
- One-to-Many with `deposits` (submittedBy)
- One-to-Many with `bank_transactions` (submittedBy)
- One-to-One with `staff_permissions`

---

### 2️⃣ **staff_permissions** (User Permissions Table)

Stores granular permissions for each staff member.

**Columns:**
```sql
CREATE TABLE staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('dashboard', 'deposits', 'bankDeposits', 'staffManagement')),
  can_view BOOLEAN DEFAULT FALSE,
  can_add BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, module)
);

-- Indexes
CREATE INDEX idx_staff_permissions_staff_id ON staff_permissions(staff_id);
CREATE INDEX idx_staff_permissions_module ON staff_permissions(module);
```

**Current Mock Data Structure:**
```typescript
type ModulePermission = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
};

type UserPermissions = {
  dashboard: ModulePermission;
  deposits: ModulePermission;
  bankDeposits: ModulePermission;
  staffManagement: ModulePermission;
};
```

**Relationships:**
- Many-to-One with `staff`

---

### 3️⃣ **deposits** (Daily Deposits/Withdrawals Table)

Tracks daily deposit and withdrawal entries with client incentives and expenses.

**Columns:**
```sql
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  local_deposit DECIMAL(15,2) DEFAULT 0,
  usdt_deposit DECIMAL(15,2) DEFAULT 0,
  cash_deposit DECIMAL(15,2) DEFAULT 0,
  local_withdraw DECIMAL(15,2) DEFAULT 0,
  usdt_withdraw DECIMAL(15,2) DEFAULT 0,
  cash_withdraw DECIMAL(15,2) DEFAULT 0,
  submitted_by UUID NOT NULL REFERENCES staff(id),
  submitted_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deposits_date ON deposits(date DESC);
CREATE INDEX idx_deposits_submitted_by ON deposits(submitted_by);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);
```

**Current Mock Data Structure:**
```typescript
interface DepositEntry {
  id: string;
  date: string;
  localDeposit: number;
  usdtDeposit: number;
  cashDeposit: number;
  localWithdraw: number;
  usdtWithdraw: number;
  cashWithdraw: number;
  clientIncentives: ClientIncentive[];
  expenses: ExpenseItem[];
  submittedBy: string;
  submittedByName: string;
}
```

**Relationships:**
- Many-to-One with `staff` (submittedBy)
- One-to-Many with `client_incentives`
- One-to-Many with `expenses`

---

### 4️⃣ **client_incentives** (Client Incentive Payments Table)

Stores individual client incentive payments linked to deposit entries.

**Columns:**
```sql
CREATE TABLE client_incentives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_client_incentives_deposit_id ON client_incentives(deposit_id);
CREATE INDEX idx_client_incentives_client_name ON client_incentives(client_name);
```

**Current Mock Data Structure:**
```typescript
interface ClientIncentive {
  id: string;
  name: string;
  amount: number;
}
```

**Relationships:**
- Many-to-One with `deposits`

---

### 5️⃣ **expenses** (Expense Items Table)

Stores expense entries linked to deposit records.

**Columns:**
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deposit_id UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_deposit_id ON expenses(deposit_id);
CREATE INDEX idx_expenses_type ON expenses(type);
```

**Current Mock Data Structure:**
```typescript
interface ExpenseItem {
  id: string;
  type: 'Promotion' | 'Salary' | 'Miscellaneous' | 'IB Commission' | 'Travel Expense';
  amount: number;
  description?: string;
}
```

**Relationships:**
- Many-to-One with `deposits`

---

### 6️⃣ **banks** (Bank Master Table)

Stores list of banks available in the system.

**Columns:**
```sql
CREATE TABLE banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_banks_name ON banks(name);
CREATE INDEX idx_banks_is_active ON banks(is_active);
```

**Current Mock Data Structure:**
```typescript
interface Bank {
  id: string;
  name: string;
}
```

**Relationships:**
- One-to-Many with `bank_transactions`

---

### 7️⃣ **bank_transactions** (Bank Deposit/Withdrawal Transactions)

Tracks all bank-related transactions with profit/loss tracking.

**Columns:**
```sql
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  bank_id UUID NOT NULL REFERENCES banks(id),
  deposit DECIMAL(15,2) DEFAULT 0,
  withdraw DECIMAL(15,2) DEFAULT 0,
  pnl DECIMAL(15,2) DEFAULT 0, -- Profit and Loss
  remaining DECIMAL(15,2) NOT NULL,
  submitted_by UUID NOT NULL REFERENCES staff(id),
  submitted_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_transactions_date ON bank_transactions(date DESC);
CREATE INDEX idx_bank_transactions_bank_id ON bank_transactions(bank_id);
CREATE INDEX idx_bank_transactions_submitted_by ON bank_transactions(submitted_by);
CREATE INDEX idx_bank_transactions_created_at ON bank_transactions(created_at DESC);
```

**Current Mock Data Structure:**
```typescript
interface BankTransaction {
  id: string;
  date: string;
  bankId: string;
  deposit: number;
  withdraw: number;
  pnl?: number;
  remaining: number;
  remainingBalance?: number; // For backward compatibility
  submittedBy: string;
  submittedByName: string;
}
```

**Relationships:**
- Many-to-One with `banks`
- Many-to-One with `staff` (submittedBy)

---

### 8️⃣ **withdrawals** (Withdrawal Records)

Simple withdrawal tracking table.

**Columns:**
```sql
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_withdrawals_date ON withdrawals(date DESC);
```

**Current Mock Data Structure:**
```typescript
interface Withdrawal {
  id: string;
  date: string;
  amount: number;
}
```

---

## 🔐 Authentication & Permission Logic

### Current Authentication System

**Location**: `/components/login-page.tsx` and `/components/admin-context.tsx`

**Flow:**
1. User enters email and password
2. System looks up staff member by email in the mock staff array
3. Validates that account is active and not archived
4. Creates user session with role and permissions
5. Redirects to default page based on role

**Current Implementation** (Mock):
```typescript
const handleLogin = async (e: React.FormEvent) => {
  // Find staff member by email
  const staffMember = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
  
  if (staffMember && staffMember.status === 'active' && !staffMember.isArchived) {
    const newUser = {
      id: staffMember.id,
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      avatar: staffMember.avatar,
    };
    
    setUser(newUser);
    setIsAuthenticated(true);
  }
}
```

### Supabase Authentication Implementation

**Recommended Approach:**

1. **Use Supabase Auth** for authentication
2. **Store user metadata** in the `staff` table
3. **Use Row Level Security (RLS)** for data access control

**Example Setup:**

```sql
-- Enable Row Level Security
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view their own data
CREATE POLICY "Staff can view own deposits" ON deposits
  FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()
      AND staff.role IN ('Super Admin', 'Admin')
    )
  );

-- Policy: Only admins can view all staff
CREATE POLICY "Admins can view all staff" ON staff
  FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()
      AND staff.role IN ('Super Admin', 'Admin', 'Manager')
    )
  );
```

### Permission Levels

| Role | Dashboard | Deposits | Bank Deposits | Staff Management |
|------|-----------|----------|---------------|------------------|
| **Super Admin** | View | Full Access | Full Access | Full Access |
| **Admin** | View | Full Access | Full Access | Full Access |
| **Manager** | View | Add, Edit, View | Add, View | Add, Edit, View |
| **Accountant** | No Access | Add, Edit, View | Add, Edit, View | No Access |
| **Viewer** | No Access | Add, View | Add, View | No Access |

**Permission Check Functions** (in `admin-context.tsx`):

```typescript
// Check if user is admin
const isAdmin = () => {
  return user?.role === 'Super Admin' || user?.role === 'Admin';
};

// Check if user can view all entries
const canViewAllEntries = () => {
  return isAdmin();
};

// Get filtered deposits based on role
const getFilteredDeposits = () => {
  if (canViewAllEntries()) {
    return deposits; // Admins see all
  }
  // Staff see only their own entries
  return deposits.filter(deposit => deposit.submittedBy === user?.id);
};
```

---

## 📊 Data Relationships Diagram

```
┌─────────────────┐
│     staff       │
│  (Users/Auth)   │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴─────────────────────────┐
    │                              │
    │                              │
┌───▼──────────┐          ┌───────▼────────┐
│   deposits   │          │ bank_trans...  │
│  (Daily P&L) │          │ (Bank Records) │
└───┬──────────┘          └────────────────┘
    │                              │
    │ 1:N                          │ N:1
    │                              │
┌───┴────────────┐          ┌──────▼──────┐
│                │          │    banks    │
│                │          │  (Masters)  │
┌────────────────▼┐         └─────────────┘
│ client_incent.. │
│  (Incentives)   │
└─────────────────┘
┌─────────────────┐
│    expenses     │
│   (Expenses)    │
└─────────────────┘
```

---

## 🚀 Migration Roadmap

### Phase 1: Setup Supabase Project
- [ ] Create Supabase project
- [ ] Configure database connection
- [ ] Set up environment variables

### Phase 2: Create Database Tables
- [ ] Create `staff` table (see `sql/001_staff.sql`)
- [ ] Create `staff_permissions` table (see `sql/002_staff_permissions.sql`)
- [ ] Create `banks` table (see `sql/003_banks.sql`)
- [ ] Create `deposits` table (see `sql/004_deposits.sql`)
- [ ] Create `client_incentives` table (see `sql/005_client_incentives.sql`)
- [ ] Create `expenses` table (see `sql/006_expenses.sql`)
- [ ] Create `bank_transactions` table (see `sql/007_bank_transactions.sql`)
- [ ] Create `withdrawals` table (see `sql/008_withdrawals.sql`)

### Phase 3: Configure Authentication
- [ ] Enable Supabase Auth
- [ ] Configure email/password authentication
- [ ] Set up user metadata
- [ ] Link Supabase Auth with `staff` table

### Phase 4: Implement Row Level Security (RLS)
- [ ] Enable RLS on all tables (see `sql/010_rls.sql`)
- [ ] Create policies for role-based access (see `sql/011_policies.sql`)
- [ ] Test permission isolation

### Phase 5: Migrate Application Code
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client configuration
- [ ] Replace mock authentication with Supabase Auth
- [ ] Replace state management with Supabase queries
- [ ] Implement real-time subscriptions (optional)

### Phase 6: Data Migration
- [ ] Migrate existing mock data to Supabase
- [ ] Verify data integrity
- [ ] Test all CRUD operations

### Phase 7: Testing & Deployment
- [ ] Test authentication flow
- [ ] Test permissions and RLS
- [ ] Test all features with real data
- [ ] Deploy to production

---

## 📝 Current Data Storage Location

All data is currently stored in `/components/admin-context.tsx`:

- **Line 141-206**: Staff members (4 mock users)
- **Line 208-413**: Deposit entries (10 mock entries)
- **Line 415-423**: Banks (7 mock banks)
- **Line 425-606**: Bank transactions (18 mock transactions)
- **Line 608-611**: Withdrawals (2 mock withdrawals)

---

## 🔧 Example Supabase Integration Code

### 1. Install Supabase

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client

Create `/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Update Login Function

```typescript
const handleLogin = async (email: string, password: string) => {
  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    alert('Invalid credentials');
    return;
  }

  // Fetch staff data
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('*, staff_permissions(*)')
    .eq('id', authData.user.id)
    .single();

  if (staffData && staffData.status === 'active') {
    setUser({
      id: staffData.id,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      avatar: staffData.avatar,
    });
    setIsAuthenticated(true);
  }
};
```

### 4. Fetch Deposits

```typescript
const fetchDeposits = async () => {
  const { data, error } = await supabase
    .from('deposits')
    .select(`
      *,
      client_incentives(*),
      expenses(*)
    `)
    .order('date', { ascending: false });

  if (data) {
    setDeposits(data);
  }
};
```

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Authentication with Supabase](https://supabase.com/docs/guides/auth)
- [React Integration](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

---

## 🎯 Summary

**Current State:**
- ✅ Frontend fully functional with mock data
- ✅ Complete UI/UX implementation
- ✅ Role-based permission logic
- ❌ No database integration
- ❌ No persistent data storage
- ❌ No real authentication

**To Implement:**
- Create 8 Supabase tables
- Implement Supabase authentication
- Configure Row Level Security
- Migrate application to use Supabase queries
- Test and deploy

---

**Last Updated:** October 16, 2025
**Version:** 1.0
**Status:** Planning Phase - No Supabase Implementation Yet
