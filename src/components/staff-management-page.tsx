import React, { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Switch } from './ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  X,
  UserX,
  RefreshCw
} from 'lucide-react';
import { useAdmin, Staff, UserRole } from './admin-context';
import { toast } from 'sonner';
import ApiService from '../services/api';
import { TablePagination } from './table-pagination';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function StaffManagementPage() {
  const { staff, setStaff, setCurrentPage, user, canViewAllEntries, addActivity, refreshAllData, isLoading } = useAdmin();

  // Debug logging for staff data
  console.log('🔍 Staff Management Debug:', {
    staffCount: staff.length,
    staff: staff,
    user: user,
    isLoading: isLoading
  });

  // Refresh data when component mounts
  React.useEffect(() => {
    refreshAllData();
  }, []);

  // Permission checks for current user
  const getCurrentUserPermissions = () => {
    if (!user) return null;
    const currentStaff = staff.find(s => s.id === user.id);
    return currentStaff?.permissions.staffManagement || null;
  };

  const canAddStaff = () => {
    const permissions = getCurrentUserPermissions();
    
    // Debug logging
    console.log('🔍 canAddStaff Debug:', {
      user: user,
      userRole: user?.role,
      permissions: permissions,
      hasPermissions: !!permissions,
      permissionsAdd: permissions?.add
    });
    
    // Temporary fix: Force admin access for admin@gmail.com
    if (user?.email === 'admin@gmail.com') {
      console.log('🔍 Force admin access for admin@gmail.com');
      return true;
    }
    
    // Fallback to role-based check if permissions are not available
    if (!permissions) {
      const hasAccess = user?.role === 'Super Admin' || user?.role === 'Admin';
      console.log('🔍 Role-based access:', hasAccess);
      return hasAccess;
    }
    return permissions.add || false;
  };

  const canEditStaff = (staffMember: Staff) => {
    const permissions = getCurrentUserPermissions();
    
    // Temporary fix: Force admin access for admin@gmail.com
    if (user?.email === 'admin@gmail.com' && staffMember.id !== user?.id) {
      return true;
    }
    
    // Fallback to role-based check if permissions are not available
    if (!permissions) {
      return (user?.role === 'Super Admin' || user?.role === 'Admin') && staffMember.id !== user?.id;
    }
    
    // Users with edit permission can edit others, but not themselves to prevent role escalation
    return permissions.edit && staffMember.id !== user?.id;
  };

  const canDeleteStaff = (staffMember: Staff) => {
    const permissions = getCurrentUserPermissions();
    
    // Temporary fix: Force admin access for admin@gmail.com
    if (user?.email === 'admin@gmail.com' && staffMember.id !== user?.id) {
      return true;
    }
    
    // Fallback to role-based check if permissions are not available
    if (!permissions) {
      return (user?.role === 'Super Admin' || user?.role === 'Admin') && staffMember.id !== user?.id;
    }
    
    // Users with delete permission can delete others, but not themselves
    return permissions.delete && staffMember.id !== user?.id;
  };

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [currentPage, setCurrentPageState] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedMember, setSelectedMember] = useState<Staff | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<any>(null);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    staff: Staff | null;
  }>({
    isOpen: false,
    staff: null
  });

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      // Filter out archived members
      if (member.isArchived) return false;
      
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [staff, searchTerm, filterStatus, filterRole]);

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStaff, currentPage, itemsPerPage]);

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || filterRole !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterRole('all');
    setCurrentPageState(1);
  };

  const handleStatusToggle = async (memberId: string) => {
    try {
      const member = staff.find(s => s.id === memberId);
      if (!member) return;

      const newStatus = member.status === 'active' ? 'inactive' : 'active';
      
      // Update in database
      const updatedMember = await ApiService.updateStaff(memberId, { status: newStatus });
      
      // Update local state
      setStaff(staff.map(s => 
        s.id === memberId ? { ...s, status: updatedMember?.status ?? newStatus } : s
      ));
      
      toast.success(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);

      if (newStatus === 'inactive') {
        toast.info('The staff member has been logged out of all active sessions.');
      }
      
      // Add activity log
      await addActivity(
        `Staff member ${member.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
        'info',
        `Staff ID: ${memberId}, Email: ${member.email}`
      );

      // Refresh to sync with database state (ensures toggle persists on reload)
      await refreshAllData();
      
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update staff status. Please try again.');
    }
  };

  const handleDelete = (memberId: string) => {
    const staffMember = staff.find(s => s.id === memberId);
    if (!staffMember) return;

    // Show confirmation dialog
    setDeleteConfirmation({
      isOpen: true,
      staff: staffMember
    });
  };

  const confirmDeleteStaff = async () => {
    const staffMember = deleteConfirmation.staff;
    if (!staffMember) return;

    try {
      // Delete from database
      await ApiService.deleteStaff(staffMember.id);
      
      // Remove from local state
      setStaff(staff.filter(member => member.id !== staffMember.id));
    
    setDeleteConfirmation({
      isOpen: false,
      staff: null
    });
    
      toast.success('Staff member deleted successfully');
      
      // Add activity log
      await addActivity(
        `Staff member ${staffMember.name} deleted`,
        'warning',
        `Staff ID: ${staffMember.id}, Email: ${staffMember.email}`
      );
      
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error('Failed to delete staff member. Please try again.');
    }
  };

  const handleViewDetails = (member: Staff) => {
    setSelectedMember(member);
    setViewDetailsOpen(true);
  };

  const handleEditPermissions = (member: Staff) => {
    setEditingPermissions({ ...member });
    setEditPermissionsOpen(true);
  };

  const updateMemberPermissions = async () => {
    if (!editingPermissions) return;

      try {
        // Persist permissions to DB (staff_permissions)
        await ApiService.upsertStaffPermissions(editingPermissions.id, editingPermissions.permissions);
        // Update basic staff fields (excluding permissions)
        await ApiService.updateStaff(editingPermissions.id, {
          name: editingPermissions.name,
          email: editingPermissions.email,
          role: editingPermissions.role,
          status: editingPermissions.status,
          avatar: editingPermissions.avatar,
        } as any);
        
        // Update local state
      setStaff(staff.map(s => 
        s.id === editingPermissions.id ? editingPermissions : s
      ));
        
      setEditPermissionsOpen(false);
      toast.success('Permissions updated successfully');
        
      // Add activity log
        await addActivity(
        `Updated permissions for ${editingPermissions.name}`,
          'info',
        `Staff ID: ${editingPermissions.id}`
        );
      
      } catch (error) {
      console.error('Error updating permissions:', error);
      toast.error('Failed to update permissions. Please try again.');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleColors = {
      'Super Admin': 'bg-red-100 text-red-800',
      'Admin': 'bg-purple-100 text-purple-800',
      'Manager': 'bg-blue-100 text-blue-800',
      'Accountant': 'bg-green-100 text-green-800',
      'Viewer': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (status: 'active' | 'inactive') => {
    return (
      <Badge className={status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {status}
      </Badge>
    );
  };

  const getPermissionsSummary = (member: Staff) => {
    const permissions: string[] = [];
    if (member.permissions.dashboard.view) permissions.push('Dashboard');
    if (member.permissions.deposits.view) permissions.push('Deposits');
    if (member.permissions.bankDeposits.view) permissions.push('Bank Deposits');
    if (member.permissions.staffManagement.view) permissions.push('Staff Management');
    return permissions;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center  justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members and their role-based permissions.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button
            onClick={() => refreshAllData()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border border-gray-300 hover:border-gray-400 px-3 py-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        {canAddStaff() ? (
          <Button 
            onClick={() => setCurrentPage('add-staff')}
              className="bg-[#6a40ec] hover:bg-[#5a2fd9] text-white border border-[#6a40ec] px-3 py-2"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  disabled
                    className="bg-gray-300 text-gray-500 cursor-not-allowed px-3 py-2"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>
              </TooltipTrigger>
                <TooltipContent>
                  <p>You don't have permission to add staff members</p>
                </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1 border border-gray-300 hover:border-gray-400 px-3 py-2"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </Button>
              )}
              <span className="text-sm text-gray-500">
                {filteredStaff.length} of {staff.length} staff
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Manage your team members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Module Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading staff data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {staff.length === 0 ? (
                          <div>
                            <UserX className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No staff members found</p>
                            <p className="text-sm">Add your first team member to get started.</p>
                          </div>
                        ) : (
                          <div>
                            <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">No staff members match your filters</p>
                            <p className="text-sm">Try adjusting your search or filter criteria.</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-[#6a40ec] text-white">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(member.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getPermissionsSummary(member).slice(0, 3).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {getPermissionsSummary(member).length > 3 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-help">
                                  +{getPermissionsSummary(member).length - 3}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium mb-1">Additional permissions:</p>
                                  {getPermissionsSummary(member).slice(3).map((permission) => (
                                    <p key={permission}>• {permission}</p>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={member.status === 'active'}
                              onCheckedChange={() => handleStatusToggle(member.id)}
                              disabled={member.id === user?.id}
                            />
                      {getStatusBadge(member.status)}
                          </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(member)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canEditStaff(member) && (
                                <DropdownMenuItem onClick={() => handleEditPermissions(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Permissions
                            </DropdownMenuItem>
                          )}
                          {canDeleteStaff(member) && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(member.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                    ))
                  )}
              </TableBody>
            </Table>
          </div>
          
          {filteredStaff.length > 0 && (
            <TablePagination
              totalItems={filteredStaff.length}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPageState}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPageState(1);
              }}
            />
          )}
          </div>
        </CardContent>
      </Card>

      {/* View Details Modal */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Member Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                  <AvatarFallback className="bg-[#6a40ec] text-white text-lg">
                    {selectedMember.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
                  <p className="text-gray-600">{selectedMember.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getRoleBadge(selectedMember.role)}
                    {getStatusBadge(selectedMember.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900">Account Information</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Created:</span> {new Date(selectedMember.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Last Login:</span> {selectedMember.lastLogin ? new Date(selectedMember.lastLogin).toLocaleDateString() : 'Never'}</p>
                    <p><span className="font-medium">Status:</span> {selectedMember.status}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Module Permissions</h4>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Dashboard:</span>
                      <span className={selectedMember.permissions.dashboard.view ? 'text-green-600' : 'text-red-600'}>
                        {selectedMember.permissions.dashboard.view ? 'View' : 'No Access'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deposits:</span>
                      <span className={selectedMember.permissions.deposits.view ? 'text-green-600' : 'text-red-600'}>
                        {selectedMember.permissions.deposits.view ? `${selectedMember.permissions.deposits.add ? 'Full' : 'View Only'}` : 'No Access'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank Deposits:</span>
                      <span className={selectedMember.permissions.bankDeposits.view ? 'text-green-600' : 'text-red-600'}>
                        {selectedMember.permissions.bankDeposits.view ? `${selectedMember.permissions.bankDeposits.add ? 'Full' : 'View Only'}` : 'No Access'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Management:</span>
                      <span className={selectedMember.permissions.staffManagement.view ? 'text-green-600' : 'text-red-600'}>
                        {selectedMember.permissions.staffManagement.view ? `${selectedMember.permissions.staffManagement.add ? 'Full' : 'View Only'}` : 'No Access'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Modal */}
      <Dialog open={editPermissionsOpen} onOpenChange={setEditPermissionsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {editingPermissions?.name}
            </DialogDescription>
          </DialogHeader>
          {editingPermissions && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Dashboard</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.dashboard.view}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            dashboard: {
                              ...editingPermissions.permissions.dashboard,
                              view: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">View</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.dashboard.add}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            dashboard: {
                              ...editingPermissions.permissions.dashboard,
                              add: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Add</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.dashboard.edit}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            dashboard: {
                              ...editingPermissions.permissions.dashboard,
                              edit: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Edit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.dashboard.delete}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            dashboard: {
                              ...editingPermissions.permissions.dashboard,
                              delete: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Delete</span>
                    </label>
                </div>
                      </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Deposits</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.deposits.view}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            deposits: {
                              ...editingPermissions.permissions.deposits,
                              view: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">View</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.deposits.add}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            deposits: {
                              ...editingPermissions.permissions.deposits,
                              add: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Add</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.deposits.edit}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            deposits: {
                              ...editingPermissions.permissions.deposits,
                              edit: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Edit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.deposits.delete}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            deposits: {
                              ...editingPermissions.permissions.deposits,
                              delete: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Delete</span>
                    </label>
                          </div>
                      </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Bank Deposits</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.bankDeposits.view}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            bankDeposits: {
                              ...editingPermissions.permissions.bankDeposits,
                              view: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">View</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.bankDeposits.add}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            bankDeposits: {
                              ...editingPermissions.permissions.bankDeposits,
                              add: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Add</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.bankDeposits.edit}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            bankDeposits: {
                              ...editingPermissions.permissions.bankDeposits,
                              edit: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Edit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.bankDeposits.delete}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            bankDeposits: {
                              ...editingPermissions.permissions.bankDeposits,
                              delete: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Delete</span>
                    </label>
                    </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Staff Management</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.staffManagement.view}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            staffManagement: {
                              ...editingPermissions.permissions.staffManagement,
                              view: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">View</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.staffManagement.add}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            staffManagement: {
                              ...editingPermissions.permissions.staffManagement,
                              add: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Add</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.staffManagement.edit}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            staffManagement: {
                              ...editingPermissions.permissions.staffManagement,
                              edit: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Edit</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingPermissions.permissions.staffManagement.delete}
                        onChange={(e) => setEditingPermissions({
                          ...editingPermissions,
                          permissions: {
                            ...editingPermissions.permissions,
                            staffManagement: {
                              ...editingPermissions.permissions.staffManagement,
                              delete: e.target.checked
                            }
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Delete</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditPermissionsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[#6a40ec] hover:bg-[#5a2fd9]"
                  onClick={updateMemberPermissions}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteConfirmation.isOpen} 
        onOpenChange={(isOpen) => 
          setDeleteConfirmation({
            isOpen,
            staff: null
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              Archive Staff Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{deleteConfirmation.staff?.name}"? This will remove them from active staff but preserve their data. This action can be undone later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteStaff}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
