import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useDeleteConfirmation } from './use-delete-confirmation';
import { Switch } from './ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Plus, Building2, Trash2, Search, Filter, Calendar, X, User, Settings, Edit2, DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Wallet } from 'lucide-react';
import { useAdmin, type Bank, type BankTransaction } from './admin-context';
import { toast } from 'sonner@2.0.3';
import { TablePagination } from './table-pagination';

export function EnhancedBankDeposits() {
  const { 
    banks, 
    setBanks, 
    bankTransactions, 
    setBankTransactions, 
    getFilteredBankTransactions, 
    canViewAllEntries,
    isAdmin,
    user,
    staff,
    addActivity
  } = useAdmin();

  // Permission checks for current user
  const getCurrentUserPermissions = () => {
    if (!user) return null;
    const currentStaff = staff.find(s => s.id === user.id);
    return currentStaff?.permissions.bankDeposits || null;
  };

  const canEditTransaction = (transaction: BankTransaction) => {
    const permissions = getCurrentUserPermissions();
    if (!permissions) return false;
    
    // Admin can edit anything
    if (canViewAllEntries()) return permissions.edit;
    
    // Staff can only edit their own entries
    return permissions.edit && transaction.submittedBy === user?.id;
  };

  const canDeleteTransaction = (transaction: BankTransaction) => {
    const permissions = getCurrentUserPermissions();
    if (!permissions) return false;
    
    // Admin can delete anything
    if (canViewAllEntries()) return permissions.delete;
    
    // Staff can only delete their own entries
    return permissions.delete && transaction.submittedBy === user?.id;
  };

  const canAddTransaction = () => {
    const permissions = getCurrentUserPermissions();
    return permissions?.add || false;
  };

  const canAddBanks = () => {
    // Users with bank deposits add permission can add banks
    const permissions = getCurrentUserPermissions();
    return permissions?.add || false;
  };

  const canEditBanks = () => {
    // Only admins can edit banks
    return canViewAllEntries() && getCurrentUserPermissions()?.edit;
  };

  const canDeleteBanks = () => {
    // Only admins can delete banks
    return canViewAllEntries() && getCurrentUserPermissions()?.delete;
  };
  
  const { showConfirmation, DeleteConfirmationDialog } = useDeleteConfirmation();
  
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [isManageBanksMode, setIsManageBanksMode] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingBankName, setEditingBankName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bankFilter, setBankFilter] = useState('all');
  
  // Enhanced Date Range Filter State
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Employee Filter State
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date-desc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bankId: 'none',
    deposit: '',
    withdraw: '',
    pnl: '',
    remainingBalance: '',
    selectedStaff: user?.id || '', // For admin selecting on behalf of staff
  });

  // Edit transaction state
  const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [editTransactionForm, setEditTransactionForm] = useState({
    date: '',
    bankId: '',
    deposit: '',
    withdraw: '',
    pnl: '',
    remainingBalance: '',
    selectedStaff: '',
  });

  // Searchable dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate dashboard metrics for bank transactions
  const calculateBankMetrics = (transactions: BankTransaction[]) => {
    const totalDeposits = transactions.reduce((sum, transaction) => sum + transaction.deposit, 0);
    const totalWithdrawals = transactions.reduce((sum, transaction) => sum + transaction.withdraw, 0);
    const netBalance = totalDeposits - totalWithdrawals;
    const totalRemaining = transactions.reduce((sum, transaction) => sum + transaction.remaining, 0);
    
    // Calculate largest bank balance
    const bankBalances = banks.map(bank => {
      const bankTransactions = transactions.filter(t => t.bankId === bank.id);
      return {
        bankName: bank.name,
        balance: bankTransactions.length > 0 ? bankTransactions[bankTransactions.length - 1]?.remaining || 0 : 0
      };
    });
    
    const largestBalance = bankBalances.reduce((max, bank) => 
      bank.balance > max.balance ? bank : max, { bankName: 'N/A', balance: 0 }
    );
    
    return {
      totalDeposits,
      totalWithdrawals,
      netBalance,
      totalRemaining,
      activeBanks: banks.length,
      largestBalance,
      transactionCount: transactions.length
    };
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      date: new Date().toISOString().split('T')[0],
      bankId: 'none',
      deposit: '',
      withdraw: '',
      pnl: '',
      remainingBalance: '',
      selectedStaff: user?.id || '',
    });
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    const newBank: Bank = {
      id: Date.now().toString(),
      name: newBankName.trim(),
    };

    setBanks([...banks, newBank]);
    setNewBankName('');
    setIsBankDialogOpen(false);
    toast.success('Bank added successfully');
    
    // Add activity
    await addActivity(
      'Bank added',
      'success',
      `Added new bank: ${newBankName}`
    );
  };

  const handleDeleteBank = async (bankId: string) => {
    const bankToDelete = banks.find(b => b.id === bankId);
    if (!bankToDelete) return;

    // Check if bank has transactions
    const hasTransactions = bankTransactions.some(t => t.bankId === bankId);
    if (hasTransactions) {
      toast.error(`Cannot delete ${bankToDelete.name} as it has existing transactions`);
      return;
    }

    // Show confirmation dialog
    showConfirmation({
      title: 'Delete Bank',
      description: `Are you sure you want to delete "${bankToDelete.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        setBanks(banks.filter(b => b.id !== bankId));
        toast.success(`${bankToDelete.name} deleted successfully`);
        
        // Add activity
        await addActivity(
          'Bank deleted',
          'warning',
          `Deleted bank: ${bankToDelete.name}`
        );
      }
    });
  };



  const handleEditBank = (bank: Bank) => {
    setEditingBankId(bank.id);
    setEditingBankName(bank.name);
  };

  const handleSaveEdit = async (bankId: string) => {
    if (!editingBankName.trim()) {
      toast.error('Bank name cannot be empty');
      return;
    }

    // Check if name already exists (excluding current bank)
    const nameExists = banks.some(b => b.id !== bankId && b.name.toLowerCase() === editingBankName.trim().toLowerCase());
    if (nameExists) {
      toast.error('A bank with this name already exists');
      return;
    }

    setBanks(banks.map(b => 
      b.id === bankId 
        ? { ...b, name: editingBankName.trim() }
        : b
    ));
    
    setEditingBankId(null);
    setEditingBankName('');
    toast.success('Bank name updated successfully');
    
    // Add activity
    await addActivity(
      'Bank updated',
      'info',
      `Updated bank name to: ${editingBankName}`
    );
  };

  const handleCancelEdit = () => {
    setEditingBankId(null);
    setEditingBankName('');
  };

  // Filter Helper Functions
  const handleQuickDateFilter = (type: string) => {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    
    switch (type) {
      case 'today':
        setDateFilter({ startDate: currentDate, endDate: currentDate });
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setDateFilter({ startDate: yesterdayStr, endDate: yesterdayStr });
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setDateFilter({ 
          startDate: startOfWeek.toISOString().split('T')[0], 
          endDate: currentDate 
        });
        break;
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        setDateFilter({ 
          startDate: lastWeekStart.toISOString().split('T')[0], 
          endDate: lastWeekEnd.toISOString().split('T')[0] 
        });
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateFilter({ 
          startDate: startOfMonth.toISOString().split('T')[0], 
          endDate: currentDate 
        });
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setDateFilter({ 
          startDate: lastMonthStart.toISOString().split('T')[0], 
          endDate: lastMonthEnd.toISOString().split('T')[0] 
        });
        break;
    }
  };

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
  };

  const clearAllFilters = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setSelectedEmployee('all');
    setBankFilter('all');
    setSearchTerm('');
    setSortBy('date-desc');
  };

  const calculateRemaining = (bankId: string, currentDate: string, newDeposit: number, newWithdraw: number) => {
    const previousTransactions = bankTransactions.filter(t => 
      t.bankId === bankId && t.date <= currentDate
    );
    const totalPreviousDeposits = previousTransactions.reduce((sum, t) => sum + t.deposit, 0);
    const totalPreviousWithdraws = previousTransactions.reduce((sum, t) => sum + t.withdraw, 0);
    return totalPreviousDeposits - totalPreviousWithdraws + newDeposit - newWithdraw;
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.bankId || transactionForm.bankId === 'none') {
      toast.error('Please select a bank');
      return;
    }

    const deposit = parseFloat(transactionForm.deposit) || 0;
    const withdraw = parseFloat(transactionForm.withdraw) || 0;
    const pnl = parseFloat(transactionForm.pnl) || 0;
    const remainingBalance = parseFloat(transactionForm.remainingBalance) || calculateRemaining(transactionForm.bankId, transactionForm.date, deposit, withdraw);

    // Determine who is submitting this transaction
    let submittedBy = user?.id || '';
    let submittedByName = user?.name || '';
    
    // If admin is creating on behalf of another staff member
    if (isAdmin() && transactionForm.selectedStaff && transactionForm.selectedStaff !== user?.id) {
      const selectedStaffMember = staff.find(s => s.id === transactionForm.selectedStaff);
      if (selectedStaffMember) {
        submittedBy = selectedStaffMember.id;
        submittedByName = selectedStaffMember.name;
      }
    }

    const newTransaction: BankTransaction = {
      id: Date.now().toString(),
      date: transactionForm.date,
      bankId: transactionForm.bankId,
      deposit,
      withdraw,
      pnl: pnl !== 0 ? pnl : undefined,
      remaining: remainingBalance,
      remainingBalance: remainingBalance,
      submittedBy,
      submittedByName,
    };

    setBankTransactions([...bankTransactions, newTransaction]);
    resetTransactionForm();
    setIsTransactionDialogOpen(false);
    toast.success('Transaction added successfully');
    
    // Add activity
    await addActivity(
      'Bank transaction added',
      'success',
      `Added transaction: ${deposit > 0 ? `Deposit ${deposit}` : `Withdrawal ${withdraw}`} for bank ${bankId}`
    );
  };





  const setCurrentPageState = (page: number) => {
    setCurrentPage(page);
  };

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bankId: string) => {
    setTransactionForm({ ...transactionForm, bankId });
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleDeleteTransaction = async (id: string) => {
    const transactionToDelete = bankTransactions.find(t => t.id === id);
    if (!transactionToDelete) return;

    const bank = banks.find(b => b.id === transactionToDelete.bankId);
    const bankName = bank?.name || 'Unknown Bank';

    // Show confirmation dialog
    showConfirmation({
      title: 'Delete Transaction',
      description: `Are you sure you want to delete this transaction from ${bankName}? This action cannot be undone.`,
      onConfirm: async () => {
        setBankTransactions(bankTransactions.filter(t => t.id !== transactionToDelete.id));
        toast.success('Transaction deleted successfully');
        
        // Add activity
        await addActivity(
          'Bank transaction deleted',
          'warning',
          `Deleted transaction: ${transactionToDelete.deposit > 0 ? `Deposit ${transactionToDelete.deposit}` : `Withdrawal ${transactionToDelete.withdraw}`} for bank ${transactionToDelete.bankId}`
        );
      }
    });
  };



  const handleEditTransaction = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setEditTransactionForm({
      date: transaction.date,
      bankId: transaction.bankId,
      deposit: transaction.deposit.toString(),
      withdraw: transaction.withdraw.toString(),
      pnl: transaction.pnl !== undefined && transaction.pnl !== null ? transaction.pnl.toString() : '',
      remainingBalance: (transaction.remainingBalance || transaction.remaining || 0).toString(),
      selectedStaff: transaction.submittedBy,
    });
    setIsEditTransactionDialogOpen(true);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    if (!editTransactionForm.bankId || editTransactionForm.bankId === 'none') {
      toast.error('Please select a bank');
      return;
    }

    const deposit = parseFloat(editTransactionForm.deposit) || 0;
    const withdraw = parseFloat(editTransactionForm.withdraw) || 0;
    const pnl = parseFloat(editTransactionForm.pnl) || 0;
    
    // Use provided remaining balance or recalculate
    const remainingBalance = parseFloat(editTransactionForm.remainingBalance) || calculateRemaining(editTransactionForm.bankId, editTransactionForm.date, deposit, withdraw);

    // Determine who is submitting this transaction
    let submittedBy = editTransactionForm.selectedStaff;
    let submittedByName = '';
    
    if (submittedBy === user?.id) {
      submittedByName = user?.name || '';
    } else {
      const selectedStaffMember = staff.find(s => s.id === submittedBy);
      submittedByName = selectedStaffMember?.name || '';
    }

    const updatedTransaction: BankTransaction = {
      ...editingTransaction,
      date: editTransactionForm.date,
      bankId: editTransactionForm.bankId,
      deposit,
      withdraw,
      pnl: pnl !== 0 ? pnl : undefined,
      remaining: remainingBalance,
      remainingBalance: remainingBalance,
      submittedBy,
      submittedByName,
    };

    setBankTransactions(bankTransactions.map(t => 
      t.id === editingTransaction.id ? updatedTransaction : t
    ));
    
    setIsEditTransactionDialogOpen(false);
    setEditingTransaction(null);
    toast.success('Transaction updated successfully');
    
    // Add activity
    await addActivity(
      'Bank transaction updated',
      'info',
      `Updated transaction: ${deposit > 0 ? `Deposit ${deposit}` : `Withdrawal ${withdraw}`} for bank ${editTransactionForm.bankId}`
    );
  };

  const resetEditTransactionForm = () => {
    setEditTransactionForm({
      date: '',
      bankId: '',
      deposit: '',
      withdraw: '',
      pnl: '',
      remainingBalance: '',
      selectedStaff: '',
    });
    setEditingTransaction(null);
  };

  // Enhanced Filtering Logic with Sorting
  const filteredTransactions = useMemo(() => {
    let filtered = getFilteredBankTransactions();

    // Apply date range filter
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = transaction.date;
        const matchesStartDate = !dateFilter.startDate || transactionDate >= dateFilter.startDate;
        const matchesEndDate = !dateFilter.endDate || transactionDate <= dateFilter.endDate;
        return matchesStartDate && matchesEndDate;
      });
    }

    // Apply employee filter (only for admins)
    if (canViewAllEntries() && selectedEmployee !== 'all') {
      filtered = filtered.filter(transaction => transaction.submittedBy === selectedEmployee);
    }

    // Apply bank filter
    if (bankFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.bankId === bankFilter);
    }

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => {
        const bank = banks.find(b => b.id === transaction.bankId);
        const submitterName = transaction.submittedByName || '';
        return (
          bank?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.deposit.toString().includes(searchTerm) ||
          transaction.withdraw.toString().includes(searchTerm) ||
          transaction.date.includes(searchTerm) ||
          (transaction.remainingBalance || transaction.remaining || 0).toString().includes(searchTerm)
        );
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'deposit-desc':
          return b.deposit - a.deposit;
        case 'deposit-asc':
          return a.deposit - b.deposit;
        case 'withdraw-desc':
          return b.withdraw - a.withdraw;
        case 'withdraw-asc':
          return a.withdraw - b.withdraw;
        case 'remaining-desc':
          return (b.remainingBalance || b.remaining || 0) - (a.remainingBalance || a.remaining || 0);
        case 'remaining-asc':
          return (a.remainingBalance || a.remaining || 0) - (b.remainingBalance || b.remaining || 0);
        case 'bank-asc':
          const bankA = banks.find(bank => bank.id === a.bankId)?.name || '';
          const bankB = banks.find(bank => bank.id === b.bankId)?.name || '';
          return bankA.localeCompare(bankB);
        case 'bank-desc':
          const bankA2 = banks.find(bank => bank.id === a.bankId)?.name || '';
          const bankB2 = banks.find(bank => bank.id === b.bankId)?.name || '';
          return bankB2.localeCompare(bankA2);
        default:
          return 0;
      }
    });
  }, [
    bankTransactions, 
    dateFilter, 
    selectedEmployee, 
    bankFilter,
    searchTerm, 
    sortBy,
    banks, 
    canViewAllEntries,
    getFilteredBankTransactions
  ]);

  // Calculate metrics based on filtered transactions
  const metrics = useMemo(() => {
    const totalDeposits = filteredTransactions.reduce((sum, t) => sum + t.deposit, 0);
    const totalWithdrawals = filteredTransactions.reduce((sum, t) => sum + t.withdraw, 0);
    const netBalance = totalDeposits - totalWithdrawals;
    const totalRemaining = filteredTransactions.reduce((sum, t) => sum + (t.remainingBalance || t.remaining || 0), 0);
    
    // Calculate largest bank balance
    const bankBalances = banks.map(bank => {
      const bankTransactions = filteredTransactions.filter(t => t.bankId === bank.id);
      return {
        bankName: bank.name,
        balance: bankTransactions.length > 0 ? bankTransactions[bankTransactions.length - 1]?.remaining || bankTransactions[bankTransactions.length - 1]?.remainingBalance || 0 : 0
      };
    });
    
    const largestBalance = bankBalances.reduce((max, bank) => 
      bank.balance > max.balance ? bank : max, { bankName: 'N/A', balance: 0 }
    );

    return {
      totalDeposits,
      totalWithdrawals,
      netBalance,
      totalRemaining,
      activeBanks: banks.length,
      largestBalance,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, banks]);

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return (
      dateFilter.startDate !== '' ||
      dateFilter.endDate !== '' ||
      selectedEmployee !== 'all' ||
      bankFilter !== 'all' ||
      searchTerm !== '' ||
      sortBy !== 'date-desc'
    );
  }, [dateFilter, selectedEmployee, bankFilter, searchTerm, sortBy]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bank Deposits Management</CardTitle>
              <CardDescription>
                Track bank deposits and withdrawals with detailed transaction history
                {!canViewAllEntries() && (
                  <span className="block text-sm text-blue-600 mt-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Showing only your transactions
                  </span>
                )}
              </CardDescription>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-2">
              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {dateFilter.startDate && dateFilter.endDate
                        ? `${format(new Date(dateFilter.startDate), 'MMM dd')} - ${format(new Date(dateFilter.endDate), 'MMM dd')}`
                        : 'Date Range'
                      }
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Quick Filters</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickDateFilter('today')}
                        className="text-xs"
                      >
                        Today
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickDateFilter('yesterday')}
                        className="text-xs"
                      >
                        Yesterday
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickDateFilter('thisWeek')}
                        className="text-xs"
                      >
                        This Week
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickDateFilter('lastWeek')}
                        className="text-xs"
                      >
                        Last Week
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickDateFilter('thisMonth')}
                        className="text-xs"
                      >
                        This Month
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickDateFilter('lastMonth')}
                        className="text-xs"
                      >
                        Last Month
                      </Button>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-3">Custom Date Range</div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <Label className="text-xs mb-2 font-medium">From Date</Label>
                          <CalendarComponent
                            mode="single"
                            selected={dateFilter.startDate ? new Date(dateFilter.startDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = date.toISOString().split('T')[0];
                                setDateFilter(prev => ({ ...prev, startDate: formattedDate }));
                              } else {
                                setDateFilter(prev => ({ ...prev, startDate: '' }));
                              }
                            }}
                            className="rounded-md border"
                            disabled={(date) => date > new Date()}
                          />
                        </div>
                        <div className="flex flex-col items-center">
                          <Label className="text-xs mb-2 font-medium">To Date</Label>
                          <CalendarComponent
                            mode="single"
                            selected={dateFilter.endDate ? new Date(dateFilter.endDate) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = date.toISOString().split('T')[0];
                                setDateFilter(prev => ({ ...prev, endDate: formattedDate }));
                              } else {
                                setDateFilter(prev => ({ ...prev, endDate: '' }));
                              }
                            }}
                            className="rounded-md border"
                            disabled={(date) => {
                              if (dateFilter.startDate) {
                                return date < new Date(dateFilter.startDate) || date > new Date();
                              }
                              return date > new Date();
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearDateFilter}
                        className="text-xs"
                      >
                        Clear Range
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {/* Close popover */}}
                        className="bg-[#6a40ec] hover:bg-[#5a2fd9] text-xs"
                      >
                        Apply Filter
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Employee Filter - Only for Admins */}
              {canViewAllEntries() && (
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-48">
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
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All</span>
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              {canAddBanks() && (
                <Dialog open={isBankDialogOpen} onOpenChange={(open) => {
                  setIsBankDialogOpen(open);
                  if (open) {
                    setIsManageBanksMode(false); // Reset to add mode when opening
                  setNewBankName(''); // Clear form
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Building2 className="w-4 h-4 mr-2" />
                    Add Bank
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {canEditBanks() && isManageBanksMode ? 'Manage Banks' : 'Add New Bank'}
                    </DialogTitle>
                    <DialogDescription>
                      {canEditBanks() && isManageBanksMode 
                        ? 'View and manage existing banks' 
                        : 'Add a new bank to the system'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Switch between Add and Manage modes - only for admins */}
                  {canEditBanks() && (
                    <div className="flex items-center space-x-3 py-4 border-b">
                      <Label htmlFor="manage-mode" className="text-sm font-medium">
                        {isManageBanksMode ? 'Manage Banks' : 'Add Bank'}
                      </Label>
                      <Switch
                        id="manage-mode"
                        checked={isManageBanksMode}
                        onCheckedChange={setIsManageBanksMode}
                      />
                      <Settings className="w-4 h-4 text-gray-500" />
                    </div>
                  )}

                  {(!canEditBanks() || !isManageBanksMode) ? (
                    <form onSubmit={handleAddBank} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          placeholder="Enter bank name"
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsBankDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-[#6a40ec] hover:bg-[#5a2fd9]">
                          Add Bank
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Total Banks: {banks.length}
                      </div>
                      
                      {/* Show existing banks list for reference */}
                      {banks.length > 0 && (
                        <div className="max-h-60 overflow-y-auto border rounded-lg bg-gray-50">
                          <div className="p-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Existing Banks:</div>
                            <div className="space-y-1">
                              {banks.map((bank) => {
                                const transactionCount = bankTransactions.filter(t => t.bankId === bank.id).length;
                                return (
                                  <div key={bank.id} className="flex justify-between items-center py-1 px-2 bg-white rounded border text-sm">
                                    <span className="font-medium">{bank.name}</span>
                                    <span className="text-gray-500">
                                      {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Full management interface for admins */}
                      {canEditBanks() && (
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Bank Name</TableHead>
                                <TableHead>Transactions</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {banks.map((bank) => {
                                const transactionCount = bankTransactions.filter(t => t.bankId === bank.id).length;
                                const canDelete = transactionCount === 0;
                                const isEditing = editingBankId === bank.id;
                                
                                return (
                                  <TableRow key={bank.id}>
                                    <TableCell className="font-medium">
                                      {isEditing ? (
                                        <div className="flex items-center space-x-2">
                                          <Input
                                            value={editingBankName}
                                            onChange={(e) => setEditingBankName(e.target.value)}
                                            className="h-8"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit(bank.id);
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveEdit(bank.id)}
                                            className="h-8 px-2 bg-[#6a40ec] hover:bg-[#5a2fd9]"
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            className="h-8 px-2"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      ) : (
                                        bank.name
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                      {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                                    </TableCell>
                                    <TableCell>
                                      {!isEditing && (
                                        <div className="flex items-center space-x-1">
                                          {canEditBanks() && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditBank(bank)}
                                              className="text-[#6a40ec] hover:text-[#5a2fd9] hover:bg-[#6a40ec]/10"
                                              title="Edit bank name"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </Button>
                                          )}
                                          {canDeleteBanks() && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteBank(bank.id)}
                                              disabled={!canDelete}
                                              className={canDelete ? "text-red-600 hover:text-red-800" : "text-gray-400 cursor-not-allowed"}
                                              title={canDelete ? "Delete bank" : "Cannot delete bank with existing transactions"}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                          {banks.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              No banks found. Switch to Add mode to create your first bank.
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsBankDialogOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              )}

              {canAddTransaction() ? (
                <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#6a40ec] hover:bg-[#5a2fd9]" onClick={resetTransactionForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Bank Transaction</DialogTitle>
                    <DialogDescription>Record a new deposit or withdrawal</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={transactionForm.date}
                          onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                          required
                        />
                      </div>
                      
                      {/* Staff Selection (only for admins) */}
                      {isAdmin() && (
                        <div>
                          <Label htmlFor="selectedStaff">Submit on behalf of</Label>
                          <Select 
                            value={transactionForm.selectedStaff} 
                            onValueChange={(value) => setTransactionForm({ ...transactionForm, selectedStaff: value })}
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
                    </div>

                    <div>
                      <Label htmlFor="bank">Bank</Label>
                      <div className="relative">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full justify-between"
                        >
                          {transactionForm.bankId === 'none' 
                            ? 'Select a bank...' 
                            : banks.find(b => b.id === transactionForm.bankId)?.name || 'Select a bank...'}
                          <Building2 className="ml-2 h-4 w-4" />
                        </Button>
                        
                        {isDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            <div className="p-2">
                              <Input
                                placeholder="Search banks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {filteredBanks.length > 0 ? (
                                filteredBanks.map((bank) => (
                                  <Button
                                    key={bank.id}
                                    variant="ghost"
                                    className="w-full justify-start text-left"
                                    onClick={() => handleBankSelect(bank.id)}
                                  >
                                    {bank.name}
                                  </Button>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500">No banks found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="deposit">Deposit Amount ($)</Label>
                        <Input
                          id="deposit"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={transactionForm.deposit}
                          onChange={(e) => {
                            const depositValue = e.target.value;
                            const depositAmount = parseFloat(depositValue || '0');
                            const withdrawAmount = parseFloat(transactionForm.withdraw || '0');
                            const pnlAmount = parseFloat(transactionForm.pnl || '0');
                            
                            // Calculate remaining balance: Deposit - Withdraw + P&L
                            const newBalance = depositAmount - withdrawAmount + pnlAmount;
                            
                            setTransactionForm({ 
                              ...transactionForm, 
                              deposit: depositValue,
                              remainingBalance: newBalance.toFixed(2)
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="withdraw">Withdraw Amount ($)</Label>
                        <Input
                          id="withdraw"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={transactionForm.withdraw}
                          onChange={(e) => {
                            const withdrawValue = e.target.value;
                            const depositAmount = parseFloat(transactionForm.deposit || '0');
                            const withdrawAmount = parseFloat(withdrawValue || '0');
                            const pnlAmount = parseFloat(transactionForm.pnl || '0');
                            
                            // Calculate remaining balance: Deposit - Withdraw + P&L
                            const newBalance = depositAmount - withdrawAmount + pnlAmount;
                            
                            setTransactionForm({ 
                              ...transactionForm, 
                              withdraw: withdrawValue,
                              remainingBalance: newBalance.toFixed(2)
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pnl">
                          <div className="flex items-center space-x-2">
                            <span>P&L Amount ($)</span>
                            <div className="group relative">
                              <TrendingUp className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                                Enter with + or - to auto-calculate balance
                              </div>
                            </div>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="pnl"
                            type="text"
                            placeholder="+150.00 or -75.50"
                            value={transactionForm.pnl || ''}
                            onChange={(e) => {
                              const pnlValue = e.target.value;
                              const depositAmount = parseFloat(transactionForm.deposit || '0');
                              const withdrawAmount = parseFloat(transactionForm.withdraw || '0');
                              const pnlAmount = parseFloat(pnlValue || '0');
                              
                              // Calculate remaining balance: Deposit - Withdraw + P&L
                              const newBalance = depositAmount - withdrawAmount + pnlAmount;
                              
                              setTransactionForm({ 
                                ...transactionForm, 
                                pnl: pnlValue,
                                remainingBalance: newBalance.toFixed(2)
                              });
                            }}
                            className={`pr-12 ${
                              transactionForm.pnl && !isNaN(parseFloat(transactionForm.pnl)) 
                                ? parseFloat(transactionForm.pnl) >= 0 
                                  ? 'border-green-300 focus:border-green-500' 
                                  : 'border-red-300 focus:border-red-500'
                                : ''
                            }`}
                          />
                          {transactionForm.pnl && !isNaN(parseFloat(transactionForm.pnl)) && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {parseFloat(transactionForm.pnl) >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Use + for profit, - for loss (e.g., +100 or -50)
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="remainingBalance">
                          <div className="flex items-center space-x-2">
                            <span>Remaining Balance ($)</span>
                            <div className="group relative">
                              <Wallet className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                                Auto-calculated: Deposit - Withdraw + P&L
                              </div>
                            </div>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="remainingBalance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={transactionForm.remainingBalance}
                            readOnly
                            className={`bg-gray-50 cursor-not-allowed ${
                              transactionForm.remainingBalance && parseFloat(transactionForm.remainingBalance) < 0
                                ? 'border-red-300 text-red-600'
                                : transactionForm.remainingBalance && parseFloat(transactionForm.remainingBalance) > 0
                                ? 'border-green-300 text-green-600'
                                : ''
                            }`}
                          />
                          {transactionForm.remainingBalance && parseFloat(transactionForm.remainingBalance) !== 0 && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {parseFloat(transactionForm.remainingBalance) >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Auto-calculated: Deposit - Withdraw + P&L
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#6a40ec] hover:bg-[#5a2fd9]">
                        Add Transaction
                      </Button>
                    </div>
                  </form>
                </DialogContent>
                </Dialog>
              ) : (
                <Button disabled className="bg-gray-300 cursor-not-allowed">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              )}

              {/* Edit Transaction Dialog */}
              <Dialog open={isEditTransactionDialogOpen} onOpenChange={(open) => {
                setIsEditTransactionDialogOpen(open);
                if (!open) {
                  resetEditTransactionForm();
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Bank Transaction</DialogTitle>
                    <DialogDescription>Update transaction details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateTransaction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-date">Date</Label>
                        <Input
                          id="edit-date"
                          type="date"
                          value={editTransactionForm.date}
                          onChange={(e) => setEditTransactionForm({ ...editTransactionForm, date: e.target.value })}
                          required
                        />
                      </div>
                      
                      {/* Staff Selection (only for admins) */}
                      {isAdmin() && (
                        <div>
                          <Label htmlFor="edit-selectedStaff">Submitted by</Label>
                          <Select 
                            value={editTransactionForm.selectedStaff} 
                            onValueChange={(value) => setEditTransactionForm({ ...editTransactionForm, selectedStaff: value })}
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
                    </div>

                    <div>
                      <Label htmlFor="edit-bank">Bank</Label>
                      <Select 
                        value={editTransactionForm.bankId} 
                        onValueChange={(value) => setEditTransactionForm({ ...editTransactionForm, bankId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-deposit">Deposit Amount ($)</Label>
                        <Input
                          id="edit-deposit"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={editTransactionForm.deposit}
                          onChange={(e) => {
                            const depositValue = e.target.value;
                            const depositAmount = parseFloat(depositValue || '0');
                            const withdrawAmount = parseFloat(editTransactionForm.withdraw || '0');
                            const pnlAmount = parseFloat(editTransactionForm.pnl || '0');
                            
                            // Calculate remaining balance: Deposit - Withdraw + P&L
                            const newBalance = depositAmount - withdrawAmount + pnlAmount;
                            
                            setEditTransactionForm({ 
                              ...editTransactionForm, 
                              deposit: depositValue,
                              remainingBalance: newBalance.toFixed(2)
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-withdraw">Withdraw Amount ($)</Label>
                        <Input
                          id="edit-withdraw"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={editTransactionForm.withdraw}
                          onChange={(e) => {
                            const withdrawValue = e.target.value;
                            const depositAmount = parseFloat(editTransactionForm.deposit || '0');
                            const withdrawAmount = parseFloat(withdrawValue || '0');
                            const pnlAmount = parseFloat(editTransactionForm.pnl || '0');
                            
                            // Calculate remaining balance: Deposit - Withdraw + P&L
                            const newBalance = depositAmount - withdrawAmount + pnlAmount;
                            
                            setEditTransactionForm({ 
                              ...editTransactionForm, 
                              withdraw: withdrawValue,
                              remainingBalance: newBalance.toFixed(2)
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-pnl">
                          <div className="flex items-center space-x-2">
                            <span>P&L Amount ($)</span>
                            <div className="group relative">
                              <TrendingUp className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                                Enter with + or - to auto-calculate balance
                              </div>
                            </div>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="edit-pnl"
                            type="text"
                            placeholder="+150.00 or -75.50"
                            value={editTransactionForm.pnl || ''}
                            onChange={(e) => {
                              const pnlValue = e.target.value;
                              const depositAmount = parseFloat(editTransactionForm.deposit || '0');
                              const withdrawAmount = parseFloat(editTransactionForm.withdraw || '0');
                              const pnlAmount = parseFloat(pnlValue || '0');
                              
                              // Calculate remaining balance: Deposit - Withdraw + P&L
                              const newBalance = depositAmount - withdrawAmount + pnlAmount;
                              
                              setEditTransactionForm({ 
                                ...editTransactionForm, 
                                pnl: pnlValue,
                                remainingBalance: newBalance.toFixed(2)
                              });
                            }}
                            className={`pr-12 ${
                              editTransactionForm.pnl && !isNaN(parseFloat(editTransactionForm.pnl)) 
                                ? parseFloat(editTransactionForm.pnl) >= 0 
                                  ? 'border-green-300 focus:border-green-500' 
                                  : 'border-red-300 focus:border-red-500'
                                : ''
                            }`}
                          />
                          {editTransactionForm.pnl && !isNaN(parseFloat(editTransactionForm.pnl)) && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {parseFloat(editTransactionForm.pnl) >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Use + for profit, - for loss (e.g., +100 or -50)
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="edit-remainingBalance">
                          <div className="flex items-center space-x-2">
                            <span>Remaining Balance ($)</span>
                            <div className="group relative">
                              <Wallet className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="invisible group-hover:visible absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-50">
                                Auto-calculated: Deposit - Withdraw + P&L
                              </div>
                            </div>
                          </div>
                        </Label>
                        <div className="relative">
                          <Input
                            id="edit-remainingBalance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={editTransactionForm.remainingBalance}
                            readOnly
                            className={`bg-gray-50 cursor-not-allowed ${
                              editTransactionForm.remainingBalance && parseFloat(editTransactionForm.remainingBalance) < 0
                                ? 'border-red-300 text-red-600'
                                : editTransactionForm.remainingBalance && parseFloat(editTransactionForm.remainingBalance) > 0
                                ? 'border-green-300 text-green-600'
                                : ''
                            }`}
                          />
                          {editTransactionForm.remainingBalance && parseFloat(editTransactionForm.remainingBalance) !== 0 && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {parseFloat(editTransactionForm.remainingBalance) >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Auto-calculated: Deposit - Withdraw + P&L
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditTransactionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#6a40ec] hover:bg-[#5a2fd9]">
                        Update Transaction
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard Cards */}
      {(() => {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {metrics.transactionCount} transactions
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
                    ${metrics.totalWithdrawals.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-start">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
                      Net: ${metrics.netBalance.toLocaleString()}
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
                    Total Bank Balance
                  </CardTitle>
                </div>
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-400/15 via-blue-400/20 to-blue-400/25 rounded-lg shadow-sm border border-blue-400/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                  <Wallet className="h-4 w-4 text-blue-600 drop-shadow-sm" />
                </div>
              </CardHeader>
              <CardContent className="relative px-4 pb-4 pt-1">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600 tracking-tight leading-none">
                    ${metrics.totalRemaining.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-start">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-blue-100 text-blue-700 border border-blue-200">
                      Across {metrics.activeBanks} banks
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
                    Largest Bank
                  </CardTitle>
                </div>
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-[#6a40ec]/15 via-[#6a40ec]/20 to-[#6a40ec]/25 rounded-lg shadow-sm border border-[#6a40ec]/20 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="h-4 w-4 text-[#6a40ec] drop-shadow-sm" />
                </div>
              </CardHeader>
              <CardContent className="relative px-4 pb-4 pt-1">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-[#6a40ec] tracking-tight leading-none">
                    ${metrics.largestBalance.balance.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-start">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-purple-100 text-purple-700 border border-purple-200">
                      {metrics.largestBalance.bankName}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}




      {/* Enhanced Filtering and Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filters & Search</span>
            <div className="text-sm text-gray-500">
              Showing {filteredTransactions.length} of {getFilteredBankTransactions().length} transactions
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search Input */}
            <div className="flex-1 min-w-[250px]">
              <Label>Search Transactions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by bank, amount, submitter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Bank Filter */}
            <div>
              <Label>Filter by Bank</Label>
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="w-48">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Banks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="deposit-desc">Deposit (Highest)</SelectItem>
                  <SelectItem value="deposit-asc">Deposit (Lowest)</SelectItem>
                  <SelectItem value="withdraw-desc">Withdraw (Highest)</SelectItem>
                  <SelectItem value="withdraw-asc">Withdraw (Lowest)</SelectItem>
                  <SelectItem value="remaining-desc">Balance (Highest)</SelectItem>
                  <SelectItem value="remaining-asc">Balance (Lowest)</SelectItem>
                  <SelectItem value="bank-asc">Bank (A-Z)</SelectItem>
                  <SelectItem value="bank-desc">Bank (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Staff Filter (only show for admins) */}
            {canViewAllEntries() && (
              <div>
                <Label>Filter by Staff</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-48">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Staff" />
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

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Transactions</CardTitle>
          <CardDescription>All bank transactions showing submitter information and transaction details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Withdraw</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction, index) => {
                  const bank = banks.find(b => b.id === transaction.bankId);
                  const isEven = index % 2 === 0;
                  const pnlValue = transaction.pnl || 0;
                  return (
                    <TableRow
                      key={transaction.id}
                      className={isEven ? 'bg-gray-50' : 'bg-white'}
                    >
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {transaction.submittedByName}
                      </TableCell>
                      <TableCell className="font-medium">
                        {bank?.name || 'Unknown Bank'}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {transaction.deposit > 0 ? `${transaction.deposit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {transaction.withdraw > 0 ? `${transaction.withdraw.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {transaction.pnl !== undefined && transaction.pnl !== null ? (
                            <>
                              <span className={transaction.pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {transaction.pnl >= 0 ? '+' : ''}${Math.abs(transaction.pnl).toLocaleString()}
                              </span>
                              {transaction.pnl > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : transaction.pnl < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              ) : null}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={transaction.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${transaction.remaining.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-[#6a40ec] hover:text-[#5a2fd9] hover:bg-[#6a40ec]/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {paginatedTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No bank transactions found matching your criteria.</p>
              </div>
            )}
          </div>
          
          {filteredTransactions.length > 0 && (
            <TablePagination
              totalItems={filteredTransactions.length}
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
      <DeleteConfirmationDialog />
    </div>
  );
}