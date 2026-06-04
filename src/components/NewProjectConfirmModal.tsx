import React from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { ModalBase } from './ModalBase';

interface NewProjectConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const NewProjectConfirmModal: React.FC<NewProjectConfirmModalProps> = ({ onClose, onConfirm }) => {
  return (
    <ModalBase onClose={onClose} onSubmit={onConfirm} maxWidthClass="max-w-md">
      {/* Header */}
      <div className="bg-red-700 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Trash2 className="w-5 h-5 animate-pulse" /> Clear Project Data?
        </h3>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          type="button"
          className="text-red-200 hover:text-white transition-colors p-2 -m-2"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">
            This action will reset your grid structure to default dimensions and permanently erase all channel names, metadata (mic, stand, notes), group colors, and stereo links.
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Are you sure you want to create a new project? This action cannot be undone.
        </p>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm transition-colors"
        >
          Yes, Create New Project
        </motion.button>
      </div>
    </ModalBase>
  );
};
