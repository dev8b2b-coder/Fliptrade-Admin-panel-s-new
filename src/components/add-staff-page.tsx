import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { ArrowLeft, Mail, UserPlus, Shield } from 'lucide-react';
import { useAdmin, Staff, UserRole, UserPermissions, ModulePermission } from './admin-context';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ApiService from '../services/api';
import { env } from 'process';

const defaultPermissions: Record<UserRole, UserPermissions> = {
  'Super Admin': {
    dashboard: { view: true, add: false, edit: false, delete: false },
    deposits: { view: true, add: true, edit: true, delete: true },
    bankDeposits: { view: true, add: true, edit: true, delete: true },
    staffManagement: { view: true, add: true, edit: true, delete: true },
    activityLogs: { view: true, add: true, edit: true, delete: true },
  },
  'Admin': {
    dashboard: { view: true, add: false, edit: false, delete: false },
    deposits: { view: true, add: true, edit: true, delete: false },
    bankDeposits: { view: true, add: true, edit: false, delete: false },
    staffManagement: { view: true, add: true, edit: true, delete: false },
    activityLogs: { view: true, add: true, edit: true, delete: false },
  },
  'Manager': {
    dashboard: { view: true, add: false, edit: false, delete: false },
    deposits: { view: true, add: true, edit: true, delete: false },
    bankDeposits: { view: true, add: true, edit: false, delete: false },
    staffManagement: { view: true, add: true, edit: true, delete: false },
    activityLogs: { view: false, add: false, edit: false, delete: false },
  },
  'Accountant': {
    dashboard: { view: true, add: false, edit: false, delete: false },
    deposits: { view: true, add: true, edit: true, delete: false },
    bankDeposits: { view: true, add: true, edit: true, delete: false },
    staffManagement: { view: false, add: false, edit: false, delete: false },
    activityLogs: { view: false, add: false, edit: false, delete: false },
  },
  'Viewer': {
    dashboard: { view: true, add: false, edit: false, delete: false },
    deposits: { view: true, add: false, edit: false, delete: false },
    bankDeposits: { view: true, add: false, edit: false, delete: false },
    staffManagement: { view: false, add: false, edit: false, delete: false },
    activityLogs: { view: false, add: false, edit: false, delete: false },
  },
};

