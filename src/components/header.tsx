import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Settings, User, LogOut } from 'lucide-react';
import { useAdmin } from './admin-context';
import { EnhancedLogo } from './enhanced-logo';

export function Header() {
  const { user, setCurrentPage, setIsAuthenticated, setUser } = useAdmin();

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('login');
    // Clear localStorage
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_is_authenticated');
    localStorage.removeItem('admin_current_page');
  };

  const handleProfile = () => {
    setCurrentPage('profile');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-2">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center">
            <EnhancedLogo />
          </div>
        </div>

        {/* Right side - Admin button */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={handleProfile}
            className="px-4 py-2 rounded-md text-gray-700 hover:text-[#6a40ec] hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6a40ec] focus:ring-offset-2"
          >
            <User className="mr-2 h-4 w-4" />
            {user?.name || 'User'}
          </Button>
        </div>
      </div>
    </header>
  );
}