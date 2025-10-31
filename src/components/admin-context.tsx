import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ApiService from '../services/api';

export type AdminPage = 
  | 'login' 
  | 'forgot-password' 
  | 'otp-verification' 
  | 'change-password' 
  | 'reset-password'
  | 'dashboard' 
  | 'profile' 
  | 'staff-management' 
  | 'add-staff'
  | 'deposits'
  | 'bank-deposits'
  | 'activity-logs';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export type ModulePermission = {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
};

export type UserPermissions = {
  dashboard: ModulePermission;
  deposits: ModulePermission;
  bankDeposits: ModulePermission;
  staffManagement: ModulePermission;
  activityLogs: ModulePermission;
};

export type UserRole = 'Super Admin' | 'Admin' | 'Manager' | 'Accountant' | 'Viewer';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isArchived?: boolean;
  archivedAt?: string;
  needsPasswordReset?: boolean;
  password_hash?: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  password_hash: string;
  avatar?: string;
}

export interface ClientIncentive {
  id: string;
  name: string;
  amount: number;
}

export interface ExpenseItem {
  id: string;
  type: 'Promotion' | 'Salary' | 'Miscellaneous' | 'IB Commission' | 'Travel Expense';
  amount: number;
  description?: string;
}

export interface DepositEntry {
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
  submittedBy: string; // Staff member ID who submitted this entry
  submittedByName: string; // Staff member name for display
}

export interface Bank {
  id: string;
  name: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  bankId: string;
  deposit: number;
  withdraw: number;
  pnl?: number; // Profit and Loss amount
  remaining: number;
  remainingBalance?: number; // For backward compatibility
  submittedBy: string; // Staff member ID who submitted this entry
  submittedByName: string; // Staff member name for display
}

export interface Activity {
  id: string;
  action: string;
  user: string;
  userId: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  details?: string;
  timestamp: Date;
  ipAddress?: string;
}

interface AdminContextType {
  currentPage: AdminPage;
  setCurrentPage: (page: AdminPage) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  staff: Staff[];
  setStaff: (staff: Staff[]) => void;
  otpData: { email: string; purpose: 'forgot-password' | 'verification' } | null;
  setOtpData: (data: { email: string; purpose: 'forgot-password' | 'verification' } | null) => void;
  deposits: DepositEntry[];
  setDeposits: (deposits: DepositEntry[]) => void;
  banks: Bank[];
  setBanks: (banks: Bank[]) => void;
  bankTransactions: BankTransaction[];
  setBankTransactions: (transactions: BankTransaction[]) => void;
  withdrawals: { id: string; date: string; amount: number }[];
  setWithdrawals: (withdrawals: { id: string; date: string; amount: number }[]) => void;
  activities: Activity[];
  setActivities: (activities: Activity[]) => void;
  isLoading: boolean;
  // Helper functions for role-based access
  isAdmin: () => boolean;
  canViewAllEntries: () => boolean;
  getFilteredDeposits: () => DepositEntry[];
  getFilteredBankTransactions: () => BankTransaction[];
  getFilteredActivities: () => Activity[];
  canAccessStaffManagement: () => boolean;
  canAccessActivityLogs: () => boolean;
  canAccessDeposits: () => boolean;
  canAccessBankDeposits: () => boolean;
  canViewDashboardExtras: () => boolean;
  canAccessDashboard: () => boolean;
  getDefaultPageForUser: () => AdminPage;
  addActivity: (action: string, type: 'success' | 'info' | 'warning' | 'error', details?: string) => Promise<void>;
  // Test data functions
  generateTestDeposits: () => void;
  generateTestBankTransactions: () => void;
  generateTestStaff: () => void;
  clearAllTestData: () => void;
  
  // Supabase fetch functions
  fetchStaff: () => Promise<void>;
  fetchDeposits: () => Promise<void>;
  fetchBanks: () => Promise<void>;
  fetchBankTransactions: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Initialize state with localStorage values
  const [currentPage, setCurrentPageState] = useState<AdminPage>(() => {
    const savedPage = localStorage.getItem('admin_current_page') as AdminPage;
    return savedPage || 'login';
  });

