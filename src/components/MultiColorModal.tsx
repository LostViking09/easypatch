import React, { useState } from 'react';
import { X, Pipette, Check } from 'lucide-react';
import { hexToRgba } from '../utils/colors';
import { motion } from 'motion/react';
import { ModalBase } from './ModalBase';

interface MultiColorModalProps {
  selectedCount: number;
  activePalette: { label: string; value: string }[];
  onClose: () => void;
  onSave: (color: string) => void;
}

export const MultiColorModal: React.FC<MultiColorModalProps> = ({
  selectedCount,
  activePalette,
  onClose,
  onSave,
}) => {
  const [color, setColor] = useState(activePalette[0]?.value || '#ffffff');

  const handleSubmit = () => {
    onSave(color);
    onClose();
  };

  return (
    <ModalBase onClose={onClose} onSubmit={handleSubmit} maxWidthClass="max-w-sm">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold text-sm sm:text-base">Set Color for {selectedCount} channels</h3>
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

      {/* Content & Swatches */}
      <div className="p-6 space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Color Theme</label>
          <div className="grid grid-cols-4 gap-2 bg-slate-55 p-2 rounded-xl border border-slate-200">
            {activePalette.map(c => (
              <motion.button
                key={c.value}
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setColor(c.value)}
                style={{
                  backgroundColor: hexToRgba(c.value, 0.4),
                  borderColor: c.value === '#ffffff' || c.value === '#000000' ? '#e2e8f0' : c.value,
                }}
                className={`h-11 rounded-lg border-2 transition-all cursor-pointer ${
                  color.toLowerCase() === c.value.toLowerCase()
                    ? 'ring-2 ring-offset-1 ring-emerald-500 scale-105 shadow-sm'
                    : 'hover:opacity-85'
                }`}
                title={c.label}
              />
            ))}

            <div className="col-span-4 h-px bg-slate-200 my-1"></div>

            {/* Custom Pipette Color Picker */}
            <div className="col-span-4 flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-3xs">
              <span className="text-xs font-semibold text-slate-650 flex items-center gap-1.5">
                <Pipette className="w-4 h-4 text-slate-550" /> Custom color
              </span>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  backgroundColor: hexToRgba(color, 0.4),
                  borderColor: color === '#ffffff' || color === '#000000' ? '#e2e8f0' : color,
                }}
                className="relative w-8 h-8 rounded-full border-2 overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer shadow-3xs"
                title="Choose Custom Color"
              >
                <input
                  type="color"
                  value={color.startsWith('#') ? color : '#ffffff'}
                  onChange={e => setColor(e.target.value)}
                  className="absolute inset-[-10px] w-14 h-14 cursor-pointer opacity-0"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Apply Color
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
