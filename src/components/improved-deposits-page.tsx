import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2, Search, Filter, Calendar, X, UserPlus, DollarSign, MinusCircle } from 'lucide-react';
import { useAdmin, type DepositEntry, type ClientIncentive, type ExpenseItem } from './admin-context';
import { toast } from 'sonner@2.0.3';
import { TablePagination } from './table-pagination';

const expenseTypes = ['Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense'] as const;

export function ImprovedDepositsPage() {
  const { 
    deposits, 
    setDeposits, 
    withdrawals, 
    getFilteredDeposits, 
    canViewAllEntries, 
    isAdmin,
    user,
    staff 
  } = useAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Form state for deposit entry
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    localDeposit: '',
    usdtDeposit: '',
    cashDeposit: '',
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
    });
    setClientIncentives([{ id: '1', name: '', amount: 0 }]);
    setExpenses([{ id: '1', type: 'Miscellaneous', amount: 0, description: '' }]);
    setEditingDeposit(null);
  };

  const addClientIncentive = () => {
    const newId = (clientIncentives.length + 1).toString();
    setClientIncentives([...clientIncentives, { id: newId, name: '', amount: 0 }]);
  };

  const removeClientIncentive = (id: string) => {
    if (clientIncentives.length > 1) {
      setClientIncentives(clientIncentives.filter(ci => ci.id !== id));
    }
  };

  const updateClientIncentive = (id: string, field: keyof ClientIncentive, value: string | number) => {
    setClientIncentives(clientIncentives.map(ci => 
      ci.id === id ? { ...ci, [field]: value } : ci
    ));
  };

  const addExpense = () => {
    const newId = (expenses.length + 1).toString();
    setExpenses([...expenses, { id: newId, type: 'Miscellaneous', amount: 0, description: '' }]);
  };

  const removeExpense = (id: string) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter(exp => exp.id !== id));
    }
  };

  const updateExpense = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all required fields are filled
    const validClientIncentives = clientIncentives.filter(ci => ci.name.trim() !== '' && ci.amount > 0);
    const validExpenses = expenses.filter(exp => exp.amount > 0);
    
    if (validClientIncentives.length === 0 && validExpenses.length === 0) {
      toast.error('Please add at least one client incentive or expense item');
      return;
    }

    const depositData: DepositEntry = {
      id: editingDeposit?.id || Date.now().toString(),
      date: formData.date,
      localDeposit: parseFloat(formData.localDeposit) || 0,
      usdtDeposit: parseFloat(formData.usdtDeposit) || 0,
      cashDeposit: parseFloat(formData.cashDeposit) || 0,
      clientIncentives: validClientIncentives,
      expenses: validExpenses,
      submittedBy: editingDeposit?.submittedBy || user?.id || '',
      submittedByName: editingDeposit?.submittedByName || user?.name || '',
    };

    if (editingDeposit) {
      setDeposits(deposits.map(d => d.id === editingDeposit.id ? depositData : d));
      toast.success('Deposit entry updated successfully');
    } else {
      setDeposits([...deposits, depositData]);
      toast.success('Deposit entry added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (deposit: DepositEntry) => {
    setEditingDeposit(deposit);
    setFormData({
      date: deposit.date,
      localDeposit: deposit.localDeposit.toString(),
      usdtDeposit: deposit.usdtDeposit.toString(),
      cashDeposit: deposit.cashDeposit.toString(),
    });
    setClientIncentives(deposit.clientIncentives.length > 0 ? deposit.clientIncentives : [{ id: '1', name: '', amount: 0 }]);
    setExpenses(deposit.expenses.length > 0 ? deposit.expenses : [{ id: '1', type: 'Miscellaneous', amount: 0, description: '' }]);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeposits(deposits.filter(d => d.id !== id));
    toast.success('Deposit entry deleted successfully');
  };

  const calculateTotalDeposit = (deposit: DepositEntry) => {
    return deposit.localDeposit + deposit.usdtDeposit + deposit.cashDeposit;
  };

  const calculateTotalIncentives = (deposit: DepositEntry) => {
    return deposit.clientIncentives.reduce((sum, ci) => sum + ci.amount, 0);
  };

  const calculateTotalExpenses = (deposit: DepositEntry) => {
    return deposit.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  const calculateTodaysBalance = (deposit: DepositEntry) => {
    const totalDeposit = calculateTotalDeposit(deposit);
    const todaysWithdrawals = withdrawals
      .filter(w => w.date === deposit.date)
      .reduce((sum, w) => sum + w.amount, 0);
    return totalDeposit - todaysWithdrawals;
  };

  // Create tooltip content for client incentives
  const createIncentivesTooltip = (incentives: ClientIncentive[]) => {
    if (incentives.length === 0) return 'No incentives';
    
    const incentivesList = incentives.map(ci => `• ${ci.name} – $${ci.amount.toLocaleString()}`).join('\n');
    const total = incentives.reduce((sum, ci) => sum + ci.amount, 0);
    
    return `${incentivesList}\n\nTotal: $${total.toLocaleString()}`;
  };

  // Create tooltip content for expenses
  const createExpensesTooltip = (expenses: ExpenseItem[]) => {
    if (expenses.length === 0) return 'No expenses';
    
    const expensesList = expenses.map(exp => 
      `• ${exp.type} – $${exp.amount.toLocaleString()}${exp.description ? ` (${exp.description})` : ''}`
    ).join('\n');
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return `${expensesList}\n\nTotal: $${total.toLocaleString()}`;
  };

  // Filter deposits based on search and filters with role-based access control
  const filteredDeposits = useMemo(() => {
    const userDeposits = getFilteredDeposits(); // Get deposits based on user role
    return userDeposits.filter((deposit) => {
      const matchesSearch = 
        deposit.clientIncentives.some(ci => ci.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deposit.expenses.some(exp => exp.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                   exp.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deposit.date.includes(searchTerm) ||
        deposit.submittedByName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter === 'all' || deposit.date === dateFilter;
      const matchesExpenseType = expenseTypeFilter === 'all' || 
        deposit.expenses.some(exp => exp.type === expenseTypeFilter);
      
      return matchesSearch && matchesDate && matchesExpenseType;
    });
  }, [getFilteredDeposits, searchTerm, dateFilter, expenseTypeFilter]);

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
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deposits Management</h1>
            <p className="text-gray-600 mt-1">Track daily deposits, client incentives, and company expenses</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-[#6a40ec] hover:bg-[#5a2fd9]">
                <Plus className="w-4 h-4 mr-2" />
                Add Deposit Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingDeposit ? 'Edit' : 'Add'} Deposit Entry</DialogTitle>
                <DialogDescription className="text-base">
                  {editingDeposit ? 'Update the' : 'Enter the'} deposit details with multiple client incentives and expenses.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <Card className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#6a40ec]" />
                      Deposit Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date and Summary Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm font-medium flex items-center gap-1">
                          Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">
                          Total Deposit (Auto-calculated)
                        </Label>
                        <div className="h-11 px-3 border rounded-md bg-gray-50 flex items-center text-base font-medium text-gray-700">
                          ${((parseFloat(formData.localDeposit) || 0) + (parseFloat(formData.usdtDeposit) || 0) + (parseFloat(formData.cashDeposit) || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Deposit Fields */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Deposit Amounts</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="localDeposit" className="text-sm font-medium">
                            Local Deposit ($)
                          </Label>
                          <Input
                            id="localDeposit"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.localDeposit}
                            onChange={(e) => setFormData({ ...formData, localDeposit: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="usdtDeposit" className="text-sm font-medium">
                            USDT Deposit ($)
                          </Label>
                          <Input
                            id="usdtDeposit"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.usdtDeposit}
                            onChange={(e) => setFormData({ ...formData, usdtDeposit: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cashDeposit" className="text-sm font-medium">
                            Cash Deposit ($)
                          </Label>
                          <Input
                            id="cashDeposit"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.cashDeposit}
                            onChange={(e) => setFormData({ ...formData, cashDeposit: e.target.value })}
                            className="h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Incentives */}
                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#6a40ec]" />
                      Client Incentives
                      {clientIncentives.filter(ci => ci.name.trim() !== '' && ci.amount > 0).length > 0 && (
                        <span className="text-sm bg-[#6a40ec] text-white px-2 py-1 rounded-full">
                          {clientIncentives.filter(ci => ci.name.trim() !== '' && ci.amount > 0).length}
                        </span>
                      )}
                    </CardTitle>
                    <Button type="button" onClick={addClientIncentive} size="sm" variant="outline" className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add Client
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {clientIncentives.map((incentive, index) => (
                      <div key={incentive.id} className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-900">Client #{index + 1}</h5>
                          {clientIncentives.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => removeClientIncentive(incentive.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <MinusCircle className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Client Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="Enter client name"
                              value={incentive.name}
                              onChange={(e) => updateClientIncentive(incentive.id, 'name', e.target.value)}
                              className="h-11"
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
                              className="h-11"
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

                {/* Expenses */}
                <Card className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#6a40ec]" />
                      Company Expenses
                      {expenses.filter(exp => exp.amount > 0).length > 0 && (
                        <span className="text-sm bg-[#6a40ec] text-white px-2 py-1 rounded-full">
                          {expenses.filter(exp => exp.amount > 0).length}
                        </span>
                      )}
                    </CardTitle>
                    <Button type="button" onClick={addExpense} size="sm" variant="outline" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Add Expense
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {expenses.map((expense, index) => (
                      <div key={expense.id} className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-900">Expense #{index + 1}</h5>
                          {expenses.length > 1 && (
                            <Button 
                              type="button" 
                              onClick={() => removeExpense(expense.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <MinusCircle className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Expense Type <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={expense.type} 
                              onValueChange={(value: any) => updateExpense(expense.id, 'type', value)}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
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
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2 lg:col-span-1">
                            <Label className="text-sm font-medium">
                              Description (Optional)
                            </Label>
                            <Input
                              placeholder="Enter description"
                              value={expense.description || ''}
                              onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                              className="h-11"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total Expenses Summary */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-orange-900">Total Company Expenses:</span>
                        <span className="text-lg font-semibold text-orange-900">
                          ${expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Card */}
                <Card className="border-2 border-[#6a40ec] bg-gradient-to-r from-[#6a40ec]/5 to-purple-50">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#6a40ec]">
                          ${((parseFloat(formData.localDeposit) || 0) + (parseFloat(formData.usdtDeposit) || 0) + (parseFloat(formData.cashDeposit) || 0)).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Total Balance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          ${clientIncentives.reduce((sum, ci) => sum + (ci.amount || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Client Incentives</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ${expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Company Expenses</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="w-full sm:w-auto px-8 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto px-8 py-2 bg-[#6a40ec] hover:bg-[#5a2fd9]"
                  >
                    {editingDeposit ? 'Update' : 'Add'} Deposit Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Local Deposit</TableHead>
                    <TableHead>USDT Deposit</TableHead>
                    <TableHead>Cash Deposit</TableHead>
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
                      <TableCell>${deposit.localDeposit.toLocaleString()}</TableCell>
                      <TableCell>${deposit.usdtDeposit.toLocaleString()}</TableCell>
                      <TableCell>${deposit.cashDeposit.toLocaleString()}</TableCell>
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
                          <TooltipContent className="max-w-xs whitespace-pre-line">
                            {createIncentivesTooltip(deposit.clientIncentives)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm cursor-help">
                              <div className="font-medium">
                                ${calculateTotalExpenses(deposit).toLocaleString()}
                              </div>
                              <div className="text-gray-500">
                                {deposit.expenses.length === 1 
                                  ? deposit.expenses[0].type 
                                  : `${deposit.expenses.length} items`}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs whitespace-pre-line">
                            {createExpensesTooltip(deposit.expenses)}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${calculateTodaysBalance(deposit).toLocaleString()}
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
    </TooltipProvider>
  );
}