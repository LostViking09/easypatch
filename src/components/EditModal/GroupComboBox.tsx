import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Channel } from '../../types';

interface GroupComboBoxProps {
  channel: Channel;
  group: string;
  onChange: (newGroup: string, color?: string) => void;
  allChannels: Channel[];
}

export const GroupComboBox: React.FC<GroupComboBoxProps> = ({ channel, group, onChange, allChannels }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique groups and their colors for autocomplete & auto-color
  const existingGroups = Array.from(new Set(allChannels.map(c => c.group).filter(Boolean))) as string[];
  const groupColors = allChannels.reduce((acc, c) => {
    if (c.group && c.color !== '#ffffff') acc[c.group] = c.color;
    return acc;
  }, {} as Record<string, string>);

  // Neighbor channels logic
  const neighborChannels = allChannels.filter(c => 
    c.type === channel.type && 
    (c.number === channel.number - 1 || c.number === channel.number + 1)
  );

  const groupToNeighbors = neighborChannels.reduce((acc, c) => {
    if (c.group && c.group.trim() !== '') {
      const label = `${c.type === 'in' ? 'IN' : 'OUT'} ${c.number}`;
      if (!acc[c.group]) acc[c.group] = [];
      if (!acc[c.group].includes(label)) acc[c.group].push(label);
    }
    return acc;
  }, {} as Record<string, string[]>);

  const neighborGroups = Object.keys(groupToNeighbors);
  const otherGroups = existingGroups.filter(g => !neighborGroups.includes(g));
  const sortedGroupSuggestions = [...neighborGroups, ...otherGroups];

  const query = (group || '').trim().toLowerCase();
  const filteredSuggestions = sortedGroupSuggestions.filter(g =>
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
    const newGroup = e.target.value;
    onChange(newGroup, groupColors[newGroup]);
    setHighlightedIndex(-1);
    setIsDropdownOpen(true);
  };

  const selectGroup = (groupName: string) => {
    onChange(groupName, groupColors[groupName]);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        setHighlightedIndex(prev => prev < filteredSuggestions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : filteredSuggestions.length - 1);
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

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Group (Link)</label>
      <div className="relative flex items-center">
        <input
          type="text"
          value={group || ''}
          onChange={handleGroupChange}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
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
  );
};
