import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
}

export function useDeleteConfirmation() {
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    options: DeleteConfirmationOptions | null;
  }>({
    isOpen: false,
    options: null
  });

  const showConfirmation = (options: DeleteConfirmationOptions) => {
    setConfirmation({
      isOpen: true,
      options
    });
  };

  const hideConfirmation = () => {
    setConfirmation({
      isOpen: false,
      options: null
    });
  };

  const handleConfirm = () => {
    if (confirmation.options?.onConfirm) {
      confirmation.options.onConfirm();
    }
    hideConfirmation();
  };

  const DeleteConfirmationDialog = () => (
    <AlertDialog 
      open={confirmation.isOpen} 
      onOpenChange={hideConfirmation}
    >
      <AlertDialogContent className="z-[100]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            {confirmation.options?.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmation.options?.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {confirmation.options?.confirmText || 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    showConfirmation,
    hideConfirmation,
    DeleteConfirmationDialog
  };
}