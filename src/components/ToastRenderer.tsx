import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { ToastMessage } from '../hooks/useToast';

interface ToastRendererProps {
  toast: ToastMessage | null;
  setToast: (toast: ToastMessage | null) => void;
}

export const ToastRenderer: React.FC<ToastRendererProps> = ({ toast, setToast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-6 left-1/2 z-50 bg-amber-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold max-w-md border border-amber-400 print:hidden"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
