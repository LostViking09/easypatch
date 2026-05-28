import React, { useState, useRef, useEffect } from 'react';
import { Channel } from '../types';

export function useMultiSelect(
  inputs: Channel[],
  setInputs: React.Dispatch<React.SetStateAction<Channel[]>>,
  outputs: Channel[],
  setOutputs: React.Dispatch<React.SetStateAction<Channel[]>>,
  isAnyModalOpen: boolean
) {
  const [isMultiEdit, setIsMultiEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isSelectingRange = useRef(false);
  const selectionMode = useRef<'select' | 'deselect'>('select');
  const lastSelectedId = useRef<string | null>(null);

  // Global ESC keydown listener to clear multi-select when no modal is open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMultiEdit && !isAnyModalOpen) {
          setIsMultiEdit(false);
          setSelectedIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isMultiEdit, isAnyModalOpen]);

  // Global mouseup listener to terminate drag range selection
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isSelectingRange.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleCellToggle = (id: string, forceMode?: 'select' | 'deselect') => {
    setSelectedIds(prev => {
      const exists = prev.includes(id);
      const mode = forceMode || (exists ? 'deselect' : 'select');
      
      if (mode === 'select' && !exists) {
        return [...prev, id];
      } else if (mode === 'deselect' && exists) {
        return prev.filter(item => item !== id);
      }
      return prev;
    });
  };

  const handleCellMouseDown = (ch: Channel, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    
    isSelectingRange.current = true;
    const exists = selectedIds.includes(ch.id);
    const mode = exists ? 'deselect' : 'select';
    selectionMode.current = mode;
    handleCellToggle(ch.id, mode);
    lastSelectedId.current = ch.id;
  };

  const handleCellMouseEnter = (ch: Channel, e: React.MouseEvent) => {
    if (!isSelectingRange.current) return;
    handleCellToggle(ch.id, selectionMode.current);
    lastSelectedId.current = ch.id;
  };

  const handleMultiEditClear = () => {
    const clearList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        return { ...ch, name: '', tech: '', group: '', color: '#ffffff' };
      }
      return ch;
    });
    setInputs(clearList(inputs));
    setOutputs(clearList(outputs));
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  return {
    isMultiEdit,
    setIsMultiEdit,
    selectedIds,
    setSelectedIds,
    handleCellToggle,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMultiEditClear
  };
}
