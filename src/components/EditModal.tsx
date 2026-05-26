import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Pipette } from 'lucide-react';
import { Channel, SettingsConfig } from '../types';
import { PALETTES } from '../utils/constants';
import { hexToRgba } from '../utils/colors';

interface EditModalProps {
  channel: Channel;
  allChannels: Channel[];
  settings: SettingsConfig;
  onClose: () => void;
  onSave: (ch: Channel) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ channel, allChannels, settings, onClose, onSave }) => {
  const [formData, setFormData] = useState<Channel>({ ...channel });
  const activePalette = PALETTES[settings.palette];

  // Extract unique groups and their colors for autocomplete & auto-color
  const existingGroups = Array.from(new Set(allChannels.map(c => c.group).filter(Boolean))) as string[];
  const groupColors = allChannels.reduce((acc, c) => {
    if (c.group && c.color !== '#ffffff') acc[c.group] = c.color;
    return acc;
  }, {} as Record<string, string>);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGroup = e.target.value;
    setFormData(prev => {
      const updates: Partial<Channel> = { group: newGroup };
      // Auto-apply color if group exists and has a color
      if (groupColors[newGroup]) {
        updates.color = groupColors[newGroup];
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">
            Edit {channel.type === 'in' ? 'Input' : 'Output'} {channel.number}
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
            <input
              ref={inputRef}
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kick, Vox 1..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold tracking-tighter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech details (e.g., mic, stand)</label>
            <input
              type="text"
              value={formData.tech}
              onChange={e => setFormData({ ...formData, tech: e.target.value })}
              placeholder="e.g. Beta52, short stand..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group (Link)</label>
            <input
              type="text"
              list="existing-groups"
              value={formData.group || ''}
              onChange={handleGroupChange}
              placeholder="e.g. Drums, Keys LR"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="existing-groups">
              {existingGroups.map(g => <option key={g} value={g} />)}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">Channels with the same group name are linked. Selecting an existing group applies its color.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {activePalette.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  style={{ 
                    backgroundColor: hexToRgba(color.value, 0.4),
                    borderColor: color.value === '#ffffff' || color.value === '#000000' ? '#d1d5db' : color.value
                  }}
                  className={`w-10 h-10 rounded-md border-2 transition-all ${
                    formData.color.toLowerCase() === color.value.toLowerCase() 
                      ? 'ring-2 ring-offset-1 ring-blue-500 shadow-sm scale-105' 
                      : 'hover:opacity-80'
                  }`}
                  title={color.label}
                />
              ))}
              
              <div className="w-px h-8 bg-gray-300 mx-1"></div>
              
              <div className="relative w-10 h-10 rounded-md border-2 border-gray-300 overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center bg-gray-50" title="Custom color">
                <Pipette className="w-5 h-5 text-gray-500" />
                <input 
                  type="color" 
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
