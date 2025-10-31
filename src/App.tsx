import React from 'react';
import { AdminProvider, useAdmin } from './components/admin-context';
import { LoginPage } from './components/login-page';
import { ForgotPasswordPage } from './components/forgot-password-page';
import { OTPVerificationPage } from './components/otp-verification-page';
import { ChangePasswordPage } from './components/change-password-page';
import { ResetPasswordPage } from './components/reset-password-page';
import { DashboardPage } from './components/dashboard-page';
import { ProfilePage } from './components/profile-page';
import { StaffManagementPage } from './components/staff-management-page';
import { AddStaffPage } from './components/add-staff-page';

import { EnhancedDepositsNew } from './components/enhanced-deposits-new';
import { BankDepositsPage } from './components/bank-deposits-page';
import { ActivityLogsPage } from './components/activity-logs-page';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { currentPage, isAuthenticated, canAccessStaffManagement, canAccessActivityLogs, canAccessDashboard, setCurrentPage, isLoading } = useAdmin();

  // Show authentication pages
  if (!isAuthenticated) {
    switch (currentPage) {
      case 'login':
        return <LoginPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'otp-verification':
        return <OTPVerificationPage />;
      case 'change-password':
        return <ChangePasswordPage />;
      default:
        return <LoginPage />;
    }
  }

  // Show reset password page (authenticated but needs password reset)
  if (currentPage === 'reset-password') {
    return <ResetPasswordPage />;
  }

  // Show authenticated pages with layout
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {currentPage === 'dashboard' && (
            isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="h-10 w-10 mx-auto border-4 border-[#6a40ec] border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-600">Loading dashboard…</p>
                </div>
              </div>
            ) : canAccessDashboard() ? (
              <DashboardPage />
            ) : (
              <div className="p-6">
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to access the Dashboard.</p>
                  <button 
                    onClick={() => setCurrentPage('deposits')}
                    className="bg-[#6a40ec] hover:bg-[#5a2fd9] text-white px-4 py-2 rounded-lg"
                  >
                    Go to Deposits
                  </button>
                </div>
              </div>
            )
          )}
          {currentPage === 'deposits' && <EnhancedDepositsNew />}
          {currentPage === 'bank-deposits' && <BankDepositsPage />}
          {currentPage === 'activity-logs' && (
            canAccessActivityLogs() ? (
              <ActivityLogsPage />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                  <p className="text-gray-600">You don't have permission to view activity logs.</p>
                </div>
              </div>
            )
          )}
          {currentPage === 'profile' && <ProfilePage />}
          {currentPage === 'staff-management' && (
            canAccessStaffManagement() ? (
              <StaffManagementPage />
            ) : (
              <div className="p-6">
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to access Staff Management.</p>
                  <button 
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-[#6a40ec] hover:bg-[#5a2fd9] text-white px-4 py-2 rounded-lg"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )
          )}
          {currentPage === 'add-staff' && (
            canAccessStaffManagement() ? (
              <AddStaffPage />
            ) : (
              <div className="p-6">
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                  <p className="text-gray-600 mb-4">You don't have permission to add staff members.</p>
                  <button 
                    onClick={() => setCurrentPage('dashboard')}
                    className="bg-[#6a40ec] hover:bg-[#5a2fd9] text-white px-4 py-2 rounded-lg"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <div className="size-full">
        <AppContent />
        <Toaster />
      </div>
    </AdminProvider>
  );
}