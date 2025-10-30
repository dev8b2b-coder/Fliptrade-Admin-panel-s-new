import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Eye, EyeOff, User, Lock, Mail, Calendar } from 'lucide-react';
import { useAdmin, Staff } from './admin-context';
import ApiService from '../services/api';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user, setUser } = useAdmin();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      if (user) {
        // Update profile in database
        await ApiService.updateStaff(user.id, {
          name: name,
          // Don't update email as it should be read-only
        });

        // Update local user state
        const updatedUser = { ...user, name };
        setUser(updatedUser);
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      if (user) {
        // Verify current password against DB
        const dbStaff = await ApiService.getStaffById(user.id);
        if (!dbStaff) {
          throw new Error('User not found');
        }
        const currentHash = (dbStaff as any).password_hash;
        if (!currentHash || currentPassword !== currentHash) {
          toast.error('Current password is incorrect');
          setIsChangingPassword(false);
          return;
        }

        // Update password in database
        await ApiService.updateStaff(user.id, {
          password_hash: newPassword, // In a real app, this should be hashed
        } as Partial<Staff>);

        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Image upload functionality removed for now

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-[#6a40ec] text-white text-xl">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <Badge className="mt-2 bg-[#6a40ec] hover:bg-[#5a2fd9]">
                  {user?.role}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-gray-600">Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings Tabs */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="general">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general" className="data-[state=active]:bg-[#6a40ec] data-[state=active]:text-white">
                  <User className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-[#6a40ec] data-[state=active]:text-white">
                  <Lock className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="general">
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="profile-image">Profile Image</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-[#6a40ec] text-white">
                          {user?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Image upload functionality removed for now */}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profile-email">Email Address</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      readOnly
                      className="mt-1 bg-gray-50 cursor-not-allowed"
                      placeholder="Email cannot be changed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contact your administrator to change your role
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec] px-3 py-2"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="security">
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>

                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirm-new-password"
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
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Password Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Mix of uppercase and lowercase letters</li>
                      <li>• At least one number or special character</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec] px-3 py-2"
                    disabled={isChangingPassword || newPassword !== confirmPassword || newPassword.length < 8}
                  >
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}