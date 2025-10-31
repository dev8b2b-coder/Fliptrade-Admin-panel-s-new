import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Users, UserPlus, Activity, DollarSign, Clock, Shield, TrendingUp, Wallet, Calculator, Filter, CalendarIcon, X, ArrowDownCircle, Receipt, Gift } from 'lucide-react';
import { useAdmin } from './admin-context';
import { TestDataManager } from './test-data-manager';
import { format } from 'date-fns';
import ApiService from '../services/api';
import { toast } from 'sonner';

export function DashboardPage() {
  const { getFilteredDeposits, withdrawals, canViewAllEntries, user, setCurrentPage, canViewDashboardExtras, canAccessStaffManagement, canAccessActivityLogs, getFilteredActivities, isLoading, addActivity, setActivities } = useAdmin();
  
  // Filter state
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Test API function
  const testApiConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      
      // Test creating a bank
      const testBank = await ApiService.createBank({
        name: 'Test Bank ' + Date.now(),
        is_active: true,
      });
      
      console.log('✅ Test bank created:', testBank);
      toast.success('API Test Successful! Bank created: ' + testBank.name);
      
      // Clean up - delete the test bank
      await ApiService.deleteBank(testBank.id);
      console.log('🧹 Test bank cleaned up');
      
    } catch (error) {
      console.error('❌ API Test failed:', error);
      toast.error('API Test Failed: ' + (error as Error).message);
    }
  };

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

  // Get filtered deposits based on user role and date filters
  const allDeposits = getFilteredDeposits();
  const deposits = useMemo(() => {
    return allDeposits.filter(deposit => {
      // Apply predefined date filter
      if (dateFilter !== 'all' && !isDateInRange(deposit.date)) {
        return false;
      }
      
      // Apply custom date range if set
      if ((customDateRange.from || customDateRange.to) && !isDateInCustomRange(deposit.date)) {
        return false;
      }
      
      return true;
    });
  }, [allDeposits, dateFilter, customDateRange]);

  // Filter withdrawals by the same criteria
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(withdrawal => {
      // Apply predefined date filter
      if (dateFilter !== 'all' && !isDateInRange(withdrawal.date)) {
        return false;
      }
      
      // Apply custom date range if set
      if ((customDateRange.from || customDateRange.to) && !isDateInCustomRange(withdrawal.date)) {
        return false;
      }
      
      return true;
    });
  }, [withdrawals, dateFilter, customDateRange]);

  const clearCustomDateRange = () => {
    setCustomDateRange({ from: undefined, to: undefined });
    setIsCustomDateOpen(false);
  };

  const hasActiveFilters = dateFilter !== 'all' || customDateRange.from || customDateRange.to;

  // Calculate financial metrics according to the formulas
  const totalDeposits = deposits.reduce((sum, deposit) => 
    sum + deposit.localDeposit + deposit.usdtDeposit + deposit.cashDeposit, 0
  );
  
  // Calculate withdrawals from deposits data (localWithdraw + usdtWithdraw + cashWithdraw)
  const totalWithdrawals = deposits.reduce((sum, deposit) => 
    sum + deposit.localWithdraw + deposit.usdtWithdraw + deposit.cashWithdraw, 0
  );
  
  console.log('📊 Dashboard Calculations:');
  console.log('📈 Total Deposits:', totalDeposits);
  console.log('📉 Total Withdrawals:', totalWithdrawals);
  console.log('📋 Deposits Count:', deposits.length);
  console.log('📄 Sample Deposit:', deposits[0]);
  
  const totalBalance = totalDeposits - totalWithdrawals;
  
  const totalCompanyExpenses = deposits.reduce((sum, deposit) => 
    sum + deposit.expenses.reduce((expSum, expense) => expSum + expense.amount, 0), 0
  );
  
  const balanceExcludingExpenses = totalBalance - totalCompanyExpenses;
  
  const totalClientIncentives = deposits.reduce((sum, deposit) => 
    sum + deposit.clientIncentives.reduce((incentiveSum, incentive) => incentiveSum + incentive.amount, 0), 0
  );
  
  const netProfit = balanceExcludingExpenses - totalClientIncentives;

  const stats = [
    {
      title: 'Total Deposits',
      value: `$${totalDeposits.toLocaleString()}`,
      change: deposits.length > 0 ? `${deposits.length} entries` : 'No data',
      changeType: 'neutral',
      icon: DollarSign,
      description: 'Local + USDT + Cash Deposits',
    },
    {
      title: 'Total Withdrawals',
      value: `$${totalWithdrawals.toLocaleString()}`,
      change: deposits.length > 0 ? `${deposits.length} entries` : 'No data',
      changeType: 'negative',
      icon: ArrowDownCircle,
      description: 'All withdrawal transactions from deposits',
    },
    {
      title: 'Total Company Expenses',
      value: `$${totalCompanyExpenses.toLocaleString()}`,
      change: totalCompanyExpenses > 0 ? `$${totalCompanyExpenses.toLocaleString()} spent` : 'No expenses',
      changeType: 'negative',
      icon: Receipt,
      description: 'All company operational expenses',
    },
    {
      title: 'Total Balance',
      value: `$${totalBalance.toLocaleString()}`,
      change: totalBalance > 0 ? '+' + ((totalBalance / (totalDeposits || 1)) * 100).toFixed(1) + '%' : '0%',
      changeType: totalBalance > 0 ? 'positive' : 'neutral',
      icon: Wallet,
      description: 'All Deposits - All Withdrawals',
    },
    {
      title: 'Total Client Incentives',
      value: `$${totalClientIncentives.toLocaleString()}`,
      change: totalClientIncentives > 0 ? `$${totalClientIncentives.toLocaleString()} paid` : 'No incentives',
      changeType: 'negative',
      icon: Gift,
      description: 'All client incentive payments',
    },
    {
      title: 'Balance (Excluding Expenses)',
      value: `$${balanceExcludingExpenses.toLocaleString()}`,
      change: balanceExcludingExpenses > 0 ? '+' + ((balanceExcludingExpenses / (totalBalance || 1)) * 100).toFixed(1) + '%' : '0%',
      changeType: balanceExcludingExpenses > 0 ? 'positive' : 'negative',
      icon: Calculator,
      description: 'Total Balance - Company Expenses',
    },
    {
      title: 'Net Profit',
      value: `$${netProfit.toLocaleString()}`,
      change: netProfit > 0 ? '+' + ((netProfit / (balanceExcludingExpenses || 1)) * 100).toFixed(1) + '%' : '0%',
      changeType: netProfit > 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      description: 'Balance Excluding Expenses - Client Incentives',
    },
  ];

  // Use real activities from context, limit to 5 most recent
  const allActivities = getFilteredActivities();
  
  // Format time function
  const formatActivityTime = (time: string | Date) => {
    try {
      const date = new Date(time);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      
      // For older dates, show actual date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error, time);
      return 'Unknown time';
    }
  };
  
  const recentActivities = allActivities.slice(0, 5).map(activity => ({
    id: activity.id,
    action: activity.action,
    user: activity.user,
    time: formatActivityTime(activity.time),
    type: activity.type,
    details: activity.details,
  }));

  // Debug logging
  console.log('🔍 Dashboard Debug:');
  console.log('👤 Current User:', user);
  console.log('👤 User Role:', user?.role);
  console.log('📊 Activities Count:', allActivities.length);
  console.log('📊 Recent Activities:', recentActivities.length);
  console.log('🔐 Can View Dashboard Extras:', canViewDashboardExtras());
  console.log('📋 All Activities:', allActivities);

  return (
    <div className="p-6 space-y-6">
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Loading data...</span>
          </div>
        </div>
      )}
      
      {/* Welcome Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of deposits, withdrawals, expenses, and profit.</p>
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
                <Calendar
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

            {/* Active Filters Indicator & Clear All */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  clearCustomDateRange();
                }}
                className="text-gray-600 hover:text-gray-700 text-xs border border-gray-300 hover:border-gray-400 px-3 py-2"
              >
                Clear All
              </Button>
            )}

            <Badge variant={canViewAllEntries() ? "default" : "secondary"} className="text-sm">
              {canViewAllEntries() ? "Admin View (All Data)" : `Staff View (${user?.name})`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Financial Stats Grid - 7 Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="group relative overflow-hidden border border-purple-200/60 bg-gradient-to-br from-white via-purple-50/40 to-[#6a40ec]/15 transition-all duration-500 hover:scale-[1.02] hover:border-[#6a40ec]/30 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-[#6a40ec]/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <CardHeader className="relative flex flex-row items-start justify-between space-y-0 px-4 pt-4 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-xs font-semibold uppercase leading-tight tracking-wide text-gray-700">
                    {stat.title}
                  </CardTitle>
                </div>
                <div className="flex-shrink-0 rounded-lg border border-[#6a40ec]/20 bg-gradient-to-br from-[#6a40ec]/15 via-[#6a40ec]/20 to-[#6a40ec]/25 p-2 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <Icon className="h-4 w-4 text-[#6a40ec] drop-shadow-sm" />
                </div>
              </CardHeader>
              <CardContent className="relative px-4 pb-4 pt-1">
                <div className="space-y-2">
                  <div className="text-2xl font-bold leading-none tracking-tight text-gray-900">
                    {stat.value}
                  </div>
                  <div className="flex items-center justify-start">
                    <div
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors ${
                        stat.changeType === 'positive'
                          ? 'border-green-200 bg-green-100 text-green-700'
                          : stat.changeType === 'negative'
                          ? 'border-red-200 bg-red-100 text-red-700'
                          : 'border-gray-200 bg-gray-100 text-gray-700'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-xs font-medium leading-relaxed text-gray-600">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Staff Summary Card - Show for all users */}
      {!canViewAllEntries() && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Your Summary</span>
            </CardTitle>
            <CardDescription>Your individual contribution to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{deposits.length}</div>
                <div className="text-sm text-gray-600">Your Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${totalDeposits.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Your Deposits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">${totalCompanyExpenses.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Your Expenses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${totalClientIncentives.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Your Incentives</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid - Only show for admin/manager roles */}
      {/* Recent Activity - Visible to all users */}
        <div className="grid grid-cols-1 gap-4">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Financial Activity</CardTitle>
                <CardDescription>Latest financial transactions and updates</CardDescription>
              </div>
              {canAccessActivityLogs() && (
                <Button
                  onClick={() => setCurrentPage('activity-logs')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 px-3 py-2"
                >
                  <span>View All</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activities found.</p>
                  <p className="text-sm mt-1">Activities will appear here when you add deposits, banks, or transactions.</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                      activity.type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                      {activity.details && (
                        <p className="text-xs text-gray-400 mt-1">{activity.details}</p>
                      )}
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {activity.time}
                  </div>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        </div>


    </div>
  );
}