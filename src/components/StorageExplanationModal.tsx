import React from 'react';
import { X, HelpCircle, HardDrive, Share2, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { ModalBase } from './ModalBase';

interface StorageExplanationModalProps {
  onClose: () => void;
}

export const StorageExplanationModal: React.FC<StorageExplanationModalProps> = ({ onClose }) => {
  return (
    <ModalBase onClose={onClose} maxWidthClass="max-w-md" zIndexClass="z-[70]">
      {/* Header */}
      <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-lg">How storage & sharing work</h3>
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          type="button"
          className="text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5 bg-slate-50 overflow-y-auto max-h-[70vh]">
        {/* Section 1: Local Storage */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-500" /> Where is my data stored?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Projects are saved directly inside your browser's database (IndexedDB). 
            No data is stored or backed up on a remote server.
          </p>
        </div>

        {/* Section 2: Re-sharing */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-500" /> Why must I re-share links?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            The shared link contains your entire configuration encoded in the URL. 
            Since there is no database to sync updates, you must share a new link when you make changes.
          </p>
        </div>

        {/* Section 3: No Cloud Sync */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-500" /> Why not use cloud sync?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Adding cloud database sync and user accounts requires user management, authentication, 
            and paid hosting. Keeping the app database-free lets us keep the tool completely free and account-free.
            {' '}
            <a
              href="https://buymeacoffee.com/lostviking09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
            >
              If you'd like to support the project's hosting, you can buy me a coffee! ☕
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end bg-white">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-5 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          Got it
        </motion.button>
      </div>
    </ModalBase>
  );
};
