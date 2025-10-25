import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAdmin } from './admin-context';
import Group1 from '../imports/Group1-47-1099';
import { toast } from "sonner";
export function ChangePasswordPage() {
  const { setCurrentPage } = useAdmin();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCurrentPage('login');
      setIsLoading(false);
      toast.success('Password changed successfully! Please log in with your new password.');
    }, 1000);
  };
  const email=localStorage.getItem("email")

  async function handleResetPassword(email, password, confirmPassword) {
    const Server = import.meta.env.VITE_NODE_SERVER;
  
    if (!Server) {
      console.error("[handleResetPassword] Missing VITE_NODE_SERVER env variable.");
      toast.error("Server configuration missing.");
      return { error: "Server not configured." };
    }
  
    if (!email || !password || !confirmPassword) {
      toast.error("All fields are required.");
      return { error: "Missing required fields." };
    }
  
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return { error: "Passwords do not match." };
    }
  
    try {
      console.log("[handleResetPassword] 🔁 Sending request to:", `${Server}/v1/reset-password`, {
        email,
        password,
        confirmPassword,
      });
  
      const response = await fetch(`${Server}/v1/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.warn("[handleResetPassword]  Failed:", data);
        toast.error(data?.error || "Password reset failed.");
        return { error: data?.error || "Password reset failed." };
      }
  
      console.log("[handleResetPassword]  Success:", data);
      toast.success(data?.message || "Password reset successful!");
      return data;
    } catch (error) {
      console.error("[handleResetPassword]  Network Error:", error);
      toast.error("Network error while resetting password.");
      return { error: "Network error while resetting password." };
    }
  }
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isFormValid = password.length >= 8 && passwordsMatch;

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
            <CardTitle className="text-2xl text-gray-800">Set New Password</CardTitle>
            <CardDescription className="text-gray-600">
              Create a new secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordsMatch && (
                  <div className="flex items-center mt-1 text-green-600 text-xs">
                    <CheckCircle size={12} className="mr-1" />
                    Passwords match
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs text-gray-600">Password requirements:</div>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle size={12} className="mr-2" />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${passwordsMatch ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle size={12} className="mr-2" />
                    Passwords match
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec]"
                disabled={isLoading || !isFormValid}
                onClick={()=>{handleResetPassword(email,password,confirmPassword)
                  console.log("hit2");}
                  
                }
              >
                {isLoading ? 'Updating...' : 'Change Password'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setCurrentPage('login')}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}