export function AddStaffPage() {
  const NodeServer = "http://localhost:8787";
  
  
  const { setCurrentPage, staff, setStaff, addActivity } = useAdmin();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '' as UserRole | '',
    temporaryPassword: '',
    permissions: {
      dashboard: { view: false, add: false, edit: false, delete: false },
      deposits: { view: false, add: false, edit: false, delete: false },
      bankDeposits: { view: false, add: false, edit: false, delete: false },
      staffManagement: { view: false, add: false, edit: false, delete: false },
      activityLogs: { view: false, add: false, edit: false, delete: false },
    } as UserPermissions,
    sendEmail: false,
    emailMessage: 'You\'ve been invited to join our team. Use this temporary password to sign in: <temporary-password>. You will be prompted to create a new password when you first log in.',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      // Don't automatically set permissions - let user set them manually
      // permissions: defaultPermissions[role],
    }));
  };

  const handlePermissionChange = (module: keyof UserPermissions, action: keyof ModulePermission, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormData(prev => ({ ...prev, sendEmail: true }));
    console.log("Sending mails test emaisls",FormData);
    

    try {
      if (isSupabaseConfigured) {
        // Check if email already exists
        const existingStaff = await ApiService.getAllStaff();
        const emailExists = existingStaff.some(staff => 
          staff.email.toLowerCase() === formData.email.toLowerCase()
        );
        
        if (emailExists) {
          toast.error('Email already exists. Please use a different email address.');
          setIsLoading(false);
          return;
        }

        // Create staff record using API service
        const staffData = await ApiService.createStaff({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: 'active',
          password_hash: formData.temporaryPassword, // Add password hash
        });

        // Create staff permissions using API service
        const moduleNameMap: Record<string, string> = {
          'dashboard': 'dashboard',
          'deposits': 'deposits',
          'bankDeposits': 'banks',
          'staffManagement': 'staff',
          'activityLogs': 'activities'
        };

        const permissionsToInsert = Object.entries(formData.permissions).map(([module, perms]) => ({
          staff_id: staffData.id,
          module: moduleNameMap[module] || module,
          can_view: (perms as ModulePermission).view,
          can_add: (perms as ModulePermission).add,
          can_edit: (perms as ModulePermission).edit,
          can_delete: (perms as ModulePermission).delete,
        }));

        console.log('🔍 Permissions to insert:', permissionsToInsert);
        try {
          await ApiService.createStaffPermissions(permissionsToInsert);
          console.log(' Staff permissions created successfully');
        } catch (permissionError) {
          console.error(' Error creating staff permissions:', permissionError);
          // If permissions fail, we should still show success for staff creation
          // but log the permission error
          toast.error('Staff created but permissions setup failed. Please edit permissions manually.');
        }

        // Add to local state for immediate UI update
        const newStaff: Staff = {
          id: staffData.id,
          name: formData.name,
          email: formData.email,
          role: formData.role as UserRole,
          permissions: formData.permissions,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        };

        setStaff([...staff, newStaff]);

        // if (formData.sendEmail) {
        //   const emailMessage = formData.emailMessage.replace('<temporary-password>', formData.temporaryPassword);
        //   toast.success(`Staff member added successfully! Email notification would be sent to ${formData.email} with temporary password.`);
        //   console.log('Email message:', emailMessage);
        // } else {
        //   toast.success('Staff member added successfully!');
        // }
        
        const shouldSendEmail = true;
        if (shouldSendEmail) {
          console.log("tes the mails sending")
          try {
            const resp = await fetch(`${NodeServer}/api/send-welcome-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: formData.email,
                name: formData.name,
                temporaryPassword: formData.temporaryPassword,
              }),
            });
        
            if (!resp.ok) throw new Error('Email API failed');
            toast.success(`Welcome email sent to ${formData.email}`);
          } catch (err) {
            console.error(err);
            toast.error('Staff created, but sending email failed. Please try again.');
          }
        } else {
          toast.success('Staff member added successfully!');
        }

        // Add activity
        await addActivity(
          'Staff member created',
          'success',
          `Created new staff member: ${formData.name} (${formData.role})`
        );
      } else {
        // Fallback to mock data
      const newStaff: Staff = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role as UserRole,
        permissions: formData.permissions,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setStaff([...staff, newStaff]);
      
      // if (formData.sendEmail) {
      //     const emailMessage = formData.emailMessage.replace('<temporary-password>', formData.temporaryPassword);
      //     toast.success(`Staff member added successfully! Email notification would be sent to ${formData.email} with temporary password.`);
      //     console.log('Email message:', emailMessage);
      // } else {
      //   toast.success('Staff member added successfully!');
      // }



 
      }
      
      setCurrentPage('staff-management');
    } catch (error) {
      console.error('Error creating staff member:', error);
      toast.error(`Failed to create staff member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.role && formData.temporaryPassword;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={() => setCurrentPage('staff-management')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Staff Member</h1>
          <p className="text-gray-600 mt-1">Create a new team member account with role-based permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-[#6a40ec]" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Enter the basic details for the new staff member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                {formData.role && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.role === 'Super Admin' && 'Full access to all modules and operations'}
                    {formData.role === 'Admin' && 'Access to most modules with limited delete permissions'}
                    {formData.role === 'Manager' && 'Managerial access with editing capabilities'}
                    {formData.role === 'Accountant' && 'Financial modules access only'}
                    {formData.role === 'Viewer' && 'Read-only access to permitted modules'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="temporaryPassword">Set Password (temporary) *</Label>
                <Input
                  id="temporaryPassword"
                  type="password"
                  value={formData.temporaryPassword}
                  onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
                  placeholder="Enter temporary password"
                  className="mt-1"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The staff member will use this password for their first login and will be prompted to create a new password.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-[#6a40ec]" />
              Module Permissions
            </CardTitle>
            <CardDescription>
              Customize permissions for each module manually or load default permissions for the selected role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Load Default Permissions Button */}
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (formData.role) {
                    setFormData(prev => ({
                      ...prev,
                      permissions: defaultPermissions[formData.role]
                    }));
                    toast.success(`Default permissions loaded for ${formData.role} role`);
                  }
                }}
                disabled={!formData.role}
                className="text-sm"
              >
                Load Default Permissions for {formData.role || 'Selected Role'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Click to load default permissions for the selected role, or customize manually below
              </p>
            </div>
            <div className="space-y-6">
              {Object.entries(formData.permissions).map(([module, perms]) => (
                <div key={module} className="border rounded-lg p-4">
                  <h4 className="font-medium capitalize mb-3">{module.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(perms as Record<string, boolean>).map(([action, enabled]) => (
                      <div key={action} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module}-${action}`}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(
                              module as keyof UserPermissions, 
                              action as keyof ModulePermission, 
                              !!checked
                            )
                          }
                        />
                        <Label htmlFor={`${module}-${action}`} className="text-sm capitalize">
                          {action}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

   
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage('staff-management')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isLoading}
          
          className="bg-[#6a40ec] hover:bg-[#5a2fd9] text-white"
        >
          {isLoading ? 'Adding Staff Member...' : 'Add Staff Member'}
        </Button>
      </div>

      {/* Summary Card */}
      {isFormValid && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {formData.name}
              </div>
              <div>
                <strong>Email:</strong> {formData.email}
              </div>
              <div>
                <strong>Role:</strong> {formData.role}
              </div>
              <div>
                <strong>Email Notification:</strong> {formData.sendEmail ? 'Yes' : 'No'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}