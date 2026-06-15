import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Save, X } from 'lucide-react';

interface DuplicateResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverwrite: () => void;
  onSaveAsCopy: () => void;
  onOpenExisting?: () => void; // Optional: if exact match
  isExactMatch?: boolean;
}

export function DuplicateResolveModal({
  isOpen,
  onClose,
  onOverwrite,
  onSaveAsCopy,
  onOpenExisting,
  isExactMatch
}: DuplicateResolveModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200"
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Project Already Exists</h2>
            {isExactMatch ? (
              <p className="text-slate-600 text-sm mb-6">
                You already have an identical copy of this project in your library.
              </p>
            ) : (
              <p className="text-slate-600 text-sm mb-6">
                A version of this project already exists in your library. What would you like to do?
              </p>
            )}

            <div className="space-y-3">
              {isExactMatch && onOpenExisting && (
                <button
                  onClick={onOpenExisting}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Open Existing Project</h3>
                    <p className="text-xs text-slate-500">Return to your saved version</p>
                  </div>
                </button>
              )}

              {!isExactMatch && (
                <button
                  onClick={onOverwrite}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-600 group-hover:bg-rose-200 transition-colors">
                    <Save className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Overwrite Existing</h3>
                    <p className="text-xs text-slate-500">Replace your local copy with this shared version</p>
                  </div>
                </button>
              )}

              <button
                onClick={onSaveAsCopy}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Save as New Copy</h3>
                  <p className="text-xs text-slate-500">Create a new duplicate project</p>
                </div>
              </button>

              <button
                onClick={onClose}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Cancel</h3>
                  <p className="text-xs text-slate-500">Keep previewing without saving</p>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
