import React, { useState, useEffect } from 'react';
import { X, Network, Plus, Check } from 'lucide-react';
import { hexToRgba } from '../utils/colors';
import { SubSnake } from '../types';
import { motion } from 'motion/react';

interface MultiEditModalProps {
  selectedCount: number;
  activePalette: { label: string; value: string }[];
  subSnakes: SubSnake[];
  onClose: () => void;
  onSave: (
    group: string,
    color: string,
    subSnakeAction: {
      type: 'existing' | 'new' | 'clear' | 'none';
      subSnakeId?: string;
      newName?: string;
      startPort?: number;
    }
  ) => void;
}

export const MultiEditModal: React.FC<MultiEditModalProps> = ({
  selectedCount,
  activePalette,
  subSnakes,
  onClose,
  onSave,
}) => {
  const [group, setGroup] = useState('');
  const [color, setColor] = useState('');
  
  // SubSnake action states
  const [subSnakeMode, setSubSnakeMode] = useState<'none' | 'clear' | 'assign'>('none');
  const [assignmentType, setAssignmentType] = useState<'existing' | 'new'>('existing');
  const [selectedSubSnakeId, setSelectedSubSnakeId] = useState('');
  const [newSubSnakeName, setNewSubSnakeName] = useState('');
  const [startPort, setStartPort] = useState<number>(1);

  // Auto-switch to 'new' if there are no existing subsnakes
  useEffect(() => {
    if (subSnakes.length === 0) {
      setAssignmentType('new');
    } else if (!selectedSubSnakeId && subSnakes.length > 0) {
      setSelectedSubSnakeId(subSnakes[0].id);
    }
  }, [subSnakes, selectedSubSnakeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    const action = {
      type: subSnakeMode === 'assign' ? assignmentType : (subSnakeMode === 'clear' ? 'clear' as const : 'none' as const),
      subSnakeId: subSnakeMode === 'assign' && assignmentType === 'existing' ? selectedSubSnakeId : undefined,
      newName: subSnakeMode === 'assign' && assignmentType === 'new' ? newSubSnakeName.trim() : undefined,
      startPort: subSnakeMode === 'assign' ? startPort : undefined,
    };
    
    onSave(group, color, action);
    onClose();
  };

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
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* General info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Common Group (Link)</label>
              <input
                type="text"
                value={group}
                onChange={e => setGroup(e.target.value)}
                placeholder="Leave empty to keep unchanged"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Common Color</label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {activePalette.map(c => (
                  <motion.button
                    key={c.value}
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setColor(c.value)}
                    style={{
                      backgroundColor: hexToRgba(c.value, 0.4),
                      borderColor: c.value === '#ffffff' || c.value === '#000000' ? '#d1d5db' : c.value,
                    }}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      color.toLowerCase() === c.value.toLowerCase()
                        ? 'ring-2 ring-offset-1 ring-blue-500 scale-105 shadow-sm'
                        : 'hover:opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* SubSnake Mapping Section */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-indigo-500" />
              <span>SubSnake Mapping</span>
            </h4>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'none', label: 'Keep Unchanged' },
                { value: 'clear', label: 'Clear Mapping' },
                { value: 'assign', label: 'Map to SubSnake' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSubSnakeMode(opt.value as any)}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border transition-all ${
                    subSnakeMode === opt.value
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-350 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* SubSnake mapping assignment details */}
            {subSnakeMode === 'assign' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 overflow-hidden"
              >
                {/* Select between Existing or New */}
                <div className="flex gap-4 border-b pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={assignmentType === 'existing'}
                      onChange={() => setAssignmentType('existing')}
                      disabled={subSnakes.length === 0}
                      className="text-blue-600 disabled:opacity-50"
                    />
                    <span className={subSnakes.length === 0 ? 'opacity-50' : ''}>Existing SubSnake</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="assignmentType"
                      checked={assignmentType === 'new'}
                      onChange={() => setAssignmentType('new')}
                      className="text-blue-600"
                    />
                    <span>Create New SubSnake</span>
                  </label>
                </div>

                {assignmentType === 'existing' && subSnakes.length > 0 && (
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select SubSnake</label>
                    <select
                      value={selectedSubSnakeId}
                      onChange={e => setSelectedSubSnakeId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {subSnakes.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.grid ? `IN: ${s.grid.input.cols * s.grid.input.rows} ch | OUT: ${s.grid.output.cols * s.grid.output.rows} ch` : 'Dynamic'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {assignmentType === 'new' && (
                  <div className="space-y-1">
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">New SubSnake Name</label>
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={newSubSnakeName}
                        onChange={e => setNewSubSnakeName(e.target.value)}
                        placeholder="e.g. Stage Left Box"
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        required={subSnakeMode === 'assign' && assignmentType === 'new'}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 italic ml-6">Will be created instantly as a Dynamic Size SubSnake.</p>
                  </div>
                )}

                {/* Start port input */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Port Number</label>
                    <input
                      type="number"
                      min="1"
                      value={startPort}
                      onChange={e => setStartPort(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <p className="text-[10px] text-slate-500 pb-1.5 leading-tight">
                      Selected channels will be mapped sequentially starting from port <b>{startPort}</b> (e.g. ports {startPort} to {startPort + selectedCount - 1}).
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            type="button"
            disabled={subSnakeMode === 'assign' && assignmentType === 'new' && !newSubSnakeName.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-sm disabled:opacity-55 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" /> Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
