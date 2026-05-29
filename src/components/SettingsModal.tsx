import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { SettingsConfig, UserSettings } from '../types';
import { motion } from 'motion/react';
import { ModalBase } from './ModalBase';

interface SettingsModalProps {
  settings: SettingsConfig;
  setSettings: (s: SettingsConfig) => void;
  userSettings: UserSettings;
  setUserSettings: (s: UserSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, setSettings, userSettings, setUserSettings, onClose }) => {
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
    <ModalBase onClose={onClose} onSubmit={onClose} maxWidthClass="max-w-md">
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold">Settings</h3>
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
      
      <div className="p-6 space-y-8 overflow-y-auto flex-1 min-h-0">
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
              { key: 'metadata', label: 'Metadata' },
              { key: 'group', label: 'Group Name' },
              { key: 'subSnakeBadge', label: 'SubSnake Badge' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="text-sm font-medium w-32">{label}</label>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.1" 
                  value={settings.fontSizes[key as keyof SettingsConfig['fontSizes']] ?? 1} 
                  onChange={(e) => updateFontSize(key as keyof SettingsConfig['fontSizes'], parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">{(settings.fontSizes[key as keyof SettingsConfig['fontSizes']] ?? 1).toFixed(1)}x</span>
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
            
            {/* Print Theme Setting */}
            <div className="space-y-2 pb-3 border-b border-gray-200">
              <label className="text-sm font-medium">Print Color Mode</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="printTheme" 
                    value="color" 
                    checked={settings.printTheme !== 'bw'} 
                    onChange={() => setSettings({...settings, printTheme: 'color'})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Full Color
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="printTheme" 
                    value="bw" 
                    checked={settings.printTheme === 'bw'} 
                    onChange={() => setSettings({...settings, printTheme: 'bw'})} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Black & White
                </label>
              </div>
              <div className="text-xs text-gray-500">Black & White mode strips backgrounds and uses dark borders.</div>
            </div>

            {/* Print Page Size Setting */}
            <div className="space-y-2 pb-3 border-b border-gray-200">
              <label className="text-sm font-medium">Print Page Size</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="printPageSize" 
                    value="a4" 
                    checked={settings.printPageSize !== 'letter'} 
                    onChange={() => setSettings({...settings, printPageSize: 'a4'})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  A4
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="printPageSize" 
                    value="letter" 
                    checked={settings.printPageSize === 'letter'} 
                    onChange={() => setSettings({...settings, printPageSize: 'letter'})} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Letter
                </label>
              </div>
              <div className="text-xs text-gray-500">Select standard A4 or US Letter page size.</div>
            </div>

            {/* Print Page Orientation Setting */}
            <div className="space-y-2 pb-3 border-b border-gray-200">
              <label className="text-sm font-medium">Print Page Orientation</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="printOrientation" 
                    value="landscape" 
                    checked={settings.printOrientation !== 'portrait'} 
                    onChange={() => setSettings({...settings, printOrientation: 'landscape'})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Landscape (Default)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input 
                    type="radio" 
                    name="printOrientation" 
                    value="portrait" 
                    checked={settings.printOrientation === 'portrait'} 
                    onChange={() => setSettings({...settings, printOrientation: 'portrait'})} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Portrait
                </label>
              </div>
              <div className="text-xs text-gray-500">Select page orientation for your print output.</div>
            </div>

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
                checked={settings.includeSubSnakesInPrint !== false}
                onChange={(e) => setSettings({ ...settings, includeSubSnakesInPrint: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-sm">Include SubSnake views in printouts</div>
                <div className="text-xs text-gray-500">Appends the SubSnake layout excerpt pages to the printed document.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border-t pt-3 border-gray-200">
              <input 
                type="checkbox" 
                checked={userSettings.confirmSubsnakeOverwrite !== false}
                onChange={(e) => setUserSettings({ ...userSettings, confirmSubsnakeOverwrite: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-sm">Confirm SubSnake port displacement</div>
                <div className="text-xs text-gray-500">Show a confirmation popup when mapping a channel to an occupied SubSnake port. (Local Preference)</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border-t pt-3 border-gray-200">
              <input 
                type="checkbox" 
                checked={userSettings.animationsEnabled !== false}
                onChange={(e) => setUserSettings({ ...userSettings, animationsEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-sm">Enable Animations</div>
                <div className="text-xs text-gray-500">Toggle UI animations and transitions across the app. (Local Preference)</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border-t pt-3 border-gray-200">
              <input 
                type="checkbox" 
                checked={settings.showGroupNameOnEveryCell === true}
                onChange={(e) => setSettings({ ...settings, showGroupNameOnEveryCell: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-sm">Show group names on every cell</div>
                <div className="text-xs text-gray-500">Always show the group name badge on all cells of a group, not just the first one.</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer border-t pt-3 border-gray-200">
              <input 
                type="checkbox" 
                checked={settings.alwaysDrawCellBorders === true}
                onChange={(e) => setSettings({ ...settings, alwaysDrawCellBorders: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <div className="font-medium text-sm">Always draw thick cell borders</div>
                <div className="text-xs text-gray-500">If a port has a name but no group, draw full thick borders as if it had its own group.</div>
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
              <p className="text-xxs text-gray-500 italic">Hidden completely at 0%.</p>
            </div>

            <div className="space-y-2 border-t pt-3 border-gray-200">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Table Stripe Contrast</label>
                <span className="text-xs font-mono">{((settings.tableStripeOpacity ?? 0.05) * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.01" max="0.25" step="0.01" 
                value={settings.tableStripeOpacity ?? 0.05} 
                onChange={(e) => setSettings({ ...settings, tableStripeOpacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Table Header Background</label>
                <span className="text-xs font-mono">{((settings.tableHeaderOpacity ?? 0.08) * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.02" max="0.35" step="0.01" 
                value={settings.tableHeaderOpacity ?? 0.08} 
                onChange={(e) => setSettings({ ...settings, tableHeaderOpacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Danger Zone */}
        <div className="pt-4 border-t border-red-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFullReset}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Full Factory Reset (Data + Settings)
          </motion.button>
        </div>
      </div>

      <div className="p-4 border-t flex justify-end">
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
        >
          Done
        </motion.button>
      </div>
    </ModalBase>
  );
};
