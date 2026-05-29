import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Channel } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ModalBase } from './ModalBase';

interface MultiGroupModalProps {
  selectedCount: number;
  allChannels: Channel[];
  onClose: () => void;
  onSave: (group: string, colorMode: 'none' | 'uncolored' | 'all') => void;
}

export const MultiGroupModal: React.FC<MultiGroupModalProps> = ({
  selectedCount,
  allChannels,
  onClose,
  onSave,
}) => {
  const [group, setGroup] = useState('');
  const [colorMode, setColorMode] = useState<'none' | 'uncolored' | 'all'>('uncolored');
  
  // Autocomplete suggestions state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique groups and colors to show suggestions
  const existingGroups = Array.from(new Set(allChannels.map(c => c.group).filter(Boolean))) as string[];
  const groupColors = allChannels.reduce((acc, c) => {
    if (c.group && c.color !== '#ffffff') acc[c.group] = c.color;
    return acc;
  }, {} as Record<string, string>);

  const query = (group || '').trim().toLowerCase();
  const filteredSuggestions = existingGroups.filter(g =>
    g.toLowerCase().includes(query)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGroup(e.target.value);
    setHighlightedIndex(-1);
    setIsDropdownOpen(true);
  };

  const selectGroup = (groupName: string) => {
    setGroup(groupName);
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
          e.preventDefault();
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

  const handleSubmit = () => {
    onSave(group.trim(), colorMode);
    onClose();
  };

  return (
    <ModalBase onClose={onClose} onSubmit={handleSubmit} maxWidthClass="max-w-sm">
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center flex-shrink-0">
        <h3 className="font-bold text-sm sm:text-base">Set Group for {selectedCount} channels</h3>
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

      {/* Content & Form */}
      <div className="p-6 space-y-4">
        <div ref={dropdownRef} className="relative">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Group Name (Link)</label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={group}
              onChange={handleGroupChange}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="e.g. Drums, Keys, Vocals..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold pr-10 shadow-3xs"
              required
            />
            <button
              type="button"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {isDropdownOpen && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 py-1"
              >
                {filteredSuggestions.map((g, index) => {
                  const isHighlighted = index === highlightedIndex;
                  const groupColor = groupColors[g];

                  return (
                    <div
                      key={g}
                      onClick={() => selectGroup(g)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-3.5 py-2 cursor-pointer flex items-center justify-between text-xs font-semibold select-none ${
                        isHighlighted ? 'bg-blue-600 text-white' : 'text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {groupColor && (
                          <span
                            className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 ${
                              isHighlighted ? 'border-white/50' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: groupColor }}
                          />
                        )}
                        <span className="truncate">{g}</span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Group Color Assignment Option */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Assign Group Color to:
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['none', 'uncolored', 'all'] as const).map((mode) => {
              const isActive = colorMode === mode;
              const labels = {
                none: 'None',
                uncolored: 'Uncolored',
                all: 'All'
              };
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setColorMode(mode)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/50 cursor-pointer'
                      : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                  }`}
                >
                  {labels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xxs text-slate-500 leading-normal italic">
          Channels sharing the same group name are linked. Setting an existing group name will automatically apply its color.
        </p>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Apply Group
          </button>
        </div>
      </div>
    </ModalBase>
  );
};
