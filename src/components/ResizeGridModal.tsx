import React, { useState } from 'react';
import { Grid, X, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Channel } from '../types';
import { ModalBase } from './ModalBase';

interface ResizeGridModalProps {
  onClose: () => void;
  onConfirm: (inputGrid: { rows: number, cols: number }, outputGrid: { rows: number, cols: number }) => void;
  currentGrid: {
    input: { rows: number, cols: number };
    output: { rows: number, cols: number };
  };
  inputs: Channel[];
  outputs: Channel[];
}

const PRESETS = [
  { name: 'Custom', in: { rows: 3, cols: 8 }, out: { rows: 3, cols: 4 } },
  { name: 'A&H AR2412 (24/12)', in: { rows: 3, cols: 8 }, out: { rows: 3, cols: 4 } },
  { name: 'A&H AB168 (16/8)', in: { rows: 2, cols: 8 }, out: { rows: 2, cols: 4 } },
  { name: 'Behringer S32 (32/16)', in: { rows: 4, cols: 8 }, out: { rows: 4, cols: 4 } },
  { name: 'Behringer S16 (16/8)', in: { rows: 2, cols: 8 }, out: { rows: 2, cols: 4 } },
];

export const ResizeGridModal: React.FC<ResizeGridModalProps> = ({
  onClose,
  onConfirm,
  currentGrid,
  inputs,
  outputs
}) => {
  // Initialize enabled state based on current grid values
  const hasInputs = currentGrid.input.rows > 0 && currentGrid.input.cols > 0;
  const hasOutputs = currentGrid.output.rows > 0 && currentGrid.output.cols > 0;

  const [isInputEnabled, setIsInputEnabled] = useState(hasInputs);
  const [isOutputEnabled, setIsOutputEnabled] = useState(hasOutputs);

  // Preserve the last non-zero grid dimensions for easy toggling
  const [inputGrid, setInputGrid] = useState({
    rows: currentGrid.input.rows || 3,
    cols: currentGrid.input.cols || 8
  });
  const [outputGrid, setOutputGrid] = useState({
    rows: currentGrid.output.rows || 3,
    cols: currentGrid.output.cols || 4
  });

  const [isLossConfirmed, setIsLossConfirmed] = useState(false);

  // Determine current preset selection
  const getPresetName = () => {
    if (!isInputEnabled && !isOutputEnabled) return 'Custom';
    const activeIn = isInputEnabled ? inputGrid : { rows: 0, cols: 0 };
    const activeOut = isOutputEnabled ? outputGrid : { rows: 0, cols: 0 };
    const match = PRESETS.find(
      p => p.in.rows === activeIn.rows &&
           p.in.cols === activeIn.cols &&
           p.out.rows === activeOut.rows &&
           p.out.cols === activeOut.cols
    );
    return match ? match.name : 'Custom';
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS.find(p => p.name === e.target.value);
    if (preset) {
      if (preset.in.rows > 0 && preset.in.cols > 0) {
        setIsInputEnabled(true);
        setInputGrid(preset.in);
      } else {
        setIsInputEnabled(false);
      }

      if (preset.out.rows > 0 && preset.out.cols > 0) {
        setIsOutputEnabled(true);
        setOutputGrid(preset.out);
      } else {
        setIsOutputEnabled(false);
      }
    }
  };

  // Compute actual columns/rows to return
  const finalInputGrid = isInputEnabled ? inputGrid : { rows: 0, cols: 0 };
  const finalOutputGrid = isOutputEnabled ? outputGrid : { rows: 0, cols: 0 };

  const totalInputs = finalInputGrid.rows * finalInputGrid.cols;
  const totalOutputs = finalOutputGrid.rows * finalOutputGrid.cols;

  // Validation rules
  const isInputOverLimit = totalInputs > 128;
  const isOutputOverLimit = totalOutputs > 128;
  const isNoneEnabled = !isInputEnabled && !isOutputEnabled;
  const hasZeroChannels = isInputEnabled && totalInputs === 0;
  const hasZeroOutputs = isOutputEnabled && totalOutputs === 0;

  const hasValidationError = isInputOverLimit || isOutputOverLimit || isNoneEnabled || hasZeroChannels || hasZeroOutputs;

  // Check for active data loss
  const checkDataLoss = () => {
    let lostInCount = 0;
    let lostOutCount = 0;

    // Check Inputs
    inputs.forEach((ch, idx) => {
      if (idx >= totalInputs) {
        const hasData = ch.name.trim() !== '' || ch.mic.trim() !== '' || ch.stand.trim() !== '' || ch.notes.trim() !== '' || ch.group || ch.stereoLink;
        if (hasData) {
          lostInCount++;
        }
      }
    });

    // Check Outputs
    outputs.forEach((ch, idx) => {
      if (idx >= totalOutputs) {
        const hasData = ch.name.trim() !== '' || ch.mic.trim() !== '' || ch.stand.trim() !== '' || ch.notes.trim() !== '' || ch.group || ch.stereoLink;
        if (hasData) {
          lostOutCount++;
        }
      }
    });

    return {
      lostInCount,
      lostOutCount,
      hasLoss: lostInCount > 0 || lostOutCount > 0
    };
  };

  const lossInfo = checkDataLoss();

  // Disable confirm button if validations fail or if there is unconfirmed loss
  const isConfirmDisabled = hasValidationError || (lossInfo.hasLoss && !isLossConfirmed);

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    onConfirm(finalInputGrid, finalOutputGrid);
    onClose();
  };

  return (
    <ModalBase onClose={onClose} onSubmit={handleConfirm} maxWidthClass="max-w-lg">
      <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Grid className="w-5 h-5" /> Resize Grid
        </h3>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          type="button"
          className="text-emerald-200 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        <p className="text-sm text-gray-600 leading-relaxed">
          Adjust the dimensions of your stage box. Active patch channels falling within the new boundaries will be safely mapped and preserved.
        </p>

        <div className="space-y-4">
          {/* Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grid Presets</label>
            <select 
              value={getPresetName()}
              onChange={handlePresetChange} 
              className="w-full px-3 py-2 border rounded-md font-medium bg-white shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              {getPresetName() === 'Custom' && <option value="Custom">Custom Layout</option>}
            </select>
          </div>

          {/* INPUT Block */}
          <div className={`p-4 rounded-lg border transition-all ${isInputEnabled ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isInputEnabled}
                  onChange={(e) => {
                    setIsInputEnabled(e.target.checked);
                    setIsLossConfirmed(false);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                />
                <span>Enable INPUT Section</span>
              </label>
            </div>

            {isInputEnabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Columns</label>
                    <input 
                      type="number" min="1" max="32"
                      value={inputGrid.cols}
                      onChange={e => {
                        setInputGrid({ ...inputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) });
                        setIsLossConfirmed(false);
                      }}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rows</label>
                    <input 
                      type="number" min="1" max="32"
                      value={inputGrid.rows}
                      onChange={e => {
                        setInputGrid({ ...inputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) });
                        setIsLossConfirmed(false);
                      }}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className={`text-xs font-semibold ${isInputOverLimit ? 'text-red-600' : 'text-emerald-700'}`}>
                  Total: {totalInputs} input channels {isInputOverLimit && '(Exceeds 128 max limit)'}
                </div>
              </div>
            )}
          </div>

          {/* OUTPUT Block */}
          <div className={`p-4 rounded-lg border transition-all ${isOutputEnabled ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 font-bold text-xs text-slate-700 uppercase tracking-wider cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isOutputEnabled}
                  onChange={(e) => {
                    setIsOutputEnabled(e.target.checked);
                    setIsLossConfirmed(false);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                />
                <span>Enable OUTPUT Section</span>
              </label>
            </div>

            {isOutputEnabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Columns</label>
                    <input 
                      type="number" min="1" max="32"
                      value={outputGrid.cols}
                      onChange={e => {
                        setOutputGrid({ ...outputGrid, cols: Math.max(0, parseInt(e.target.value) || 0) });
                        setIsLossConfirmed(false);
                      }}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rows</label>
                    <input 
                      type="number" min="1" max="32"
                      value={outputGrid.rows}
                      onChange={e => {
                        setOutputGrid({ ...outputGrid, rows: Math.max(0, parseInt(e.target.value) || 0) });
                        setIsLossConfirmed(false);
                      }}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className={`text-xs font-semibold ${isOutputOverLimit ? 'text-red-600' : 'text-emerald-700'}`}>
                  Total: {totalOutputs} output channels {isOutputOverLimit && '(Exceeds 128 max limit)'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Validation Warnings */}
        {hasValidationError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium space-y-1">
            {isNoneEnabled && <div>• At least one section (INPUT or OUTPUT) must be enabled.</div>}
            {isInputOverLimit && <div>• INPUT grid size cannot exceed 128 channels (currently {totalInputs}).</div>}
            {isOutputOverLimit && <div>• OUTPUT grid size cannot exceed 128 channels (currently {totalOutputs}).</div>}
            {hasZeroChannels && <div>• INPUT grid must contain at least 1 column and 1 row when enabled.</div>}
            {hasZeroOutputs && <div>• OUTPUT grid must contain at least 1 column and 1 row when enabled.</div>}
          </div>
        )}

        {/* Dynamic Data Loss Alert */}
        {!hasValidationError && lossInfo.hasLoss && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-red-700">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Warning: Potential Data Loss!</span>
            </div>
            <div className="text-xs space-y-1">
              <p>Resizing the grid will truncate and delete channels that currently contain active patch details:</p>
              <ul className="list-disc list-inside pl-1 font-semibold text-red-700">
                {lossInfo.lostInCount > 0 && <li>{lossInfo.lostInCount} input channel(s) will be permanently lost</li>}
                {lossInfo.lostOutCount > 0 && <li>{lossInfo.lostOutCount} output channel(s) will be permanently lost</li>}
              </ul>
            </div>
            
            <label className="flex items-start gap-2.5 p-2 bg-white rounded border border-red-200 cursor-pointer hover:bg-red-50/50 transition-colors select-none">
              <input 
                type="checkbox"
                checked={isLossConfirmed}
                onChange={(e) => setIsLossConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
              />
              <span className="text-xs font-semibold leading-snug text-red-700">
                I understand that reducing the grid size will permanently delete these channels and their data.
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 print:hidden">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={!isConfirmDisabled ? { scale: 1.02 } : {}}
          whileTap={!isConfirmDisabled ? { scale: 0.98 } : {}}
          disabled={isConfirmDisabled}
          className={`px-6 py-2 text-sm font-bold text-white rounded-md shadow-sm transition-all ${isConfirmDisabled ? 'bg-slate-300 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-500'}`}
        >
          Confirm
        </motion.button>
      </div>
    </ModalBase>
  );
};
