import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Search, Filter, Calendar, X, Download, RefreshCw } from 'lucide-react';
import { useAdmin, type Activity } from './admin-context';
import { TablePagination } from './table-pagination';
import { format } from 'date-fns';
import ApiService from '../services/api';

export function ActivityLogsPage() {
  const { 
    getFilteredActivities, 
    user, 
    canViewAllEntries,
    refreshAllData,
    isLoading
  } = useAdmin();


  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');


  // Get all activities
  const allActivities = getFilteredActivities();

  // Filter activities based on search and filters
  const filteredActivities = useMemo(() => {
    let filtered = allActivities.filter((activity) => {
      const matchesSearch = 
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesUser = userFilter === 'all' || activity.userId === userFilter;
      
      return matchesSearch && matchesUser;
    });

    // Sort activities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'action-asc':
          return a.action.localeCompare(b.action);
        case 'action-desc':
          return b.action.localeCompare(a.action);
        case 'user-asc':
          return a.user.localeCompare(b.user);
        case 'user-desc':
          return b.user.localeCompare(a.user);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allActivities, searchTerm, userFilter, sortBy]);

  // Paginate activities
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage, itemsPerPage]);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = allActivities.map(activity => ({
      id: activity.userId,
      name: activity.user
    }));
    return users.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
  }, [allActivities]);


  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📝';
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setUserFilter('all');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || userFilter !== 'all';

  const exportToCSV = () => {
    const csvContent = [
      ['Timestamp', 'Action', 'User', 'Details'].join(','),
      ...filteredActivities.map(activity => [
        format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        `"${activity.action}"`,
        `"${activity.user}"`,
        `"${activity.details || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">
            Complete audit trail of all system activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="border border-gray-300 hover:border-gray-400 px-3 py-2"
            disabled={filteredActivities.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => refreshAllData()}
            className="border border-gray-300 hover:border-gray-400 px-3 py-2"
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="action-asc">Action A-Z</SelectItem>
                <SelectItem value="action-desc">Action Z-A</SelectItem>
                <SelectItem value="user-asc">User A-Z</SelectItem>
                <SelectItem value="user-desc">User Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            {hasActiveFilters && (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
            <span className="text-sm text-gray-500">
              {filteredActivities.length} of {allActivities.length} activities
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Complete audit trail of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No activities found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(activity.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {getTypeIcon(activity.type)} {activity.action}
                        </TableCell>
                        <TableCell>{activity.user}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {activity.details || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredActivities.length > 0 && (
                <TablePagination
                  totalItems={filteredActivities.length}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
