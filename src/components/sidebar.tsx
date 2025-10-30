import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign,
  Building2,
  LogOut,
  X,
  Check,
  Activity
} from 'lucide-react';
import { useAdmin } from './admin-context';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import Group1 from '../imports/Group1-47-1099';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    page: 'dashboard' as const,
  },
  {
    id: 'deposits',
    label: 'Deposits',
    icon: DollarSign,
    page: 'deposits' as const,
  },
  {
    id: 'bank-deposits',
    label: 'Bank Deposits',
    icon: Building2,
    page: 'bank-deposits' as const,
  },
  {
    id: 'staff-management',
    label: 'Staff Management',
    icon: Users,
    page: 'staff-management' as const,
  },
  {
    id: 'activity-logs',
    label: 'Activity Logs',
    icon: Activity,
    page: 'activity-logs' as const,
  },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, setIsAuthenticated, setUser, canAccessStaffManagement, canAccessActivityLogs, canAccessDashboard, canAccessDeposits, canAccessBankDeposits } = useAdmin();

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
        {/* Logo Placeholder - Add your logo here */}

        <nav className="space-y-2">
          {menuItems.map((item) => {
            // Hide Dashboard for staff users without permission
            if (item.id === 'dashboard' && !canAccessDashboard()) {
              return null;
            }
            // Hide Staff Management for users without permission
            if (item.id === 'staff-management' && !canAccessStaffManagement()) {
              return null;
            }
            if (item.id === 'activity-logs' && !canAccessActivityLogs()) {
              return null;
            }
            if (item.id === 'deposits' && !canAccessDeposits()) {
              return null;
            }
            if (item.id === 'bank-deposits' && !canAccessBankDeposits()) {
              return null;
            }

            const Icon = item.icon;
            const isActive = currentPage === item.page;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#6a40ec] text-white hover:bg-[#5a2fd9] hover:text-white shadow-lg border-l-4 border-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800 hover:border-l-4 hover:border-gray-600'
                }`}
                onClick={() => setCurrentPage(item.page)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
      
      {/* Fixed Logout Button at Bottom */}
      <div className="p-4 border-t border-gray-700 space-y-2 flex-shrink-0">
        
        {/* Logout Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be redirected to the login page and need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Yes, Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}