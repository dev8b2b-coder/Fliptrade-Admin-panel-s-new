import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
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
  Search, 
  MoreHorizontal, 
  RotateCcw, 
  Trash2,
  Filter,
  X
} from 'lucide-react';
import { useAdmin, Staff, UserRole } from './admin-context';
import { toast } from 'sonner@2.0.3';
import { TablePagination } from './table-pagination';

export function ArchivedPage() {
  const { staff, setStaff } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPageState] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedMember, setSelectedMember] = useState<Staff | null>(null);

  // Filter to show only archived staff
  const archivedStaff = useMemo(() => {
    return staff.filter((member) => member.isArchived === true);
  }, [staff]);

  const filteredArchivedStaff = useMemo(() => {
    return archivedStaff.filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || member.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [archivedStaff, searchTerm, filterRole]);

  const paginatedArchivedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredArchivedStaff.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredArchivedStaff, currentPage, itemsPerPage]);

  const hasActiveFilters = searchTerm !== '' || filterRole !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setCurrentPageState(1);
  };

  const handleRestore = (memberId: string) => {
    setStaff(staff.map(member => 
      member.id === memberId 
        ? { ...member, isArchived: false, archivedAt: undefined }
        : member
    ));
    toast.success('Staff member restored successfully');
  };

  const handlePermanentDelete = (memberId: string) => {
    setStaff(staff.filter(member => member.id !== memberId));
    setSelectedMember(null);
    toast.success('Staff member permanently deleted');
  };

  const getRoleBadge = (role: UserRole) => {
    const roleColors: Record<UserRole, string> = {
      'Super Admin': 'bg-purple-600 hover:bg-purple-600',
      'Admin': 'bg-[#6a40ec] hover:bg-[#6a40ec]',
      'Manager': 'bg-blue-500 hover:bg-blue-500', 
      'Accountant': 'bg-green-500 hover:bg-green-500',
      'Viewer': 'bg-gray-500 hover:bg-gray-500',
    };
    
    return (
      <Badge className={`${roleColors[role]} text-white`}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archived Staff</h1>
          <p className="text-gray-600 mt-1">Manage archived team members - restore or permanently delete.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Filter archived staff members by search term and role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search archived staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                  className="flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>Clear Filters</span>
                </Button>
              )}
              <span className="text-sm text-gray-500">
                {filteredArchivedStaff.length} of {archivedStaff.length} archived
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Archived Team Members ({filteredArchivedStaff.length})</CardTitle>
          <CardDescription>
            These staff members have been archived and can be restored or permanently deleted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status at Archive</TableHead>
                  <TableHead>Archived Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedArchivedStaff.map((member) => (
                  <TableRow key={member.id} className="opacity-70">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-gray-500 text-white">
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
                      <Badge 
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                        className={member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {member.archivedAt ? new Date(member.archivedAt).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer text-green-600"
                            onClick={() => handleRestore(member.id)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedMember(member);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Permanently Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete {selectedMember?.name}'s account and remove all of their data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setSelectedMember(null)}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => selectedMember && handlePermanentDelete(selectedMember.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Permanently Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {paginatedArchivedStaff.length === 0 && filteredArchivedStaff.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No archived staff members found.</p>
              </div>
            )}
          </div>
          
          {filteredArchivedStaff.length > 0 && (
            <TablePagination
              totalItems={filteredArchivedStaff.length}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPageState}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPageState(1);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}