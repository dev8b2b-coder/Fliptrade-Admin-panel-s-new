import React from 'react';
import { EnhancedBankDeposits } from './components/enhanced-bank-deposits';
import { EnhancedDepositsNew } from './components/enhanced-deposits-new';
import { StaffManagementPage } from './components/staff-management-page';
import { AdminProvider } from './components/admin-context';
import { Toaster } from './components/ui/sonner';

export default function TestDelete() {
  return (
    <AdminProvider>
      <div className="p-4 space-y-8">
        <h1 className="text-2xl font-bold">Delete Functionality Test</h1>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-xl mb-4">Bank Deposits</h2>
          <EnhancedBankDeposits />
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-xl mb-4">Regular Deposits</h2>
          <EnhancedDepositsNew />
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-xl mb-4">Staff Management</h2>
          <StaffManagementPage />
        </div>
      </div>
      <Toaster />
    </AdminProvider>
  );
}