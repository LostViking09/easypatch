import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Pipette, ChevronDown, AlertCircle, Link2, Network, Trash2 } from 'lucide-react';
import { Channel, SettingsConfig, SubSnake, UserSettings } from '../types';
import { PALETTES } from '../utils/constants';
import { hexToRgba } from '../utils/colors';
import { motion, AnimatePresence } from 'motion/react';
import { ModalBase } from './ModalBase';
import { ColorPicker } from './ColorPicker';
import { GroupComboBox } from './EditModal/GroupComboBox';
import { SubSnakeGridSelector } from './EditModal/SubSnakeGridSelector';

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

  const handleClear = () => {
    setFormData(prev => ({
      ...prev,
      name: '',
      mic: '',
      stand: '',
      notes: '',
      group: undefined,
      stereoLink: undefined,
      subSnakeId: undefined,
      subSnakeChannel: undefined,
      stageboxId: undefined,
      stageboxPort: undefined,
      color: '#ffffff'
    }));
  };

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

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showConfirmModal, formData, isOverwriting, userSettings.confirmSubsnakeOverwrite, currentOccupant, onSave, onNavigate, pendingNavigation]);

  const handleSubmit = () => {
    if (isOverwriting && userSettings.confirmSubsnakeOverwrite !== false && currentOccupant) {
      setShowConfirmModal(true);
    } else {
      onSave(formData);
      onClose();
    }
  };

  return (
    <ModalBase onClose={onClose} onSubmit={handleSubmit} maxWidthClass="max-w-md">
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
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

      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
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

        <GroupComboBox
          channel={channel}
          group={formData.group || ''}
          onChange={(group, color) => {
            setFormData(prev => ({
              ...prev,
              group,
              ...(color ? { color } : {})
            }));
          }}
          allChannels={allChannels}
        />

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

        <SubSnakeGridSelector
          channel={channel}
          formData={formData}
          onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          subSnakes={subSnakes}
          allChannels={allChannels}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <ColorPicker
            value={formData.color}
            onChange={(color) => setFormData({ ...formData, color })}
            palette={activePalette}
            size="lg"
          />
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50 flex justify-between items-center flex-shrink-0">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-55 hover:text-rose-750 rounded-md transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Clear Channel
        </motion.button>
        <div className="flex gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-750 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold shadow-sm rounded-md transition-all duration-150 cursor-pointer ${
              isOverwriting
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Save className="w-4 h-4" /> Save
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && currentOccupant && (
          <ModalBase
            onClose={() => {
              setShowConfirmModal(false);
              setPendingNavigation(null);
            }}
            onSubmit={() => {
              setShowConfirmModal(false);
              if (pendingNavigation) {
                onNavigate?.(formData, pendingNavigation);
                setPendingNavigation(null);
              } else {
                onSave(formData);
                onClose();
              }
            }}
            zIndexClass="z-[60]"
            maxWidthClass="max-w-sm"
          >
            {/* Header */}
            <div className="bg-amber-600 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
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
                className="text-amber-205 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 text-slate-800 overflow-y-auto">
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
            <div className="p-3 bg-gray-50 border-t flex justify-end gap-2 flex-shrink-0">
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
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-md shadow-sm transition-colors"
              >
                Yes, Overwrite
              </button>
            </div>
          </ModalBase>
        )}
      </AnimatePresence>
    </ModalBase>
  );
};
