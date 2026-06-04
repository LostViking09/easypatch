import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Server, ArrowUp, ArrowDown, Edit2, AlertTriangle, Layers, Check, HelpCircle } from 'lucide-react';
import { Stagebox } from '../types';
import { STAGEBOX_PRESETS } from '../utils/constants';
import { motion, AnimatePresence } from 'motion/react';
import { ModalBase } from './ModalBase';
import { ModalHelpBox } from './ModalHelpBox';
import { useWalkthrough } from '../features/Walkthrough/WalkthroughContext';
import { WALKTHROUGH_STEPS } from '../utils/walkthroughSteps';

interface StageboxesModalProps {
  stageboxes: Stagebox[];
  onClose: () => void;
  onUpdateStageboxes: (newStageboxes: Stagebox[]) => void;
}

const allPresets = STAGEBOX_PRESETS.flatMap(g => g.presets);

export const StageboxesModal: React.FC<StageboxesModalProps> = ({
  stageboxes,
  onClose,
  onUpdateStageboxes,
}) => {
  const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
  const [boxName, setBoxName] = useState('');
  const [boxNote, setBoxNote] = useState('');
  
  const [inEnabled, setInEnabled] = useState(true);
  const [inputCols, setInputCols] = useState(8);
  const [inputRows, setInputRows] = useState(3);
  
  const [outEnabled, setOutEnabled] = useState(true);
  const [outputCols, setOutputCols] = useState(4);
  const [outputRows, setOutputRows] = useState(3);
  
  const [preset, setPreset] = useState('custom');
  const [boxToDelete, setBoxToDelete] = useState<Stagebox | null>(null);
  const { isActive: isTourActive, currentStepIndex } = useWalkthrough();
  const step = WALKTHROUGH_STEPS[currentStepIndex];
  const isTourPaused = isTourActive && (!step || !step.actionEvent);
  const [isHelpOpen, setIsHelpOpen] = useState(isTourPaused);

  // Sync editing mode fields when selected stagebox changes
  useEffect(() => {
    if (editingBoxId) {
      const box = stageboxes.find(b => b.id === editingBoxId);
      if (box) {
        setBoxName(box.name);
        setBoxNote(box.note || '');
        const hasInputs = box.grid.input.rows > 0 && box.grid.input.cols > 0;
        setInEnabled(hasInputs);
        setInputCols(hasInputs ? box.grid.input.cols : 8);
        setInputRows(hasInputs ? box.grid.input.rows : 3);
        
        const hasOutputs = box.grid.output.rows > 0 && box.grid.output.cols > 0;
        setOutEnabled(hasOutputs);
        setOutputCols(hasOutputs ? box.grid.output.cols : 4);
        setOutputRows(hasOutputs ? box.grid.output.rows : 3);
      }
    } else {
      setBoxName('');
      setBoxNote('');
      setInEnabled(true);
      setInputCols(8);
      setInputRows(3);
      setOutEnabled(true);
      setOutputCols(4);
      setOutputRows(3);
      setPreset('custom');
    }
  }, [editingBoxId, stageboxes]);

  // Dynamically calculate matching preset
  useEffect(() => {
    const activeInRows = inEnabled ? inputRows : 0;
    const activeInCols = inEnabled ? inputCols : 0;
    const activeOutRows = outEnabled ? outputRows : 0;
    const activeOutCols = outEnabled ? outputCols : 0;

    const matched = allPresets.find(p => 
      p.id !== 'custom' &&
      p.inRows === activeInRows &&
      p.inCols === activeInCols &&
      p.outRows === activeOutRows &&
      p.outCols === activeOutCols &&
      p.inEnabled === inEnabled &&
      p.outEnabled === outEnabled
    );

    if (matched) {
      setPreset(matched.id);
    } else {
      setPreset('custom');
    }
  }, [inEnabled, inputCols, inputRows, outEnabled, outputCols, outputRows]);

  const handlePresetChange = (presetId: string) => {
    setPreset(presetId);
    if (presetId === 'custom') return;

    const p = allPresets.find(pr => pr.id === presetId);
    if (p) {
      setInEnabled(p.inEnabled);
      if (p.inEnabled) {
        setInputCols(p.inCols);
        setInputRows(p.inRows);
      }
      
      setOutEnabled(p.outEnabled);
      if (p.outEnabled) {
        setOutputCols(p.outCols);
        setOutputRows(p.outRows);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxName.trim()) return;

    const currentInRows = inEnabled ? inputRows : 0;
    const currentInCols = inEnabled ? inputCols : 0;
    const currentOutRows = outEnabled ? outputRows : 0;
    const currentOutCols = outEnabled ? outputCols : 0;

    if (editingBoxId) {
      // Edit Stagebox Mode
      const updatedBoxes = stageboxes.map(box => {
        if (box.id === editingBoxId) {
          return {
            ...box,
            name: boxName.trim(),
            note: boxNote.trim(),
            grid: {
              input: { rows: currentInRows, cols: currentInCols },
              output: { rows: currentOutRows, cols: currentOutCols }
            }
          };
        }
        return box;
      });
      onUpdateStageboxes(updatedBoxes);
      setEditingBoxId(null); // Switch back to Add mode
    } else {
      // Add Stagebox Mode
      const newBox: Stagebox = {
        id: 'box-' + (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)),
        name: boxName.trim(),
        note: boxNote.trim(),
        order: stageboxes.length,
        grid: {
          input: { rows: currentInRows, cols: currentInCols },
          output: { rows: currentOutRows, cols: currentOutCols }
        }
      };
      onUpdateStageboxes([...stageboxes, newBox]);
      setBoxName('');
      setBoxNote('');
      setInEnabled(true);
      setInputCols(8);
      setInputRows(3);
      setOutEnabled(true);
      setOutputCols(4);
      setOutputRows(3);
      setPreset('custom');
    }
  };

  const moveBox = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stageboxes.length - 1) return;

    const newBoxes = [...stageboxes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBoxes[index];
    newBoxes[index] = newBoxes[targetIndex];
    newBoxes[targetIndex] = temp;

    newBoxes.forEach((b, i) => b.order = i);
    onUpdateStageboxes(newBoxes);
  };

  const handleDelete = () => {
    if (!boxToDelete) return;

    if (editingBoxId === boxToDelete.id) {
      setEditingBoxId(null);
    }

    const newBoxes = stageboxes.filter(b => b.id !== boxToDelete.id);
    newBoxes.forEach((b, i) => b.order = i);
    onUpdateStageboxes(newBoxes);
    setBoxToDelete(null);
  };

  const activeInputCount = inEnabled ? inputCols * inputRows : 0;
  const activeOutputCount = outEnabled ? outputCols * outputRows : 0;

  return (
    <>
      <ModalBase onClose={onClose} maxWidthClass="max-w-4xl">
        <div data-tour="stageboxes-modal" className="max-h-[90vh] flex flex-col w-full">
          <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">Stagebox Setup</h3>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsHelpOpen(!isHelpOpen)}
                className={`transition-colors flex items-center gap-1.5 text-sm font-bold ${isHelpOpen ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-300'}`}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Help</span>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-slate-300 hover:text-white transition-colors p-2 -m-2"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="px-6 pt-4 pb-0 -mb-2">
            <ModalHelpBox
              isOpen={isHelpOpen}
              onClose={() => setIsHelpOpen(false)}
              title="Stagebox Setup Guide"
              content="Inside Stagebox Setup, you can add stageboxes, size them (e.g., 8x3 inputs), and re-order them. Stageboxes represent your physical hardware layout. Remember: removing a stagebox will permanently delete its associated inputs/outputs."
            />
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 flex flex-col md:flex-row gap-6">
            {/* Left Panel: Form */}
            <div className={`md:w-5/12 p-4 rounded-xl border transition-all duration-300 h-fit space-y-4 shadow-3xs ${
              editingBoxId 
                ? 'bg-indigo-50 border-indigo-250 ring-2 ring-indigo-100' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase flex items-center gap-1.5 border-b pb-2">
                {editingBoxId ? (
                  <>
                    <Edit2 className="w-4 h-4 text-indigo-650 animate-pulse" /> Edit Stagebox
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-indigo-650" /> Add Stagebox
                  </>
                )}
              </h4>
              
              {editingBoxId && (
                <div className="bg-indigo-600/10 border border-indigo-200/50 rounded-lg p-2.5 flex items-center gap-2 text-indigo-900 text-xxs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-1 duration-200">
                  <Edit2 className="w-3.5 h-3.5 text-indigo-600 animate-pulse flex-shrink-0" />
                  <span className="truncate">Currently editing: "{boxName}"</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={boxName}
                    onChange={e => setBoxName(e.target.value)}
                    maxLength={16}
                    placeholder="e.g. Main IO, Stage Left Box"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">Note</label>
                  <input
                    type="text"
                    value={boxNote}
                    onChange={e => setBoxNote(e.target.value)}
                    placeholder="e.g. Stage Right Drop Box"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-800"
                  />
                </div>

                {/* Presets Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1">Size Preset</label>
                  <select
                    value={preset}
                    onChange={e => handlePresetChange(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm text-slate-700"
                  >
                    {STAGEBOX_PRESETS.map((group, gIdx) => (
                      <optgroup key={gIdx} label={group.groupName}>
                        {group.presets.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {/* Inputs Section */}
                  <div className="p-3 bg-white rounded border border-slate-200 relative">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inputs</label>
                      <label className="flex items-center gap-1.5 text-xxs font-bold text-slate-600 cursor-pointer select-none">
                        <span>Enabled</span>
                        <input
                          type="checkbox"
                          checked={inEnabled}
                          onChange={e => setInEnabled(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300"
                        />
                      </label>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 transition-all duration-200 ${inEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div>
                        <label className="block text-xxs text-gray-500 mb-0.5">Cols</label>
                        <input
                          type="number"
                          min="1"
                          max="32"
                          disabled={!inEnabled}
                          value={inputCols}
                          onChange={e => setInputCols(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 border border-slate-350 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs text-gray-500 mb-0.5">Rows</label>
                        <input
                          type="number"
                          min="1"
                          max="32"
                          disabled={!inEnabled}
                          value={inputRows}
                          onChange={e => setInputRows(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 border border-slate-350 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-xxs font-extrabold text-indigo-750 mt-1.5 text-right font-mono">
                      {activeInputCount} IN {inEnabled ? '' : '(Disabled)'}
                    </div>
                  </div>

                  {/* Outputs Section */}
                  <div className="p-3 bg-white rounded border border-slate-200 relative">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Outputs</label>
                      <label className="flex items-center gap-1.5 text-xxs font-bold text-slate-600 cursor-pointer select-none">
                        <span>Enabled</span>
                        <input
                          type="checkbox"
                          checked={outEnabled}
                          onChange={e => setOutEnabled(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300"
                        />
                      </label>
                    </div>

                    <div className={`grid grid-cols-2 gap-2 transition-all duration-200 ${outEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <div>
                        <label className="block text-xxs text-gray-500 mb-0.5">Cols</label>
                        <input
                          type="number"
                          min="1"
                          max="32"
                          disabled={!outEnabled}
                          value={outputCols}
                          onChange={e => setOutputCols(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 border border-slate-350 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs text-gray-500 mb-0.5">Rows</label>
                        <input
                          type="number"
                          min="1"
                          max="32"
                          disabled={!outEnabled}
                          value={outputRows}
                          onChange={e => setOutputRows(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1 border border-slate-350 rounded text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-xxs font-extrabold text-indigo-750 mt-1.5 text-right font-mono">
                      {activeOutputCount} OUT {outEnabled ? '' : '(Disabled)'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingBoxId && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditingBoxId(null)}
                      className="w-1/3 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded font-bold text-sm transition-colors border border-slate-300"
                    >
                      Cancel
                    </motion.button>
                  )}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-2 text-white py-2 rounded font-bold text-sm transition-colors shadow-sm ${
                      editingBoxId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {editingBoxId ? (
                      <>
                        <Check className="w-4 h-4" /> Save Changes
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Add Box
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* Right Panel: List */}
            <div className="md:w-7/12 flex flex-col flex-1">
              <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase border-b pb-2 mb-3">
                Device Chain ({stageboxes.length})
              </h4>
              <div className="space-y-3 overflow-y-auto">
                  {stageboxes.map((box, index) => {
                    const isInputBoxActive = box.grid.input.rows * box.grid.input.cols > 0;
                    const isOutputBoxActive = box.grid.output.rows * box.grid.output.cols > 0;
                    const isCurrentlyEditing = editingBoxId === box.id;

                    return (
                      <div
                        key={box.id}
                        className={`p-3 border rounded-xl bg-white flex items-center gap-4 hover:shadow-sm transition-all group ${
                          isCurrentlyEditing ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveBox(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBox(index, 'down')}
                            disabled={index === stageboxes.length - 1}
                            className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <Server className={`w-4 h-4 ${isCurrentlyEditing ? 'text-indigo-500 animate-pulse' : 'text-slate-500'}`} />
                            <span className="truncate">{box.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1">
                            <span>
                              IN:{' '}
                              {isInputBoxActive ? (
                                <strong className="font-semibold text-slate-700">
                                  {box.grid.input.rows * box.grid.input.cols} ({box.grid.input.cols}×{box.grid.input.rows})
                                </strong>
                              ) : (
                                <span className="italic text-slate-400">None</span>
                              )}
                            </span>
                            <span>
                              OUT:{' '}
                              {isOutputBoxActive ? (
                                <strong className="font-semibold text-slate-700">
                                  {box.grid.output.rows * box.grid.output.cols} ({box.grid.output.cols}×{box.grid.output.rows})
                                </strong>
                              ) : (
                                <span className="italic text-slate-400">None</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Edit stagebox button */}
                          <button
                            type="button"
                            onClick={() => setEditingBoxId(box.id)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg border border-slate-200 transition-all hover:scale-105 active:scale-95 duration-100 flex items-center justify-center cursor-pointer"
                            title="Edit Size & Name"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Remove stagebox button */}
                          <button
                            type="button"
                            onClick={() => setBoxToDelete(box)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-200 transition-all hover:scale-105 active:scale-95 duration-100 flex items-center justify-center cursor-pointer"
                            title="Remove Stagebox"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end bg-slate-50">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm shadow-sm"
            >
              Close
            </motion.button>
          </div>
        </div>
      </ModalBase>

      <AnimatePresence>
        {boxToDelete && (
          <ModalBase
            onClose={() => setBoxToDelete(null)}
            onSubmit={handleDelete}
            maxWidthClass="max-w-md"
            zIndexClass="z-[60]"
          >
            <div className="bg-red-700 text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-100" /> Remove Stagebox?
              </h3>
              <button onClick={() => setBoxToDelete(null)} className="text-red-205 hover:text-white p-2 -m-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-700">
                Are you sure you want to remove <strong className="text-slate-900">"{boxToDelete.name}"</strong> from the device chain? 
              </p>
              <div className="text-xs text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg font-semibold">
                Danger: Removing this stagebox will permanently delete <span className="underline">all inputs and outputs</span> associated with it, along with their patch data!
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
              <button type="button" onClick={() => setBoxToDelete(null)} className="px-4 py-2 text-sm font-medium hover:bg-slate-200 rounded-md">Cancel</button>
              <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-md">Remove</button>
            </div>
          </ModalBase>
        )}
      </AnimatePresence>
    </>
  );
};
