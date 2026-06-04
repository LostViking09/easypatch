import React, { useState } from 'react';
import { Plus, Grid } from 'lucide-react';
import { motion } from 'motion/react';
import { ColorPicker } from '../ColorPicker';
import { PALETTES, SUB_SNAKE_PRESETS } from '../../utils/constants';
import { SettingsConfig } from '../../types';

interface CreateSubSnakeFormProps {
  settings: SettingsConfig;
  onAddSubSnake: (name: string, note?: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
}

const PRESETS = SUB_SNAKE_PRESETS;

export const CreateSubSnakeForm: React.FC<CreateSubSnakeFormProps> = ({ settings, onAddSubSnake }) => {
  const [newSnakeName, setNewSnakeName] = useState('');
  const [newSnakeNote, setNewSnakeNote] = useState('');
  const [newSnakePreset, setNewSnakePreset] = useState('dynamic');
  
  const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
  const [newSnakeColor, setNewSnakeColor] = useState(defaultColor);
  
  const [isInputEnabled, setIsInputEnabled] = useState(false);
  const [isOutputEnabled, setIsOutputEnabled] = useState(false);
  const [inputGrid, setInputGrid] = useState({ rows: 2, cols: 4 });
  const [outputGrid, setOutputGrid] = useState({ rows: 2, cols: 4 });

  const handlePresetChange = (presetValue: string) => {
    setNewSnakePreset(presetValue);
    const preset = PRESETS.find(p => p.value === presetValue);
    
    if (preset && preset.value !== 'dynamic' && preset.value !== 'custom') {
      const hasIn = preset.in && (preset.in.rows > 0 && preset.in.cols > 0);
      const hasOut = preset.out && (preset.out.rows > 0 && preset.out.cols > 0);
      
      setIsInputEnabled(!!hasIn);
      if (hasIn) setInputGrid(preset.in!);
      setIsOutputEnabled(!!hasOut);
      if (hasOut) setOutputGrid(preset.out!);
    } else if (preset && preset.value === 'dynamic') {
      setIsInputEnabled(false);
      setIsOutputEnabled(false);
    } else if (preset && preset.value === 'custom') {
      setIsInputEnabled(true);
      setIsOutputEnabled(true);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnakeName.trim()) return;

    let grid = undefined;
    if (newSnakePreset !== 'dynamic') {
      grid = {
        input: isInputEnabled ? inputGrid : { rows: 0, cols: 0 },
        output: isOutputEnabled ? outputGrid : { rows: 0, cols: 0 },
      };
    }

    onAddSubSnake(newSnakeName.trim(), newSnakeNote.trim(), newSnakeColor, grid);
    setNewSnakeName('');
    setNewSnakeNote('');
    setNewSnakePreset('dynamic');
    setNewSnakeColor(defaultColor);
    setIsInputEnabled(false);
    setIsOutputEnabled(false);
  };

  return (
    <div className="md:w-5/12 bg-slate-50 p-4 rounded-xl border border-slate-200 h-fit space-y-4">
      <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5 border-b pb-2">
        <Plus className="w-4 h-4 text-indigo-600" /> Create SubSnake
      </h4>
      
      <form onSubmit={handleAdd} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Short Name</label>
          <input
            type="text"
            value={newSnakeName}
            onChange={e => setNewSnakeName(e.target.value)}
            maxLength={16}
            placeholder="e.g. Stage Left, Drums..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Note</label>
          <input
            type="text"
            value={newSnakeNote}
            onChange={e => setNewSnakeNote(e.target.value)}
            placeholder="e.g. Center stage drop box"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Color theme</label>
          <ColorPicker
            value={newSnakeColor}
            onChange={setNewSnakeColor}
            palette={PALETTES[settings.palette]}
            size="md"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
            <Grid className="w-3.5 h-3.5 text-slate-500" />
            <span>Port Layout Presets</span>
          </label>
          <select 
            value={newSnakePreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md font-medium bg-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
          >
            {PRESETS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
          </select>
        </div>

        {newSnakePreset === 'custom' && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            {/* INPUT */}
            <div className={`p-3 rounded-lg border transition-all ${isInputEnabled ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-slate-200 opacity-60'}`}>
              <label className="flex items-center gap-2 font-bold text-xxs text-slate-700 uppercase tracking-wider cursor-pointer select-none mb-2">
                <input 
                  type="checkbox"
                  checked={isInputEnabled}
                  onChange={(e) => setIsInputEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span>Enable INPUT</span>
              </label>
              {isInputEnabled && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xxs text-gray-500 mb-0.5">Columns</label>
                      <input type="number" min="1" max="32" value={inputGrid.cols} onChange={e => setInputGrid({ ...inputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-xxs text-gray-500 mb-0.5">Rows</label>
                      <input type="number" min="1" max="32" value={inputGrid.rows} onChange={e => setInputGrid({ ...inputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                    </div>
                  </div>
                  <div className="text-xxs font-semibold text-indigo-700">
                    Total: {inputGrid.cols * inputGrid.rows} channels
                  </div>
                </div>
              )}
            </div>

            {/* OUTPUT */}
            <div className={`p-3 rounded-lg border transition-all ${isOutputEnabled ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-slate-200 opacity-60'}`}>
              <label className="flex items-center gap-2 font-bold text-xxs text-slate-700 uppercase tracking-wider cursor-pointer select-none mb-2">
                <input 
                  type="checkbox"
                  checked={isOutputEnabled}
                  onChange={(e) => setIsOutputEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                />
                <span>Enable OUTPUT</span>
              </label>
              {isOutputEnabled && (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xxs text-gray-500 mb-0.5">Columns</label>
                      <input type="number" min="1" max="32" value={outputGrid.cols} onChange={e => setOutputGrid({ ...outputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="block text-xxs text-gray-500 mb-0.5">Rows</label>
                      <input type="number" min="1" max="32" value={outputGrid.rows} onChange={e => setOutputGrid({ ...outputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                    </div>
                  </div>
                  <div className="text-xxs font-semibold text-indigo-700">
                    Total: {outputGrid.cols * outputGrid.rows} channels
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add SubSnake
        </motion.button>
      </form>
    </div>
  );
};
