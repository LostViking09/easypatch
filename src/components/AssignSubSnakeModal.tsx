import React, { useState, useEffect, useRef } from 'react';
import { X, Network, Plus, Check, AlertTriangle, Play } from 'lucide-react';
import { hexToRgba } from '../utils/colors';
import { Channel, SubSnake, SettingsConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { PALETTES } from '../utils/constants';

interface AssignSubSnakeModalProps {
  selectedCount: number;
  selectedIds: string[];
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  onClose: () => void;
  onSave: (subSnakeId: string, startPort: number) => void;
  onAddSubSnake: (name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => SubSnake;
}

export const AssignSubSnakeModal: React.FC<AssignSubSnakeModalProps> = ({
  selectedCount,
  selectedIds,
  inputs,
  outputs,
  subSnakes,
  settings,
  onClose,
  onSave,
  onAddSubSnake,
}) => {
  const [selectedSubSnakeId, setSelectedSubSnakeId] = useState('');
  const [startPort, setStartPort] = useState<number>(1);
  const [hoveredPort, setHoveredPort] = useState<number | null>(null);

  // New subsnake creation form in-modal
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSnakeName, setNewSnakeName] = useState('');
  const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
  const [newSnakeColor, setNewSnakeColor] = useState(defaultColor);
  const [newSnakePreset, setNewSnakePreset] = useState('dynamic');

  // Selected channels separated by type
  const selectedInputs = inputs.filter(ch => selectedIds.includes(ch.id));
  const selectedOutputs = outputs.filter(ch => selectedIds.includes(ch.id));

  // Auto-select first subsnake or default to creation if empty
  useEffect(() => {
    if (subSnakes.length === 0) {
      setIsCreatingNew(true);
    } else if (!selectedSubSnakeId) {
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

  const activeSubSnake = subSnakes.find(s => s.id === selectedSubSnakeId);

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnakeName.trim()) return;

    let grid = undefined;
    if (newSnakePreset === '4x2') {
      grid = { input: { rows: 2, cols: 4 }, output: { rows: 0, cols: 0 } };
    } else if (newSnakePreset === '4x4') {
      grid = { input: { rows: 4, cols: 4 }, output: { rows: 0, cols: 0 } };
    }

    const newSnake = onAddSubSnake(newSnakeName.trim(), newSnakeColor, grid);
    setSelectedSubSnakeId(newSnake.id);
    setIsCreatingNew(false);
    setNewSnakeName('');
    setNewSnakePreset('dynamic');
    setNewSnakeColor(defaultColor);
    setStartPort(1);
  };

  const getOccupant = (type: 'in' | 'out', port: number) => {
    if (!selectedSubSnakeId) return undefined;
    const list = type === 'in' ? inputs : outputs;
    return list.find(
      c => !selectedIds.includes(c.id) &&
           c.type === type &&
           c.subSnakeId === selectedSubSnakeId &&
           c.subSnakeChannel === port
    );
  };

  // Compute mapping range and conflicts
  const getPortStatus = (type: 'in' | 'out', port: number, checkHover: boolean = false) => {
    const activePort = checkHover && hoveredPort !== null ? hoveredPort : startPort;
    const count = type === 'in' ? selectedInputs.length : selectedOutputs.length;
    
    if (count === 0) return { isTarget: false, isConflict: false };

    const isTarget = port >= activePort && port < activePort + count;
    const occupant = getOccupant(type, port);
    const isConflict = isTarget && !!occupant;

    return { isTarget, isConflict, occupant };
  };

  // Compile list of conflicts
  const getConflicts = () => {
    const list: { type: 'in' | 'out'; port: number; channelName: string; channelNumber: number }[] = [];
    if (!activeSubSnake) return list;

    // Check inputs conflicts
    if (selectedInputs.length > 0) {
      for (let i = 0; i < selectedInputs.length; i++) {
        const port = startPort + i;
        const occupant = getOccupant('in', port);
        if (occupant) {
          list.push({
            type: 'in',
            port,
            channelName: occupant.name || 'Unused',
            channelNumber: occupant.number,
          });
        }
      }
    }

    // Check outputs conflicts
    if (selectedOutputs.length > 0) {
      for (let i = 0; i < selectedOutputs.length; i++) {
        const port = startPort + i;
        const occupant = getOccupant('out', port);
        if (occupant) {
          list.push({
            type: 'out',
            port,
            channelName: occupant.name || 'Unused',
            channelNumber: occupant.number,
          });
        }
      }
    }

    return list;
  };

  const conflicts = getConflicts();

  const handleSaveClick = () => {
    if (!selectedSubSnakeId) return;
    onSave(selectedSubSnakeId, startPort);
    onClose();
  };

  // Render a visual port grid for a specific type (in/out)
  const renderVisualGrid = (type: 'in' | 'out') => {
    if (!activeSubSnake) return null;

    const selectedList = type === 'in' ? selectedInputs : selectedOutputs;
    if (selectedList.length === 0) return null;

    let totalPorts = 12;
    let cols = 4;

    if (activeSubSnake.grid) {
      const gridConfig = type === 'in' ? activeSubSnake.grid.input : activeSubSnake.grid.output;
      totalPorts = gridConfig.rows * gridConfig.cols;
      cols = gridConfig.cols || 4;
    } else {
      // Dynamic: compute total size based on highest mapped port + selection space
      const list = type === 'in' ? inputs : outputs;
      const subSnakeChannels = list.filter(c => c.subSnakeId === activeSubSnake.id);
      const mappedPorts = subSnakeChannels.map(c => c.subSnakeChannel || 0);
      const highestPort = Math.max(...mappedPorts, 0);
      totalPorts = Math.max(12, Math.ceil((Math.max(highestPort, startPort + selectedList.length - 1) + 1) / 4) * 4);
    }

    if (totalPorts <= 0) return null;

    const portsList = [];
    for (let p = 1; p <= totalPorts; p++) {
      const { isTarget, isConflict, occupant } = getPortStatus(type, p);
      const hoverStatus = getPortStatus(type, p, true);

      // Determine cell styles dynamically
      let bgStyle = 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50 hover:border-slate-400';
      
      if (isTarget) {
        if (isConflict) {
          bgStyle = 'bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-400/40 z-10 scale-105';
        } else {
          bgStyle = 'bg-indigo-600 border-indigo-600 text-white z-10 scale-105 shadow-sm';
        }
      } else if (hoverStatus.isTarget) {
        if (hoverStatus.isConflict) {
          bgStyle = 'bg-amber-50 border-amber-300 text-amber-700 border-dashed scale-102';
        } else {
          bgStyle = 'bg-indigo-50 border-indigo-300 text-indigo-700 border-dashed scale-102';
        }
      } else if (occupant) {
        bgStyle = 'bg-slate-100 border-slate-300 text-slate-500 opacity-80';
      }

      portsList.push(
        <motion.button
          key={p}
          type="button"
          onMouseEnter={() => setHoveredPort(p)}
          onMouseLeave={() => setHoveredPort(null)}
          onClick={() => setStartPort(p)}
          whileHover={{ scale: isTarget ? 1.05 : 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`h-11 rounded-lg border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all ${bgStyle}`}
          title={
            occupant 
              ? `Port ${p}: Mapped to ${type.toUpperCase()} ${occupant.number} (${occupant.name || 'Unused'})` 
              : `Port ${p}: Available`
          }
        >
          <span>{p}</span>
          {occupant && !isTarget && !hoverStatus.isTarget && (
            <span className="text-[7px] truncate max-w-[90%] px-0.5 mt-0.5 leading-none text-slate-450 font-normal">
              {occupant.name || `${type.toUpperCase()}${occupant.number}`}
            </span>
          )}
          {isTarget && occupant && (
            <span className="text-[7px] truncate max-w-[90%] px-0.5 mt-0.5 leading-none text-amber-700 font-semibold animate-pulse">
              Overwrite
            </span>
          )}
          {isTarget && !occupant && (
            <span className="text-[7px] truncate max-w-[90%] px-0.5 mt-0.5 leading-none text-indigo-200 font-medium">
              {(type === 'in' ? selectedInputs : selectedOutputs)[p - startPort]?.name || `${type.toUpperCase()}${(type === 'in' ? selectedInputs : selectedOutputs)[p - startPort]?.number}`}
            </span>
          )}
        </motion.button>
      );
    }

    return (
      <div className="space-y-2 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex justify-between items-center mb-1">
          <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            <span>{type === 'in' ? 'Inputs' : 'Outputs'} Port Grid ({selectedList.length} channels selected)</span>
          </span>
          <span className="text-[10px] text-slate-400 italic">
            Click a port to set starting position
          </span>
        </div>
        
        <div 
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
          }}
        >
          {portsList}
        </div>
      </div>
    );
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Assign {selectedCount} channels to SubSnake</h3>
          </div>
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {isCreatingNew ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4"
            >
              <h4 className="font-bold text-sm text-slate-800 border-b pb-2 flex justify-between items-center">
                <span>Create New SubSnake Inline</span>
                {subSnakes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-indigo-600 hover:underline font-bold"
                  >
                    Select Existing
                  </button>
                )}
              </h4>

              <form onSubmit={handleCreateNew} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">SubSnake Name</label>
                    <input
                      type="text"
                      value={newSnakeName}
                      onChange={e => setNewSnakeName(e.target.value)}
                      placeholder="e.g. Stage Right, Drums..."
                      className="w-full px-3 py-1.5 border border-slate-350 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Grid Preset</label>
                    <select
                      value={newSnakePreset}
                      onChange={e => setNewSnakePreset(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-350 bg-white rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    >
                      <option value="dynamic">Dynamic (Auto-size)</option>
                      <option value="4x2">4×2 (8 inputs)</option>
                      <option value="4x4">4×4 (16 inputs)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Color Theme</label>
                  <div className="flex flex-wrap gap-1.5 items-center bg-white p-2 border border-slate-200 rounded-md">
                    {PALETTES[settings.palette].map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewSnakeColor(color.value)}
                        style={{
                          backgroundColor: hexToRgba(color.value, 0.4),
                          borderColor: color.value === '#ffffff' || color.value === '#000000' ? '#cbd5e1' : color.value
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

                <div className="flex justify-end gap-2 pt-2 border-t">
                  {subSnakes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-4 py-1.5 text-xs font-medium text-slate-650 bg-white border rounded hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold rounded-md shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create & Select
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Choose Existing SubSnake */}
              <div className="flex justify-between items-end border-b pb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Choose SubSnake</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {subSnakes.map(s => {
                  const isSelected = selectedSubSnakeId === s.id;
                  const totalIn = s.grid ? s.grid.input.rows * s.grid.input.cols : 0;
                  const totalOut = s.grid ? s.grid.output.rows * s.grid.output.cols : 0;
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSubSnakeId(s.id);
                        setStartPort(1);
                      }}
                      whileHover={{ scale: isSelected ? 1.01 : 1.02 }}
                      whileTap={{ scale: 0.99 }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/15 ring-2 ring-indigo-500/25 shadow-sm font-semibold'
                          : 'border-slate-200 hover:border-slate-350 hover:shadow-xs bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {s.color && s.color !== '#ffffff' && (
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                        )}
                        <span className="truncate text-sm font-bold">{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                        {s.grid ? `IN:${totalIn} | OUT:${totalOut}` : 'Dynamic'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubSnake && !isCreatingNew && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 pt-1"
            >
              {/* Start port slider/input */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-0.5">
                  <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">Start Port Selection</label>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Mapping will occupy ports <b>{startPort}</b> to <b>{startPort + Math.max(selectedInputs.length, selectedOutputs.length) - 1}</b>.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-250 rounded-lg shadow-3xs">
                  <span className="text-2xs font-bold text-slate-500 uppercase">Start Port:</span>
                  <input
                    type="number"
                    min="1"
                    value={startPort}
                    onChange={e => setStartPort(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 px-1 text-center font-mono font-bold text-sm bg-transparent outline-none border-b border-transparent focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Visual port grids for inputs and outputs */}
              {renderVisualGrid('in')}
              {renderVisualGrid('out')}

              {/* Conflict Warnings */}
              <AnimatePresence>
                {conflicts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-2 text-xs leading-relaxed overflow-hidden shadow-3xs"
                  >
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Overwrite Mappings Warning ({conflicts.length} conflict{conflicts.length > 1 ? 's' : ''})</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 font-medium max-h-36 overflow-y-auto">
                      {conflicts.map((c, idx) => (
                        <li key={idx}>
                          Port {c.port} on {c.type === 'in' ? 'INPUT' : 'OUTPUT'} is currently occupied by{' '}
                          <span className="font-bold font-mono">
                            {c.type === 'in' ? 'IN' : 'OUT'} {c.channelNumber} ("{c.channelName}")
                          </span>
                          . Confirming will displace this channel (its mapping will be cleared).
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
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
            onClick={handleSaveClick}
            type="button"
            disabled={!selectedSubSnakeId || isCreatingNew}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              conflicts.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 border border-amber-600'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Check className="w-4 h-4" /> Save Assignment
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
