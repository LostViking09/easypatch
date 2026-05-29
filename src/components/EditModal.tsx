import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Pipette, ChevronDown, AlertCircle, Link2, Network } from 'lucide-react';
import { Channel, SettingsConfig, SubSnake, UserSettings } from '../types';
import { PALETTES } from '../utils/constants';
import { hexToRgba } from '../utils/colors';
import { motion, AnimatePresence } from 'motion/react';

interface EditModalProps {
  channel: Channel;
  allChannels: Channel[];
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  userSettings: UserSettings;
  onClose: () => void;
  onSave: (ch: Channel) => void;
  onNavigate?: (ch: Channel, direction: 'prev' | 'next') => void;
}

export const EditModal: React.FC<EditModalProps> = ({ channel, allChannels, subSnakes, settings, userSettings, onClose, onSave, onNavigate }) => {
  const [formData, setFormData] = useState<Channel>({ ...channel });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'prev' | 'next' | null>(null);
  const activePalette = PALETTES[settings.palette];

  const sameTypeChannels = allChannels.filter(c => c.type === channel.type);
  const hasPrev = channel.number > 1;
  const hasNext = channel.number < sameTypeChannels.length;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!onNavigate) return;
    if (direction === 'next' && !hasNext) {
      // Just save and close if no next channel
      if (isOverwriting && userSettings.confirmSubsnakeOverwrite !== false && currentOccupant) {
        setShowConfirmModal(true);
      } else {
        onSave(formData);
        onClose();
      }
    } else if (direction === 'prev' && !hasPrev) {
      // Just save and close if no prev channel
      if (isOverwriting && userSettings.confirmSubsnakeOverwrite !== false && currentOccupant) {
        setShowConfirmModal(true);
      } else {
        onSave(formData);
        onClose();
      }
    } else {
      if (isOverwriting && userSettings.confirmSubsnakeOverwrite !== false && currentOccupant) {
        setPendingNavigation(direction);
        setShowConfirmModal(true);
      } else {
        onNavigate(formData, direction);
      }
    }
  };

  const isEvenToOddPair = 
    (formData.stereoLink === 'next' && formData.number % 2 === 0) ||
    (formData.stereoLink === 'prev' && formData.number % 2 !== 0);

  const selectedSubSnake = subSnakes.find(s => s.id === formData.subSnakeId);
  const currentOccupant = selectedSubSnake && formData.subSnakeChannel
    ? allChannels.find(
        c => c.id !== formData.id &&
             c.type === channel.type &&
             c.subSnakeId === formData.subSnakeId &&
             c.subSnakeChannel === formData.subSnakeChannel
      )
    : undefined;
  const isOverwriting = !!currentOccupant;

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
        if (showConfirmModal) {
          setShowConfirmModal(false);
          setPendingNavigation(null);
        } else {
          onClose();
        }
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isCtrl) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (showConfirmModal) {
            if (pendingNavigation) {
              onNavigate?.(formData, pendingNavigation);
              setPendingNavigation(null);
            } else {
              onSave(formData);
              onClose();
            }
            setShowConfirmModal(false);
            return;
          }
          handleNavigate(isShift ? 'prev' : 'next');
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (showConfirmModal) return;
          handleNavigate('next');
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (showConfirmModal) return;
          handleNavigate('prev');
          return;
        }
      }
      
      if (e.key === 'Enter') {
        // Do not intercept if dropdown is open so that the combobox can use Enter to select an item
        if (isDropdownOpen) {
          return;
        }

        if (showConfirmModal) {
          e.preventDefault();
          if (pendingNavigation) {
            onNavigate?.(formData, pendingNavigation);
            setPendingNavigation(null);
          } else {
            onSave(formData);
            onClose();
          }
          setShowConfirmModal(false);
          return;
        }

        // Allow Enter to work naturally on certain interactive elements
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl) {
          const tagName = activeEl.tagName;
          const type = activeEl.getAttribute('type');
          
          if (tagName === 'BUTTON') {
             const text = activeEl.textContent?.trim().toLowerCase() || '';
             const ariaLabel = activeEl.getAttribute('aria-label') || '';
             
             // Let Cancel, Close, and submit buttons work natively
             if (text.includes('cancel') || ariaLabel === 'Close' || type === 'submit') {
                return;
             }
          }
        }

        e.preventDefault();
        
        if (isOverwriting && userSettings.confirmSubsnakeOverwrite !== false && currentOccupant) {
          setShowConfirmModal(true);
        } else {
          onSave(formData);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showConfirmModal, formData, isDropdownOpen, isOverwriting, userSettings.confirmSubsnakeOverwrite, currentOccupant, onSave, onNavigate, pendingNavigation]);

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
    
    if (isOverwriting && userSettings.confirmSubsnakeOverwrite !== false && currentOccupant) {
      if (showConfirmModal) {
        onSave(formData);
        onClose();
      } else {
        setShowConfirmModal(true);
      }
    } else {
      onSave(formData);
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (showConfirmModal) {
            setShowConfirmModal(false);
            setPendingNavigation(null);
          } else {
            onClose();
          }
        }
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">
            {channel.type === 'in' ? 'In' : 'Out'}  #{channel.number}
          </h3>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            type="button"
            aria-label="Close"
            className="text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
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

          {channel.type === 'in' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mic / DI</label>
                <input
                  type="text"
                  value={formData.mic}
                  onChange={e => setFormData({ ...formData, mic: e.target.value })}
                  placeholder="e.g. Beta52"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stand</label>
                <input
                  type="text"
                  value={formData.stand}
                  onChange={e => setFormData({ ...formData, stand: e.target.value })}
                  placeholder="e.g. Short boom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder={channel.type === 'in' ? "e.g. 48V, Bring own mic..." : "e.g. IEM, Wedge, Stereo..."}
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

          {/* SubSnake Mapping Section */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-indigo-500" />
              <span>Map to SubSnake</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  subSnakeId: undefined, 
                  subSnakeChannel: undefined 
                })}
                className={`py-1.5 px-3 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                  !formData.subSnakeId
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                None
              </button>
              {subSnakes.map(s => {
                const isSelected = formData.subSnakeId === s.id;
                const totalCh = s.grid 
                  ? (channel.type === 'in' ? s.grid.input.cols * s.grid.input.rows : s.grid.output.cols * s.grid.output.rows) 
                  : 'Dyn';
                
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      subSnakeId: s.id, 
                      subSnakeChannel: formData.subSnakeId === s.id ? (formData.subSnakeChannel || 1) : 1 
                    })}
                    className={`py-1.5 px-3 text-xs font-bold rounded-md border transition-all flex items-center gap-2 cursor-pointer shadow-3xs ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s.color && s.color !== '#ffffff' && (
                      <span 
                        className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                    )}
                    <span>{s.name} ({totalCh} ch)</span>
                  </button>
                );
              })}
            </div>

            {(() => {
              const selectedSubSnake = subSnakes.find(s => s.id === formData.subSnakeId);
              if (!selectedSubSnake) return null;
              
              const isDynamicSubSnake = selectedSubSnake && !selectedSubSnake.grid;
              
              let totalPorts = 0;
              let gridCols = 4;
              if (selectedSubSnake.grid) {
                const subGrid = channel.type === 'in' ? selectedSubSnake.grid.input : selectedSubSnake.grid.output;
                totalPorts = subGrid.rows * subGrid.cols;
                gridCols = subGrid.cols || 4;
              } else {
                const subSnakeChannels = allChannels.filter(c => c.subSnakeId === selectedSubSnake.id && c.type === channel.type);
                const mappedPorts = subSnakeChannels.map(c => c.subSnakeChannel || 0);
                const highestPort = Math.max(...mappedPorts, 0);
                totalPorts = Math.max(12, Math.ceil((highestPort + 1) / 4) * 4);
              }
              
              const ports = [];

              for (let p = 1; p <= totalPorts; p++) {
                const occupant = allChannels.find(
                  c => c.id !== formData.id && c.type === channel.type && c.subSnakeId === selectedSubSnake.id && c.subSnakeChannel === p
                );
                const isSelected = formData.subSnakeChannel === p;
                
                ports.push(
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, subSnakeChannel: p })}
                    className={`h-9 relative rounded border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? occupant
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs z-10 scale-105 hover:bg-amber-600'
                          : 'bg-blue-600 border-blue-600 text-white shadow-xs z-10 scale-105 hover:bg-blue-700'
                        : occupant
                        ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400'
                        : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                    title={
                      isSelected
                        ? occupant
                          ? `Port ${p}: Selected. Occupied by ${occupant.type === 'in' ? 'IN' : 'OUT'} ${occupant.number} (${occupant.name || 'Unused'}). Saving will displace it.`
                          : `Port ${p}: Currently selected`
                        : occupant
                        ? `Port ${p}: Occupied by ${occupant.type === 'in' ? 'IN' : 'OUT'} ${occupant.number} (${occupant.name || 'Unused'}). Clicking will select and displace it.`
                        : `Port ${p}: Available`
                    }
                  >
                    <span>{p}</span>
                    {occupant && (
                      <span className={`text-micro truncate max-w-[90%] px-0.5 mt-0.5 leading-none ${isSelected ? 'text-amber-950 font-bold' : 'text-amber-600'}`}>
                        {(() => {
                          const nameLabel = occupant.name 
                            ? `${occupant.number}: ${occupant.name}` 
                            : `${occupant.type === 'in' ? 'IN' : 'OUT'}${occupant.number}`;
                          return nameLabel.length > 9 ? nameLabel.slice(0, 8) + '..' : nameLabel;
                        })()}
                      </span>
                    )}
                  </button>
                );
              }

              return (
                <div className="space-y-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-2xs font-bold text-slate-500 tracking-wider">Select SubSnake Port</span>
                    {isDynamicSubSnake && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xxs font-semibold text-slate-500">Custom Port:</span>
                        <input
                          type="number"
                          min="1"
                          value={formData.subSnakeChannel || ''}
                          onChange={e => setFormData({ ...formData, subSnakeChannel: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                        />
                      </div>
                    )}
                  </div>
                  <div 
                    className="grid gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
                    }}
                  >
                    {ports}
                  </div>
                  {formData.subSnakeChannel && (
                    <div className="text-xxs text-gray-500 italic leading-tight">
                      {(() => {
                        const currentOccupant = allChannels.find(
                          c => c.id !== formData.id && c.type === channel.type && c.subSnakeId === selectedSubSnake.id && c.subSnakeChannel === formData.subSnakeChannel
                        );
                        if (currentOccupant) {
                          return (
                            <span className="text-amber-700 font-medium">
                              ⚠️ Port {formData.subSnakeChannel} is in use by "{currentOccupant.name || `${currentOccupant.type === 'in' ? 'IN' : 'OUT'} ${currentOccupant.number}`}". Saving will clear its mapping.
                            </span>
                          );
                        }
                        return `Selected Port: ${formData.subSnakeChannel} (available).`;
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}
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

          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
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
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold shadow-sm rounded-md transition-all duration-150 ${
                isOverwriting
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save className="w-4 h-4" /> Save
            </motion.button>
          </div>
        </form>
      </motion.div>
      <AnimatePresence>
        {showConfirmModal && currentOccupant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowConfirmModal(false);
                setPendingNavigation(null);
              }
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-amber-600 text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> Overwrite Mapping?
                </h3>
                <button 
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingNavigation(null);
                  }}
                  aria-label="Close Confirm"
                  className="text-amber-200 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3 text-slate-800">
                <div className="text-sm leading-relaxed">
                  Port <span className="font-bold font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{formData.subSnakeChannel}</span> on SubSnake <span className="font-bold">"{selectedSubSnake?.name || 'SubSnake'}"</span> is already occupied by:
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="font-bold text-sm text-amber-900 font-mono">
                    {currentOccupant.type === 'in' ? 'Input' : 'Output'}  #{currentOccupant.number}
                  </div>
                  <div className="text-xs text-amber-800 font-mono truncate mt-0.5">
                    {currentOccupant.name || 'Unused'} {currentOccupant.mic ? `(${currentOccupant.mic})` : ''}
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  Saving will overwrite and clear the mapping for this channel. Do you want to proceed?
                </p>
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingNavigation(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    if (pendingNavigation) {
                      onNavigate?.(formData, pendingNavigation);
                      setPendingNavigation(null);
                    } else {
                      onSave(formData);
                      onClose();
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-md shadow-sm transition-colors"
                >
                  Yes, Overwrite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
