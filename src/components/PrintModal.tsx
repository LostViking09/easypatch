import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Printer, LayoutGrid, Table, SlidersHorizontal, Network } from 'lucide-react';
import { Channel, SubSnake, PrintOptions, PrintSourceOptions, SettingsConfig } from '../types';
import { ModalBase } from './ModalBase';

interface PrintModalProps {
  onClose: () => void;
  onConfirm: (options: PrintOptions) => void;
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  setSettings: (s: SettingsConfig) => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  onClose,
  onConfirm,
  inputs,
  outputs,
  subSnakes,
  settings,
  setSettings
}) => {
  const [options, setOptions] = useState<PrintOptions | null>(null);

  useEffect(() => {
    const hasInputContent = inputs.length > 0;
    const hasOutputContent = outputs.length > 0;
    
    const initialSubSnakes: Record<string, PrintSourceOptions> = {};
    subSnakes.forEach(snake => {
      const hasContent = inputs.some(c => c.subSnakeId === snake.id) || outputs.some(c => c.subSnakeId === snake.id);
      initialSubSnakes[snake.id] = {
        printGrid: hasContent,
        printTable: hasContent
      };
    });

    setOptions({
      mainInput: { printGrid: hasInputContent, printTable: hasInputContent },
      mainOutput: { printGrid: hasOutputContent, printTable: hasOutputContent },
      subSnakes: initialSubSnakes
    });
  }, [inputs, outputs, subSnakes]);

  if (!options) return null;

  const toggleSource = (
    key: 'mainInput' | 'mainOutput' | string,
    field: 'printGrid' | 'printTable'
  ) => {
    setOptions(prev => {
      if (!prev) return prev;
      if (key === 'mainInput' || key === 'mainOutput') {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [field]: !prev[key][field]
          }
        };
      } else {
        return {
          ...prev,
          subSnakes: {
            ...prev.subSnakes,
            [key]: {
              ...prev.subSnakes[key],
              [field]: !prev.subSnakes[key][field]
            }
          }
        };
      }
    });
  };

  const OptionRow = ({ icon, title, optionsObj, onToggle, hasContent }: { key?: string, icon?: React.ReactNode, title: string, optionsObj: PrintSourceOptions, onToggle: (field: 'printGrid' | 'printTable') => void, hasContent: boolean }) => (
    <div className={`flex items-center justify-between py-3 border-b border-slate-100 last:border-0 ${!hasContent ? 'opacity-50' : ''}`}>
      <div className="font-semibold text-slate-800 flex items-center gap-2">
        {icon}
        {title}
        {!hasContent && <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Empty</span>}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
          <input 
            type="checkbox" 
            checked={optionsObj.printGrid}
            onChange={() => onToggle('printGrid')}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <LayoutGrid className="w-4 h-4" /> Grid
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
          <input 
            type="checkbox" 
            checked={optionsObj.printTable}
            onChange={() => onToggle('printTable')}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Table className="w-4 h-4" /> Table
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <ModalBase onClose={onClose} onSubmit={() => onConfirm(options)} maxWidthClass="max-w-lg" zIndexClass="z-[100]">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Printer className="w-6 h-6 text-blue-500" />
          Print Options
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto">
        <p className="text-sm text-slate-500 mb-6">
          Select the views you want to include in the printout. Each selected block will automatically start on a new page.
        </p>
        
        <div className="space-y-1 bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
          <OptionRow 
            icon={<SlidersHorizontal className="w-4 h-4 text-slate-550" />}
            title="Main Inputs" 
            optionsObj={options.mainInput} 
            onToggle={(f) => toggleSource('mainInput', f)}
            hasContent={inputs.length > 0}
          />
          <OptionRow 
            icon={<SlidersHorizontal className="w-4 h-4 text-slate-550" />}
            title="Main Outputs" 
            optionsObj={options.mainOutput} 
            onToggle={(f) => toggleSource('mainOutput', f)}
            hasContent={outputs.length > 0}
          />
          
          {subSnakes.map(snake => {
            const hasContent = inputs.some(c => c.subSnakeId === snake.id) || outputs.some(c => c.subSnakeId === snake.id);
            return (
              <OptionRow 
                key={snake.id}
                icon={<Network className="w-4 h-4" style={{ color: snake.color && snake.color !== '#ffffff' ? snake.color : '#64748b' }} />}
                title={`${snake.name}`} 
                optionsObj={options.subSnakes[snake.id]} 
                onToggle={(f) => toggleSource(snake.id, f)}
                hasContent={hasContent}
              />
            );
          })}
        </div>

        {/* Page Setup Section */}
        <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            Print Page Setup
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Color Mode Toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Color Mode</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printTheme: 'color' })}
                  className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    settings.printTheme !== 'bw'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Full Color
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printTheme: 'bw' })}
                  className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    settings.printTheme === 'bw'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Black & White
                </button>
              </div>
            </div>
            
            {/* Page Size Toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Page Size</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printPageSize: 'a4' })}
                  className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    settings.printPageSize !== 'letter'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  A4
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printPageSize: 'letter' })}
                  className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    settings.printPageSize === 'letter'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Letter
                </button>
              </div>
            </div>
          </div>
          
          {/* Orientation Toggle */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Orientation</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, printOrientation: 'landscape' })}
                className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                  settings.printOrientation !== 'portrait'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Landscape (Default)
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, printOrientation: 'portrait' })}
                className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                  settings.printOrientation === 'portrait'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Portrait
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
    </ModalBase>
  );
};
