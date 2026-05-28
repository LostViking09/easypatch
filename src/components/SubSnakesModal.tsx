import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Network, HelpCircle, Grid, AlertTriangle } from 'lucide-react';
import { Channel, SubSnake, SettingsConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PALETTES } from '../utils/constants';
import { hexToRgba } from '../utils/colors';

interface SubSnakesModalProps {
  subSnakes: SubSnake[];
  inputs: Channel[];
  outputs: Channel[];
  settings: SettingsConfig;
  onClose: () => void;
  onAddSubSnake: (name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
  onUpdateSubSnake: (id: string, name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
  onDeleteSubSnake: (id: string) => void;
}

const PRESETS = [
  { name: 'Dynamic (Auto-size)', value: 'dynamic' },
  { name: '2×2 (4 ch)', value: '2x2', in: { rows: 2, cols: 2 }, out: { rows: 0, cols: 0 } },
  { name: '4×2 (8 ch)', value: '4x2', in: { rows: 2, cols: 4 }, out: { rows: 0, cols: 0 } },
  { name: '4×3 (12 ch)', value: '4x3', in: { rows: 3, cols: 4 }, out: { rows: 0, cols: 0 } },
  { name: '4×4 (16 ch)', value: '4x4', in: { rows: 4, cols: 4 }, out: { rows: 0, cols: 0 } },
  { name: 'Custom', value: 'custom', in: { rows: 2, cols: 4 }, out: { rows: 0, cols: 0 } },
];

export const SubSnakesModal: React.FC<SubSnakesModalProps> = ({
  subSnakes,
  inputs,
  outputs,
  settings,
  onClose,
  onAddSubSnake,
  onUpdateSubSnake,
  onDeleteSubSnake,
}) => {
  const [newSnakeName, setNewSnakeName] = useState('');
  const [newSnakePreset, setNewSnakePreset] = useState('dynamic');
  const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
  const [newSnakeColor, setNewSnakeColor] = useState(defaultColor);
  const [editingColor, setEditingColor] = useState(defaultColor);
  
  // Custom grid sizes for creation
  const [isInputEnabled, setIsInputEnabled] = useState(false);
  const [isOutputEnabled, setIsOutputEnabled] = useState(false);
  const [inputGrid, setInputGrid] = useState({ rows: 2, cols: 4 });
  const [outputGrid, setOutputGrid] = useState({ rows: 2, cols: 4 });

  // Editing state for existing subsnakes
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editPreset, setEditPreset] = useState('dynamic');
  const [editIsInputEnabled, setEditIsInputEnabled] = useState(false);
  const [editIsOutputEnabled, setEditIsOutputEnabled] = useState(false);
  const [editInputGrid, setEditInputGrid] = useState({ rows: 2, cols: 4 });
  const [editOutputGrid, setEditOutputGrid] = useState({ rows: 2, cols: 4 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePresetChange = (presetValue: string, isEdit: boolean) => {
    if (isEdit) setEditPreset(presetValue);
    else setNewSnakePreset(presetValue);

    const preset = PRESETS.find(p => p.value === presetValue);
    if (preset && preset.value !== 'dynamic' && preset.value !== 'custom') {
      const hasIn = preset.in && (preset.in.rows > 0 && preset.in.cols > 0);
      const hasOut = preset.out && (preset.out.rows > 0 && preset.out.cols > 0);
      
      if (isEdit) {
        setEditIsInputEnabled(!!hasIn);
        if (hasIn) setEditInputGrid(preset.in!);
        setEditIsOutputEnabled(!!hasOut);
        if (hasOut) setEditOutputGrid(preset.out!);
      } else {
        setIsInputEnabled(!!hasIn);
        if (hasIn) setInputGrid(preset.in!);
        setIsOutputEnabled(!!hasOut);
        if (hasOut) setOutputGrid(preset.out!);
      }
    } else if (preset && preset.value === 'dynamic') {
      if (isEdit) {
        setEditIsInputEnabled(false);
        setEditIsOutputEnabled(false);
      } else {
        setIsInputEnabled(false);
        setIsOutputEnabled(false);
      }
    } else if (preset && preset.value === 'custom') {
      if (isEdit) {
        setEditIsInputEnabled(true);
        setEditIsOutputEnabled(true);
      } else {
        setIsInputEnabled(true);
        setIsOutputEnabled(true);
      }
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

    onAddSubSnake(newSnakeName.trim(), newSnakeColor, grid);
    setNewSnakeName('');
    setNewSnakePreset('dynamic');
    setNewSnakeColor(defaultColor);
    setIsInputEnabled(false);
    setIsOutputEnabled(false);
  };

  const startEditing = (snake: SubSnake) => {
    setEditingId(snake.id);
    setEditingName(snake.name);
    setEditingColor(snake.color || defaultColor);
    
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
  };

  const saveEditing = (id: string) => {
    if (!editingName.trim()) return;
    
    let grid = undefined;
    if (editPreset !== 'dynamic') {
      grid = {
        input: editIsInputEnabled ? editInputGrid : { rows: 0, cols: 0 },
        output: editIsOutputEnabled ? editOutputGrid : { rows: 0, cols: 0 },
      };
    }

    onUpdateSubSnake(id, editingName.trim(), editingColor, grid);
    setEditingId(null);
  };

  const getMappedCount = (snakeId: string, type?: 'in' | 'out') => {
    if (type === 'in') return inputs.filter(c => c.subSnakeId === snakeId).length;
    if (type === 'out') return outputs.filter(c => c.subSnakeId === snakeId).length;
    return inputs.filter(c => c.subSnakeId === snakeId).length + outputs.filter(c => c.subSnakeId === snakeId).length;
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
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Manage SubSnakes</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col md:flex-row gap-6">
          {/* Left panel: Add new SubSnake */}
          <div className="md:w-5/12 bg-slate-50 p-4 rounded-xl border border-slate-200 h-fit space-y-4">
            <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5 border-b pb-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Create SubSnake
            </h4>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SubSnake Name</label>
                <input
                  type="text"
                  value={newSnakeName}
                  onChange={e => setNewSnakeName(e.target.value)}
                  placeholder="e.g. Stage Left, Drums..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Color theme</label>
                <div className="flex flex-wrap gap-1.5 items-center bg-white p-2 border border-slate-250 rounded-md">
                  {PALETTES[settings.palette].map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewSnakeColor(color.value)}
                      style={{ 
                        backgroundColor: hexToRgba(color.value, 0.4),
                        borderColor: color.value === '#ffffff' || color.value === '#000000' ? '#e2e8f0' : color.value
                      }}
                      className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                        newSnakeColor.toLowerCase() === color.value.toLowerCase() 
                          ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110 shadow-3xs' 
                          : 'hover:opacity-85'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Grid className="w-3.5 h-3.5 text-slate-500" />
                  <span>Port Layout Presets</span>
                </label>
                <select 
                  value={newSnakePreset}
                  onChange={(e) => handlePresetChange(e.target.value, false)}
                  className="w-full px-3 py-2 border rounded-md font-medium bg-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                >
                  {PRESETS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                </select>
              </div>

              {newSnakePreset === 'custom' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {/* INPUT */}
                  <div className={`p-3 rounded-lg border transition-all ${isInputEnabled ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-slate-200 opacity-60'}`}>
                    <label className="flex items-center gap-2 font-bold text-[10px] text-slate-700 uppercase tracking-wider cursor-pointer select-none mb-2">
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
                            <label className="block text-[10px] text-gray-500 mb-0.5">Columns</label>
                            <input type="number" min="1" max="32" value={inputGrid.cols} onChange={e => setInputGrid({ ...inputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Rows</label>
                            <input type="number" min="1" max="32" value={inputGrid.rows} onChange={e => setInputGrid({ ...inputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                          </div>
                        </div>
                        <div className="text-[10px] font-semibold text-indigo-700">
                          Total: {inputGrid.cols * inputGrid.rows} channels
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OUTPUT */}
                  <div className={`p-3 rounded-lg border transition-all ${isOutputEnabled ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-slate-200 opacity-60'}`}>
                    <label className="flex items-center gap-2 font-bold text-[10px] text-slate-700 uppercase tracking-wider cursor-pointer select-none mb-2">
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
                            <label className="block text-[10px] text-gray-500 mb-0.5">Columns</label>
                            <input type="number" min="1" max="32" value={outputGrid.cols} onChange={e => setOutputGrid({ ...outputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-0.5">Rows</label>
                            <input type="number" min="1" max="32" value={outputGrid.rows} onChange={e => setOutputGrid({ ...outputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-2 py-1 border rounded text-xs" />
                          </div>
                        </div>
                        <div className="text-[10px] font-semibold text-indigo-700">
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

          {/* Right panel: SubSnake List */}
          <div className="md:w-7/12 flex flex-col flex-1">
            <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase border-b pb-2 mb-3">
              Active SubSnakes ({subSnakes.length})
            </h4>

            {subSnakes.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-350 text-slate-500 flex-1">
                <HelpCircle className="w-8 h-8 mb-2 text-slate-400" />
                <p className="text-sm font-medium">No SubSnakes created yet.</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Create one on the left to map physical stage boxes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[45vh] md:max-h-none overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {subSnakes.map(snake => {
                    const isEditing = editingId === snake.id;
                    const inMapped = getMappedCount(snake.id, 'in');
                    const outMapped = getMappedCount(snake.id, 'out');
                    
                    return (
                      <motion.div
                        key={snake.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`p-3 border rounded-xl flex items-start justify-between gap-4 transition-all ${
                          isEditing 
                            ? 'border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-500/20 shadow-md flex-col' 
                            : 'border-slate-205 hover:border-slate-300 hover:shadow-xs bg-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0 w-full">
                          {isEditing ? (
                            <div className="space-y-3 w-full">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={e => setEditingName(e.target.value)}
                                  className="w-full px-2 py-1 text-sm border rounded focus:outline-indigo-550 focus:ring-1 focus:ring-indigo-500 font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Color theme</label>
                                <div className="flex flex-wrap gap-1 items-center bg-white p-1.5 border rounded">
                                  {PALETTES[settings.palette].map(color => (
                                    <button
                                      key={color.value}
                                      type="button"
                                      onClick={() => setEditingColor(color.value)}
                                      style={{ 
                                        backgroundColor: hexToRgba(color.value, 0.4),
                                        borderColor: color.value === '#ffffff' || color.value === '#000000' ? '#e2e8f0' : color.value
                                      }}
                                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                                        editingColor.toLowerCase() === color.value.toLowerCase() 
                                          ? 'ring-1.5 ring-offset-1 ring-indigo-500 scale-110 shadow-3xs' 
                                          : 'hover:opacity-85'
                                      }`}
                                      title={color.label}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Layout</label>
                                <select 
                                  value={editPreset}
                                  onChange={(e) => handlePresetChange(e.target.value, true)}
                                  className="w-full px-2 py-1 border rounded-md font-medium bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs"
                                >
                                  {PRESETS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                                </select>
                              </div>

                              {editPreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  {/* Edit INPUT */}
                                  <div className={`p-2 rounded border ${editIsInputEnabled ? 'bg-white border-slate-300' : 'bg-transparent border-slate-200 opacity-60'}`}>
                                    <label className="flex items-center gap-1.5 font-bold text-[9px] text-slate-700 uppercase tracking-wider cursor-pointer mb-1">
                                      <input type="checkbox" checked={editIsInputEnabled} onChange={(e) => setEditIsInputEnabled(e.target.checked)} className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500" />
                                      <span>INPUT</span>
                                    </label>
                                    {editIsInputEnabled && (
                                      <div className="space-y-1">
                                        <div className="flex gap-2">
                                          <input type="number" min="1" max="32" value={editInputGrid.cols} onChange={e => setEditInputGrid({ ...editInputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Cols" />
                                          <input type="number" min="1" max="32" value={editInputGrid.rows} onChange={e => setEditInputGrid({ ...editInputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Rows" />
                                        </div>
                                        <div className="text-[9px] font-semibold text-indigo-700">
                                          Total: {editInputGrid.cols * editInputGrid.rows} ch
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Edit OUTPUT */}
                                  <div className={`p-2 rounded border ${editIsOutputEnabled ? 'bg-white border-slate-300' : 'bg-transparent border-slate-200 opacity-60'}`}>
                                    <label className="flex items-center gap-1.5 font-bold text-[9px] text-slate-700 uppercase tracking-wider cursor-pointer mb-1">
                                      <input type="checkbox" checked={editIsOutputEnabled} onChange={(e) => setEditIsOutputEnabled(e.target.checked)} className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500" />
                                      <span>OUTPUT</span>
                                    </label>
                                    {editIsOutputEnabled && (
                                      <div className="space-y-1">
                                        <div className="flex gap-2">
                                          <input type="number" min="1" max="32" value={editOutputGrid.cols} onChange={e => setEditOutputGrid({ ...editOutputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Cols" />
                                          <input type="number" min="1" max="32" value={editOutputGrid.rows} onChange={e => setEditOutputGrid({ ...editOutputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) })} className="w-1/2 px-1 py-0.5 border rounded text-xs" title="Rows" />
                                        </div>
                                        <div className="text-[9px] font-semibold text-indigo-700">
                                          Total: {editOutputGrid.cols * editOutputGrid.rows} ch
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-end gap-2 pt-2 border-t">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                                >
                                  Cancel
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => saveEditing(snake.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full justify-between">
                              <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                                {snake.color && snake.color !== '#ffffff' && (
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                                    style={{ backgroundColor: snake.color }}
                                  />
                                )}
                                <span>{snake.name}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {snake.grid ? (
                                    <>
                                      IN: {snake.grid.input.rows * snake.grid.input.cols > 0 ? `${snake.grid.input.cols}×${snake.grid.input.rows}` : '0'} 
                                      <span className="mx-1 text-slate-300">|</span> 
                                      OUT: {snake.grid.output.rows * snake.grid.output.cols > 0 ? `${snake.grid.output.cols}×${snake.grid.output.rows}` : '0'}
                                    </>
                                  ) : 'Dynamic (Auto-size)'}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <div className="flex gap-1.5">
                                  {inMapped > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{inMapped} IN</span>}
                                  {outMapped > 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{outMapped} OUT</span>}
                                  {inMapped === 0 && outMapped === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">0 mapped</span>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => startEditing(snake)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg border border-slate-200 transition-colors"
                              title="Edit SubSnake"
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete SubSnake "${snake.name}"? All mappings to it will be cleared!`)) {
                                  onDeleteSubSnake(snake.id);
                                }
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-200 transition-colors"
                              title="Delete SubSnake"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end bg-slate-50">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
