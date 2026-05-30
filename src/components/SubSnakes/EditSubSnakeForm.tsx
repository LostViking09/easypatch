import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { ColorPicker } from '../ColorPicker';
import { PALETTES, SUB_SNAKE_PRESETS } from '../../utils/constants';
import { SubSnake, SettingsConfig } from '../../types';

interface EditSubSnakeFormProps {
  snake: SubSnake;
  settings: SettingsConfig;
  onSave: (id: string, name: string, color: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
  onCancel: () => void;
}

const PRESETS = SUB_SNAKE_PRESETS;

export const EditSubSnakeForm: React.FC<EditSubSnakeFormProps> = ({ snake, settings, onSave, onCancel }) => {
  const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
  const [editingName, setEditingName] = useState(snake.name);
  const [editingColor, setEditingColor] = useState(snake.color || defaultColor);
  
  const [editPreset, setEditPreset] = useState('dynamic');
  const [editIsInputEnabled, setEditIsInputEnabled] = useState(false);
  const [editIsOutputEnabled, setEditIsOutputEnabled] = useState(false);
  const [editInputGrid, setEditInputGrid] = useState({ rows: 2, cols: 4 });
  const [editOutputGrid, setEditOutputGrid] = useState({ rows: 2, cols: 4 });

  useEffect(() => {
    if (!snake.grid) {
      setEditPreset('dynamic');
      setEditIsInputEnabled(false);
      setEditIsOutputEnabled(false);
    } else {
      const { input, output } = snake.grid;
      const match = PRESETS.find(
        p => p.value !== 'dynamic' && p.value !== 'custom' &&
             p.in?.rows === input.rows && p.in?.cols === input.cols &&
             p.out?.rows === output.rows && p.out?.cols === output.cols
      );
      setEditPreset(match ? match.value : 'custom');
      setEditIsInputEnabled(input.rows > 0 && input.cols > 0);
      setEditIsOutputEnabled(output.rows > 0 && output.cols > 0);
      setEditInputGrid(input.rows > 0 && input.cols > 0 ? input : { rows: 3, cols: 8 });
      setEditOutputGrid(output.rows > 0 && output.cols > 0 ? output : { rows: 3, cols: 4 });
    }
  }, [snake]);

  const handlePresetChange = (presetValue: string) => {
    setEditPreset(presetValue);

    const preset = PRESETS.find(p => p.value === presetValue);
    if (preset && preset.value !== 'dynamic' && preset.value !== 'custom') {
      const hasIn = preset.in && (preset.in.rows > 0 && preset.in.cols > 0);
      const hasOut = preset.out && (preset.out.rows > 0 && preset.out.cols > 0);
      
      setEditIsInputEnabled(!!hasIn);
      if (hasIn) setEditInputGrid(preset.in!);
      setEditIsOutputEnabled(!!hasOut);
      if (hasOut) setEditOutputGrid(preset.out!);
    } else if (preset && preset.value === 'dynamic') {
      setEditIsInputEnabled(false);
      setEditIsOutputEnabled(false);
    } else if (preset && preset.value === 'custom') {
      setEditIsInputEnabled(true);
      setEditIsOutputEnabled(true);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    
    let grid = undefined;
    if (editPreset !== 'dynamic') {
      grid = {
        input: editIsInputEnabled ? editInputGrid : { rows: 0, cols: 0 },
        output: editIsOutputEnabled ? editOutputGrid : { rows: 0, cols: 0 },
      };
    }

    onSave(snake.id, editingName.trim(), editingColor, grid);
  };

  return (
    <form onSubmit={handleSave} className="space-y-3 w-full">
      <div>
        <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Name</label>
        <input
          type="text"
          value={editingName}
          onChange={e => setEditingName(e.target.value)}
          maxLength={6}
          className="w-full px-2 py-1 text-sm border rounded focus:outline-indigo-550 focus:ring-1 focus:ring-indigo-500 font-bold"
        />
      </div>

      <div>
        <label className="block text-xxs font-bold text-slate-505 uppercase mb-1">Color theme</label>
        <ColorPicker
          value={editingColor}
          onChange={setEditingColor}
          palette={PALETTES[settings.palette]}
          size="sm"
        />
      </div>
      
      <div>
        <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Layout</label>
        <select 
          value={editPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full px-2 py-1 border rounded-md font-medium bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
        >
          {PRESETS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
        </select>
      </div>

      {editPreset === 'custom' && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Edit INPUT */}
          <div className={`p-2 rounded border ${editIsInputEnabled ? 'bg-white border-slate-300' : 'bg-transparent border-slate-200 opacity-60'}`}>
            <label className="flex items-center gap-1.5 font-bold text-tiny text-slate-700 uppercase tracking-wider cursor-pointer mb-1">
              <input type="checkbox" checked={editIsInputEnabled} onChange={(e) => setEditIsInputEnabled(e.target.checked)} className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500" />
              <span>INPUT</span>
            </label>
            {editIsInputEnabled && (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input type="number" min="1" max="32" value={editInputGrid.cols} onChange={e => setEditInputGrid({ ...editInputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Cols" />
                  <input type="number" min="1" max="32" value={editInputGrid.rows} onChange={e => setEditInputGrid({ ...editInputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Rows" />
                </div>
                <div className="text-tiny font-semibold text-indigo-700">
                  Total: {editInputGrid.cols * editInputGrid.rows} ch
                </div>
              </div>
            )}
          </div>

          {/* Edit OUTPUT */}
          <div className={`p-2 rounded border ${editIsOutputEnabled ? 'bg-white border-slate-300' : 'bg-transparent border-slate-200 opacity-60'}`}>
            <label className="flex items-center gap-1.5 font-bold text-tiny text-slate-700 uppercase tracking-wider cursor-pointer mb-1">
              <input type="checkbox" checked={editIsOutputEnabled} onChange={(e) => setEditIsOutputEnabled(e.target.checked)} className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500" />
              <span>OUTPUT</span>
            </label>
            {editIsOutputEnabled && (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input type="number" min="1" max="32" value={editOutputGrid.cols} onChange={e => setEditOutputGrid({ ...editOutputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Cols" />
                  <input type="number" min="1" max="32" value={editOutputGrid.rows} onChange={e => setEditOutputGrid({ ...editOutputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Rows" />
                </div>
                <div className="text-tiny font-semibold text-indigo-700">
                  Total: {editOutputGrid.cols * editOutputGrid.rows} ch
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-2 border-t">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-bold text-slate-655 bg-slate-100 hover:bg-slate-205 rounded-md"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md"
        >
          <Check className="w-3 h-3" /> Save
        </motion.button>
      </div>
    </form>
  );
};
