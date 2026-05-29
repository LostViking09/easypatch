import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Download } from 'lucide-react';
import { ModalBase } from './ModalBase';

interface UrlImportConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  notes?: string;
}

export const UrlImportConfirmModal: React.FC<UrlImportConfirmModalProps> = ({ onConfirm, onCancel, title, notes }) => {
  return (
    <ModalBase onClose={onCancel} onSubmit={onConfirm} maxWidthClass="max-w-md" zIndexClass="z-[100]">
      <div className="bg-amber-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> Load Shared Patch?
        </h3>
      </div>
      
      <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
        <p className="text-gray-700">
          You are about to load a shared patch from the URL. 
          <span className="font-bold text-red-600 ml-1">This will overwrite your current unsaved data.</span>
        </p>
        
        <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
          <p className="font-medium text-amber-900 mb-1">Incoming Patch Info:</p>
          <p className="text-amber-800">
            <span className="font-bold">Title:</span> {title || 'Untitled Patch'}
          </p>
          {notes && (
            <p className="text-amber-800 truncate">
              <span className="font-bold">Notes:</span> {notes}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 border-t flex flex-col-reverse sm:flex-row justify-end gap-3 bg-gray-50">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border rounded-md transition-colors w-full sm:w-auto"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition-colors w-full sm:w-auto"
        >
          <Download className="w-4 h-4" /> Load Shared Patch
        </motion.button>
      </div>
    </ModalBase>
  );
};
