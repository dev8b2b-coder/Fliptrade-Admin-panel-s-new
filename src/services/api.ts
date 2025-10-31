import { supabase, supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';

// Types
export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
  created_at?: string;
  last_login?: string;
  is_archived?: boolean;
  archived_at?: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  password_hash: string;
  avatar?: string;
}

export interface StaffPermission {
  id: string;
  staff_id: string;
  module: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Deposit {
  id: string;
  date: string;
  local_deposit: number;
  usdt_deposit: number;
  cash_deposit: number;
  local_withdraw: number;
  usdt_withdraw: number;
  cash_withdraw: number;
  submitted_by: string;
  submitted_by_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientIncentive {
  id: string;
  deposit_id: string;
  client_name: string;
  amount: number;
  created_at?: string;
}

export interface Expense {
  id: string;
  deposit_id: string;
  type: string;
  amount: number;
  description?: string;
  created_at?: string;
}

export interface Bank {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  bank_id: string;
  deposit: number;
  withdraw: number;
  remaining: number;
  pnl?: number;
  submitted_by: string;
  submitted_by_name: string;
  created_at?: string;
}

// API Service Class
export class ApiService {
  // EMAIL SERVICE
  static get emailApiBase(): string {
    const base = (import.meta as any).env?.VITE_EMAIL_API_URL as string | undefined;
    return (base && base.trim()) || 'http://localhost:3001';
  }

  static async sendWelcomeEmail(params: { email: string; staffName: string; tempPassword: string }): Promise<void> {
    const res = await fetch(`${this.emailApiBase}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Welcome email failed: ${res.status} ${text}`);
    }
  }

  static async sendPasswordResetOtp(params: { email: string; staffName: string; otp: string }): Promise<void> {
    const res = await fetch(`${this.emailApiBase}/api/send-password-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Password reset email failed: ${res.status} ${text}`);
    }
  }

