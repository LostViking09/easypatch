import React, { useState } from 'react';
import { X } from 'lucide-react';
import { hexToRgba } from '../utils/colors';
import { motion } from 'motion/react';

interface MultiEditModalProps {
  selectedCount: number;
  activePalette: { label: string; value: string }[];
  onClose: () => void;
  onSave: (group: string, color: string) => void;
}

export const MultiEditModal: React.FC<MultiEditModalProps> = ({ selectedCount, activePalette, onClose, onSave }) => {
  const [group, setGroup] = useState('');
  const [color, setColor] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Edit {selectedCount} channels</h3>
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
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Common Group (Link)</label>
            <input type="text" value={group} onChange={e => setGroup(e.target.value)} placeholder="Leave empty to keep unchanged" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Common Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {activePalette.map(c => (
                <motion.button 
                  key={c.value} 
                  type="button" 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setColor(c.value)} 
                  style={{ backgroundColor: hexToRgba(c.value, 0.4), borderColor: c.value === '#ffffff' || c.value === '#000000' ? '#d1d5db' : c.value }} 
                  className={`w-10 h-10 rounded-md border-2 transition-all ${color.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-offset-1 ring-blue-500 scale-105' : 'hover:opacity-80'}`} 
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">If no color is selected, original remains.</p>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose} 
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSave(group, color)} 
            type="button"
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
