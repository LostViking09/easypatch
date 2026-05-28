import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Folder, Palette, Trash2 } from 'lucide-react';

interface MultiEditBarProps {
  isMultiEdit: boolean;
  selectedIds: string[];
  setIsAssignSubSnakeOpen: (val: boolean) => void;
  setIsMultiGroupOpen: (val: boolean) => void;
  setIsMultiColorOpen: (val: boolean) => void;
  handleMultiEditClear: () => void;
  setSelectedIds: (val: string[]) => void;
  setIsMultiEdit: (val: boolean) => void;
}

export function MultiEditBar({
  isMultiEdit,
  selectedIds,
  setIsAssignSubSnakeOpen,
  setIsMultiGroupOpen,
  setIsMultiColorOpen,
  handleMultiEditClear,
  setSelectedIds,
  setIsMultiEdit
}: MultiEditBarProps) {
  if (!isMultiEdit) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        exit={{ y: 80, x: "-50%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-6 left-1/2 bg-slate-800 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40"
      >
        <div className="font-bold">
          {selectedIds.length === 0 ? "Select channels to edit" : `${selectedIds.length} channels selected`}
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
            disabled={selectedIds.length === 0}
            onClick={() => setIsAssignSubSnakeOpen(true)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              selectedIds.length > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                : 'bg-indigo-900/40 text-indigo-300/40 cursor-not-allowed'
            }`}
          >
            <Network className={`w-4 h-4 ${selectedIds.length > 0 ? 'text-indigo-200' : 'text-indigo-300/30'}`} /> SubSnake
          </motion.button>
          <motion.button
            whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
            disabled={selectedIds.length === 0}
            onClick={() => setIsMultiGroupOpen(true)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              selectedIds.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-blue-900/40 text-blue-300/40 cursor-not-allowed'
            }`}
          >
            <Folder className={`w-4 h-4 ${selectedIds.length > 0 ? 'text-blue-200' : 'text-blue-300/30'}`} /> Group
          </motion.button>
          <motion.button
            whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
            disabled={selectedIds.length === 0}
            onClick={() => setIsMultiColorOpen(true)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              selectedIds.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                : 'bg-emerald-900/40 text-emerald-300/40 cursor-not-allowed'
            }`}
          >
            <Palette className={`w-4 h-4 ${selectedIds.length > 0 ? 'text-emerald-200' : 'text-emerald-300/30'}`} /> Color
          </motion.button>
          <motion.button
            whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
            disabled={selectedIds.length === 0}
            onClick={handleMultiEditClear}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
              selectedIds.length > 0
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                : 'bg-red-900/40 text-red-300/40 cursor-not-allowed'
            }`}
          >
            <Trash2 className={`w-4 h-4 ${selectedIds.length > 0 ? 'text-red-200' : 'text-red-300/30'}`} /> Clear
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedIds([]);
              setIsMultiEdit(false);
            }}
            className="px-4 py-2 rounded-full text-sm font-bold bg-slate-600 hover:bg-slate-500 text-white cursor-pointer transition-all duration-200"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