  static async supabaseInvite(email: string, name: string, tempPassword?: string): Promise<void> {
    const res = await fetch(`${this.emailApiBase}/api/supabase/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, tempPassword }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase invite failed: ${res.status} ${text}`);
    }
  }

  static async supabaseRecover(email: string, redirectTo?: string): Promise<void> {
    const res = await fetch(`${this.emailApiBase}/api/supabase/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirectTo }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase recover failed: ${res.status} ${text}`);
    }
  }
  // STAFF MANAGEMENT APIs
  static async getAllStaff(): Promise<Staff[]> {
    console.log('API: Fetching all staff...');
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedStaff = localStorage.getItem('admin_staff');
      if (savedStaff) {
        const staff = JSON.parse(savedStaff);
        console.log('API: Staff fetched from localStorage:', staff.length, 'records');
        return staff.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          status: s.status,
          avatar: s.avatar,
          created_at: s.createdAt,
          last_login: s.lastLogin,
          is_archived: s.isArchived || false,
          archived_at: s.archivedAt,
        }));
      }
      return [];
    }
    
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API Error - Get All Staff:', error);
      throw new Error(error.message);
    }

    console.log('API: Staff fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  static async getStaffById(id: string): Promise<Staff | null> {
    console.log('API: Fetching staff by ID:', id);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('API Error - Get Staff by ID:', error);
      return null;
    }

    console.log('API: Staff fetched successfully:', data);
    return data;
  }

  static async createStaff(staff: CreateStaffData): Promise<Staff> {
    console.log('API: Creating staff:', staff);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedStaff = localStorage.getItem('admin_staff');
      const staffList = savedStaff ? JSON.parse(savedStaff) : [];
      const newStaff = {
        id: crypto.randomUUID(),
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: staff.status,
        avatar: staff.avatar,
        createdAt: new Date().toISOString().split('T')[0],
        password_hash: staff.password_hash,
      };
      staffList.push(newStaff);
      localStorage.setItem('admin_staff', JSON.stringify(staffList));
      console.log('API: Staff created in localStorage:', newStaff);
      return {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        status: newStaff.status,
        avatar: newStaff.avatar,
        created_at: newStaff.createdAt,
      };
    }
    
    const { data, error } = await supabase
      .from('staff')
      .insert({
        ...staff,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Staff:', error);
      throw new Error(error.message);
    }

    console.log('API: Staff created successfully:', data);
    return data;
  }

  static async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
    console.log('API: Updating staff:', id, updates);
    console.log('API: Updates object:', JSON.stringify(updates, null, 2));
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedStaff = localStorage.getItem('admin_staff');
      if (savedStaff) {
        const staff = JSON.parse(savedStaff);
        const index = staff.findIndex((s: any) => s.id === id);
        if (index !== -1) {
          // Update the staff member
          staff[index] = {
            ...staff[index],
            ...updates,
            // Map database fields to local storage format
            createdAt: updates.created_at || staff[index].createdAt,
            lastLogin: updates.last_login || staff[index].lastLogin,
            isArchived: updates.is_archived !== undefined ? updates.is_archived : staff[index].isArchived,
          };
          localStorage.setItem('admin_staff', JSON.stringify(staff));
          console.log('API: Staff updated in localStorage:', staff[index]);
          return {
            id: staff[index].id,
            name: staff[index].name,
            email: staff[index].email,
            role: staff[index].role,
            status: staff[index].status,
            avatar: staff[index].avatar,
            created_at: staff[index].createdAt,
            last_login: staff[index].lastLogin,
            is_archived: staff[index].isArchived,
            archived_at: staff[index].archivedAt,
          };
        }
      }
      throw new Error('Staff member not found');
    }
    
    // If status change requested, delegate to secure server endpoint using service role key
    if (updates.status !== undefined) {
      const res = await fetch(`${this.emailApiBase}/api/staff/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: id, status: updates.status }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('API Error - Staff status update via server failed:', res.status, text);
        throw new Error(`Staff status update failed: ${res.status} ${text}`);
      }

      const result = await res.json();
      console.log('API: Staff status updated via admin API:', result);
      return result?.data ?? { id, ...updates } as Staff;
    }

    // Sanitize and map fields to match DB schema (snake_case, valid columns only)
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.role !== undefined) payload.role = updates.role as any;
    if (updates.status !== undefined) payload.status = updates.status as any;
    if ((updates as any).avatar !== undefined) payload.avatar = (updates as any).avatar;
    if ((updates as any).lastLogin !== undefined) payload.last_login = (updates as any).lastLogin;
    if ((updates as any).isArchived !== undefined) payload.is_archived = (updates as any).isArchived;
    if ((updates as any).archivedAt !== undefined) payload.archived_at = (updates as any).archivedAt;
    if ((updates as any).password_hash !== undefined) payload.password_hash = (updates as any).password_hash;
    // Always bump updated_at when we perform updates
    if (Object.keys(payload).length > 0) payload.updated_at = new Date().toISOString();

    if (Object.keys(payload).length === 0) {
      throw new Error('No valid fields to update');
    }
    // Never try to update created_at/id/password_hash via this path

    const { data, error } = await supabase
      .from('staff')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API Error - Update Staff:', error);
      console.error('API Error - Full error object:', JSON.stringify(error, null, 2));
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('API: Staff updated successfully:', data);
    return data;
  }

  static async deleteStaff(id: string): Promise<void> {
    console.log('API: Deleting staff:', id);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedStaff = localStorage.getItem('admin_staff');
      if (savedStaff) {
        const staff = JSON.parse(savedStaff);
        const filteredStaff = staff.filter((s: any) => s.id !== id);
        localStorage.setItem('admin_staff', JSON.stringify(filteredStaff));
        console.log('API: Staff deleted from localStorage');
        return;
      }
      throw new Error('Staff member not found');
    }
    
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error - Delete Staff:', error);
      throw new Error(error.message);
    }

    console.log('API: Staff deleted successfully');
  }

  static async updateLastLogin(id: string): Promise<void> {
    console.log('API: Updating last login for staff:', id);
    const { error } = await supabase
      .from('staff')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('API Error - Update Last Login:', error);
      throw new Error(error.message);
    }

    console.log('API: Last login updated successfully');
  }

  static async getStaffPermissions(staffId: string): Promise<StaffPermission[]> {
    console.log('API: Fetching staff permissions:', staffId);
    const { data, error } = await supabase
      .from('staff_permissions')
      .select('*')
      .eq('staff_id', staffId);

    if (error) {
      console.error('API Error - Get Staff Permissions:', error);
      throw new Error(error.message);
    }

    console.log('API: Staff permissions fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async createStaffPermissions(permissions: Omit<StaffPermission, 'id'>[]): Promise<StaffPermission[]> {
    console.log('API: Creating staff permissions via server:', permissions);

    const res = await fetch(`${this.emailApiBase}/api/staff/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('API Error - Create Staff Permissions via server:', res.status, text);
      throw new Error(`Permissions setup failed: ${res.status} ${text}`);
    }

    const result = await res.json();
    console.log('API: Staff permissions created via server successfully:', result?.data?.length || 0, 'records');
    return result?.data || [];
  }

  static async applyDefaultPermissions(staffId: string): Promise<void> {
    console.log('API: Applying default permissions via server for staff:', staffId);

    const res = await fetch(`${this.emailApiBase}/api/staff/permissions/defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('API Error - Apply default permissions via server:', res.status, text);
      throw new Error(`Default permissions failed: ${res.status} ${text}`);
    }

    console.log('API: Default permissions applied successfully');
  }

  static async upsertStaffPermissions(staffId: string, perms: {
    dashboard?: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    deposits?: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    bankDeposits?: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    staffManagement?: { view: boolean; add: boolean; edit: boolean; delete: boolean };
    activityLogs?: { view: boolean; add: boolean; edit: boolean; delete: boolean };
  }): Promise<void> {
    const allowedModules = new Set(['dashboard', 'deposits', 'bankDeposits', 'staffManagement']);
    const toDbModule = (m: string) => m; // DB expects camelCase per check constraint

    const rows = Object.entries(perms)
      .filter(([module]) => allowedModules.has(module))
      .map(([module, p]) => ({
        id: crypto.randomUUID(),
        staff_id: staffId,
        module: toDbModule(module),
        can_view: !!p?.view,
        can_add: !!p?.add,
        can_edit: !!p?.edit,
        can_delete: !!p?.delete,
      }));

    // Upsert by composite key (staff_id, module). Ensure unique index exists in DB ideally.
    const { error } = await supabase
      .from('staff_permissions')
      .upsert(rows as any, { onConflict: 'staff_id,module' });

    if (error) {
      console.error('API Error - Upsert Staff Permissions:', error);
      throw new Error(error.message);
    }
  }

  // DEPOSITS MANAGEMENT APIs
  static async getAllDeposits(userId?: string): Promise<Deposit[]> {
    console.log('API: Fetching deposits...', userId ? `for user: ${userId}` : 'for all users');
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedDeposits = localStorage.getItem('admin_deposits');
      if (savedDeposits) {
        const deposits = JSON.parse(savedDeposits);
        console.log('API: Deposits fetched from localStorage:', deposits.length, 'records');
        let filtered = deposits;
        if (userId) {
          filtered = deposits.filter((d: any) => d.submittedBy === userId);
        }
        return filtered.map((d: any) => ({
          id: d.id,
          date: d.date,
          local_deposit: d.localDeposit || 0,
          usdt_deposit: d.usdtDeposit || 0,
          cash_deposit: d.cashDeposit || 0,
          local_withdraw: d.localWithdraw || 0,
          usdt_withdraw: d.usdtWithdraw || 0,
          cash_withdraw: d.cashWithdraw || 0,
          submitted_by: d.submittedBy,
          submitted_by_name: d.submittedByName,
          created_at: d.createdAt,
          updated_at: d.updatedAt,
        }));
      }
      return [];
    }
    
    let query = supabase
      .from('deposits')
      .select('*')
      .order('date', { ascending: false });

    if (userId) {
      query = query.eq('submitted_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API Error - Get All Deposits:', error);
      throw new Error(error.message);
    }

    console.log('API: Deposits fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  static async createDeposit(deposit: Omit<Deposit, 'id'>): Promise<Deposit> {
    console.log('API: Creating deposit:', deposit);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedDeposits = localStorage.getItem('admin_deposits');
      const deposits = savedDeposits ? JSON.parse(savedDeposits) : [];
      const newDeposit = {
        id: crypto.randomUUID(),
        date: deposit.date,
        localDeposit: deposit.local_deposit || 0,
        usdtDeposit: deposit.usdt_deposit || 0,
        cashDeposit: deposit.cash_deposit || 0,
        localWithdraw: deposit.local_withdraw || 0,
        usdtWithdraw: deposit.usdt_withdraw || 0,
        cashWithdraw: deposit.cash_withdraw || 0,
        submittedBy: deposit.submitted_by,
        submittedByName: deposit.submitted_by_name,
        createdAt: new Date().toISOString(),
      };
      deposits.push(newDeposit);
      localStorage.setItem('admin_deposits', JSON.stringify(deposits));
      console.log('API: Deposit created in localStorage:', newDeposit);
      return {
        id: newDeposit.id,
        date: newDeposit.date,
        local_deposit: newDeposit.localDeposit,
        usdt_deposit: newDeposit.usdtDeposit,
        cash_deposit: newDeposit.cashDeposit,
        local_withdraw: newDeposit.localWithdraw,
        usdt_withdraw: newDeposit.usdtWithdraw,
        cash_withdraw: newDeposit.cashWithdraw,
        submitted_by: newDeposit.submittedBy,
        submitted_by_name: newDeposit.submittedByName,
        created_at: newDeposit.createdAt,
      };
    }
    
    const { data, error } = await supabase
      .from('deposits')
      .insert({
        ...deposit,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Deposit:', error);
      throw new Error(error.message);
    }

    console.log('API: Deposit created successfully:', data);
    return data;
  }

  static async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit> {
    console.log('API: Updating deposit:', id, updates);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedDeposits = localStorage.getItem('admin_deposits');
      if (savedDeposits) {
        const deposits = JSON.parse(savedDeposits);
        const index = deposits.findIndex((d: any) => d.id === id);
        if (index !== -1) {
          deposits[index] = {
            ...deposits[index],
            ...updates,
            // Map database fields
            localDeposit: updates.local_deposit !== undefined ? updates.local_deposit : deposits[index].localDeposit,
            usdtDeposit: updates.usdt_deposit !== undefined ? updates.usdt_deposit : deposits[index].usdtDeposit,
            cashDeposit: updates.cash_deposit !== undefined ? updates.cash_deposit : deposits[index].cashDeposit,
            localWithdraw: updates.local_withdraw !== undefined ? updates.local_withdraw : deposits[index].localWithdraw,
            usdtWithdraw: updates.usdt_withdraw !== undefined ? updates.usdt_withdraw : deposits[index].usdtWithdraw,
            cashWithdraw: updates.cash_withdraw !== undefined ? updates.cash_withdraw : deposits[index].cashWithdraw,
            submittedBy: updates.submitted_by || deposits[index].submittedBy,
            submittedByName: updates.submitted_by_name || deposits[index].submittedByName,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('admin_deposits', JSON.stringify(deposits));
          console.log('API: Deposit updated in localStorage');
          const d = deposits[index];
          return {
            id: d.id,
            date: d.date,
            local_deposit: d.localDeposit,
            usdt_deposit: d.usdtDeposit,
            cash_deposit: d.cashDeposit,
            local_withdraw: d.localWithdraw,
            usdt_withdraw: d.usdtWithdraw,
            cash_withdraw: d.cashWithdraw,
            submitted_by: d.submittedBy,
            submitted_by_name: d.submittedByName,
            created_at: d.createdAt,
            updated_at: d.updatedAt,
          };
        }
      }
      throw new Error('Deposit not found');
    }
    
    const { data, error } = await supabase
      .from('deposits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API Error - Update Deposit:', error);
      throw new Error(error.message);
    }

    console.log('API: Deposit updated successfully:', data);
    return data;
  }

  static async deleteDeposit(id: string): Promise<void> {
    console.log('API: Deleting deposit:', id);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedDeposits = localStorage.getItem('admin_deposits');
      if (savedDeposits) {
        const deposits = JSON.parse(savedDeposits);
        const filteredDeposits = deposits.filter((d: any) => d.id !== id);
        localStorage.setItem('admin_deposits', JSON.stringify(filteredDeposits));
        console.log('API: Deposit deleted from localStorage');
        return;
      }
      throw new Error('Deposit not found');
    }
    
    const { error } = await supabase
      .from('deposits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error - Delete Deposit:', error);
      throw new Error(error.message);
    }

    console.log('API: Deposit deleted successfully');
  }

  // CLIENT INCENTIVES APIs
  static async getClientIncentivesByDeposit(depositId: string): Promise<ClientIncentive[]> {
    console.log('API: Fetching client incentives for deposit:', depositId);
    const { data, error } = await supabase
      .from('client_incentives')
      .select('*')
      .eq('deposit_id', depositId);

    if (error) {
      console.error('API Error - Get Client Incentives:', error);
      throw new Error(error.message);
    }

    console.log('API: Client incentives fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async createClientIncentive(incentive: Omit<ClientIncentive, 'id'>): Promise<ClientIncentive> {
    console.log('API: Creating client incentive:', incentive);
    const { data, error } = await supabase
      .from('client_incentives')
      .insert({
        ...incentive,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Client Incentive:', error);
      throw new Error(error.message);
    }

    console.log('API: Client incentive created successfully:', data);
    return data;
  }

  static async updateClientIncentive(id: string, updates: Partial<ClientIncentive>): Promise<ClientIncentive> {
    console.log('API: Updating client incentive:', id, updates);
    const { data, error } = await supabase
      .from('client_incentives')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API Error - Update Client Incentive:', error);
      throw new Error(error.message);
    }

    console.log('API: Client incentive updated successfully:', data);
    return data;
  }

  static async deleteClientIncentive(id: string): Promise<void> {
    console.log('API: Deleting client incentive:', id);
    const { error } = await supabase
      .from('client_incentives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error - Delete Client Incentive:', error);
      throw new Error(error.message);
    }

    console.log('API: Client incentive deleted successfully');
  }

  static async getClientIncentivesByDepositId(depositId: string): Promise<ClientIncentive[]> {
    console.log('API: Getting client incentives for deposit:', depositId);
    const { data, error } = await supabase
      .from('client_incentives')
      .select('*')
      .eq('deposit_id', depositId);

    if (error) {
      console.error('API Error - Get Client Incentives by Deposit ID:', error);
      throw new Error(error.message);
    }

    console.log('API: Client incentives fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  // EXPENSES APIs
  static async getExpensesByDeposit(depositId: string): Promise<Expense[]> {
    console.log('API: Fetching expenses for deposit:', depositId);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('deposit_id', depositId);

    if (error) {
      console.error('API Error - Get Expenses:', error);
      throw new Error(error.message);
    }

    console.log('API: Expenses fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async getExpensesByDepositId(depositId: string): Promise<Expense[]> {
    return this.getExpensesByDeposit(depositId);
  }

  static async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    console.log('API: Creating expense:', expense);
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Expense:', error);
      throw new Error(error.message);
    }

    console.log('API: Expense created successfully:', data);
    return data;
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    console.log('API: Updating expense:', id, updates);
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API Error - Update Expense:', error);
      throw new Error(error.message);
    }

    console.log('API: Expense updated successfully:', data);
    return data;
  }

  static async deleteExpense(id: string): Promise<void> {
    console.log('API: Deleting expense:', id);
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error - Delete Expense:', error);
      throw new Error(error.message);
    }

    console.log('API: Expense deleted successfully');
  }

  // BANKS MANAGEMENT APIs
  static async getAllBanks(): Promise<Bank[]> {
    console.log('API: Fetching all banks...');
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedBanks = localStorage.getItem('admin_banks');
      if (savedBanks) {
        const banks = JSON.parse(savedBanks);
        console.log('API: Banks fetched from localStorage:', banks.length, 'records');
        return banks
          .filter((b: any) => b.isActive !== false)
          .map((b: any) => ({
            id: b.id,
            name: b.name,
            is_active: b.isActive !== false,
            created_at: b.createdAt,
          }));
      }
      return [];
    }
    
    const { data, error } = await supabase
      .from('banks')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('API Error - Get All Banks:', error);
      throw new Error(error.message);
    }

    console.log('API: Banks fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  static async createBank(bank: Omit<Bank, 'id'>): Promise<Bank> {
    console.log('API: Creating bank:', bank);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedBanks = localStorage.getItem('admin_banks');
      const banks = savedBanks ? JSON.parse(savedBanks) : [];
      const newBank = {
        id: crypto.randomUUID(),
        name: bank.name,
        isActive: bank.is_active !== false,
        createdAt: new Date().toISOString(),
      };
      banks.push(newBank);
      localStorage.setItem('admin_banks', JSON.stringify(banks));
      console.log('API: Bank created in localStorage:', newBank);
      return {
        id: newBank.id,
        name: newBank.name,
        is_active: newBank.isActive,
        created_at: newBank.createdAt,
      };
    }
    
    // Check if user is authenticated in Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user, using admin client...');
      // Use admin client when no user is authenticated
      const { data, error } = await supabaseAdmin
        .from('banks')
        .insert({
          ...bank,
          id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) {
        console.error('API Error - Create Bank (Admin):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank created successfully (Admin):', data);
      return data;
    } else {
      console.log('Authenticated user found, using regular client...');
      // Use regular client when user is authenticated
      const { data, error } = await supabase
        .from('banks')
        .insert({
          ...bank,
          id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) {
        console.error('API Error - Create Bank (Regular):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank created successfully (Regular):', data);
      return data;
    }
  }

  static async updateBank(id: string, updates: Partial<Bank>): Promise<Bank> {
    console.log('API: Updating bank:', id, updates);
    const { data, error } = await supabaseAdmin
      .from('banks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API Error - Update Bank:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank updated successfully:', data);
    return data;
  }

  static async deleteBank(id: string): Promise<void> {
    console.log('API: Deleting bank:', id);
    const { error } = await supabaseAdmin
      .from('banks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error - Delete Bank:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank deleted successfully');
  }

  // BANK TRANSACTIONS APIs
  static async getAllBankTransactions(userId?: string): Promise<BankTransaction[]> {
    console.log('API: Fetching bank transactions...', userId ? `for user: ${userId}` : 'for all users');
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedTransactions = localStorage.getItem('admin_bank_transactions');
      if (savedTransactions) {
        const transactions = JSON.parse(savedTransactions);
        console.log('API: Bank transactions fetched from localStorage:', transactions.length, 'records');
        let filtered = transactions;
        if (userId) {
          filtered = transactions.filter((t: any) => t.submittedBy === userId);
        }
        return filtered.map((t: any) => ({
          id: t.id,
          date: t.date,
          bank_id: t.bankId,
          deposit: t.deposit || 0,
          withdraw: t.withdraw || 0,
          remaining: t.remaining || t.remainingBalance || 0,
          pnl: t.pnl,
          submitted_by: t.submittedBy,
          submitted_by_name: t.submittedByName,
          created_at: t.createdAt,
        }));
      }
      return [];
    }
    
    // Check if user is authenticated in Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let query;
    if (!user) {
      console.log('No authenticated user, using admin client...');
      query = supabaseAdmin
        .from('bank_transactions')
        .select('*')
        .order('date', { ascending: false });
    } else {
      console.log('Authenticated user found, using regular client...');
      query = supabase
        .from('bank_transactions')
        .select('*')
        .order('date', { ascending: false });
    }

    if (userId) {
      query = query.eq('submitted_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API Error - Get All Bank Transactions:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank transactions fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  static async getBankTransactionsByBank(bankId: string): Promise<BankTransaction[]> {
    console.log('API: Fetching bank transactions for bank:', bankId);
    // Check if user is authenticated in Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let query;
    if (!user) {
      console.log('No authenticated user, using admin client...');
      query = supabaseAdmin
        .from('bank_transactions')
        .select('*')
        .eq('bank_id', bankId)
        .order('date', { ascending: false });
    } else {
      console.log('Authenticated user found, using regular client...');
      query = supabase
        .from('bank_transactions')
        .select('*')
        .eq('bank_id', bankId)
        .order('date', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('API Error - Get Bank Transactions by Bank:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank transactions fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async createBankTransaction(transaction: Omit<BankTransaction, 'id'>): Promise<BankTransaction> {
    console.log('API: Creating bank transaction:', transaction);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedTransactions = localStorage.getItem('admin_bank_transactions');
      const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      const newTransaction = {
        id: crypto.randomUUID(),
        date: transaction.date,
        bankId: transaction.bank_id,
        deposit: transaction.deposit || 0,
        withdraw: transaction.withdraw || 0,
        remaining: transaction.remaining || 0,
        remainingBalance: transaction.remaining || 0,
        pnl: transaction.pnl,
        submittedBy: transaction.submitted_by,
        submittedByName: transaction.submitted_by_name,
        createdAt: new Date().toISOString(),
      };
      transactions.push(newTransaction);
      localStorage.setItem('admin_bank_transactions', JSON.stringify(transactions));
      console.log('API: Bank transaction created in localStorage:', newTransaction);
      return {
        id: newTransaction.id,
        date: newTransaction.date,
        bank_id: newTransaction.bankId,
        deposit: newTransaction.deposit,
        withdraw: newTransaction.withdraw,
        remaining: newTransaction.remaining,
        pnl: newTransaction.pnl,
        submitted_by: newTransaction.submittedBy,
        submitted_by_name: newTransaction.submittedByName,
        created_at: newTransaction.createdAt,
      };
    }
    
    // Check if user is authenticated in Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      console.log('No authenticated user, using admin client...');
      // Use admin client when no user is authenticated
      const { data, error } = await supabaseAdmin
        .from('bank_transactions')
        .insert({
          ...transaction,
          id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) {
        console.error('API Error - Create Bank Transaction (Admin):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank transaction created successfully (Admin):', data);
      return data;
    } else {
      console.log('Authenticated user found, using regular client...');
      // Use regular client when user is authenticated
      const { data, error } = await supabase
        .from('bank_transactions')
        .insert({
          ...transaction,
          id: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) {
        console.error('API Error - Create Bank Transaction (Regular):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank transaction created successfully (Regular):', data);
      return data;
    }
  }

  static async updateBankTransaction(id: string, updates: Partial<BankTransaction>): Promise<BankTransaction> {
    console.log('API: Updating bank transaction:', id, updates);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedTransactions = localStorage.getItem('admin_bank_transactions');
      if (savedTransactions) {
        const transactions = JSON.parse(savedTransactions);
        const index = transactions.findIndex((t: any) => t.id === id);
        if (index !== -1) {
          transactions[index] = {
            ...transactions[index],
            ...updates,
            // Map database fields
            bankId: updates.bank_id || transactions[index].bankId,
            deposit: updates.deposit !== undefined ? updates.deposit : transactions[index].deposit,
            withdraw: updates.withdraw !== undefined ? updates.withdraw : transactions[index].withdraw,
            remaining: updates.remaining !== undefined ? updates.remaining : transactions[index].remaining,
            remainingBalance: updates.remaining !== undefined ? updates.remaining : transactions[index].remainingBalance,
            pnl: updates.pnl !== undefined ? updates.pnl : transactions[index].pnl,
            submittedBy: updates.submitted_by || transactions[index].submittedBy,
            submittedByName: updates.submitted_by_name || transactions[index].submittedByName,
          };
          localStorage.setItem('admin_bank_transactions', JSON.stringify(transactions));
          console.log('API: Bank transaction updated in localStorage');
          const t = transactions[index];
          return {
            id: t.id,
            date: t.date,
            bank_id: t.bankId,
            deposit: t.deposit,
            withdraw: t.withdraw,
            remaining: t.remaining || t.remainingBalance,
            pnl: t.pnl,
            submitted_by: t.submittedBy,
            submitted_by_name: t.submittedByName,
            created_at: t.createdAt,
          };
        }
      }
      throw new Error('Bank transaction not found');
    }
    
    // Check if user is authenticated in Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      console.log('No authenticated user, using admin client...');
      // Use admin client when no user is authenticated
      const { data, error } = await supabaseAdmin
        .from('bank_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('API Error - Update Bank Transaction (Admin):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank transaction updated successfully (Admin):', data);
      return data;
    } else {
      console.log('Authenticated user found, using regular client...');
      // Use regular client when user is authenticated
      const { data, error } = await supabase
        .from('bank_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('API Error - Update Bank Transaction (Regular):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank transaction updated successfully (Regular):', data);
      return data;
    }
  }

  static async deleteBankTransaction(id: string): Promise<void> {
    console.log('API: Deleting bank transaction:', id);
    
    if (!isSupabaseConfigured) {
      // Use localStorage fallback
      const savedTransactions = localStorage.getItem('admin_bank_transactions');
      if (savedTransactions) {
        const transactions = JSON.parse(savedTransactions);
        const filteredTransactions = transactions.filter((t: any) => t.id !== id);
        localStorage.setItem('admin_bank_transactions', JSON.stringify(filteredTransactions));
        console.log('API: Bank transaction deleted from localStorage');
        return;
      }
      throw new Error('Bank transaction not found');
    }
    
    // Check if user is authenticated in Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      console.log('No authenticated user, using admin client...');
      // Use admin client when no user is authenticated
      const { error } = await supabaseAdmin
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('API Error - Delete Bank Transaction (Admin):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank transaction deleted successfully (Admin)');
    } else {
      console.log('Authenticated user found, using regular client...');
      // Use regular client when user is authenticated
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('API Error - Delete Bank Transaction (Regular):', error);
        throw new Error(error.message);
      }

      console.log('API: Bank transaction deleted successfully (Regular)');
    }
  }

  // AUTHENTICATION APIs
  static async login(email: string, password: string) {
    console.log('API: Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('API Error - Login:', error);
      throw new Error(error.message);
    }

    console.log('API: Login successful:', data.user?.email);
    return data;
  }

  static async logout() {
    console.log('API: Logging out...');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('API Error - Logout:', error);
      throw new Error(error.message);
    }

    console.log('API: Logout successful');
  }

  static async getCurrentUser() {
    console.log('API: Getting current user...');
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('API Error - Get Current User:', error);
      return null;
    }

    console.log('API: Current user:', user?.email);
    return user;
  }

  // ===== ACTIVITIES API =====
  
  // Get all activities
  static async getAllActivities(userId?: string): Promise<any[]> {
    console.log('API: Fetching activities...', userId ? `for user: ${userId}` : 'for all users');
    
    let query = supabaseAdmin
      .from('activities')
      .select('*')
      .order('timestamp', { ascending: false });

    // If userId is provided, filter by user (for staff members)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API Error - Get All Activities:', error);
      throw new Error(error.message);
    }

    console.log('API: Activities fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  // Create activity
  static async createActivity(activity: {
    action: string;
    user_name: string;
    user_id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    details?: string;
    ip_address?: string | null;
  }): Promise<any> {
    console.log('API: Creating activity:', activity);
    console.log('API: Activity type:', activity.type, 'Type of type:', typeof activity.type);
    
    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert([activity])
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Activity:', error);
      throw new Error(error.message);
    }

    console.log('API: Activity created successfully:', data);
    return data;
  }

  // Get recent activities (last 30 days)
  static async getRecentActivities(limit: number = 50): Promise<any[]> {
    console.log('API: Fetching recent activities...', `limit: ${limit}`);
    
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('API Error - Get Recent Activities:', error);
      throw new Error(error.message);
    }

    console.log('API: Recent activities fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  // Get activity statistics
  static async getActivityStats(days: number = 30): Promise<any> {
    console.log('API: Fetching activity stats...', `days: ${days}`);
    
    const { data, error } = await supabase
      .from('activities')
      .select('type, timestamp')
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('API Error - Get Activity Stats:', error);
      throw new Error(error.message);
    }

    const stats = {
      total: data?.length || 0,
      success: data?.filter(a => a.type === 'success').length || 0,
      info: data?.filter(a => a.type === 'info').length || 0,
      warning: data?.filter(a => a.type === 'warning').length || 0,
      error: data?.filter(a => a.type === 'error').length || 0,
    };

    console.log('API: Activity stats fetched successfully:', stats);
    return stats;
  }

  // Clean up old activities (older than specified days)
  static async cleanupOldActivities(days: number = 30): Promise<number> {
    console.log('API: Cleaning up old activities...', `older than ${days} days`);
    
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('activities')
      .delete()
      .lt('timestamp', cutoffDate)
      .select('id');

    if (error) {
      console.error('API Error - Cleanup Old Activities:', error);
      throw new Error(error.message);
    }

    const deletedCount = data?.length || 0;
    console.log('API: Old activities cleaned up successfully:', deletedCount, 'records deleted');
    return deletedCount;
  }

  // UTILITY METHODS
  static async testConnection(): Promise<boolean> {
    try {
      console.log('API: Testing connection...');
      const { data, error } = await supabase
        .from('staff')
        .select('count')
        .limit(1);

      if (error) {
        console.error('API Error - Test Connection:', error);
        return false;
      }

      console.log('API: Connection test successful');
      return true;
    } catch (error) {
      console.error('API Error - Test Connection:', error);
      return false;
    }
  }
}

export default ApiService;
