import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, Download } from 'lucide-react';

interface UrlImportConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  notes?: string;
}

export const UrlImportConfirmModal: React.FC<UrlImportConfirmModalProps> = ({ onConfirm, onCancel, title, notes }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
      >
        <div className="bg-amber-600 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Load Shared Patch?
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 border rounded-md transition-colors w-full sm:w-auto"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition-colors w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> Load Shared Patch
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
