import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { SettingsConfig } from '../types';
import { motion } from 'motion/react';

interface SettingsModalProps {
  settings: SettingsConfig;
  setSettings: (s: SettingsConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, setSettings, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFullReset = () => {
    if (window.confirm('Are you sure you want to reset everything to factory defaults? All data and settings will be lost!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const updateFontSize = (key: keyof SettingsConfig['fontSizes'], value: number) => {
    setSettings({ ...settings, fontSizes: { ...settings.fontSizes, [key]: value } });
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
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Settings</h3>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Palette */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Default Color Palette</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="palette" 
                  value="qu5" 
                  checked={settings.palette === 'qu5'} 
                  onChange={() => setSettings({ ...settings, palette: 'qu5' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">Allen & Heath Qu5 Colors</span>
              </label>
              <label className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="palette" 
                  value="sq" 
                  checked={settings.palette === 'sq'} 
                  onChange={() => setSettings({ ...settings, palette: 'sq' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">Allen & Heath SQ Colors</span>
              </label>
            </div>
          </div>

          {/* Font Sizes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Font Size Multipliers</label>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              {[
                { key: 'number', label: 'Channel Number' },
                { key: 'name', label: 'Channel Name' },
                { key: 'tech', label: 'Tech Data' },
                { key: 'group', label: 'Group Name' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="text-sm font-medium w-32">{label}</label>
                  <input 
                    type="range" 
                    min="0.5" max="2" step="0.1" 
                    value={settings.fontSizes[key as keyof SettingsConfig['fontSizes']]} 
                    onChange={(e) => updateFontSize(key as keyof SettingsConfig['fontSizes'], parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-right">{settings.fontSizes[key as keyof SettingsConfig['fontSizes']].toFixed(1)}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Print Height */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Print Height (%)</label>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
              <input 
                type="range" 
                min="50" max="100" step="5" 
                value={settings.printHeight} 
                onChange={(e) => setSettings({ ...settings, printHeight: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs font-mono w-10 text-right">{settings.printHeight}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">If it doesn't fit on one page, lower this value (e.g., 90%).</p>
          </div>

          {/* Print & Display Toggles */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Appearance & Print</label>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.useEditorLookInPrint}
                  onChange={(e) => setSettings({ ...settings, useEditorLookInPrint: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium text-sm">Use editor appearance in print</div>
                  <div className="text-xs text-gray-500">The same colors and styles will appear when printing (recommended).</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer border-t pt-3 border-gray-200">
                <input 
                  type="checkbox" 
                  checked={settings.confirmSubsnakeOverwrite !== false}
                  onChange={(e) => setSettings({ ...settings, confirmSubsnakeOverwrite: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium text-sm">Confirm SubSnake port displacement</div>
                  <div className="text-xs text-gray-500">Show a confirmation popup when mapping a channel to an occupied SubSnake port.</div>
                </div>
              </label>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Color Opacity</label>
                  <span className="text-xs font-mono">{(settings.colorOpacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" max="0.8" step="0.05" 
                  value={settings.colorOpacity} 
                  onChange={(e) => setSettings({ ...settings, colorOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Group Border Opacity</label>
                  <span className="text-xs font-mono">{(settings.groupBorderOpacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.05" 
                  value={settings.groupBorderOpacity ?? 1} 
                  onChange={(e) => setSettings({ ...settings, groupBorderOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">XLR Silhouette Opacity</label>
                  <span className="text-xs font-mono">{(settings.xlrOpacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="0.2" step="0.01" 
                  value={settings.xlrOpacity} 
                  onChange={(e) => setSettings({ ...settings, xlrOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-[10px] text-gray-500 italic">Hidden completely at 0%.</p>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="pt-4 border-t border-red-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFullReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Full Factory Reset (Data + Settings)
            </motion.button>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
