import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onConfirm: (inputGrid: { rows: number, cols: number }, outputGrid: { rows: number, cols: number }) => void;
}

const PRESETS = [
  { name: 'Custom', in: { rows: 3, cols: 8 }, out: { rows: 3, cols: 4 } },
  { name: 'A&H AR2412 (24/12)', in: { rows: 3, cols: 8 }, out: { rows: 3, cols: 4 } },
  { name: 'A&H AB168 (16/8)', in: { rows: 2, cols: 8 }, out: { rows: 2, cols: 4 } },
  { name: 'Behringer S32 (32/16)', in: { rows: 4, cols: 8 }, out: { rows: 4, cols: 4 } },
  { name: 'Behringer S16 (16/8)', in: { rows: 2, cols: 8 }, out: { rows: 2, cols: 4 } },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onConfirm }) => {
  const [inputGrid, setInputGrid] = useState({ rows: 3, cols: 8 });
  const [outputGrid, setOutputGrid] = useState({ rows: 3, cols: 4 });

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS.find(p => p.name === e.target.value);
    if (preset) {
      setInputGrid(preset.in);
      setOutputGrid(preset.out);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Create New Project
          </h3>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Set the dimensions for the new stage box grid. Warning: this will clear current data!
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Presets</label>
              <select onChange={handlePresetChange} className="w-full px-3 py-2 border rounded-md font-medium bg-white">
                {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">INPUT Blocks</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Columns</label>
                  <input 
                    type="number" min="1" max="16"
                    value={inputGrid.cols}
                    onChange={e => setInputGrid({ ...inputGrid, cols: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rows</label>
                  <input 
                    type="number" min="1" max="10"
                    value={inputGrid.rows}
                    onChange={e => setInputGrid({ ...inputGrid, rows: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                Total: {inputGrid.rows * inputGrid.cols} channels
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">OUTPUT Blocks</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Columns</label>
                  <input 
                    type="number" min="1" max="16"
                    value={outputGrid.cols}
                    onChange={e => setOutputGrid({ ...outputGrid, cols: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rows</label>
                  <input 
                    type="number" min="1" max="10"
                    value={outputGrid.rows}
                    onChange={e => setOutputGrid({ ...outputGrid, rows: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                Total: {outputGrid.rows * outputGrid.cols} channels
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(inputGrid, outputGrid)}
            className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-sm transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
