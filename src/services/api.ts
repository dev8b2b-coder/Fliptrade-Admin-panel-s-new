import { supabase } from '../lib/supabase';

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
  // STAFF MANAGEMENT APIs
  static async getAllStaff(): Promise<Staff[]> {
    console.log('API: Fetching all staff...');
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('status', 'active')
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
    
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
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
    console.log('API: Creating staff permissions:', permissions);
    const permissionsWithIds = permissions.map(p => ({
      ...p,
      id: crypto.randomUUID(),
    }));

    const { data, error } = await supabase
      .from('staff_permissions')
      .insert(permissionsWithIds)
      .select();

    if (error) {
      console.error('API Error - Create Staff Permissions:', error);
      throw new Error(error.message);
    }

    console.log('API: Staff permissions created successfully:', data?.length || 0, 'records');
    return data || [];
  }

  // DEPOSITS MANAGEMENT APIs
  static async getAllDeposits(userId?: string): Promise<Deposit[]> {
    console.log('API: Fetching deposits...', userId ? `for user: ${userId}` : 'for all users');
    
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
    const { data, error } = await supabase
      .from('banks')
      .insert({
        ...bank,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Bank:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank created successfully:', data);
    return data;
  }

  static async updateBank(id: string, updates: Partial<Bank>): Promise<Bank> {
    console.log('API: Updating bank:', id, updates);
    const { data, error } = await supabase
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
    const { error } = await supabase
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
    
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .order('date', { ascending: false });

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
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_id', bankId)
      .order('date', { ascending: false });

    if (error) {
      console.error('API Error - Get Bank Transactions by Bank:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank transactions fetched:', data?.length || 0, 'records');
    return data || [];
  }

  static async createBankTransaction(transaction: Omit<BankTransaction, 'id'>): Promise<BankTransaction> {
    console.log('API: Creating bank transaction:', transaction);
    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        ...transaction,
        id: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) {
      console.error('API Error - Create Bank Transaction:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank transaction created successfully:', data);
    return data;
  }

  static async updateBankTransaction(id: string, updates: Partial<BankTransaction>): Promise<BankTransaction> {
    console.log('API: Updating bank transaction:', id, updates);
    const { data, error } = await supabase
      .from('bank_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('API Error - Update Bank Transaction:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank transaction updated successfully:', data);
    return data;
  }

  static async deleteBankTransaction(id: string): Promise<void> {
    console.log('API: Deleting bank transaction:', id);
    const { error } = await supabase
      .from('bank_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('API Error - Delete Bank Transaction:', error);
      throw new Error(error.message);
    }

    console.log('API: Bank transaction deleted successfully');
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
    
    let query = supabase
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
  }): Promise<any> {
    console.log('API: Creating activity:', activity);
    console.log('API: Activity type:', activity.type, 'Type of type:', typeof activity.type);
    
    const { data, error } = await supabase
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
    
    const { data, error } = await supabase
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
