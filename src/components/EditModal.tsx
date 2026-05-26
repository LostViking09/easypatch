import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Pipette, ChevronDown, AlertCircle, Link2 } from 'lucide-react';
import { Channel, SettingsConfig } from '../types';
import { PALETTES } from '../utils/constants';
import { hexToRgba } from '../utils/colors';
import { motion, AnimatePresence } from 'motion/react';

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

  const sameTypeChannels = allChannels.filter(c => c.type === channel.type);
  const hasPrev = channel.number > 1;
  const hasNext = channel.number < sameTypeChannels.length;

  const isEvenToOddPair = 
    (formData.stereoLink === 'next' && formData.number % 2 === 0) ||
    (formData.stereoLink === 'prev' && formData.number % 2 !== 0);

  // Combobox State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique groups and their colors for autocomplete & auto-color
  const existingGroups = Array.from(new Set(allChannels.map(c => c.group).filter(Boolean))) as string[];
  const groupColors = allChannels.reduce((acc, c) => {
    if (c.group && c.color !== '#ffffff') acc[c.group] = c.color;
    return acc;
  }, {} as Record<string, string>);

  // Neighbor groups detection and label mapping
  const neighborChannels = allChannels.filter(c => 
    c.type === channel.type && 
    (c.number === channel.number - 1 || c.number === channel.number + 1)
  );

  const groupToNeighbors = neighborChannels.reduce((acc, c) => {
    if (c.group && c.group.trim() !== '') {
      const label = `${c.type === 'in' ? 'IN' : 'OUT'} ${c.number}`;
      if (!acc[c.group]) {
        acc[c.group] = [];
      }
      if (!acc[c.group].includes(label)) {
        acc[c.group].push(label);
      }
    }
    return acc;
  }, {} as Record<string, string[]>);

  const neighborGroups = Object.keys(groupToNeighbors);
  const otherGroups = existingGroups.filter(g => !neighborGroups.includes(g));
  const sortedGroupSuggestions = [...neighborGroups, ...otherGroups];

  // Filter based on input value
  const query = (formData.group || '').trim().toLowerCase();
  const filteredSuggestions = sortedGroupSuggestions.filter(g =>
    g.toLowerCase().includes(query)
  );

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    setHighlightedIndex(-1);
    setIsDropdownOpen(true);
  };

  const selectGroup = (groupName: string) => {
    setFormData(prev => {
      const updates: Partial<Channel> = { group: groupName };
      if (groupColors[groupName]) {
        updates.color = groupColors[groupName];
      }
      return { ...prev, ...updates };
    });
    setIsDropdownOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          e.preventDefault(); // Don't submit the form
          selectGroup(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen(false);
        break;
      case 'Tab':
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          selectGroup(filteredSuggestions[highlightedIndex]);
        } else {
          setIsDropdownOpen(false);
        }
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
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
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">
            Edit {channel.type === 'in' ? 'Input' : 'Output'} {channel.number}
          </h3>
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

          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Group (Link)</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={formData.group || ''}
                onChange={handleGroupChange}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="e.g. Drums, Keys LR"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="absolute right-2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {isDropdownOpen && filteredSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-50 py-1"
                >
                  {filteredSuggestions.map((g, index) => {
                    const isNeighbor = neighborGroups.includes(g);
                    const neighborLabels = groupToNeighbors[g];
                    const isHighlighted = index === highlightedIndex;
                    const groupColor = groupColors[g];

                    return (
                      <div
                        key={g}
                        onClick={() => selectGroup(g)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between select-none ${
                          isHighlighted ? 'bg-blue-600 text-white' : 'text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {groupColor && (
                            <span
                              className={`w-3 h-3 rounded-full border flex-shrink-0 ${
                                isHighlighted ? 'border-white/50' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: groupColor }}
                            />
                          )}
                          <span className="font-medium truncate">{g}</span>
                        </div>
                        
                        {isNeighbor && neighborLabels && (
                          <span
                            className={`text-2xs font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              isHighlighted 
                                ? 'bg-blue-500 text-blue-100 border border-blue-400/30' 
                                : 'bg-teal-50 text-teal-700 border border-teal-200'
                            }`}
                          >
                            {neighborLabels.map(label => `[${label}]`).join(' ')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-xs text-gray-500 mt-1">Channels with the same group name are linked. Selecting an existing group applies its color.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-gray-500" />
              <span>Stereo Link</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stereoLink: undefined })}
                className={`py-2 px-3 text-xs font-bold rounded-md border transition-all ${
                  !formData.stereoLink
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                None
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => setFormData({ ...formData, stereoLink: 'next' })}
                className={`py-2 px-3 text-xs font-bold rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.stereoLink === 'next'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Link to Next (+1)
              </button>
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => setFormData({ ...formData, stereoLink: 'prev' })}
                className={`py-2 px-3 text-xs font-bold rounded-md border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.stereoLink === 'prev'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Link to Prev (-1)
              </button>
            </div>
            
            <AnimatePresence>
              {isEvenToOddPair && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex gap-2 items-start text-xs leading-relaxed overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Non-standard console pairing warning!</span>
                    Consoles usually require odd+even pairings (e.g., 1-2, 3-4). Linking Ch {formData.number} with Ch {formData.stereoLink === 'next' ? formData.number + 1 : formData.number - 1} forms a {formData.stereoLink === 'next' ? `${formData.number}-${formData.number + 1}` : `${formData.number - 1}-${formData.number}`} pair.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {activePalette.map(color => (
                <motion.button
                  key={color.value}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
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
              
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative w-10 h-10 rounded-md border-2 border-gray-300 overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center bg-gray-50" 
                title="Custom color"
              >
                <Pipette className="w-5 h-5 text-gray-500" />
                <input 
                  type="color" 
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0"
                />
              </motion.div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Save
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
