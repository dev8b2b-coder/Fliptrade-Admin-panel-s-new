import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Building2, Trash2, Search, Filter, Calendar, X, Edit, Eye } from 'lucide-react';
import { useAdmin, type Bank, type BankTransaction } from './admin-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ApiService from '../services/api';
import { toast } from 'sonner';
import { TablePagination } from './table-pagination';

export function BankDepositsPage() {
  const { 
    banks, 
    setBanks, 
    bankTransactions, 
    setBankTransactions, 
    getFilteredBankTransactions, 
    canViewAllEntries,
    user,
    refreshAllData,
    addActivity
  } = useAdmin();

  // Check if user can edit/delete bank transactions
  const canEditBankTransactions = user?.role === 'Super Admin' || user?.role === 'Admin' || 
    (user?.permissions?.bankDeposits?.edit === true);
  const canDeleteBankTransactions = user?.role === 'Super Admin' || user?.role === 'Admin' || 
    (user?.permissions?.bankDeposits?.delete === true);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeletingTransaction, setIsDeletingTransaction] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    transaction: BankTransaction | null;
  }>({
    isOpen: false,
    transaction: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bankId: 'none',
    deposit: '',
    withdraw: '',
    pnlType: 'profit',
    hissabAmount: '',
  });

  // Store custom amount per transaction id for display in table
  // Removed client-only map; pnl now persisted in DB via `pnl` column

  // Searchable dropdown state
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    setIsAddingBank(true);
    try {
      const bankId = crypto.randomUUID();
      
      if (isSupabaseConfigured) {
        // Save to Supabase database using API service
        const bankData = await ApiService.createBank({
          name: newBankName.trim(),
          is_active: true,
        });
        
        toast.success(`Bank "${bankData.name}" added successfully!`);
        
        // Add activity
        await addActivity(
          'Bank added',
          'success',
          `Added new bank: ${bankData.name}`
        );
        
        setNewBankName('');
        setIsBankDialogOpen(false);
        
        // Refresh data
        await refreshAllData();
        
      } else {
        // Fallback to local state
    const newBank: Bank = {
          id: bankId,
      name: newBankName.trim(),
    };
    setBanks([...banks, newBank]);
        toast.success('Bank added successfully');
    setNewBankName('');
    setIsBankDialogOpen(false);
      }
      
    } catch (error) {
      console.error('Error adding bank:', error);
      toast.error('Failed to add bank');
    } finally {
      setIsAddingBank(false);
    }
  };

  const handleDeleteBank = (bankId: string) => {
    setBanks(banks.filter(b => b.id !== bankId));
    setBankTransactions(bankTransactions.filter(t => t.bankId !== bankId));
    toast.success('Bank and its transactions deleted successfully');
  };

  const calculateRemaining = (bankId: string, date: string, currentDeposit: number, currentWithdraw: number, excludeTransactionId?: string): number => {
    // Get all previous transactions for this bank up to this date, excluding the one being updated
    const previousTransactions = bankTransactions
      .filter(t => t.bankId === bankId && t.date <= date && t.id !== excludeTransactionId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remaining = 0;
    for (const transaction of previousTransactions) {
      remaining = remaining + transaction.deposit - transaction.withdraw;
    }

    // Add current transaction
    remaining = remaining + currentDeposit - currentWithdraw;
    
    return remaining;
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('➕ ===== ADDING NEW TRANSACTION =====');
    console.log('📊 Form Data:', transactionForm);
    console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);
    
    if (!transactionForm.bankId || transactionForm.bankId === 'none') {
      toast.error('Please select a bank');
      return;
    }

    setIsAddingTransaction(true);
    try {
    const deposit = parseFloat(transactionForm.deposit) || 0;
    const withdraw = parseFloat(transactionForm.withdraw) || 0;
    const remaining = calculateRemaining(transactionForm.bankId, transactionForm.date, deposit, withdraw);
    const hissabAmountNum = parseFloat(transactionForm.hissabAmount) || 0;
      const transactionId = crypto.randomUUID();

      console.log('💰 New Transaction - Deposit:', deposit, 'Withdraw:', withdraw, 'Remaining:', remaining);

      if (isSupabaseConfigured) {
        console.log('💾 Creating new transaction in Supabase...');
        // Save to Supabase database using API service
        const transactionData = await ApiService.createBankTransaction({
          date: transactionForm.date,
          bank_id: transactionForm.bankId,
          deposit,
          withdraw,
          pnl: (transactionForm.pnlType === 'loss' ? -1 : 1) * (parseFloat(transactionForm.hissabAmount) || 0),
          remaining,
          submitted_by: user?.id || '',
          submitted_by_name: user?.name || '',
        });

        console.log('✅ New transaction created in database:', transactionData);
        toast.success('Transaction added successfully');
        
        
        // Add activity
        await addActivity(
          'Bank transaction added',
          'success',
          `Added transaction: ${deposit > 0 ? `Deposit ${deposit}` : `Withdrawal ${withdraw}`} for bank ${transactionForm.bankId}`
        );
      } else {
        console.log('💾 Creating new transaction in local state...');
        // Fallback to local state
    const newTransaction: BankTransaction = {
          id: transactionId,
      date: transactionForm.date,
      bankId: transactionForm.bankId,
      deposit,
      withdraw,
          pnl: (transactionForm.pnlType === 'loss' ? -1 : 1) * (parseFloat(transactionForm.hissabAmount) || 0),
      remaining,
      submittedBy: user?.id || '',
      submittedByName: user?.name || '',
    };

        console.log('✅ New transaction object:', newTransaction);
    setBankTransactions([...bankTransactions, newTransaction]);
        toast.success('Transaction added successfully');
      }

    setTransactionForm({
      date: new Date().toISOString().split('T')[0],
      bankId: 'none',
      deposit: '',
      withdraw: '',
      pnlType: 'profit',
      hissabAmount: '',
    });
    setIsTransactionDialogOpen(false);

      console.log('🔄 Refreshing all data...');
      // Refresh all data to ensure consistency
      await refreshAllData();
      console.log('✅ Data refresh completed');
      } catch (error) {
        console.error('❌ Error adding transaction:', error);
        toast.error('Failed to add transaction');
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleEditTransaction = (transaction: BankTransaction) => {
    console.log('✏️ ===== EDIT TRANSACTION CLICKED =====');
    console.log('📝 Transaction to edit:', transaction);
    console.log('🆔 Transaction ID:', transaction.id);
    
    setEditingTransaction(transaction);
    setTransactionForm({
      date: transaction.date,
      bankId: transaction.bankId,
      deposit: transaction.deposit.toString(),
      withdraw: transaction.withdraw.toString(),
      pnlType: (typeof transaction.pnl === 'number' && transaction.pnl < 0 ? 'loss' : 'profit') as 'profit' | 'loss',
      hissabAmount: (typeof transaction.pnl === 'number' ? Math.abs(transaction.pnl).toString() : ''),
    });
    setIsEditDialogOpen(true);
    
    console.log('✅ Edit dialog opened with transaction:', transaction);
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    console.log('🔄 ===== UPDATING TRANSACTION =====');
    console.log('📝 Editing Transaction ID:', editingTransaction.id);
    console.log('📊 Form Data:', transactionForm);
    console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);

    setIsAddingTransaction(true);
    try {
      const deposit = parseFloat(transactionForm.deposit) || 0;
      const withdraw = parseFloat(transactionForm.withdraw) || 0;
      
      // For update, we need to recalculate remaining for all transactions after this one
      // First, get the bank name for activity logging
      const bank = banks.find(b => b.id === transactionForm.bankId);
      const bankName = bank?.name || 'Unknown Bank';

      console.log('💰 Deposit:', deposit, 'Withdraw:', withdraw);
      console.log('🏦 Bank:', bankName);

      if (isSupabaseConfigured) {
        console.log('💾 Updating transaction in Supabase...');
        // Update the transaction in database
        const updatedTransaction = await ApiService.updateBankTransaction(editingTransaction.id, {
          date: transactionForm.date,
          bank_id: transactionForm.bankId,
          deposit,
          withdraw,
          pnl: (transactionForm.pnlType === 'loss' ? -1 : 1) * (parseFloat(transactionForm.hissabAmount) || 0),
          // Note: remaining will be recalculated by the database trigger or we'll handle it in refreshAllData
        });

        console.log('✅ Transaction updated in database:', updatedTransaction);
        // Update custom amount mapping for UI
        setCustomHissabById(prev => ({
          ...prev,
          [editingTransaction.id]: { type: transactionForm.pnlType as 'profit' | 'loss', amount: parseFloat(transactionForm.hissabAmount) || 0 }
        }));
        toast.success('Transaction updated successfully');
        await addActivity(
          'Bank transaction updated',
          'success',
          `Updated transaction: ${deposit > 0 ? `Deposit ${deposit}` : `Withdrawal ${withdraw}`} for ${bankName}`
        );
      } else {
        console.log('💾 Updating transaction in local state...');
        // Fallback to local state
        const updatedTransaction: BankTransaction = {
          ...editingTransaction,
          date: transactionForm.date,
          bankId: transactionForm.bankId,
          deposit,
          withdraw,
          remaining: calculateRemaining(transactionForm.bankId, transactionForm.date, deposit, withdraw, editingTransaction.id),
        };

        console.log('✅ Updated transaction object:', updatedTransaction);
        setBankTransactions(bankTransactions.map(t => 
          t.id === editingTransaction.id ? updatedTransaction : t
        ));
        toast.success('Transaction updated successfully');
      }

      // Reset form and close dialog
      setTransactionForm({
        date: new Date().toISOString().split('T')[0],
        bankId: 'none',
        deposit: '',
        withdraw: '',
      });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);

      console.log('🔄 Refreshing all data...');
      // Refresh all data to ensure consistency and recalculate remaining amounts
      await refreshAllData();
      console.log('✅ Data refresh completed');
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const handleDeleteTransaction = (transaction: BankTransaction) => {
    console.log('🗑️ ===== DELETE TRANSACTION CLICKED =====');
    console.log('📝 Transaction to delete:', transaction);
    console.log('🆔 Transaction ID:', transaction.id);

    // Show confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      transaction: transaction
    });
  };

  const confirmDeleteTransaction = async () => {
    const transactionToDelete = deleteConfirmation.transaction;
    if (!transactionToDelete) return;

    console.log('🗑️ ===== CONFIRMING DELETE TRANSACTION =====');
    console.log('📝 Transaction to delete:', transactionToDelete);
    console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);

    setIsDeletingTransaction(true);
    try {
      if (isSupabaseConfigured) {
        console.log('💾 Deleting transaction from Supabase...');
        await ApiService.deleteBankTransaction(transactionToDelete.id);
        console.log('✅ Transaction deleted from database successfully');
        toast.success('Transaction deleted successfully');
        await addActivity(
          'Bank transaction deleted',
          'warning',
          `Deleted transaction: ${transactionToDelete.deposit > 0 ? `Deposit ${transactionToDelete.deposit}` : `Withdrawal ${transactionToDelete.withdraw}`} for bank ${transactionToDelete.bankId}`
        );
      } else {
        console.log('💾 Deleting transaction from local state...');
        setBankTransactions(bankTransactions.filter(t => t.id !== transactionToDelete.id));
        toast.success('Transaction deleted successfully');
      }

      console.log('🔄 Refreshing all data...');
      await refreshAllData();
      console.log('✅ Data refresh completed');
    } catch (error) {
      console.error('❌ Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeletingTransaction(false);
      setDeleteConfirmation({
        isOpen: false,
        transaction: null
      });
    }
  };

  // Filter transactions based on search and filters with role-based access control
  const filteredTransactions = useMemo(() => {
    const userTransactions = getFilteredBankTransactions(); // Get transactions based on user role
    return userTransactions.filter((transaction) => {
      const bank = banks.find(b => b.id === transaction.bankId);
      const matchesSearch = 
        bank?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.date.includes(searchTerm) ||
        transaction.deposit.toString().includes(searchTerm) ||
        transaction.withdraw.toString().includes(searchTerm) ||
        transaction.submittedByName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter === 'all' || transaction.date === dateFilter;
      const matchesBank = bankFilter === 'all' || transaction.bankId === bankFilter;
      
      return matchesSearch && matchesDate && matchesBank;
    });
  }, [getFilteredBankTransactions, banks, searchTerm, dateFilter, bankFilter]);



  const hasActiveFilters = searchTerm !== '' || dateFilter !== 'all' || bankFilter !== 'all';

  // Pagination for filtered transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setBankFilter('all');
    setCurrentPage(1);
  };

  // Filtered banks for searchable dropdown
  const filteredBanks = useMemo(() => {
    if (!bankSearchTerm.trim()) return banks;
    return banks.filter(bank =>
      bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase().trim())
    );
  }, [banks, bankSearchTerm]);

  // Handle bank selection from dropdown
  const handleBankSelect = (bank: Bank) => {
    setTransactionForm({ ...transactionForm, bankId: bank.id });
    setBankSearchTerm(bank.name);
    setShowBankDropdown(false);
  };

  // Handle adding new bank from dropdown
  const handleAddNewBank = (bankName: string) => {
    const trimmedName = bankName.trim();
    
    // Check for duplicate names (case-insensitive)
    const existingBank = banks.find(bank => 
      bank.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingBank) {
      toast.error('A bank with this name already exists');
      return;
    }

    if (!trimmedName) {
      toast.error('Bank name cannot be empty');
      return;
    }

    const newBank: Bank = {
      id: Date.now().toString(),
      name: trimmedName,
    };

    setBanks([...banks, newBank]);
    setTransactionForm({ ...transactionForm, bankId: newBank.id });
    setBankSearchTerm(trimmedName);
    setShowBankDropdown(false);
    toast.success(`Bank "${trimmedName}" added successfully`);
  };

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBankDropdown(false);
      }
    };

    if (showBankDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBankDropdown]);

  // Reset bank search when dialog opens/closes
  useEffect(() => {
    if (!isTransactionDialogOpen) {
      setBankSearchTerm('');
      setShowBankDropdown(false);
    }
  }, [isTransactionDialogOpen]);

  // Update search term when bank is selected from form reset
  useEffect(() => {
    if (transactionForm.bankId === 'none') {
      setBankSearchTerm('');
    } else {
      const selectedBank = banks.find(bank => bank.id === transactionForm.bankId);
      if (selectedBank) {
        setBankSearchTerm(selectedBank.name);
      }
    }
  }, [transactionForm.bankId, banks]);


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Deposits Management</h1>
          <p className="text-gray-600 mt-1">Track deposits and withdrawals across multiple banks</p>
        </div>
        <div className="flex space-x-3">
          {/* Add Bank Dialog */}
          <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border border-gray-300 hover:border-gray-400 px-3 py-2">
                <Building2 className="w-4 h-4 mr-2" />
                Add Bank
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[40%] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Bank</DialogTitle>
                <DialogDescription>
                  Enter the bank name to add it to the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddBank} className="space-y-4">
                <div>
                  <Label htmlFor="bankName" className="mb-2">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="Enter bank name"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsBankDialogOpen(false)} className="border border-gray-300 hover:border-gray-400 px-3 py-2">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#6a40ec] hover:bg-[#5a2fd9] border border-[#6a40ec] px-3 py-2"
                    disabled={isAddingBank}
                  >
                    {isAddingBank ? 'Adding...' : 'Add Bank'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Transaction Dialog */}
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#6a40ec] hover:bg-[#5a2fd9] border border-[#6a40ec] px-3 py-2">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[50%] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Bank Transaction</DialogTitle>
                <DialogDescription>
                  Add a new deposit or withdrawal transaction for a bank.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transactionDate">Date</Label>
                    <Input
                      id="transactionDate"
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank">Bank <span className="text-red-500">*</span></Label>
                    <div className="relative" ref={dropdownRef}>
                      <Input
                        id="bank"
                        placeholder="Search or add bank..."
                        value={bankSearchTerm}
                        onChange={(e) => setBankSearchTerm(e.target.value)}
                        onFocus={() => setShowBankDropdown(true)}
                        className="pr-10"
                        autoComplete="off"
                      />
                      <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      
                      {showBankDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredBanks.length > 0 ? (
                            <>
                              {filteredBanks.map((bank) => (
                                <button
                                  key={bank.id}
                                  type="button"
                                  onClick={() => handleBankSelect(bank)}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-2"
                                >
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span>{bank.name}</span>
                                  {transactionForm.bankId === bank.id && (
                                    <span className="ml-auto text-[#6a40ec] text-sm">✓</span>
                                  )}
                                </button>
                              ))}
                              {bankSearchTerm.trim() && !filteredBanks.some(bank => 
                                bank.name.toLowerCase() === bankSearchTerm.toLowerCase().trim()
                              ) && (
                                <div className="border-t border-gray-100">
                                  <button
                                    type="button"
                                    onClick={() => handleAddNewBank(bankSearchTerm.trim())}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center gap-2 text-[#6a40ec]"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Add "{bankSearchTerm.trim()}"</span>
                                  </button>
                                </div>
                              )}
                            </>
                          ) : bankSearchTerm.trim() ? (
                            <button
                              type="button"
                              onClick={() => handleAddNewBank(bankSearchTerm.trim())}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center gap-2 text-[#6a40ec]"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add "{bankSearchTerm.trim()}"</span>
                            </button>
                          ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">
                              Start typing to search banks...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deposit">Deposit Amount ($)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transactionForm.deposit}
                      onChange={(e) => setTransactionForm({ ...transactionForm, deposit: e.target.value })}
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
                      onChange={(e) => setTransactionForm({ ...transactionForm, withdraw: e.target.value })}
                    />
                  </div>
                </div>

                {/* Profit/Loss and Custom Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pnlType">Profit / Loss</Label>
                    <Select value={transactionForm.pnlType} onValueChange={(v: any) => setTransactionForm({ ...transactionForm, pnlType: v })}>
                      <SelectTrigger id="pnlType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profit">Profit</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hissabAmount">Amount ($)</Label>
                    <Input
                      id="hissabAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={transactionForm.hissabAmount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, hissabAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#6a40ec] hover:bg-[#5a2fd9]"
                    disabled={isAddingTransaction}
                  >
                    {isAddingTransaction ? 'Adding...' : 'Add Transaction'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Banks Overview */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle>Registered Banks</CardTitle>
          <CardDescription>Manage banks in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banks.map((bank) => {
              const bankTransactionsSum = bankTransactions
                .filter(t => t.bankId === bank.id)
                .reduce((sum, t) => sum + t.deposit - t.withdraw, 0);

              return (
                <div key={bank.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{bank.name}</h3>
                      <p className="text-sm text-gray-500">
                        Balance: <span className="font-medium">${bankTransactionsSum.toLocaleString()}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBank(bank.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {banks.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No banks added yet. Click "Add Bank" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter bank transactions by search term, date, and bank</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by bank name, date, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {Array.from(new Set(bankTransactions.map(t => t.date))).sort().reverse().map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date as string).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                {filteredTransactions.length} of {bankTransactions.length} transactions
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Transactions Table with Individual Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Transactions</CardTitle>
          <CardDescription>Individual transactions with edit and delete actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Date</TableHead>
                  <TableHead className="text-center">Bank</TableHead>
                  <TableHead className="text-center">Deposit</TableHead>
                  <TableHead className="text-center">Withdraw</TableHead>
                  <TableHead className="text-center">Remaining</TableHead>
                  <TableHead className="text-center">Profit/Loss</TableHead>
                  <TableHead className="text-center">Submitted By</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => {
                  const bank = banks.find(b => b.id === transaction.bankId);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-center">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-center">{bank?.name || 'Unknown Bank'}</TableCell>
                      <TableCell className="text-center">
                        {transaction.deposit > 0 ? `$${transaction.deposit.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.withdraw > 0 ? `$${transaction.withdraw.toLocaleString()}` : '-'}
                    </TableCell>
                      <TableCell className="text-center font-medium">
                        {`$${transaction.remaining.toLocaleString()}`}
                          </TableCell>
                      <TableCell className="text-center">
                        {typeof transaction.pnl === 'number' ? (
                          <span className={transaction.pnl >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {transaction.pnl >= 0 ? '+' : '-'}${Math.abs(transaction.pnl).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{transaction.submittedByName || 'Unknown'}</TableCell>
                          <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          {canEditBankTransactions && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTransaction(transaction)}
                              disabled={isDeletingTransaction}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteBankTransactions && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTransaction(transaction)}
                              disabled={isDeletingTransaction}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {!canEditBankTransactions && !canDeleteBankTransactions && (
                            <span className="text-gray-400 text-sm">No permissions</span>
                          )}
                        </div>
                          </TableCell>
                    </TableRow>
                      );
                    })}
                {paginatedTransactions.length === 0 && filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length > 0 && (
            <TablePagination
              totalItems={filteredTransactions.length}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
            />
          )}
        </CardContent>
      </Card>


      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[60%] bg-white border border-purple-200/60 shadow-xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6a40ec]/20 to-[#6a40ec]/30 rounded-lg flex items-center  mr-3">
                <Building2 className="w-4 h-4 text-[#6a40ec]" />
              </div>
              Edit Bank Transaction
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-left">
              Update the bank transaction details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTransaction} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTransactionDate" className="text-sm font-medium text-gray-700">Date</Label>
                <Input
                  id="editTransactionDate"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  className="border-gray-300 focus:border-[#6a40ec] focus:ring-[#6a40ec]/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBank" className="text-sm font-medium text-gray-700">Bank <span className="text-red-500">*</span></Label>
                <div className="relative" ref={dropdownRef}>
                  <Input
                    id="editBank"
                    placeholder="Search or add bank..."
                    value={bankSearchTerm}
                    onChange={(e) => setBankSearchTerm(e.target.value)}
                    onFocus={() => setShowBankDropdown(true)}
                    className="pr-10 border-gray-300 focus:border-[#6a40ec] focus:ring-[#6a40ec]/20"
                    autoComplete="off"
                  />
                  <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  
                  {showBankDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-purple-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredBanks.length > 0 ? (
                        <>
                          {filteredBanks.map((bank) => (
                            <div
                              key={bank.id}
                              className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setTransactionForm({ ...transactionForm, bankId: bank.id });
                                setBankSearchTerm(bank.name);
                                setShowBankDropdown(false);
                              }}
                            >
                              {bank.name}
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No banks found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPnlType" className="text-sm font-medium text-gray-700">Profit / Loss</Label>
                <Select value={transactionForm.pnlType} onValueChange={(v: any) => setTransactionForm({ ...transactionForm, pnlType: v })}>
                  <SelectTrigger id="editPnlType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit">Profit</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editHissabAmount" className="text-sm font-medium text-gray-700">Amount ($)</Label>
                <Input
                  id="editHissabAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionForm.hissabAmount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, hissabAmount: e.target.value })}
                  className="border-gray-300 focus:border-[#6a40ec] focus:ring-[#6a40ec]/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDeposit" className="text-sm font-medium text-gray-700">Deposit Amount</Label>
                <Input
                  id="editDeposit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionForm.deposit}
                  onChange={(e) => setTransactionForm({ ...transactionForm, deposit: e.target.value })}
                  className="border-gray-300 focus:border-[#6a40ec] focus:ring-[#6a40ec]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editWithdraw" className="text-sm font-medium text-gray-700">Withdraw Amount</Label>
                <Input
                  id="editWithdraw"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionForm.withdraw}
                  onChange={(e) => setTransactionForm({ ...transactionForm, withdraw: e.target.value })}
                  className="border-gray-300 focus:border-[#6a40ec] focus:ring-[#6a40ec]/20"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTransaction(null);
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAddingTransaction}
                className="bg-gradient-to-r from-[#6a40ec] to-[#8b5cf6] hover:from-[#5a30d9] hover:to-[#7c3aed] text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isAddingTransaction ? 'Updating...' : 'Update Transaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteConfirmation({
            isOpen,
            transaction: null
          })
        }
      >
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Bank Transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bank transaction from {deleteConfirmation.transaction?.date}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTransaction}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={isDeletingTransaction}
            >
              {isDeletingTransaction ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}