  // Custom setCurrentPage function that saves to localStorage
  const setCurrentPage = (page: AdminPage) => {
    setCurrentPageState(page);
    localStorage.setItem('admin_current_page', page);
    console.log('🔍 Current page set to:', page);
  };
  
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('🔍 Loaded user from localStorage:', parsedUser);
        return parsedUser;
      } catch (error) {
        console.error('❌ Error parsing user from localStorage:', error);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_is_authenticated');
        return null;
      }
    }
    console.log('🔍 No user found in localStorage');
    return null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem('admin_is_authenticated');
    const savedUser = localStorage.getItem('admin_user');
    // Only set authenticated to true if we have both auth flag and user data
    const isAuth = savedAuth === 'true' && !!savedUser;
    console.log('🔍 Authentication state:', { savedAuth, hasUser: !!savedUser, isAuth });
    return isAuth;
  });
  
  const [otpData, setOtpData] = useState<{ email: string; purpose: 'forgot-password' | 'verification' } | null>(null);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('admin_current_page', currentPage);
  }, [currentPage]);
  
  useEffect(() => {
    if (user) {
      localStorage.setItem('admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('admin_user');
    }
  }, [user]);
  
  useEffect(() => {
    localStorage.setItem('admin_is_authenticated', isAuthenticated.toString());
  }, [isAuthenticated]);
  
  // Fetch data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 User authenticated, fetching all data...');
      refreshAllData();
    }
  }, [isAuthenticated, user]);
  
  // Data fetching functions
  // Capture client public IP once
  const [clientIp, setClientIp] = useState<string | null>(null);
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setClientIp(d?.ip || null))
      .catch(() => setClientIp(null));
  }, []);
  const fetchStaff = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      const staffData = await ApiService.getAllStaff();

      const transformedStaff = await Promise.all(staffData.map(async (s) => {
        // Load permissions rows for each staff
        let permissionsRows: any[] = [];
        try {
          permissionsRows = await ApiService.getStaffPermissions(s.id);
        } catch {}

        const toModule = (module: string) => {
          // Accept both DB snake_case and camelCase for safety
          const candidates = [
            module,
            module === 'bankDeposits' ? 'bank_deposits' :
            module === 'staffManagement' ? 'staff_management' :
            module === 'activityLogs' ? 'activity_logs' : module
          ];
          return permissionsRows.find(r => candidates.includes(r.module));
        };
        const permsObj = ((): any => {
          const defaults = (() => {
            const isSuperAdmin = s.role === 'Super Admin';
            const isAdmin = s.role === 'Admin';
            const isManager = s.role === 'Manager';
            const isAccountant = s.role === 'Accountant';
            return {
              dashboard: { view: true, add: isSuperAdmin || isAdmin, edit: isSuperAdmin || isAdmin, delete: isSuperAdmin },
              deposits: { view: true, add: isSuperAdmin || isAdmin || isManager || isAccountant, edit: isSuperAdmin || isAdmin || isManager || isAccountant, delete: isSuperAdmin || isAdmin },
              bankDeposits: { view: true, add: isSuperAdmin || isAdmin || isManager || isAccountant, edit: isSuperAdmin || isAdmin || isManager || isAccountant, delete: isSuperAdmin || isAdmin },
              staffManagement: { view: isSuperAdmin || isAdmin || isManager, add: isSuperAdmin || isAdmin, edit: isSuperAdmin || isAdmin, delete: isSuperAdmin },
              activityLogs: { view: isSuperAdmin || isAdmin, add: isSuperAdmin || isAdmin, edit: isSuperAdmin || isAdmin, delete: isSuperAdmin },
            };
          })();

          const build = (module: keyof typeof defaults) => {
            const row = toModule(module as string);
            return row ? { view: row.can_view, add: row.can_add, edit: row.can_edit, delete: row.can_delete } : defaults[module];
          };

          return {
            dashboard: build('dashboard'),
            deposits: build('deposits'),
            bankDeposits: build('bankDeposits'),
            staffManagement: build('staffManagement'),
            activityLogs: build('activityLogs'),
          };
        })();

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          role: s.role,
          status: s.status,
          avatar: s.avatar,
          createdAt: s.created_at,
          lastLogin: s.last_login,
          isArchived: s.is_archived,
          archivedAt: s.archived_at,
          permissions: permsObj,
        };
      }));

      setStaff(transformedStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchDeposits = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      console.log('🔄 Fetching deposits from database...');
      const userId = user && !isAdmin() ? user.id : undefined;
      const depositsData = await ApiService.getAllDeposits(userId);
      
      console.log('📊 Raw deposits data:', depositsData);
      
      // Fetch client incentives and expenses for each deposit
      const transformedDeposits = await Promise.all(
        depositsData.map(async (deposit) => {
          try {
            // Fetch client incentives for this deposit
            const clientIncentives = await ApiService.getClientIncentivesByDepositId(deposit.id);
            console.log(`🎁 Client incentives for deposit ${deposit.id}:`, clientIncentives);
            
            // Fetch expenses for this deposit
            const expenses = await ApiService.getExpensesByDepositId(deposit.id);
            console.log(`💸 Expenses for deposit ${deposit.id}:`, expenses);
            
            return {
              id: deposit.id,
              date: deposit.date,
              localDeposit: deposit.local_deposit,
              usdtDeposit: deposit.usdt_deposit,
              cashDeposit: deposit.cash_deposit,
              localWithdraw: deposit.local_withdraw,
              usdtWithdraw: deposit.usdt_withdraw,
              cashWithdraw: deposit.cash_withdraw,
              clientIncentives: clientIncentives.map(ci => ({
                id: ci.id,
                name: ci.client_name,
                amount: ci.amount
              })),
              expenses: expenses.map(exp => ({
                id: exp.id,
                type: exp.type,
                amount: exp.amount,
                description: exp.description || ''
              })),
              submittedBy: deposit.submitted_by,
              submittedByName: deposit.submitted_by_name,
            };
          } catch (error) {
            console.error(`Error fetching related data for deposit ${deposit.id}:`, error);
            return {
              id: deposit.id,
              date: deposit.date,
              localDeposit: deposit.local_deposit,
              usdtDeposit: deposit.usdt_deposit,
              cashDeposit: deposit.cash_deposit,
              localWithdraw: deposit.local_withdraw,
              usdtWithdraw: deposit.usdt_withdraw,
              cashWithdraw: deposit.cash_withdraw,
              clientIncentives: [],
              expenses: [],
              submittedBy: deposit.submitted_by,
              submittedByName: deposit.submitted_by_name,
            };
          }
        })
      );
      
      console.log('✅ Transformed deposits:', transformedDeposits);
      console.log('📊 Setting deposits state with', transformedDeposits.length, 'deposits');
      setDeposits(transformedDeposits);
      console.log('✅ Deposits state updated successfully');
    } catch (error) {
      console.error('Error fetching deposits:', error);
    }
  };

  const fetchBanks = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      const banksData = await ApiService.getAllBanks();
      
      const transformedBanks = banksData.map(bank => ({
        id: bank.id,
        name: bank.name
      }));
      
      setBanks(transformedBanks);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchBankTransactions = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      const userId = user && !isAdmin() ? user.id : undefined;
      const transactionsData = await ApiService.getAllBankTransactions(userId);
      
      const transformedTransactions = transactionsData.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        bankId: transaction.bank_id,
        deposit: transaction.deposit,
        withdraw: transaction.withdraw,
        pnl: transaction.pnl,
        remaining: transaction.remaining,
        remainingBalance: transaction.remaining, // For backward compatibility
        submittedBy: transaction.submitted_by,
        submittedByName: transaction.submitted_by_name,
      }));
      
      setBankTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
    }
  };

  const fetchActivities = async () => {
    if (!isSupabaseConfigured) return;
    
    try {
      console.log('🔄 Fetching activities from database...');
      const userId = user && !isAdmin() ? user.id : undefined;
      const activitiesData = await ApiService.getAllActivities(userId);
      
      console.log('📊 Raw activities data:', activitiesData);
      
      // Transform data to match expected format
      const transformedActivities = activitiesData.map(activity => ({
        id: activity.id,
        action: activity.action,
        user: activity.user_name,
        userId: activity.user_id,
        time: activity.timestamp,
        type: activity.type,
        details: activity.details,
        timestamp: new Date(activity.timestamp),
        ipAddress: (activity as any).ip_address || undefined,
      }));
      
      console.log('✅ Transformed activities:', transformedActivities);
      setActivities(transformedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  // Refresh all data function
  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await Promise.all([
          fetchStaff(),
          fetchDeposits(),
          fetchBanks(),
          fetchBankTransactions(),
          fetchActivities()
        ]);
        console.log('All data refreshed successfully');
      } else {
        // Refresh localStorage data
        console.log('🔄 Refreshing localStorage data...');
        
        // Load staff data
        const savedStaff = localStorage.getItem('admin_staff');
        if (savedStaff) {
          const parsedStaff = JSON.parse(savedStaff);
          
          // Transform data to match expected format
          const transformedStaff = parsedStaff.map((staff: any) => ({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            status: staff.status,
            avatar: staff.avatar,
            createdAt: staff.createdAt || staff.created_at,
            lastLogin: staff.lastLogin || staff.last_login,
            isArchived: staff.isArchived || staff.is_archived || false,
            archivedAt: staff.archivedAt || staff.archived_at,
            needsPasswordReset: staff.needsPasswordReset || staff.needs_password_reset,
            password_hash: staff.password_hash,
            permissions: staff.permissions || (() => {
              // Default permissions based on role
              const isSuperAdmin = staff.role === 'Super Admin';
              const isAdmin = staff.role === 'Admin';
              const isManager = staff.role === 'Manager';
              const isAccountant = staff.role === 'Accountant';
              
              return {
                dashboard: { 
                  view: true, 
                  add: isSuperAdmin || isAdmin, 
                  edit: isSuperAdmin || isAdmin, 
                  delete: isSuperAdmin 
                },
                deposits: { 
                  view: true, 
                  add: isSuperAdmin || isAdmin || isManager || isAccountant, 
                  edit: isSuperAdmin || isAdmin || isManager || isAccountant, 
                  delete: isSuperAdmin || isAdmin 
                },
                bankDeposits: { 
                  view: true, 
                  add: isSuperAdmin || isAdmin || isManager || isAccountant, 
                  edit: isSuperAdmin || isAdmin || isManager || isAccountant, 
                  delete: isSuperAdmin || isAdmin 
                },
                staffManagement: { 
                  view: isSuperAdmin || isAdmin || isManager,
                  add: isSuperAdmin || isAdmin,
                  edit: isSuperAdmin || isAdmin,
                  delete: isSuperAdmin
                },
                activityLogs: { 
                  view: isSuperAdmin || isAdmin,
                  add: isSuperAdmin || isAdmin,
                  edit: isSuperAdmin || isAdmin,
                  delete: isSuperAdmin
                }
              };
            })()
          }));
          
          setStaff(transformedStaff);
          console.log('📂 Refreshed staff from localStorage:', transformedStaff.length, 'staff members');
        } else {
          // No staff data found, generate some test data
          console.log('📂 No staff data found in localStorage, generating test data...');
          const testStaffMembers: Staff[] = [
            {
              id: `admin-${Date.now()}`,
              name: 'Admin User',
              email: 'admin@gmail.com',
              role: 'Super Admin',
              permissions: {
                dashboard: { view: true, add: false, edit: false, delete: false },
                deposits: { view: true, add: true, edit: true, delete: true },
                bankDeposits: { view: true, add: true, edit: true, delete: true },
                staffManagement: { view: true, add: true, edit: true, delete: true },
                activityLogs: { view: true, add: true, edit: true, delete: true },
              },
              status: 'active',
              createdAt: new Date().toISOString().split('T')[0],
              isArchived: false,
            }
          ];
          
          setStaff(testStaffMembers);
          localStorage.setItem('admin_staff', JSON.stringify(testStaffMembers));
          console.log('📂 Generated and saved test staff data:', testStaffMembers.length, 'staff members');
        }
        
        // Load deposits data
        const savedDeposits = localStorage.getItem('admin_deposits');
        if (savedDeposits) {
          const parsedDeposits = JSON.parse(savedDeposits);
          setDeposits(parsedDeposits);
          console.log('📂 Refreshed deposits from localStorage:', parsedDeposits.length, 'deposits');
        }
        
        // Load banks data
        const savedBanks = localStorage.getItem('admin_banks');
        if (savedBanks) {
          const parsedBanks = JSON.parse(savedBanks);
          setBanks(parsedBanks);
          console.log('📂 Refreshed banks from localStorage:', parsedBanks.length, 'banks');
        }
        
        // Load bank transactions data
        const savedBankTransactions = localStorage.getItem('admin_bank_transactions');
        if (savedBankTransactions) {
          const parsedBankTransactions = JSON.parse(savedBankTransactions);
          setBankTransactions(parsedBankTransactions);
          console.log('📂 Refreshed bank transactions from localStorage:', parsedBankTransactions.length, 'transactions');
        }
        
        // Load activities data
        const savedActivities = localStorage.getItem('admin_activities');
        if (savedActivities) {
          const parsedActivities = JSON.parse(savedActivities);
          setActivities(parsedActivities);
          console.log('📂 Refreshed activities from localStorage:', parsedActivities.length, 'activities');
        }
        
        console.log('✅ localStorage data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchStaff();
      fetchDeposits();
      fetchBanks();
      fetchBankTransactions();
      fetchActivities();
    }
    
    // Load activities from localStorage on mount (only if Supabase is not configured)
    if (!isSupabaseConfigured) {
      const savedActivities = localStorage.getItem('admin_activities');
      if (savedActivities) {
        try {
          const parsedActivities = JSON.parse(savedActivities);
          console.log('📂 Loading activities from localStorage:', parsedActivities.length, 'activities');
          
          // Ensure activities have proper Date objects
          const formattedActivities = parsedActivities.map((activity: any) => ({
            ...activity,
            timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
          }));
          
          setActivities(formattedActivities);
        } catch (error) {
          console.error('Error loading activities from localStorage:', error);
          // Initialize with empty array if parsing fails
          setActivities([]);
        }
      } else {
        // Initialize with mock activities if no saved data
        const mockActivities: Activity[] = [
          {
            id: '1',
            action: 'User logged in',
            user: 'Admin User',
            userId: 'admin-1',
            time: 'Just now',
            type: 'success',
            details: 'Successfully logged into the system',
            timestamp: new Date(),
            ipAddress: '192.168.1.1',
          },
          {
            id: '2',
            action: 'Bank transaction created',
            user: 'Admin User',
            userId: 'admin-1',
            time: '5m ago',
            type: 'info',
            details: 'Created new bank transaction for Bank of America',
            timestamp: new Date(Date.now() - 5 * 60000),
            ipAddress: '192.168.1.1',
          },
          {
            id: '3',
            action: 'Deposit entry added',
            user: 'Admin User',
            userId: 'admin-1',
            time: '1h ago',
            type: 'success',
            details: 'Added new deposit entry for 2024-01-20',
            timestamp: new Date(Date.now() - 60 * 60000),
            ipAddress: '192.168.1.1',
          },
        ];
        setActivities(mockActivities);
        localStorage.setItem('admin_activities', JSON.stringify(mockActivities));
        console.log('📂 Initialized with mock activities:', mockActivities.length, 'activities');
      }
    }
  }, [isSupabaseConfigured]);

  // Refetch data when user changes (for role-based access)
  useEffect(() => {
    if (isSupabaseConfigured && user) {
      fetchDeposits();
      fetchBankTransactions();
      fetchActivities();
    }
  }, [user]);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [deposits, setDeposits] = useState<DepositEntry[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<{ id: string; date: string; amount: number }[]>([]);
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('admin_activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with data from localStorage or mock data if Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Load staff data from localStorage or use mock data
      const savedStaff = localStorage.getItem('admin_staff');
      if (savedStaff) {
        try {
          const parsedStaff = JSON.parse(savedStaff);
          setStaff(parsedStaff);
          console.log('📂 Loaded staff from localStorage:', parsedStaff.length, 'staff members');
        } catch (error) {
          console.error('Error loading staff from localStorage:', error);
          // Fallback to mock data
          setStaff([
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@gmail.com',
      password_hash: 'admin123', // Simple password for testing
      role: 'Super Admin',
      permissions: {
        dashboard: { view: true, add: true, edit: true, delete: true },
        deposits: { view: true, add: true, edit: true, delete: true },
        bankDeposits: { view: true, add: true, edit: true, delete: true },
        staffManagement: { view: true, add: true, edit: true, delete: true },
      },
      status: 'active',
      createdAt: '2024-01-01',
      lastLogin: '2024-01-20',
      isArchived: false,
    },
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      password_hash: 'password123',
      role: 'Super Admin',
      permissions: {
        dashboard: { view: true, add: false, edit: false, delete: false },
        deposits: { view: true, add: true, edit: true, delete: true },
        bankDeposits: { view: true, add: true, edit: true, delete: true },
        staffManagement: { view: true, add: true, edit: true, delete: true },
      },
      status: 'active',
      createdAt: '2024-01-15',
      lastLogin: '2024-01-20',
      isArchived: false,
    },
    {
      id: '2', 
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      password_hash: 'password123',
      role: 'Manager',
      permissions: {
        dashboard: { view: true, add: false, edit: false, delete: false },
        deposits: { view: true, add: true, edit: true, delete: false },
        bankDeposits: { view: true, add: true, edit: false, delete: false },
        staffManagement: { view: true, add: true, edit: true, delete: false },
      },
      status: 'active',
      createdAt: '2024-02-01',
      lastLogin: '2024-01-19',
      isArchived: false,
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike@example.com',
      password_hash: 'password123',
      role: 'Accountant',
      permissions: {
        dashboard: { view: false, add: false, edit: false, delete: false },
        deposits: { view: true, add: true, edit: true, delete: false },
        bankDeposits: { view: true, add: true, edit: true, delete: false },
        staffManagement: { view: false, add: false, edit: false, delete: false },
      },
      status: 'active',
      createdAt: '2024-01-28',
      lastLogin: '2024-01-18',
      isArchived: false,
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma@example.com',
      password_hash: 'password123',
      role: 'Viewer',
      permissions: {
        dashboard: { view: false, add: false, edit: false, delete: false },
        deposits: { view: true, add: true, edit: false, delete: false },
        bankDeposits: { view: true, add: true, edit: false, delete: false },
        staffManagement: { view: false, add: false, edit: false, delete: false },
      },
      status: 'active',
      createdAt: '2024-01-10',
      lastLogin: '2024-01-15',
      isArchived: false,
    }
          ]);
        }
      } else {
        // No saved data, use mock data
        setStaff([
          {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@gmail.com',
            password_hash: 'admin123',
            role: 'Super Admin',
            permissions: {
              dashboard: { view: true, add: true, edit: true, delete: true },
              deposits: { view: true, add: true, edit: true, delete: true },
              bankDeposits: { view: true, add: true, edit: true, delete: true },
              staffManagement: { view: true, add: true, edit: true, delete: true },
            },
            status: 'active',
            createdAt: '2024-01-01',
            lastLogin: '2024-01-20',
            isArchived: false,
          }
        ]);
      }

      // Load deposits data from localStorage or use mock data
      const savedDeposits = localStorage.getItem('admin_deposits');
      if (savedDeposits) {
        try {
          const parsedDeposits = JSON.parse(savedDeposits);
          setDeposits(parsedDeposits);
          console.log('📂 Loaded deposits from localStorage:', parsedDeposits.length, 'deposits');
        } catch (error) {
          console.error('Error loading deposits from localStorage:', error);
          // Fallback to mock data
          setDeposits([
    {
      id: '1',
      date: '2024-01-20',
      localDeposit: 75000,
      usdtDeposit: 45000,
      cashDeposit: 25000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '1', name: 'John Doe', amount: 8000 },
        { id: '2', name: 'Alice Johnson', amount: 5500 },
        { id: '3', name: 'Robert Chen', amount: 4200 }
      ],
      expenses: [
        { id: '1', type: 'Salary', amount: 12000, description: 'Monthly salary payments - January' },
        { id: '2', type: 'Promotion', amount: 3500, description: 'Social media advertising campaign' }
      ],
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '2',
      date: '2024-01-20',
      localDeposit: 60000,
      usdtDeposit: 35000,
      cashDeposit: 18000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '4', name: 'Maria Garcia', amount: 6000 },
        { id: '5', name: 'David Kim', amount: 4800 }
      ],
      expenses: [
        { id: '3', type: 'IB Commission', amount: 8500, description: 'Q1 IB commission payments' },
        { id: '4', type: 'Miscellaneous', amount: 2200, description: 'Office supplies and utilities' }
      ],
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '3',
      date: '2024-01-19',
      localDeposit: 92000,
      usdtDeposit: 28000,
      cashDeposit: 32000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '6', name: 'Jennifer Wilson', amount: 7500 },
        { id: '7', name: 'Michael Brown', amount: 6200 },
        { id: '8', name: 'Lisa Taylor', amount: 3800 },
        { id: '9', name: 'James Anderson', amount: 5100 }
      ],
      expenses: [
        { id: '5', type: 'Travel Expense', amount: 4500, description: 'Client meeting travel costs' },
        { id: '6', type: 'Promotion', amount: 6800, description: 'Trade show participation' }
      ],
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '4',
      date: '2024-01-19',
      localDeposit: 38000,
      usdtDeposit: 22000,
      cashDeposit: 15000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '10', name: 'Christopher Lee', amount: 4200 },
        { id: '11', name: 'Amanda White', amount: 3600 }
      ],
      expenses: [
        { id: '7', type: 'Salary', amount: 9500, description: 'Part-time staff salaries' }
      ],
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '5',
      date: '2024-01-18',
      localDeposit: 48000,
      usdtDeposit: 55000,
      cashDeposit: 12000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '12', name: 'Thomas Martinez', amount: 5800 },
        { id: '13', name: 'Sarah Davis', amount: 4100 }
      ],
      expenses: [
        { id: '8', type: 'IB Commission', amount: 11200, description: 'Monthly IB commissions' },
        { id: '9', type: 'Miscellaneous', amount: 1800, description: 'Software licenses renewal' }
      ],
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '6',
      date: '2024-01-18',
      localDeposit: 65000,
      usdtDeposit: 18000,
      cashDeposit: 28000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '14', name: 'Patricia Johnson', amount: 6500 },
        { id: '15', name: 'Kevin Rodriguez', amount: 4900 },
        { id: '16', name: 'Nicole Thompson', amount: 3700 }
      ],
      expenses: [
        { id: '10', type: 'Travel Expense', amount: 3200, description: 'Regional conference attendance' },
        { id: '11', type: 'Promotion', amount: 4800, description: 'Email marketing campaign' }
      ],
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '7',
      date: '2024-01-17',
      localDeposit: 82000,
      usdtDeposit: 41000,
      cashDeposit: 19000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '17', name: 'Daniel Wilson', amount: 8200 },
        { id: '18', name: 'Michelle Garcia', amount: 5600 },
        { id: '19', name: 'Ryan Clark', amount: 4300 }
      ],
      expenses: [
        { id: '12', type: 'Salary', amount: 15500, description: 'Senior staff bonus payments' },
        { id: '13', type: 'Miscellaneous', amount: 2800, description: 'Equipment maintenance' }
      ],
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '8',
      date: '2024-01-17',
      localDeposit: 29000,
      usdtDeposit: 33000,
      cashDeposit: 21000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '20', name: 'Brandon Moore', amount: 3800 },
        { id: '21', name: 'Stephanie Lewis', amount: 4500 }
      ],
      expenses: [
        { id: '14', type: 'IB Commission', amount: 7900, description: 'Weekly IB payouts' }
      ],
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '9',
      date: '2024-01-16',
      localDeposit: 71000,
      usdtDeposit: 26000,
      cashDeposit: 34000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '22', name: 'Gregory Hall', amount: 6800 },
        { id: '23', name: 'Kimberly Allen', amount: 5200 },
        { id: '24', name: 'Eric Young', amount: 4600 }
      ],
      expenses: [
        { id: '15', type: 'Travel Expense', amount: 5500, description: 'International client visits' },
        { id: '16', type: 'Promotion', amount: 7200, description: 'Website redesign project' }
      ],
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '10',
      date: '2024-01-15',
      localDeposit: 44000,
      usdtDeposit: 39000,
      cashDeposit: 16000,
      localWithdraw: 0,
      usdtWithdraw: 0,
      cashWithdraw: 0,
      clientIncentives: [
        { id: '25', name: 'Ashley King', amount: 4400 },
        { id: '26', name: 'Jonathan Wright', amount: 3900 }
      ],
      expenses: [
        { id: '17', type: 'Salary', amount: 10800, description: 'Administrative staff salaries' },
        { id: '18', type: 'Miscellaneous', amount: 2100, description: 'Legal consultation fees' }
      ],
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    }
          ]);
        }
      } else {
        // No saved data, use mock data
        setDeposits([
          {
            id: '1',
            date: '2024-01-20',
            localDeposit: 75000,
            usdtDeposit: 45000,
            cashDeposit: 25000,
            localWithdraw: 0,
            usdtWithdraw: 0,
            cashWithdraw: 0,
            clientIncentives: [],
            expenses: [],
            submittedBy: '2',
            submittedByName: 'Sarah Johnson',
          }
        ]);
      }

      // Load banks data from localStorage or use mock data
      const savedBanks = localStorage.getItem('admin_banks');
      if (savedBanks) {
        try {
          const parsedBanks = JSON.parse(savedBanks);
          setBanks(parsedBanks);
          console.log('📂 Loaded banks from localStorage:', parsedBanks.length, 'banks');
        } catch (error) {
          console.error('Error loading banks from localStorage:', error);
          // Fallback to mock data
          setBanks([
            { id: '1', name: 'Bank of America' },
            { id: '2', name: 'Chase Bank' },
            { id: '3', name: 'Wells Fargo' },
            { id: '4', name: 'JPMorgan Chase' },
            { id: '5', name: 'Citibank' },
            { id: '6', name: 'HSBC Bank' },
            { id: '7', name: 'TD Bank' },
          ]);
        }
      } else {
        // No saved data, use mock data
        setBanks([
          { id: '1', name: 'Bank of America' },
          { id: '2', name: 'Chase Bank' },
          { id: '3', name: 'Wells Fargo' },
          { id: '4', name: 'JPMorgan Chase' },
          { id: '5', name: 'Citibank' },
          { id: '6', name: 'HSBC Bank' },
          { id: '7', name: 'TD Bank' },
        ]);
      }

      // Load bank transactions data from localStorage or use mock data
      const savedBankTransactions = localStorage.getItem('admin_bank_transactions');
      if (savedBankTransactions) {
        try {
          const parsedTransactions = JSON.parse(savedBankTransactions);
          setBankTransactions(parsedTransactions);
          console.log('📂 Loaded bank transactions from localStorage:', parsedTransactions.length, 'transactions');
        } catch (error) {
          console.error('Error loading bank transactions from localStorage:', error);
          // Fallback to mock data
          setBankTransactions([
    {
      id: '1',
      date: '2024-01-20',
      bankId: '1',
      deposit: 150000,
      withdraw: 25000,
      remaining: 425000,
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '2',
      date: '2024-01-20',
      bankId: '2',
      deposit: 120000,
      withdraw: 35000,
      remaining: 245000,
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '3',
      date: '2024-01-20',
      bankId: '4',
      deposit: 95000,
      withdraw: 0,
      remaining: 385000,
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '4',
      date: '2024-01-19',
      bankId: '1',
      deposit: 85000,
      withdraw: 15000,
      remaining: 300000,
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '5',
      date: '2024-01-19',
      bankId: '3',
      deposit: 110000,
      withdraw: 45000,
      remaining: 165000,
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '6',
      date: '2024-01-19',
      bankId: '5',
      deposit: 75000,
      withdraw: 20000,
      remaining: 195000,
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '7',
      date: '2024-01-18',
      bankId: '2',
      deposit: 65000,
      withdraw: 18000,
      remaining: 160000,
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '8',
      date: '2024-01-18',
      bankId: '4',
      deposit: 140000,
      withdraw: 32000,
      remaining: 290000,
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '9',
      date: '2024-01-18',
      bankId: '6',
      deposit: 88000,
      withdraw: 12000,
      remaining: 176000,
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '10',
      date: '2024-01-17',
      bankId: '1',
      deposit: 200000,
      withdraw: 55000,
      remaining: 230000,
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '11',
      date: '2024-01-17',
      bankId: '3',
      deposit: 45000,
      withdraw: 8000,
      remaining: 100000,
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '12',
      date: '2024-01-17',
      bankId: '7',
      deposit: 125000,
      withdraw: 28000,
      remaining: 197000,
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '13',
      date: '2024-01-16',
      bankId: '2',
      deposit: 92000,
      withdraw: 22000,
      remaining: 113000,
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '14',
      date: '2024-01-16',
      bankId: '4',
      deposit: 78000,
      withdraw: 38000,
      remaining: 182000,
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '15',
      date: '2024-01-16',
      bankId: '5',
      deposit: 105000,
      withdraw: 15000,
      remaining: 140000,
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    },
    {
      id: '16',
      date: '2024-01-15',
      bankId: '3',
      deposit: 135000,
      withdraw: 42000,
      remaining: 63000,
      submittedBy: '1',
      submittedByName: 'John Smith',
    },
    {
      id: '17',
      date: '2024-01-15',
      bankId: '6',
      deposit: 68000,
      withdraw: 25000,
      remaining: 100000,
      submittedBy: '2',
      submittedByName: 'Sarah Johnson',
    },
    {
      id: '18',
      date: '2024-01-15',
      bankId: '7',
      deposit: 115000,
      withdraw: 18000,
      remaining: 100000,
      submittedBy: '3',
      submittedByName: 'Mike Davis',
    }
          ]);
        }
      } else {
        // No saved data, use mock data
        setBankTransactions([
          {
            id: '1',
            date: '2024-01-20',
            bankId: '1',
            deposit: 150000,
            withdraw: 25000,
            remaining: 425000,
            submittedBy: '2',
            submittedByName: 'Sarah Johnson',
          }
        ]);
      }

      // Load withdrawals data from localStorage or use mock data
      const savedWithdrawals = localStorage.getItem('admin_withdrawals');
      if (savedWithdrawals) {
        try {
          const parsedWithdrawals = JSON.parse(savedWithdrawals);
          setWithdrawals(parsedWithdrawals);
          console.log('📂 Loaded withdrawals from localStorage:', parsedWithdrawals.length, 'withdrawals');
        } catch (error) {
          console.error('Error loading withdrawals from localStorage:', error);
          // Fallback to mock data
          setWithdrawals([
            { id: '1', date: '2024-01-15', amount: 25000 },
            { id: '2', date: '2024-01-16', amount: 18000 },
          ]);
        }
      } else {
        // No saved data, use mock data
        setWithdrawals([
          { id: '1', date: '2024-01-15', amount: 25000 },
          { id: '2', date: '2024-01-16', amount: 18000 },
        ]);
      }
    }
  }, [isSupabaseConfigured]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isSupabaseConfigured && staff.length > 0) {
      localStorage.setItem('admin_staff', JSON.stringify(staff));
    }
  }, [staff, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured && deposits.length > 0) {
      localStorage.setItem('admin_deposits', JSON.stringify(deposits));
    }
  }, [deposits, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured && banks.length > 0) {
      localStorage.setItem('admin_banks', JSON.stringify(banks));
    }
  }, [banks, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured && bankTransactions.length > 0) {
      localStorage.setItem('admin_bank_transactions', JSON.stringify(bankTransactions));
    }
  }, [bankTransactions, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured && withdrawals.length > 0) {
      localStorage.setItem('admin_withdrawals', JSON.stringify(withdrawals));
    }
  }, [withdrawals, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured && activities.length > 0) {
      localStorage.setItem('admin_activities', JSON.stringify(activities));
    }
  }, [activities, isSupabaseConfigured]);

  // Helper functions for role-based access control
  const isAdmin = () => {
    return user?.role === 'Super Admin' || user?.role === 'Admin';
  };

  const canViewAllEntries = () => {
    return isAdmin();
  };

  const getCurrentStaff = () => (user ? staff.find(s => s.id === user.id) : undefined);

  const canAccessStaffManagement = () => {
    const current = getCurrentStaff();
    if (!current) return false;
    // Admins always have access regardless of stored permissions
    if (user?.role === 'Super Admin' || user?.role === 'Admin') return true;
    // Otherwise use permission flag, fallback to role if permissions missing
    return current.permissions?.staffManagement?.view ?? (user?.role === 'Manager');
  };

  const canAccessActivityLogs = () => {
    const current = getCurrentStaff();
    if (!current) return false;
    return current.permissions?.activityLogs?.view ?? (user?.role === 'Super Admin' || user?.role === 'Admin');
  };

  const canAccessDeposits = () => {
    const current = getCurrentStaff();
    if (!current) return false;
    return current.permissions?.deposits?.view ?? true;
  };

  const canAccessBankDeposits = () => {
    const current = getCurrentStaff();
    if (!current) return false;
    return current.permissions?.bankDeposits?.view ?? true;
  };

  const canViewDashboardExtras = () => {
    const current = getCurrentStaff();
    if (!current) return false;
    // Tie extras to dashboard.view plus role for extras if you want stricter control
    return !!(current.permissions?.dashboard?.view);
  };

  const canAccessDashboard = () => {
    const current = getCurrentStaff();
    if (!current) return false;
    return !!(current.permissions?.dashboard?.view);
  };

  const getDefaultPageForUser = (): AdminPage => {
    if (!user) return 'login';
    // If user can access dashboard, default to dashboard
    if (canAccessDashboard()) {
      return 'dashboard';
    }
    // Otherwise, default to deposits for staff users
    return 'deposits';
  };

  const addActivity = async (action: string, type: 'success' | 'info' | 'warning' | 'error', details?: string) => {
    console.log('🔍 addActivity called with:', { action, type, details, user });
    console.log('🔍 Type parameter:', type, 'Type of type:', typeof type);
    
    if (!user) {
      console.log('❌ No user found, cannot add activity');
      return;
    }
    
    // Format time properly
    const formatTime = (date: Date) => {
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    };
    
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      action,
      user: user.name,
      userId: user.id,
      time: formatTime(new Date()),
      type,
      details,
      timestamp: new Date(),
      ipAddress: clientIp || undefined,
    };
    
    console.log('📢 Creating new activity:', newActivity);
    
    // Save to database if Supabase is configured
    if (isSupabaseConfigured) {
      try {
        console.log('💾 Saving activity to database...');
        const activityData = {
          action,
          user_name: user.name,
          user_id: user.id,
          type,
          details,
          ip_address: clientIp || null,
        };
        console.log('🔍 Activity data being sent to API:', activityData);
        await ApiService.createActivity(activityData);
        console.log('✅ Activity saved to database successfully');
      } catch (error) {
        console.error('❌ Error saving activity to database:', error);
        // Continue with local storage fallback
      }
    }
    
    setActivities(prev => {
      const updated = [newActivity, ...prev.slice(0, 49)]; // Keep only last 50 activities
      console.log('📊 Updated activities array:', updated.length, 'activities');
      return updated;
    });
    
    // Also save to localStorage for persistence
    const savedActivities = JSON.parse(localStorage.getItem('admin_activities') || '[]');
    const updatedActivities = [newActivity, ...savedActivities.slice(0, 49)];
    localStorage.setItem('admin_activities', JSON.stringify(updatedActivities));
    
    console.log('💾 Activity saved to localStorage:', updatedActivities.length, 'activities');
    console.log('📢 Activity added successfully:', newActivity);
  };

  const getFilteredDeposits = () => {
    console.log('🔍 getFilteredDeposits called - Total deposits:', deposits.length);
    console.log('👤 Current user:', user?.id, user?.name);
    console.log('🔐 canViewAllEntries():', canViewAllEntries());
    
    if (canViewAllEntries()) {
      console.log('✅ Admin view - returning all', deposits.length, 'deposits');
      return deposits;
    }
    // Regular staff can only see their own entries
    const filteredDeposits = deposits.filter(deposit => deposit.submittedBy === user?.id);
    console.log('👤 Staff view - returning', filteredDeposits.length, 'deposits for user', user?.id);
    return filteredDeposits;
  };

  const getFilteredBankTransactions = () => {
    if (canViewAllEntries()) {
      return bankTransactions;
    }
    // Regular staff can only see their own entries
    return bankTransactions.filter(transaction => transaction.submittedBy === user?.id);
  };

  const getFilteredActivities = () => {
    if (canViewAllEntries()) {
      // Admin sees all activities
      return activities;
    }
    // Regular staff see their own activities + all activities (for notifications)
    return activities;
  };

  // Test data generation functions
  const generateTestDeposits = () => {
    const today = new Date();
    const testDeposits: DepositEntry[] = [];
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const randomStaff = staff[Math.floor(Math.random() * staff.length)];
      const clientNames = [
        'Alexander Chen', 'Jessica Rodriguez', 'Mohammed Hassan', 'Emily Parker', 'Viktor Petrov',
        'Sophia Martinez', 'James Thompson', 'Priya Sharma', 'Marco Rossi', 'Aisha Okafor',
        'Lucas Weber', 'Nadia Volkov', 'Carlos Mendez', 'Yuki Tanaka', 'Isabella Costa'
      ];
      
      const numClients = Math.floor(Math.random() * 4) + 1;
      const clientIncentives: ClientIncentive[] = [];
      for (let j = 0; j < numClients; j++) {
        clientIncentives.push({
          id: `test-${Date.now()}-${i}-${j}`,
          name: clientNames[Math.floor(Math.random() * clientNames.length)],
          amount: Math.floor(Math.random() * 8000) + 2000
        });
      }
      
      const expenseTypes = ['Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense'];
      const numExpenses = Math.floor(Math.random() * 3) + 1;
      const expenses: ExpenseItem[] = [];
      for (let k = 0; k < numExpenses; k++) {
        expenses.push({
          id: `test-exp-${Date.now()}-${i}-${k}`,
          type: expenseTypes[Math.floor(Math.random() * expenseTypes.length)] as any,
          amount: Math.floor(Math.random() * 15000) + 1000,
          description: `Test expense description ${k + 1}`
        });
      }
      
      testDeposits.push({
        id: `test-dep-${Date.now()}-${i}`,
        date: date.toISOString().split('T')[0],
        localDeposit: Math.floor(Math.random() * 100000) + 20000,
        usdtDeposit: Math.floor(Math.random() * 80000) + 15000,
        cashDeposit: Math.floor(Math.random() * 50000) + 10000,
        localWithdraw: Math.floor(Math.random() * 20000),
        usdtWithdraw: Math.floor(Math.random() * 15000),
        cashWithdraw: Math.floor(Math.random() * 10000),
        clientIncentives,
        expenses,
        submittedBy: randomStaff.id,
        submittedByName: randomStaff.name
      });
    }
    
    setDeposits([...deposits, ...testDeposits]);
  };

  const generateTestBankTransactions = () => {
    const today = new Date();
    const testTransactions: BankTransaction[] = [];
    
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const randomStaff = staff[Math.floor(Math.random() * staff.length)];
      const randomBank = banks[Math.floor(Math.random() * banks.length)];
      
      const deposit = Math.floor(Math.random() * 200000) + 50000;
      const withdraw = Math.random() > 0.7 ? Math.floor(Math.random() * 50000) + 5000 : 0;
      const remaining = Math.floor(Math.random() * 500000) + 100000;
      
      testTransactions.push({
        id: `test-bank-${Date.now()}-${i}`,
        date: date.toISOString().split('T')[0],
        bankId: randomBank.id,
        deposit,
        withdraw,
        remaining,
        submittedBy: randomStaff.id,
        submittedByName: randomStaff.name
      });
    }
    
    setBankTransactions([...bankTransactions, ...testTransactions]);
  };

  const generateTestStaff = () => {
    const testStaffMembers: Staff[] = [
      {
        id: `test-staff-${Date.now()}-1`,
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@example.com',
        role: 'Accountant',
        permissions: {
          dashboard: { view: false, add: false, edit: false, delete: false },
          deposits: { view: true, add: true, edit: true, delete: false },
          bankDeposits: { view: true, add: true, edit: true, delete: false },
          staffManagement: { view: false, add: false, edit: false, delete: false },
          activityLogs: { view: false, add: false, edit: false, delete: false },
        },
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        isArchived: false,
      },
      {
        id: `test-staff-${Date.now()}-2`,
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        role: 'Viewer',
        permissions: {
          dashboard: { view: false, add: false, edit: false, delete: false },
          deposits: { view: true, add: true, edit: false, delete: false },
          bankDeposits: { view: true, add: true, edit: false, delete: false },
          staffManagement: { view: false, add: false, edit: false, delete: false },
          activityLogs: { view: false, add: false, edit: false, delete: false },
        },
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        isArchived: false,
      },
      {
        id: `test-staff-${Date.now()}-3`,
        name: 'Kevin Chen',
        email: 'kevin.chen@example.com',
        role: 'Manager',
        permissions: {
          dashboard: { view: true, add: false, edit: false, delete: false },
          deposits: { view: true, add: true, edit: true, delete: false },
          bankDeposits: { view: true, add: true, edit: false, delete: false },
          staffManagement: { view: true, add: true, edit: true, delete: false },
          activityLogs: { view: false, add: false, edit: false, delete: false },
        },
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        isArchived: false,
      }
    ];
    
    setStaff([...staff, ...testStaffMembers]);
  };

  const clearAllTestData = () => {
    // Remove all test data (entries with IDs starting with 'test-')
    const filteredDeposits = deposits.filter(d => !d.id.startsWith('test-'));
    const filteredTransactions = bankTransactions.filter(t => !t.id.startsWith('test-'));
    const filteredStaff = staff.filter(s => !s.id.startsWith('test-'));
    
    setDeposits(filteredDeposits);
    setBankTransactions(filteredTransactions);
    setStaff(filteredStaff);
  };

  return (
    <AdminContext.Provider value={{
      currentPage,
      setCurrentPage,
      user,
      setUser,
      isAuthenticated,
      setIsAuthenticated,
      staff,
      setStaff,
      otpData,
      setOtpData,
      deposits,
      setDeposits,
      banks,
      setBanks,
      bankTransactions,
      setBankTransactions,
      withdrawals,
      setWithdrawals,
      activities,
      setActivities,
      isLoading,
      isAdmin,
      canViewAllEntries,
      getFilteredDeposits,
      getFilteredBankTransactions,
      getFilteredActivities,
      canAccessStaffManagement,
      canAccessActivityLogs,
      canAccessDeposits,
      canAccessBankDeposits,
      canViewDashboardExtras,
      canAccessDashboard,
      getDefaultPageForUser,
      addActivity,
      generateTestDeposits,
      generateTestBankTransactions,
      generateTestStaff,
      clearAllTestData,
      // Supabase fetch functions
      fetchStaff,
      fetchDeposits,
      fetchBanks,
      fetchBankTransactions,
      fetchActivities,
      refreshAllData,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}