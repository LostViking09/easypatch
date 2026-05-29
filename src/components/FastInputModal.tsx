import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Channel } from '../types';
import { motion } from 'motion/react';
import { ModalBase } from './ModalBase';

interface FastInputModalProps {
  inputs: Channel[];
  outputs: Channel[];
  onClose: () => void;
  onSave: (i: Channel[], o: Channel[]) => void;
}

export const FastInputModal: React.FC<FastInputModalProps> = ({ inputs, outputs, onClose, onSave }) => {
  const [inText, setInText] = useState(inputs.map(c => c.name).join('\n'));
  const [outText, setOutText] = useState(outputs.map(c => c.name).join('\n'));

  const handleSave = () => {
    const inLines = inText.split('\n');
    const outLines = outText.split('\n');
    
    const newInputs = inputs.map((ch, i) => ({ ...ch, name: inLines[i] || '' }));
    const newOutputs = outputs.map((ch, i) => ({ ...ch, name: outLines[i] || '' }));
    
    onSave(newInputs, newOutputs);
    onClose();
  };

  return (
    <ModalBase onClose={onClose} onSubmit={handleSave} maxWidthClass="max-w-4xl">
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold">Fast Input (One name per line)</h3>
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
      
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col md:flex-row gap-6">
        {inputs.length > 0 && (
          <div className="flex-1 flex flex-col">
            <label className="font-bold mb-2">INPUT ({inputs.length})</label>
            <div className="flex flex-1 border rounded-md overflow-hidden font-mono text-sm">
              <div className="bg-gray-100 text-gray-400 p-2 text-right select-none border-r">
                {Array.from({length: inputs.length}, (_, i) => <div key={i}>{i+1}</div>)}
              </div>
              <textarea 
                value={inText}
                onChange={e => setInText(e.target.value)}
                rows={inputs.length}
                className="flex-1 p-2 outline-none resize-none whitespace-pre leading-tight"
                placeholder="Kick&#10;Snare&#10;..."
                style={{ lineHeight: '1.25rem' }}
              />
            </div>
          </div>
        )}

        {outputs.length > 0 && (
          <div className="flex-1 flex flex-col">
            <label className="font-bold mb-2">OUTPUT ({outputs.length})</label>
            <div className="flex flex-1 border rounded-md overflow-hidden font-mono text-sm">
              <div className="bg-gray-100 text-gray-400 p-2 text-right select-none border-r">
                {Array.from({length: outputs.length}, (_, i) => <div key={i}>{i+1}</div>)}
              </div>
              <textarea 
                value={outText}
                onChange={e => setOutText(e.target.value)}
                rows={outputs.length}
                className="flex-1 p-2 outline-none resize-none whitespace-pre leading-tight"
                placeholder="Main L&#10;Main R&#10;..."
                style={{ lineHeight: '1.25rem' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
        <motion.button 
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose} 
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
        >
          Mégse
        </motion.button>
        <motion.button 
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
        >
          <Save className="w-4 h-4" /> Mentés a rácsra
        </motion.button>
      </div>
    </ModalBase>
  );
};
