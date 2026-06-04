import React, { useState } from 'react';
import { X, Pipette, Check } from 'lucide-react';
import { hexToRgba } from '../utils/colors';
import { motion } from 'motion/react';
import { ModalBase } from './ModalBase';
import { ColorPicker } from './ColorPicker';

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
          className="text-slate-300 hover:text-white transition-colors p-2 -m-2"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content & Swatches */}
      <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Color Theme</label>
          <div className="bg-slate-55 p-3 rounded-xl border border-slate-200">
            <ColorPicker
              value={color}
              onChange={setColor}
              palette={activePalette}
              size="lg"
            />
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
