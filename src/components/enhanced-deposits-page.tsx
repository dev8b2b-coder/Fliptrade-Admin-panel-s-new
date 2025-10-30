import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2, Search, Filter, Calendar, X, UserPlus, DollarSign, MinusCircle } from 'lucide-react';
import { useAdmin, type DepositEntry, type ClientIncentive, type ExpenseItem } from './admin-context';
import { toast } from 'sonner@2.0.3';
import { TablePagination } from './table-pagination';

const expenseTypes = ['Promotion', 'Salary', 'Miscellaneous', 'IB Commission', 'Travel Expense'] as const;

export function EnhancedDepositsPage() {
  const { deposits, setDeposits, withdrawals } = useAdmin();
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

  const calculateNetAmount = (deposit: DepositEntry) => {
    const totalDeposit = calculateTotalDeposit(deposit);
    const totalIncentives = calculateTotalIncentives(deposit);
    const totalExpenses = calculateTotalExpenses(deposit);
    return totalDeposit - totalIncentives - totalExpenses;
  };

  // Filter deposits based on search and filters
  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const matchesSearch = 
        deposit.clientIncentives.some(ci => ci.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deposit.expenses.some(exp => exp.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                   exp.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        deposit.date.includes(searchTerm);
      
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
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Deposits Management</h1>
          <p className="text-gray-600 mt-1">Track deposits with multiple client incentives and expense categories</p>
        </div>
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
                {editingDeposit ? 'Update the' : 'Enter the'} deposit details with multiple client incentives and expenses.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deposit Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Incentives */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Client Incentives</CardTitle>
                  <Button type="button" onClick={addClientIncentive} size="sm" variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clientIncentives.map((incentive, index) => (
                    <div key={incentive.id} className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg">
                      <div>
                        <Label>Client Name</Label>
                        <Input
                          placeholder="Enter client name"
                          value={incentive.name}
                          onChange={(e) => updateClientIncentive(incentive.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Incentive Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={incentive.amount}
                          onChange={(e) => updateClientIncentive(incentive.id, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        {clientIncentives.length > 1 && (
                          <Button 
                            type="button" 
                            onClick={() => removeClientIncentive(incentive.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Expenses */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Company Expenses</CardTitle>
                  <Button type="button" onClick={addExpense} size="sm" variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expenses.map((expense, index) => (
                    <div key={expense.id} className="grid grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                      <div>
                        <Label>Expense Type</Label>
                        <Select 
                          value={expense.type} 
                          onValueChange={(value: any) => updateExpense(expense.id, 'type', value)}
                        >
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
                      <div>
                        <Label>Amount ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={expense.amount}
                          onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Description (Optional)</Label>
                        <Input
                          placeholder="Enter description"
                          value={expense.description || ''}
                          onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        {expenses.length > 1 && (
                          <Button 
                            type="button" 
                            onClick={() => removeExpense(expense.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

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
          <CardDescription>All deposit entries with client incentives and expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Deposits</TableHead>
                  <TableHead>Client Incentives</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Net Amount</TableHead>
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
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>Local: ${deposit.localDeposit.toLocaleString()}</div>
                        <div>USDT: ${deposit.usdtDeposit.toLocaleString()}</div>
                        <div>Cash: ${deposit.cashDeposit.toLocaleString()}</div>
                        <div className="font-medium">Total: ${calculateTotalDeposit(deposit).toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {deposit.clientIncentives.map((ci) => (
                          <div key={ci.id}>
                            <span className="font-medium">{ci.name}</span>: ${ci.amount.toLocaleString()}
                          </div>
                        ))}
                        <div className="font-medium text-red-600">
                          Total: ${calculateTotalIncentives(deposit).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {deposit.expenses.map((exp) => (
                          <div key={exp.id}>
                            <span className="font-medium">{exp.type}</span>: ${exp.amount.toLocaleString()}
                            {exp.description && <div className="text-gray-500 text-xs">{exp.description}</div>}
                          </div>
                        ))}
                        <div className="font-medium text-red-600">
                          Total: ${calculateTotalExpenses(deposit).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={calculateNetAmount(deposit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${calculateNetAmount(deposit).toLocaleString()}
                      </span>
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