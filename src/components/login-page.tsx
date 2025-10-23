import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAdmin } from './admin-context';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ApiService from '../services/api';
import Group1 from '../imports/Group1-47-1099';
// import { toast } from 'sonner@2.0.3';

export function LoginPage() {
  const { setCurrentPage, setUser, setIsAuthenticated, getDefaultPageForUser, staff } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        // First try Supabase Auth login using API service
        try {
          const authData = await ApiService.login(email.trim(), password);
          
          if (authData?.user) {
            // Auth login successful, get staff data using API service
            const staffData = await ApiService.getStaffById(authData.user.id);

            if (!staffData || staffData.status !== 'active') {
              setError('User account not found or inactive. Please contact administrator.');
              return;
            }

            const newUser = {
              id: staffData.id,
              name: staffData.name,
              email: staffData.email,
              role: staffData.role,
              avatar: staffData.avatar,
            };
            setUser(newUser);
            setIsAuthenticated(true);
            
            // Update last login time
            try {
              await ApiService.updateLastLogin(staffData.id);
            } catch (error) {
              console.error('Failed to update last login:', error);
              // Don't block login if last login update fails
            }
            
            const defaultPage = newUser.role === 'Super Admin' || newUser.role === 'Admin' || newUser.role === 'Manager'
              ? 'dashboard'
              : 'deposits';
            setCurrentPage(defaultPage);
            return;
          }
        } catch (authError) {
          console.log('Auth login failed, trying direct staff login...');
        }

        // If Auth login fails, try direct staff table login (for new staff without Auth accounts)
        const allStaff = await ApiService.getAllStaff();
        const staffData = allStaff.find(s => s.email.toLowerCase() === email.trim().toLowerCase());

        if (!staffData || staffData.status !== 'active') {
          setError('Invalid email or password. Please check your credentials.');
          return;
        }

        // Check password (simple comparison for now)
        if (staffData.password_hash !== password) {
          setError('Invalid email or password. Please check your credentials.');
          return;
        }

        const newUser = {
          id: staffData.id,
          name: staffData.name,
          email: staffData.email,
          role: staffData.role,
          avatar: staffData.avatar,
        };
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Update last login time
        try {
          await ApiService.updateLastLogin(staffData.id);
        } catch (error) {
          console.error('Failed to update last login:', error);
          // Don't block login if last login update fails
        }
        
        const defaultPage = newUser.role === 'Super Admin' || newUser.role === 'Admin' || newUser.role === 'Manager'
          ? 'dashboard'
          : 'deposits';
        setCurrentPage(defaultPage);
      } else {
        // Fallback to existing mock login when Supabase env vars are missing
      const staffMember = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (staffMember && staffMember.status === 'active' && !staffMember.isArchived) {
        const newUser = {
          id: staffMember.id,
          name: staffMember.name,
          email: staffMember.email,
          role: staffMember.role,
          avatar: staffMember.avatar,
        };
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Update last login time (for fallback login)
        try {
          await ApiService.updateLastLogin(staffMember.id);
        } catch (error) {
          console.error('Failed to update last login:', error);
          // Don't block login if last login update fails
        }
        
        const defaultPage = newUser.role === 'Super Admin' || newUser.role === 'Admin' || newUser.role === 'Manager' 
          ? 'dashboard' 
          : 'deposits';
        setCurrentPage(defaultPage);
      } else {
          setError('Invalid email or password. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#6a40ec] to-[#8b5cf6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-56 h-16 flex items-center justify-center">
                <Group1 />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-800">Welcome Back</CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a40ec] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6a40ec] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center justify-center w-5 h-5"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage('forgot-password')}
                  className="text-sm text-[#6a40ec] hover:text-[#5a2fd9] transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white font-medium py-3 px-4 rounded-md transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-[#6a40ec] text-center flex items-center justify-center"
                disabled={isLoading}
                style={{ backgroundColor: '#6a40ec' }}
              >
                <span className="text-base font-medium">
                {isLoading ? 'Signing In...' : 'Sign In'}
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}