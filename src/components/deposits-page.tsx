import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit, Trash2, Search, Filter, Calendar, X, RefreshCw } from 'lucide-react';
import { useAdmin, type DepositEntry, type ClientIncentive } from './admin-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ApiService from '../services/api';
import { toast } from 'sonner';
import { TablePagination } from './table-pagination';

const expenseTypes = ['Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense'] as const;

export function DepositsPage() {
  const { deposits, setDeposits, withdrawals, refreshAllData, user } = useAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    localDeposit: '',
    usdtDeposit: '',
    cashDeposit: '',
    localWithdraw: '',
    usdtWithdraw: '',
    cashWithdraw: '',
    clientIncentiveName: '',
    clientIncentiveAmount: '',
    expenseType: 'Miscellaneous' as const,
    expenseAmount: '',
    expenseDescription: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      localDeposit: '',
      usdtDeposit: '',
      cashDeposit: '',
      localWithdraw: '',
      usdtWithdraw: '',
      cashWithdraw: '',
      clientIncentiveName: '',
      clientIncentiveAmount: '',
      expenseType: 'Miscellaneous',
      expenseAmount: '',
      expenseDescription: '',
    });
    setEditingDeposit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💰 ===== DEPOSIT FORM SUBMITTED =====');
    console.log('📊 Form Data:', formData);
    console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);
    console.log('👤 User:', user);
    
    try {
      const depositId = editingDeposit?.id || crypto.randomUUID();
      
      if (isSupabaseConfigured) {
        // Save to Supabase database using API service
        console.log('💾 Saving deposit to Supabase...');
        const depositData = await ApiService.createDeposit({
          date: formData.date,
          local_deposit: parseFloat(formData.localDeposit) || 0,
          usdt_deposit: parseFloat(formData.usdtDeposit) || 0,
          cash_deposit: parseFloat(formData.cashDeposit) || 0,
          local_withdraw: parseFloat(formData.localWithdraw) || 0,
          usdt_withdraw: parseFloat(formData.usdtWithdraw) || 0,
          cash_withdraw: parseFloat(formData.cashWithdraw) || 0,
          submitted_by: user?.id || '',
          submitted_by_name: user?.name || '',
        });


        // Save client incentives using API service
        if (formData.clientIncentiveName && formData.clientIncentiveAmount) {
          console.log('🎁 Saving client incentive...');
          await ApiService.createClientIncentive({
            deposit_id: depositData.id,
            client_name: formData.clientIncentiveName,
            amount: parseFloat(formData.clientIncentiveAmount) || 0,
          });
        }

        // Save expenses using API service
        if (formData.expenseAmount && formData.expenseDescription) {
          console.log('💸 Saving expense...');
          await ApiService.createExpense({
            deposit_id: depositData.id,
            type: formData.expenseType,
            amount: parseFloat(formData.expenseAmount) || 0,
            description: formData.expenseDescription,
          });
        }

        console.log('✅ Deposit entry saved successfully!');
        toast.success('Deposit entry saved to database successfully');
      } else {
        // Fallback to local state for development
    const depositData: DepositEntry = {
          id: depositId,
      date: formData.date,
      localDeposit: parseFloat(formData.localDeposit) || 0,
      usdtDeposit: parseFloat(formData.usdtDeposit) || 0,
      cashDeposit: parseFloat(formData.cashDeposit) || 0,
          localWithdraw: parseFloat(formData.localWithdraw) || 0,
          usdtWithdraw: parseFloat(formData.usdtWithdraw) || 0,
          cashWithdraw: parseFloat(formData.cashWithdraw) || 0,
          clientIncentives: [{
            id: Date.now().toString(),
        name: formData.clientIncentiveName,
        amount: parseFloat(formData.clientIncentiveAmount) || 0,
          }],
          expenses: [{
            id: Date.now().toString(),
            type: formData.expenseType,
            amount: parseFloat(formData.expenseAmount) || 0,
            description: formData.expenseDescription,
          }],
          submittedBy: user?.id || '',
          submittedByName: user?.name || '',
    };

    if (editingDeposit) {
      setDeposits(deposits.map(d => d.id === editingDeposit.id ? depositData : d));
      toast.success('Deposit entry updated successfully');
    } else {
      setDeposits([...deposits, depositData]);
      toast.success('Deposit entry added successfully');
    }
      }

      // Refresh all data to ensure consistency
      await refreshAllData();

    setIsDialogOpen(false);
    resetForm();
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error('Failed to submit deposit entry');
    }
  };

  const handleEdit = (deposit: DepositEntry) => {
    setEditingDeposit(deposit);
    setFormData({
      date: deposit.date,
      localDeposit: deposit.localDeposit.toString(),
      usdtDeposit: deposit.usdtDeposit.toString(),
      cashDeposit: deposit.cashDeposit.toString(),
      localWithdraw: deposit.localWithdraw.toString(),
      usdtWithdraw: deposit.usdtWithdraw.toString(),
      cashWithdraw: deposit.cashWithdraw.toString(),
      clientIncentiveName: deposit.clientIncentives[0]?.name || '',
      clientIncentiveAmount: deposit.clientIncentives[0]?.amount.toString() || '',
      expenseType: deposit.expenses[0]?.type || 'Miscellaneous',
      expenseAmount: deposit.expenses[0]?.amount.toString() || '',
      expenseDescription: deposit.expenses[0]?.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeposits(deposits.filter(d => d.id !== id));
    toast.success('Deposit entry deleted successfully');
  };

  const calculateTotalDeposit = (deposit: DepositEntry) => {
    return deposit.localDeposit + deposit.usdtDeposit + deposit.cashDeposit;
  };

  const calculateTodaysBalance = (deposit: DepositEntry) => {
    const totalDeposit = calculateTotalDeposit(deposit);
    const todaysWithdrawals = withdrawals
      .filter(w => w.date === deposit.date)
      .reduce((sum, w) => sum + w.amount, 0);
    return totalDeposit - todaysWithdrawals;
  };

  // Filter deposits based on search and filters
  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const clientIncentiveNames = deposit.clientIncentives.map(ci => ci.name).join(' ');
      const expenseTypes = deposit.expenses.map(exp => exp.type).join(' ');
      
      const matchesSearch = 
        clientIncentiveNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expenseTypes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.date.includes(searchTerm) ||
        deposit.submittedByName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter === 'all' || deposit.date === dateFilter;
      const matchesExpenseType = expenseTypeFilter === 'all' || 
        deposit.expenses.some(exp => exp.type === expenseTypeFilter);
      
      return matchesSearch && matchesDate && matchesExpenseType;
    });
  }, [deposits, searchTerm, dateFilter, expenseTypeFilter]);

  // Group filtered deposits by date for color coding
  const groupedDeposits = useMemo(() => {
    return filteredDeposits.reduce((acc, deposit) => {
      if (!acc[deposit.date]) {
        acc[deposit.date] = [];
      }
      acc[deposit.date].push(deposit);
      return acc;
    }, {} as Record<string, DepositEntry[]>);
  }, [filteredDeposits]);

  // Flatten grouped deposits for pagination
  const flattenedDeposits = useMemo(() => {
    return Object.entries(groupedDeposits).flatMap(([date, dateDeposits]) => 
      dateDeposits.map((deposit, index) => ({
        ...deposit,
        groupIndex: Object.keys(groupedDeposits).indexOf(date)
      }))
    );
  }, [groupedDeposits]);

  const paginatedDeposits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return flattenedDeposits.slice(startIndex, startIndex + itemsPerPage);
  }, [flattenedDeposits, currentPage, itemsPerPage]);

  const hasActiveFilters = searchTerm !== '' || dateFilter !== 'all' || expenseTypeFilter !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setExpenseTypeFilter('all');
    setCurrentPage(1);
  };

  const dateColors = [
    'bg-blue-50 border-blue-200',
    'bg-green-50 border-green-200',
    'bg-purple-50 border-purple-200',
    'bg-orange-50 border-orange-200',
    'bg-pink-50 border-pink-200',
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deposits Management</h1>
          <p className="text-gray-600 mt-1">Track daily deposits, client incentives, and company expenses</p>
        </div>
        <div className="flex space-x-2">
          {/* Test Button */}
          <Button 
            onClick={() => {
              console.log('🧪 TEST DEPOSIT FORM SUBMISSION');
              console.log('📊 Current form data:', formData);
              console.log('🔧 isSupabaseConfigured:', isSupabaseConfigured);
              console.log('👤 User:', user);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            🧪 Test
          </Button>
          
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[#6a40ec] hover:bg-[#5a2fd9]">
              <Plus className="w-4 h-4 mr-2" />
              Add Deposit Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[80vw] max-w-[80vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDeposit ? 'Edit' : 'Add'} Deposit Entry</DialogTitle>
              <DialogDescription>
                {editingDeposit ? 'Update the' : 'Enter the'} deposit details, client incentives, and company expenses.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expenseType">Expense Type</Label>
                  <Select value={formData.expenseType} onValueChange={(value: any) => setFormData({ ...formData, expenseType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="localDeposit">Local Deposit ($)</Label>
                  <Input
                    id="localDeposit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.localDeposit}
                    onChange={(e) => setFormData({ ...formData, localDeposit: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="usdtDeposit">USDT Deposit ($)</Label>
                  <Input
                    id="usdtDeposit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.usdtDeposit}
                    onChange={(e) => setFormData({ ...formData, usdtDeposit: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cashDeposit">Cash Deposit ($)</Label>
                  <Input
                    id="cashDeposit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cashDeposit}
                    onChange={(e) => setFormData({ ...formData, cashDeposit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
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
                <div>
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
                <div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientIncentiveName">Client Incentive Name</Label>
                  <Input
                    id="clientIncentiveName"
                    placeholder="Client name"
                    value={formData.clientIncentiveName}
                    onChange={(e) => setFormData({ ...formData, clientIncentiveName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientIncentiveAmount">Client Incentive Amount ($)</Label>
                  <Input
                    id="clientIncentiveAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.clientIncentiveAmount}
                    onChange={(e) => setFormData({ ...formData, clientIncentiveAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="expenseAmount">Expense Amount ($)</Label>
                <Input
                    id="expenseAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                    value={formData.expenseAmount}
                    onChange={(e) => setFormData({ ...formData, expenseAmount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expenseDescription">Expense Description</Label>
                  <Input
                    id="expenseDescription"
                    placeholder="Enter expense description"
                    value={formData.expenseDescription}
                    onChange={(e) => setFormData({ ...formData, expenseDescription: e.target.value })}
                  required
                />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#6a40ec] hover:bg-[#5a2fd9]">
                  {editingDeposit ? 'Update' : 'Add'} Deposit
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Button 
          variant="outline" 
          onClick={refreshAllData}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter deposits by search term, date, and expense type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by client name, expense type, or date..."
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
                  {Array.from(new Set(deposits.map(d => d.date))).sort().reverse().map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <CardDescription>All deposit entries grouped by date with color coding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Local Deposit</TableHead>
                  <TableHead>USDT Deposit</TableHead>
                  <TableHead>Cash Deposit</TableHead>
                  <TableHead>Total Balance</TableHead>
                  <TableHead>Client Incentives</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Submitted By</TableHead>
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
                      <TableCell>${deposit.localDeposit.toLocaleString()}</TableCell>
                      <TableCell>${deposit.usdtDeposit.toLocaleString()}</TableCell>
                      <TableCell>${deposit.cashDeposit.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">
                        ${calculateTotalDeposit(deposit).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {deposit.clientIncentives.map((ci, index) => (
                            <div key={index} className="mb-1">
                              <div className="font-medium">{ci.name}</div>
                              <div className="text-gray-500">${ci.amount.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {deposit.expenses.map((exp, index) => (
                            <div key={index} className="mb-1">
                              <div className="font-medium">${exp.amount.toLocaleString()}</div>
                              <div className="text-gray-500">{exp.type}</div>
                              {exp.description && (
                                <div className="text-xs text-gray-400">{exp.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {deposit.submittedByName}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(deposit)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(deposit.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredDeposits.length > 0 && (
            <TablePagination
              totalItems={filteredDeposits.length}
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
    </div>
  );
}