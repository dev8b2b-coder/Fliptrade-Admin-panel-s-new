import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Plus, Edit, Trash2, Search, Filter, Calendar, X, UserPlus, DollarSign, MinusCircle, User, TrendingUp, Wallet, Calculator, ArrowUpDown, TrendingDown, CalendarIcon } from 'lucide-react';
import { useAdmin, type DepositEntry, type ClientIncentive, type ExpenseItem } from './admin-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ApiService from '../services/api';
import { toast } from 'sonner';
import { TablePagination } from './table-pagination';
import { format } from 'date-fns';

const expenseTypes = ['Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense'] as const;

export function EnhancedDepositsNew() {
  const { 
    deposits, 
    setDeposits, 
    withdrawals, 
    getFilteredDeposits, 
    canViewAllEntries, 
    isAdmin,
    user,
    staff,
    addActivity,
    refreshAllData
  } = useAdmin();

  // Permission checks for current user
  const getCurrentUserPermissions = () => {
    if (!user) return null;
    const currentStaff = staff.find(s => s.id === user.id);
    return currentStaff?.permissions.deposits || null;
  };

  const canEditDeposit = (deposit: DepositEntry) => {
    const permissions = getCurrentUserPermissions();
    if (!permissions) return false;
    
    // Admin can edit anything
    if (canViewAllEntries()) return permissions.edit;
    
    // Staff can only edit their own entries
    return permissions.edit && deposit.submittedBy === user?.id;
  };

  const canDeleteDeposit = (deposit: DepositEntry) => {
    const permissions = getCurrentUserPermissions();
    if (!permissions) return false;
    
    // Admin can delete anything
    if (canViewAllEntries()) return permissions.delete;
    
    // Staff can only delete their own entries
    return permissions.delete && deposit.submittedBy === user?.id;
  };

  const canAddDeposit = () => {
    const permissions = getCurrentUserPermissions();
    return permissions?.add || false;
  };
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  
  // New filter state
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // Helper function to check if date is in range
  const isDateInRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return date >= weekAgo && date <= now;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return date >= monthAgo && date <= now;
      case 'all':
      default:
        return true;
    }
  };

  // Check custom date range
  const isDateInCustomRange = (dateStr: string) => {
    if (!customDateRange.from && !customDateRange.to) return true;
    
    const date = new Date(dateStr);
    const from = customDateRange.from;
    const to = customDateRange.to;
    
    if (from && to) {
      return date >= from && date <= to;
    } else if (from) {
      return date >= from;
    } else if (to) {
      return date <= to;
    }
    
    return true;
  };

  const clearCustomDateRange = () => {
    setCustomDateRange({ from: undefined, to: undefined });
    setIsCustomDateOpen(false);
  };

  const hasNewActiveFilters = dateFilter !== 'all' || customDateRange.from || customDateRange.to || employeeFilter !== 'all';
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    deposit: DepositEntry | null;
  }>({
    isOpen: false,
    deposit: null
  });
  
  // Form state for deposit entry
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    localDeposit: '',
    usdtDeposit: '',
    cashDeposit: '',
    localWithdraw: '',
    usdtWithdraw: '',
    cashWithdraw: '',
    selectedStaff: user?.id || '', // For admin selecting on behalf of staff
  });

  // Client incentives state
  const [clientIncentives, setClientIncentives] = useState<ClientIncentive[]>([
    { id: '1', name: '', amount: 0 }
  ]);

  // Expenses state
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: '1', type: 'Miscellaneous', amount: 0, description: '' }
  ]);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      localDeposit: '',
      usdtDeposit: '',
      cashDeposit: '',
      localWithdraw: '',
      usdtWithdraw: '',
      cashWithdraw: '',
      selectedStaff: user?.id || '',
    });
    setClientIncentives([{ id: '1', name: '', amount: 0 }]);
    setExpenses([{ id: '1', type: 'Miscellaneous', amount: 0, description: '' }]);
    setEditingDeposit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💰 ===== ENHANCED DEPOSIT FORM SUBMITTED =====');
    console.log('📊 Form Data:', formData);
    console.log('🎁 Client Incentives:', clientIncentives);
    console.log('💸 Expenses:', expenses);
    console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);
    console.log('👤 User:', user);
    console.log('✏️ Editing Deposit:', editingDeposit);
    console.log('🆔 Editing Deposit ID:', editingDeposit?.id);
    
    // Validate that all required fields are filled
    const validClientIncentives = clientIncentives.filter(ci => ci.name.trim() !== '' && ci.amount > 0);
    const validExpenses = expenses.filter(exp => exp.amount > 0);
    
    // Client Incentives and Company Expenses are optional - no validation needed
    console.log('🎁 Valid Client Incentives:', validClientIncentives.length);
    console.log('💸 Valid Expenses:', validExpenses.length);

    setIsSubmitting(true);

    // Determine who is submitting this entry
    let submittedBy = user?.id || '';
    let submittedByName = user?.name || '';
    
    // If admin is creating on behalf of another staff member
    if (isAdmin() && formData.selectedStaff && formData.selectedStaff !== user?.id) {
      const selectedStaffMember = staff.find(s => s.id === formData.selectedStaff);
      if (selectedStaffMember) {
        submittedBy = selectedStaffMember.id;
        submittedByName = selectedStaffMember.name;
      }
    }

    try {
      if (isSupabaseConfigured) {
        let depositData;
        
        if (editingDeposit) {
          // Update existing deposit
          console.log('🔄 Updating existing deposit in Supabase...');
          depositData = await ApiService.updateDeposit(editingDeposit.id, {
            date: formData.date,
            local_deposit: parseFloat(formData.localDeposit) || 0,
            usdt_deposit: parseFloat(formData.usdtDeposit) || 0,
            cash_deposit: parseFloat(formData.cashDeposit) || 0,
            local_withdraw: parseFloat(formData.localWithdraw) || 0,
            usdt_withdraw: parseFloat(formData.usdtWithdraw) || 0,
            cash_withdraw: parseFloat(formData.cashWithdraw) || 0,
            submitted_by: submittedBy,
            submitted_by_name: submittedByName,
          });

          // Delete existing client incentives and expenses
          console.log('🗑️ Deleting existing client incentives and expenses...');
          const existingIncentives = await ApiService.getClientIncentivesByDepositId(editingDeposit.id);
          const existingExpenses = await ApiService.getExpensesByDepositId(editingDeposit.id);
          
          for (const incentive of existingIncentives) {
            await ApiService.deleteClientIncentive(incentive.id);
          }
          
          for (const expense of existingExpenses) {
            await ApiService.deleteExpense(expense.id);
          }

          console.log('✅ Deposit updated successfully!');
          toast.success('Deposit entry updated successfully');
          
          // Add activity
          await addActivity(
            'Deposit entry updated',
            'success',
            `Updated deposit entry for ${formData.date} with ${validClientIncentives.length} client incentives and ${validExpenses.length} expenses`
          );
          
          // Refresh all data to ensure real-time updates
          console.log('🔄 Refreshing all data after update...');
          await refreshAllData();
          console.log('✅ Data refresh completed after update');
          
          // Debug: Check if the updated deposit has the new data
          console.log('🔍 Checking updated deposit data...');
          const updatedDeposits = getFilteredDeposits();
          const updatedDeposit = updatedDeposits.find(d => d.id === depositData.id);
          console.log('📊 Updated deposit found:', updatedDeposit);
          if (updatedDeposit) {
            console.log('🎁 Updated deposit client incentives:', updatedDeposit.clientIncentives);
            console.log('💸 Updated deposit expenses:', updatedDeposit.expenses);
          }
        } else {
          // Create new deposit
          console.log('💾 Creating new deposit in Supabase...');
          depositData = await ApiService.createDeposit({
            date: formData.date,
            local_deposit: parseFloat(formData.localDeposit) || 0,
            usdt_deposit: parseFloat(formData.usdtDeposit) || 0,
            cash_deposit: parseFloat(formData.cashDeposit) || 0,
            local_withdraw: parseFloat(formData.localWithdraw) || 0,
            usdt_withdraw: parseFloat(formData.usdtWithdraw) || 0,
            cash_withdraw: parseFloat(formData.cashWithdraw) || 0,
            submitted_by: submittedBy,
            submitted_by_name: submittedByName,
          });

          console.log('✅ Deposit created successfully!');
          toast.success('Deposit entry added successfully');
          
          // Add activity
          await addActivity(
            'Deposit entry added',
            'success',
            `Added deposit entry for ${formData.date} with ${validClientIncentives.length} client incentives and ${validExpenses.length} expenses`
          );
          
          // Refresh all data to ensure real-time updates
          console.log('🔄 Refreshing all data after create...');
          await refreshAllData();
          console.log('✅ Data refresh completed after create');
        }

        // Save client incentives using API service
        for (const incentive of validClientIncentives) {
          console.log('🎁 Saving client incentive:', incentive);
          const createdIncentive = await ApiService.createClientIncentive({
            deposit_id: depositData.id,
            client_name: incentive.name,
            amount: incentive.amount,
          });
          console.log('✅ Client incentive created:', createdIncentive);
        }

        // Save expenses using API service
        for (const expense of validExpenses) {
          console.log('💸 Saving expense:', expense);
          const createdExpense = await ApiService.createExpense({
            deposit_id: depositData.id,
            type: expense.type,
            amount: expense.amount,
            description: expense.description || '',
          });
          console.log('✅ Expense created:', createdExpense);
        }
      } else {
        // Fallback to local state
        const depositData: DepositEntry = {
          id: editingDeposit?.id || Date.now().toString(),
          date: formData.date,
          localDeposit: parseFloat(formData.localDeposit) || 0,
          usdtDeposit: parseFloat(formData.usdtDeposit) || 0,
          cashDeposit: parseFloat(formData.cashDeposit) || 0,
          localWithdraw: parseFloat(formData.localWithdraw) || 0,
          usdtWithdraw: parseFloat(formData.usdtWithdraw) || 0,
          cashWithdraw: parseFloat(formData.cashWithdraw) || 0,
          clientIncentives: validClientIncentives,
          expenses: validExpenses,
          submittedBy,
          submittedByName,
        };

        if (editingDeposit) {
          setDeposits(deposits.map(d => d.id === editingDeposit.id ? depositData : d));
          toast.success('Deposit entry updated successfully');
        } else {
          setDeposits([...deposits, depositData]);
          toast.success('Deposit entry added successfully');
        }
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving deposit:', error);
      toast.error('Failed to save deposit entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (deposit: DepositEntry) => {
    console.log('✏️ ===== EDIT DEPOSIT CLICKED =====');
    console.log('📝 Deposit to edit:', deposit);
    console.log('🆔 Deposit ID:', deposit.id);
    
    setEditingDeposit(deposit);
    setFormData({
      date: deposit.date,
      localDeposit: deposit.localDeposit.toString(),
      usdtDeposit: deposit.usdtDeposit.toString(),
      cashDeposit: deposit.cashDeposit.toString(),
      localWithdraw: deposit.localWithdraw.toString(),
      usdtWithdraw: deposit.usdtWithdraw.toString(),
      cashWithdraw: deposit.cashWithdraw.toString(),
      selectedStaff: deposit.submittedBy,
    });
    setClientIncentives(deposit.clientIncentives.length > 0 ? deposit.clientIncentives : [{ id: '1', name: '', amount: 0 }]);
    setExpenses(deposit.expenses.length > 0 ? deposit.expenses : [{ id: '1', type: 'Miscellaneous', amount: 0, description: '' }]);
    setIsDialogOpen(true);
    
    console.log('✅ Edit dialog opened with deposit:', deposit);
  };

  const handleDelete = (id: string) => {
    console.log('🗑️ ===== DELETE BUTTON CLICKED =====');
    console.log('🆔 Deposit ID to delete:', id);
    
    const depositToDelete = deposits.find(d => d.id === id);
    if (!depositToDelete) {
      console.log('❌ Deposit not found with ID:', id);
      return;
    }

    console.log('📝 Deposit found:', depositToDelete);
    console.log('✅ Showing confirmation dialog...');

    // Show confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      deposit: depositToDelete
    });
  };

  const confirmDeleteDeposit = async () => {
    const depositToDelete = deleteConfirmation.deposit;
    if (!depositToDelete) return;

    console.log('🗑️ ===== DELETING DEPOSIT =====');
    console.log('📝 Deposit to delete:', depositToDelete);
    console.log('🆔 Deposit ID:', depositToDelete.id);
    console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);

    try {
      if (isSupabaseConfigured) {
        console.log('💾 Deleting deposit from Supabase...');
        
        // First delete related client incentives
        console.log('🗑️ Deleting client incentives...');
        const existingIncentives = await ApiService.getClientIncentivesByDepositId(depositToDelete.id);
        for (const incentive of existingIncentives) {
          await ApiService.deleteClientIncentive(incentive.id);
        }
        
        // Then delete related expenses
        console.log('🗑️ Deleting expenses...');
        const existingExpenses = await ApiService.getExpensesByDepositId(depositToDelete.id);
        for (const expense of existingExpenses) {
          await ApiService.deleteExpense(expense.id);
        }
        
        // Finally delete the deposit
        console.log('🗑️ Deleting deposit...');
        await ApiService.deleteDeposit(depositToDelete.id);
        
        console.log('✅ Deposit deleted from database successfully');
        toast.success('Deposit entry deleted successfully');
        
        // Add activity
        await addActivity(
          'Deposit entry deleted',
          'warning',
          `Deleted deposit entry for ${depositToDelete.date}`
        );
        
        // Refresh all data to ensure real-time updates
        console.log('🔄 Refreshing all data after delete...');
        await refreshAllData();
        console.log('✅ Data refresh completed after delete');
      } else {
        console.log('💾 Deleting deposit from local state...');
        setDeposits(deposits.filter(d => d.id !== depositToDelete.id));
        toast.success('Deposit entry deleted successfully');
      }
      
      setDeleteConfirmation({
        isOpen: false,
        deposit: null
      });
      
    } catch (error) {
      console.error('❌ Error deleting deposit:', error);
      toast.error('Failed to delete deposit entry');
    }
  };

  // Calculate dashboard metrics based on filtered data
  const calculateDashboardMetrics = (deposits: DepositEntry[]) => {
    const totalDeposits = deposits.reduce((sum, deposit) => 
      sum + deposit.localDeposit + deposit.usdtDeposit + deposit.cashDeposit, 0
    );
    
    const totalWithdraws = deposits.reduce((sum, deposit) => 
      sum + deposit.localWithdraw + deposit.usdtWithdraw + deposit.cashWithdraw, 0
    );
    
    const netDeposits = totalDeposits - totalWithdraws;
    
    const totalClientIncentives = deposits.reduce((sum, deposit) => 
      sum + deposit.clientIncentives.reduce((incentiveSum, incentive) => incentiveSum + incentive.amount, 0), 0
    );
    
    const totalCompanyExpenses = deposits.reduce((sum, deposit) => 
      sum + deposit.expenses.reduce((expSum, expense) => expSum + expense.amount, 0), 0
    );
    
    const netProfit = netDeposits - totalClientIncentives - totalCompanyExpenses;
    
    return {
      totalDeposits,
      totalWithdraws,
      netDeposits,
      totalClientIncentives,
      totalCompanyExpenses,
      netProfit,
      entryCount: deposits.length
    };
  };

  // Filter deposits based on search and filters with role-based access control
  const filteredDeposits = useMemo(() => {
    const userDeposits = getFilteredDeposits(); // Get deposits based on user role
    console.log('🔍 Enhanced Deposits - userDeposits from getFilteredDeposits:', userDeposits.length);
    console.log('🔍 Enhanced Deposits - userDeposits data:', userDeposits);
    
    const filtered = userDeposits.filter((deposit) => {
      const matchesSearch = 
        deposit.clientIncentives.some(ci => ci.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deposit.expenses.some(exp => exp.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                   exp.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deposit.date.includes(searchTerm) ||
        deposit.submittedByName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = (() => {
        if (!startDate && !endDate) return true;
        const depositDate = new Date(deposit.date);
        if (startDate && endDate) {
          return depositDate >= startDate && depositDate <= endDate;
        }
        if (startDate) {
          return depositDate >= startDate;
        }
        if (endDate) {
          return depositDate <= endDate;
        }
        return true;
      })();
      
      // New date filters
      const matchesDateFilter = dateFilter === 'all' || isDateInRange(deposit.date);
      const matchesCustomDateRange = isDateInCustomRange(deposit.date);
      
      const matchesExpenseType = expenseTypeFilter === 'all' || 
        deposit.expenses.some(exp => exp.type === expenseTypeFilter);
      const matchesStaff = selectedStaffFilter === 'all' || deposit.submittedBy === selectedStaffFilter;
      
      // New employee filter
      const matchesEmployee = employeeFilter === 'all' || deposit.submittedBy === employeeFilter;
      
      return matchesSearch && matchesDate && matchesDateFilter && matchesCustomDateRange && matchesExpenseType && matchesStaff && matchesEmployee;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return calculateTotalDeposit(b) - calculateTotalDeposit(a);
        case 'amount-asc':
          return calculateTotalDeposit(a) - calculateTotalDeposit(b);
        case 'submitter-asc':
          return a.submittedByName.localeCompare(b.submittedByName);
        case 'submitter-desc':
          return b.submittedByName.localeCompare(a.submittedByName);
        default:
          return 0;
      }
    });
    
    console.log('🔍 Enhanced Deposits - Final filtered deposits:', filtered.length);
    return filtered;
  }, [getFilteredDeposits, searchTerm, startDate, endDate, expenseTypeFilter, selectedStaffFilter, sortBy, dateFilter, customDateRange, employeeFilter]);

  // Group deposits by date and staff member (show separately even if same date)
  const groupedDeposits = useMemo(() => {
    return filteredDeposits.reduce((acc, deposit) => {
      const key = `${deposit.date}-${deposit.submittedBy}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(deposit);
      return acc;
    }, {} as Record<string, DepositEntry[]>);
  }, [filteredDeposits]);

  // Flatten grouped deposits for pagination (keeping separate entries for same date/different staff)
  const flattenedDeposits = useMemo(() => {
    return Object.entries(groupedDeposits).flatMap(([key, dateStaffDeposits]) => 
      dateStaffDeposits.map((deposit, index) => ({
        ...deposit,
        groupKey: key,
        groupIndex: Object.keys(groupedDeposits).indexOf(key)
      }))
    );
  }, [groupedDeposits]);

  const paginatedDeposits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return flattenedDeposits.slice(startIndex, startIndex + itemsPerPage);
  }, [flattenedDeposits, currentPage, itemsPerPage]);

  const hasActiveFilters = searchTerm !== '' || startDate || endDate || expenseTypeFilter !== 'all' || selectedStaffFilter !== 'all' || hasNewActiveFilters;

  const clearAllFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
    setExpenseTypeFilter('all');
    setSelectedStaffFilter('all');
    setDateFilter('all');
    clearCustomDateRange();
    setEmployeeFilter('all');
    setCurrentPage(1);
  };

  const setCurrentPageState = (page: number) => {
    setCurrentPage(page);
  };

  const calculateTotalDeposit = (deposit: DepositEntry) => {
    const totalDeposits = deposit.localDeposit + deposit.usdtDeposit + deposit.cashDeposit;
    const totalWithdraws = deposit.localWithdraw + deposit.usdtWithdraw + deposit.cashWithdraw;
    return totalDeposits - totalWithdraws;
  };

  const calculateTotalIncentives = (deposit: DepositEntry) => {
    return deposit.clientIncentives.reduce((sum, ci) => sum + ci.amount, 0);
  };

  const calculateTotalExpenses = (deposit: DepositEntry) => {
    return deposit.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const calculateTodaysBalance = (deposit: DepositEntry) => {
    const totalDeposit = calculateTotalDeposit(deposit);
    const totalIncentives = calculateTotalIncentives(deposit);
    const totalExpenses = calculateTotalExpenses(deposit);
    return totalDeposit - totalIncentives - totalExpenses;
  };

  const addClientIncentive = () => {
    setClientIncentives([...clientIncentives, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const updateClientIncentive = (id: string, field: keyof ClientIncentive, value: any) => {
    setClientIncentives(clientIncentives.map(ci => 
      ci.id === id ? { ...ci, [field]: value } : ci
    ));
  };

  const removeClientIncentive = (id: string) => {
    if (clientIncentives.length > 1) {
      setClientIncentives(clientIncentives.filter(ci => ci.id !== id));
    }
  };

  const addExpense = () => {
    setExpenses([...expenses, { id: Date.now().toString(), type: 'Miscellaneous', amount: 0, description: '' }]);
  };

  const updateExpense = (id: string, field: keyof ExpenseItem, value: any) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExpense = (id: string) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const dateColors = [
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-yellow-50 border-yellow-200',
    'bg-purple-50 border-purple-200',
    'bg-pink-50 border-pink-200',
    'bg-indigo-50 border-indigo-200',
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Daily Deposits Management</CardTitle>
                <CardDescription>
                  Track daily deposits, client incentives, and company expenses
                  {!canViewAllEntries() && (
                    <span className="block text-sm text-blue-600 mt-1">
                      <User className="w-4 h-4 inline mr-1" />
                      Showing only your entries
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                {/* Quick Date Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="justify-between border border-gray-300 hover:border-gray-400 px-3 py-2"
                    >
                      {dateFilter === 'all' && 'All Time'}
                      {dateFilter === 'today' && 'Today'}
                      {dateFilter === 'week' && 'This Week'}
                      {dateFilter === 'month' && 'This Month'}
                      <Filter className="ml-2 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setDateFilter('all')}
                      className={dateFilter === 'all' ? 'bg-gray-100' : ''}
                    >
                      All Time
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDateFilter('today')}
                      className={dateFilter === 'today' ? 'bg-gray-100' : ''}
                    >
                      Today
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDateFilter('week')}
                      className={dateFilter === 'week' ? 'bg-gray-100' : ''}
                    >
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDateFilter('month')}
                      className={dateFilter === 'month' ? 'bg-gray-100' : ''}
                    >
                      This Month
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Custom Date Range */}
                <Popover open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="justify-start text-left font-normal border border-gray-300 hover:border-gray-400 px-3 py-2"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "MMM dd")} - {format(customDateRange.to, "MMM dd, yyyy")}
                          </>
                        ) : (
                          format(customDateRange.from, "MMM dd, yyyy")
                        )
                      ) : (
                        "Date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from}
                      selected={customDateRange}
                      onSelect={(range) => {
                        setCustomDateRange({
                          from: range?.from,
                          to: range?.to
                        });
                      }}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Clear Custom Date Range */}
                {(customDateRange.from || customDateRange.to) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearCustomDateRange}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-gray-300 hover:border-red-300 px-3 py-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}

                {/* Employee Filter - Only show for admin users */}
                {canViewAllEntries() && (
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {staff.filter(s => s.status === 'active').map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Clear All Filters */}
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-600 hover:text-gray-700 text-xs"
                  >
                    Clear All
                  </Button>
                )}

                {canAddDeposit() ? (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#6a40ec] hover:bg-[#5a2fd9]" onClick={() => resetForm()}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Entry
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-[60%] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDeposit ? 'Edit' : 'Add New'} Deposit Entry</DialogTitle>
                    <DialogDescription>
                      {editingDeposit ? 'Update the deposit information below' : 'Fill in the deposit information below'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      
                      {/* Staff Selection (only for admins) */}
                      {isAdmin() && (
                        <div className="space-y-2">
                          <Label htmlFor="selectedStaff">Submit on behalf of</Label>
                          <Select 
                            value={formData.selectedStaff} 
                            onValueChange={(value) => setFormData({ ...formData, selectedStaff: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={user?.id || ''}>{user?.name} (Yourself)</SelectItem>
                              {staff.filter(s => s.id !== user?.id && s.status === 'active').map((member) => (
                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
          
                      <div className="space-y-2">
                        <Label htmlFor="localDeposit">Local Deposit ($)</Label>
                        <Input
                          id="localDeposit"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.localDeposit}
                          onChange={(e) => setFormData({ ...formData, localDeposit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usdtDeposit">USDT Deposit ($)</Label>
                        <Input
                          id="usdtDeposit"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.usdtDeposit}
                          onChange={(e) => setFormData({ ...formData, usdtDeposit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cashDeposit">Cash Deposit ($)</Label>
                        <Input
                          id="cashDeposit"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.cashDeposit}
                          onChange={(e) => setFormData({ ...formData, cashDeposit: e.target.value })}
                        />
                      </div> 
                      <div className="space-y-2">
                        <Label htmlFor="localWithdraw">Local Withdraw ($)</Label>
                        <Input
                          id="localWithdraw"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.localWithdraw}
                          onChange={(e) => setFormData({ ...formData, localWithdraw: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usdtWithdraw">USDT Withdraw ($)</Label>
                        <Input
                          id="usdtWithdraw"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.usdtWithdraw}
                          onChange={(e) => setFormData({ ...formData, usdtWithdraw: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cashWithdraw">Cash Withdraw ($)</Label>
                        <Input
                          id="cashWithdraw"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.cashWithdraw}
                          onChange={(e) => setFormData({ ...formData, cashWithdraw: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Client Incentives */}
                    <Card className="border-2">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-[#6a40ec]" />
                          Client Incentives
                          <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                          {clientIncentives.filter(ci => ci.amount > 0).length > 0 && (
                            <span className="text-sm bg-[#6a40ec] text-white px-2 py-1 rounded-full">
                              {clientIncentives.filter(ci => ci.amount > 0).length}
                            </span>
                          )}
                        </CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addClientIncentive}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Client
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {clientIncentives.map((incentive, index) => (
                          <div key={incentive.id} className="relative border border-gray-200 rounded-lg p-4">
                            {clientIncentives.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                onClick={() => removeClientIncentive(incentive.id)}
                              >
                                <MinusCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Client Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  placeholder="Enter client name"
                                  value={incentive.name}
                                  onChange={(e) => updateClientIncentive(incentive.id, 'name', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Incentive Amount ($) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={incentive.amount}
                                  onChange={(e) => updateClientIncentive(incentive.id, 'amount', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total Incentives Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-blue-900">Total Client Incentives:</span>
                            <span className="text-lg font-semibold text-blue-900">
                              ${clientIncentives.reduce((sum, ci) => sum + (ci.amount || 0), 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Company Expenses */}
                    <Card className="border-2">
                      <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-[#6a40ec]" />
                          Company Expenses
                          <span className="text-sm text-gray-500 font-normal">(Optional)</span>
                          {expenses.filter(exp => exp.amount > 0).length > 0 && (
                            <span className="text-sm bg-[#6a40ec] text-white px-2 py-1 rounded-full">
                              {expenses.filter(exp => exp.amount > 0).length}
                            </span>
                          )}
                        </CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addExpense}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Expense
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {expenses.map((expense, index) => (
                          <div key={expense.id} className="relative border border-gray-200 rounded-lg p-4">
                            {expenses.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                onClick={() => removeExpense(expense.id)}
                              >
                                <MinusCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Expense Type <span className="text-red-500">*</span>
                                  </Label>
                                  <Select 
                                    value={expense.type} 
                                    onValueChange={(value) => updateExpense(expense.id, 'type', value as any)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {expenseTypes.map((type) => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Amount ($) <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={expense.amount}
                                    onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Description</Label>
                                <Textarea
                                  placeholder="Optional description"
                                  value={expense.description || ''}
                                  onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total Expenses Summary */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-red-900">Total Company Expenses:</span>
                            <span className="text-lg font-semibold text-red-900">
                              ${expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-[#6a40ec] hover:bg-[#5a2fd9]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Adding...' : (editingDeposit ? 'Update Entry' : 'Add Entry')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
                </Dialog>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button disabled className="bg-gray-300 cursor-not-allowed">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Entry
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>You don't have permission to add deposit entries</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Dashboard Cards */}
        {(() => {
          const metrics = calculateDashboardMetrics(filteredDeposits);
          return (
            <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="group relative overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-white via-green-50/40 to-green-100/15 border border-green-200/60 hover:border-green-400/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                  <div className="flex-1">
                    <CardTitle className="text-xs font-semibold text-gray-700 leading-tight tracking-wide uppercase">
                      Total Deposits
                    </CardTitle>
                  </div>
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-green-400/15 via-green-400/20 to-green-400/25 rounded-lg shadow-sm border border-green-400/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <DollarSign className="h-4 w-4 text-green-600 drop-shadow-sm" />
                  </div>
                </CardHeader>
                <CardContent className="relative px-4 pb-4 pt-1">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600 tracking-tight leading-none">
                      ${metrics.totalDeposits.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-start">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-green-100 text-green-700 border border-green-200">
                        {metrics.entryCount} entries
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-white via-red-50/40 to-red-100/15 border border-red-200/60 hover:border-red-400/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-red-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                  <div className="flex-1">
                    <CardTitle className="text-xs font-semibold text-gray-700 leading-tight tracking-wide uppercase">
                      Total Withdrawals
                    </CardTitle>
                  </div>
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-red-400/15 via-red-400/20 to-red-400/25 rounded-lg shadow-sm border border-red-400/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <TrendingDown className="h-4 w-4 text-red-600 drop-shadow-sm" />
                  </div>
                </CardHeader>
                <CardContent className="relative px-4 pb-4 pt-1">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-red-600 tracking-tight leading-none">
                      ${metrics.totalWithdraws.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-start">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
                        Net: ${metrics.netDeposits.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-white via-blue-50/40 to-blue-100/15 border border-blue-200/60 hover:border-blue-400/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                  <div className="flex-1">
                    <CardTitle className="text-xs font-semibold text-gray-700 leading-tight tracking-wide uppercase">
                      Client Incentives (Optional)
                    </CardTitle>
                  </div>
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-400/15 via-blue-400/20 to-blue-400/25 rounded-lg shadow-sm border border-blue-400/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <UserPlus className="h-4 w-4 text-blue-600 drop-shadow-sm" />
                  </div>
                </CardHeader>
                <CardContent className="relative px-4 pb-4 pt-1">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600 tracking-tight leading-none">
                      ${metrics.totalClientIncentives.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-start">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-orange-100 text-orange-700 border border-orange-200">
                        Expenses: ${metrics.totalCompanyExpenses.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-white via-purple-50/40 to-[#6a40ec]/15 border border-purple-200/60 hover:border-[#6a40ec]/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-[#6a40ec]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                  <div className="flex-1">
                    <CardTitle className="text-xs font-semibold text-gray-700 leading-tight tracking-wide uppercase">
                      Net Profit
                    </CardTitle>
                  </div>
                  <div className="flex-shrink-0 p-2 bg-gradient-to-br from-[#6a40ec]/15 via-[#6a40ec]/20 to-[#6a40ec]/25 rounded-lg shadow-sm border border-[#6a40ec]/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                    <TrendingUp className="h-4 w-4 text-[#6a40ec] drop-shadow-sm" />
                  </div>
                </CardHeader>
                <CardContent className="relative px-4 pb-4 pt-1">
                  <div className="space-y-2">
                    <div className={`text-2xl font-bold tracking-tight leading-none ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${metrics.netProfit.toLocaleString()}
                    </div>
                    <div className="flex items-center justify-start">
                      <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                        metrics.netProfit >= 0 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {metrics.netProfit >= 0 ? 'Profit' : 'Loss'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search deposits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      {startDate || endDate ? (
                        `${startDate ? startDate.toLocaleDateString() : 'Start'} - ${endDate ? endDate.toLocaleDateString() : 'End'}`
                      ) : (
                        'Filter by date range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Start Date</Label>
                            <CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              className="rounded-md border"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">End Date</Label>
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              disabled={(date) => startDate ? date < startDate : false}
                              className="rounded-md border"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setStartDate(undefined);
                              setEndDate(undefined);
                            }}
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsDatePickerOpen(false);
                              if (startDate || endDate) {
                                toast.success('Date filter applied successfully');
                              }
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Select value={expenseTypeFilter} onValueChange={setExpenseTypeFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by expense type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Expense Types</SelectItem>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sort By */}
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (Highest)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Lowest)</SelectItem>
                    <SelectItem value="submitter-asc">Submitter (A-Z)</SelectItem>
                    <SelectItem value="submitter-desc">Submitter (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Staff Filter (only show for admins) */}
              {canViewAllEntries() && (
                <div>
                  <Select value={selectedStaffFilter} onValueChange={setSelectedStaffFilter}>
                    <SelectTrigger>
                      <User className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff Members</SelectItem>
                      {staff.filter(s => s.status === 'active').map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </Button>
                )}
                <span className="text-sm text-gray-500">
                  {filteredDeposits.length} of {deposits.length} entries
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit Entries</CardTitle>
            <CardDescription>All deposit entries showing submitter and grouped by date/staff (separate entries for same date)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Local Deposit</TableHead>
                    <TableHead>USDT Deposit</TableHead>
                    <TableHead>Cash Deposit</TableHead>
                    <TableHead>Local Withdraw</TableHead>
                    <TableHead>USDT Withdraw</TableHead>
                    <TableHead>Cash Withdraw</TableHead>
                    <TableHead>Total Balance</TableHead>
                    <TableHead>Client Incentive</TableHead>
                    <TableHead>Company Expense</TableHead>
                    <TableHead>Today's Balance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDeposits.map((deposit) => (
                    <TableRow
                      key={deposit.id}
                      className={`${dateColors[deposit.groupIndex % dateColors.length]} border-l-4`}
                    >
                      <TableCell className="font-medium">
                        {new Date(deposit.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {deposit.submittedByName}
                      </TableCell>
                      <TableCell>${deposit.localDeposit.toLocaleString()}</TableCell>
                      <TableCell>${deposit.usdtDeposit.toLocaleString()}</TableCell>
                      <TableCell>${deposit.cashDeposit.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">${deposit.localWithdraw.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">${deposit.usdtWithdraw.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">${deposit.cashWithdraw.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ${calculateTotalDeposit(deposit).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm cursor-help">
                              <div className="font-medium">
                                {deposit.clientIncentives.length === 1 
                                  ? deposit.clientIncentives[0].name 
                                  : `${deposit.clientIncentives.length} clients`}
                              </div>
                              <div className="text-gray-500">
                                ${calculateTotalIncentives(deposit).toLocaleString()}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {deposit.clientIncentives.map((ci, index) => (
                                <div key={index} className="text-sm">
                                  {ci.name}: ${ci.amount.toLocaleString()}
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm cursor-help">
                              <div className="font-medium">
                                {deposit.expenses.length === 1 
                                  ? deposit.expenses[0].type 
                                  : `${deposit.expenses.length} expenses`}
                              </div>
                              <div className="text-gray-500">
                                ${calculateTotalExpenses(deposit).toLocaleString()}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {deposit.expenses.map((exp, index) => (
                                <div key={index} className="text-sm">
                                  {exp.type}: ${exp.amount.toLocaleString()}
                                  {exp.description && <div className="text-xs text-gray-500">{exp.description}</div>}
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={calculateTodaysBalance(deposit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${calculateTodaysBalance(deposit).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {canEditDeposit(deposit) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(deposit)}
                                  className="text-[#6a40ec] hover:text-[#5a2fd9] hover:bg-[#6a40ec]/10"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit deposit entry</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className="text-gray-300 cursor-not-allowed"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {canViewAllEntries() ? "No edit permission" : "Can only edit your own entries"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {canDeleteDeposit(deposit) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(deposit.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete deposit entry</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className="text-gray-300 cursor-not-allowed"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {canViewAllEntries() ? "No delete permission" : "Can only delete your own entries"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {paginatedDeposits.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No deposit entries found matching your criteria.</p>
                </div>
              )}
            </div>
            
            {filteredDeposits.length > 0 && (
              <TablePagination
                totalItems={filteredDeposits.length}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPageState}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPageState(1);
                }}
              />
            )}
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog 
          open={deleteConfirmation.isOpen} 
          onOpenChange={(isOpen) => 
            setDeleteConfirmation({
              isOpen,
              deposit: null
            })
          }
        >
          <AlertDialogContent className="z-[100]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Delete Deposit Entry
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this deposit entry from {deleteConfirmation.deposit?.date}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteDeposit}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}