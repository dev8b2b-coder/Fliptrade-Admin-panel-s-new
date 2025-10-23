import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Badge } from './ui/badge';
import { Database, Users, Building2, DollarSign, Trash2, RefreshCcw, TestTube, AlertTriangle } from 'lucide-react';
import { useAdmin } from './admin-context';
import { toast } from 'sonner@2.0.3';

export function TestDataManager() {
  const { 
    deposits, 
    bankTransactions, 
    staff, 
    generateTestDeposits, 
    generateTestBankTransactions, 
    generateTestStaff, 
    clearAllTestData,
    isAdmin
  } = useAdmin();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  if (!isAdmin()) {
    return null; // Only admins can access test data management
  }

  // Count test data entries
  const testDepositsCount = deposits.filter(d => d.id.startsWith('test-')).length;
  const testTransactionsCount = bankTransactions.filter(t => t.id.startsWith('test-')).length;
  const testStaffCount = staff.filter(s => s.id.startsWith('test-')).length;

  const handleGenerateTestDeposits = () => {
    generateTestDeposits();
    toast.success('Generated 15 test deposit entries');
  };

  const handleGenerateTestBankTransactions = () => {
    generateTestBankTransactions();
    toast.success('Generated 20 test bank transactions');
  };

  const handleGenerateTestStaff = () => {
    generateTestStaff();
    toast.success('Generated 3 test staff members');
  };

  const handleClearAllTestData = () => {
    clearAllTestData();
    setShowClearConfirmation(false);
    toast.success('All test data cleared');
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test Data
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Test Data Management
            </DialogTitle>
            <DialogDescription>
              Generate sample data for testing or clear existing test data. Test entries are marked with special IDs for easy identification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* Deposits Test Data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Deposits
                  </div>
                  <Badge variant="secondary">
                    {testDepositsCount} test entries
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Generate sample deposit entries with client incentives and expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateTestDeposits}
                  className="w-full"
                  size="sm"
                >
                  Generate 15 Deposits
                </Button>
              </CardContent>
            </Card>

            {/* Bank Transactions Test Data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Bank Transactions
                  </div>
                  <Badge variant="secondary">
                    {testTransactionsCount} test entries
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Generate sample bank transactions across different banks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateTestBankTransactions}
                  className="w-full"
                  size="sm"
                >
                  Generate 20 Transactions
                </Button>
              </CardContent>
            </Card>

            {/* Staff Test Data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Staff Members
                  </div>
                  <Badge variant="secondary">
                    {testStaffCount} test entries
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Generate sample staff members with different roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleGenerateTestStaff}
                  className="w-full"
                  size="sm"
                >
                  Generate 3 Staff
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button
              onClick={() => {
                handleGenerateTestDeposits();
                handleGenerateTestBankTransactions();
                handleGenerateTestStaff();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Generate All Test Data
            </Button>
            
            {(testDepositsCount > 0 || testTransactionsCount > 0 || testStaffCount > 0) && (
              <Button
                variant="destructive"
                onClick={() => setShowClearConfirmation(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Test Data
              </Button>
            )}
          </div>

          {/* Current Test Data Summary */}
          {(testDepositsCount > 0 || testTransactionsCount > 0 || testStaffCount > 0) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Current Test Data Summary:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• {testDepositsCount} test deposit entries</div>
                <div>• {testTransactionsCount} test bank transactions</div>
                <div>• {testStaffCount} test staff members</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Clear All Test Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all test data including:
              <br />
              • {testDepositsCount} test deposit entries
              <br />
              • {testTransactionsCount} test bank transactions  
              <br />
              • {testStaffCount} test staff members
              <br /><br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllTestData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Test Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}