import { useState, useEffect } from 'react';
import { Channel, SettingsConfig, SubSnake } from '../types';
import { defaultSettings, initialInputs, initialOutputs, PALETTES } from '../utils/constants';

export function usePatchState() {
  const [title, setTitle] = useState('EasyPatch');
  const [notes, setNotes] = useState('');
  const [inputs, setInputs] = useState<Channel[]>(initialInputs);
  const [outputs, setOutputs] = useState<Channel[]>(initialOutputs);
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [subSnakes, setSubSnakes] = useState<SubSnake[]>([]);

  useEffect(() => {
    document.title = title.trim() !== '' ? title : 'EasyPatch';
  }, [title]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('ar2412-title');
    const savedNotes = localStorage.getItem('ar2412-notes');
    const savedInputs = localStorage.getItem('ar2412-inputs');
    const savedOutputs = localStorage.getItem('ar2412-outputs');
    const savedSettings = localStorage.getItem('ar2412-settings');
    const savedSubSnakes = localStorage.getItem('ar2412-subsnakes');
    
    if (savedTitle) setTitle(savedTitle);
    if (savedNotes) setNotes(savedNotes);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...defaultSettings,
          ...parsed,
          fontSizes: {
            ...defaultSettings.fontSizes,
            ...(parsed.fontSizes || {})
          },
          grid: {
            ...defaultSettings.grid,
            ...(parsed.grid || {})
          }
        });
      } catch (e) { console.error(e); }
    } else {
      // Migrate old palette setting if exists
      const oldPalette = localStorage.getItem('ar2412-palette');
      if (oldPalette) setSettings(s => ({ ...s, palette: oldPalette as 'qu5' | 'sq' }));
    }

    if (savedInputs) {
      try { setInputs(JSON.parse(savedInputs).map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }))); } catch (e) { console.error(e); }
    }
    if (savedOutputs) {
      try { setOutputs(JSON.parse(savedOutputs).map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }))); } catch (e) { console.error(e); }
    }
    if (savedSubSnakes) {
      try { 
        const parsed = JSON.parse(savedSubSnakes);
        if (Array.isArray(parsed)) {
          setSubSnakes(parsed.map((s: any) => ({ ...s, name: (s.name || '').slice(0, 6) })));
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('ar2412-title', title);
    localStorage.setItem('ar2412-notes', notes);
    localStorage.setItem('ar2412-settings', JSON.stringify(settings));
    localStorage.setItem('ar2412-inputs', JSON.stringify(inputs));
    localStorage.setItem('ar2412-outputs', JSON.stringify(outputs));
    localStorage.setItem('ar2412-subsnakes', JSON.stringify(subSnakes));
  }, [title, notes, settings, inputs, outputs, subSnakes]);

  const sanitizeStereoLinks = (channels: Channel[]): Channel[] => {
    const list = channels.map(c => ({ ...c }));
    for (let i = 0; i < list.length; i++) {
      const ch = list[i];
      if (ch.stereoLink === 'next') {
        const nextCh = list[i + 1];
        if (!nextCh || nextCh.stereoLink !== 'prev') {
          ch.stereoLink = undefined;
        }
      } else if (ch.stereoLink === 'prev') {
        const prevCh = list[i - 1];
        if (!prevCh || prevCh.stereoLink !== 'next') {
          ch.stereoLink = undefined;
        }
      }
    }
    return list;
  };

  const handleDrop = (sourceId: string, targetId: string): string | null => {
    if (sourceId === targetId) return null;
    const sourceIsInput = sourceId.startsWith('in-');
    const targetIsInput = targetId.startsWith('in-');
    if (sourceIsInput !== targetIsInput) return null;

    const list = sourceIsInput ? [...inputs] : [...outputs];
    const sourceIdx = list.findIndex(c => c.id === sourceId);
    const targetIdx = list.findIndex(c => c.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return null;

    const sourceChannel = list[sourceIdx];
    let warning: string | null = null;

    // Check if the source channel is stereo linked
    if (sourceChannel.stereoLink) {
      const isNext = sourceChannel.stereoLink === 'next';
      const srcFirst = isNext ? sourceIdx : sourceIdx - 1;
      const srcSecond = srcFirst + 1;

      if (srcFirst < 0 || srcSecond >= list.length) return null;

      // Determine the target range
      let tgtFirst = isNext ? targetIdx : targetIdx - 1;
      tgtFirst = Math.max(0, Math.min(tgtFirst, list.length - 2));
      const tgtSecond = tgtFirst + 1;

      // If source and target pairs are the same, do nothing
      if (srcFirst === tgtFirst) return null;

      // Perform pair swap
      const tempFirst = list[srcFirst];
      const tempSecond = list[srcSecond];

      list[srcFirst] = { ...list[tgtFirst], number: srcFirst + 1 };
      list[srcSecond] = { ...list[tgtSecond], number: srcSecond + 1 };
      list[tgtFirst] = { ...tempFirst, number: tgtFirst + 1 };
      list[tgtSecond] = { ...tempSecond, number: tgtSecond + 1 };

      // Check odd-even pairing mismatch in the new target position (1-based index)
      if ((tgtFirst + 1) % 2 === 0) {
        warning = `Consoles usually require odd+even pairings (e.g., 1-2). Moving here forms Ch ${tgtFirst + 1}-${tgtFirst + 2} (${sourceIsInput ? 'Input' : 'Output'}).`;
      }

      // Sanitize stereo links to ensure robustness
      const sanitized = sanitizeStereoLinks(list);
      if (sourceIsInput) setInputs(sanitized);
      else setOutputs(sanitized);

      return warning;
    } else {
      // Normal single channel swap
      const temp = list[sourceIdx];
      list[sourceIdx] = { ...list[targetIdx], number: sourceIdx + 1 };
      list[targetIdx] = { ...temp, number: targetIdx + 1 };

      // Sanitize stereo links to ensure robustness
      const sanitized = sanitizeStereoLinks(list);
      if (sourceIsInput) setInputs(sanitized);
      else setOutputs(sanitized);

      return null;
    }
  };

  const saveEdit = (updatedChannel: Channel) => {
    const isInput = updatedChannel.type === 'in';
    const list = isInput ? [...inputs] : [...outputs];
    
    // Find the original channel to see if the stereoLink status changed
    const originalIdx = list.findIndex(c => c.id === updatedChannel.id);
    if (originalIdx === -1) return;
    const originalChannel = list[originalIdx];
    
    // We will build a map of updates
    const updates: Record<string, Partial<Channel>> = {};
    
    // Helper to format stereo names
    const formatStereoName = (name: string, suffix: ' L' | ' R'): string => {
      const trimmed = name.trim();
      if (!trimmed) return '';
      const base = trimmed.replace(/\s+[LRlr]$/, '');
      return `${base}${suffix}`;
    };
    
    // 1. Handle breaking old links first
    if (originalChannel.stereoLink === 'next') {
      const partnerIdx = originalIdx + 1;
      if (partnerIdx < list.length && list[partnerIdx].stereoLink === 'prev') {
        updates[list[partnerIdx].id] = { stereoLink: undefined };
      }
    } else if (originalChannel.stereoLink === 'prev') {
      const partnerIdx = originalIdx - 1;
      if (partnerIdx >= 0 && list[partnerIdx].stereoLink === 'next') {
        updates[list[partnerIdx].id] = { stereoLink: undefined };
      }
    }
    
    // Start with the basic updated channel parameters
    let finalSourceChannel = { ...updatedChannel };
    
    // 2. Handle establishing new links & synchronizing group/color
    if (updatedChannel.stereoLink === 'next') {
      const partnerIdx = originalIdx + 1;
      if (partnerIdx < list.length) {
        const partner = list[partnerIdx];
        
        // If partner was previously linked to someone else (e.g. partner+1), break that link too
        if (partner.stereoLink === 'next') {
          const partnersPartnerIdx = partnerIdx + 1;
          if (partnersPartnerIdx < list.length && list[partnersPartnerIdx].stereoLink === 'prev') {
            updates[list[partnersPartnerIdx].id] = { stereoLink: undefined };
          }
        }
        
        const isNewLink = originalChannel.stereoLink !== 'next';
        const partnerHasNoData = partner.name.trim() === '';
        
        if (isNewLink && partnerHasNoData) {
          // Copy data, and format both names with L/R
          const sName = formatStereoName(updatedChannel.name, ' L');
          const pName = formatStereoName(updatedChannel.name, ' R');
          
          finalSourceChannel.name = sName;
          updates[partner.id] = {
            stereoLink: 'prev',
            name: pName,
            mic: updatedChannel.mic,
            stand: updatedChannel.stand,
            notes: updatedChannel.notes,
            group: updatedChannel.group,
            color: updatedChannel.color
          };
        } else {
          // Standard link creation (partner already has data)
          updates[partner.id] = {
            stereoLink: 'prev',
            group: updatedChannel.group,
            color: updatedChannel.color
          };
        }
      }
    } else if (updatedChannel.stereoLink === 'prev') {
      const partnerIdx = originalIdx - 1;
      if (partnerIdx >= 0) {
        const partner = list[partnerIdx];
        
        // If partner was previously linked to someone else (e.g. partner-1), break that link too
        if (partner.stereoLink === 'prev') {
          const partnersPartnerIdx = partnerIdx - 1;
          if (partnersPartnerIdx >= 0 && list[partnersPartnerIdx].stereoLink === 'next') {
            updates[list[partnersPartnerIdx].id] = { stereoLink: undefined };
          }
        }
        
        const isNewLink = originalChannel.stereoLink !== 'prev';
        const partnerHasNoData = partner.name.trim() === '';
        
        if (isNewLink && partnerHasNoData) {
          // Copy data, and format both names with L/R
          const sName = formatStereoName(updatedChannel.name, ' R');
          const pName = formatStereoName(updatedChannel.name, ' L');
          
          finalSourceChannel.name = sName;
          updates[partner.id] = {
            stereoLink: 'next',
            name: pName,
            mic: updatedChannel.mic,
            stand: updatedChannel.stand,
            notes: updatedChannel.notes,
            group: updatedChannel.group,
            color: updatedChannel.color
          };
        } else {
          // Standard link creation (partner already has data)
          updates[partner.id] = {
            stereoLink: 'next',
            group: updatedChannel.group,
            color: updatedChannel.color
          };
        }
      }
    }
    
    // Write source updates
    updates[finalSourceChannel.id] = {
      name: finalSourceChannel.name,
      mic: finalSourceChannel.mic,
      stand: finalSourceChannel.stand,
      notes: finalSourceChannel.notes,
      group: finalSourceChannel.group,
      color: finalSourceChannel.color,
      stereoLink: finalSourceChannel.stereoLink,
      subSnakeId: finalSourceChannel.subSnakeId,
      subSnakeChannel: finalSourceChannel.subSnakeChannel
    };
    
    // 3. If the channel is already linked, propagate editing changes (names, mic, stand, notes, group, color)
    if (updatedChannel.stereoLink === originalChannel.stereoLink && updatedChannel.stereoLink) {
      const partnerIdx = updatedChannel.stereoLink === 'next' ? originalIdx + 1 : originalIdx - 1;
      if (partnerIdx >= 0 && partnerIdx < list.length) {
        const partner = list[partnerIdx];
        
        let nameUpdate = {};
        if (updatedChannel.name !== originalChannel.name) {
          if (updatedChannel.stereoLink === 'next') {
            // Edited channel is Left, partner is Right
            const sName = formatStereoName(updatedChannel.name, ' L');
            const pName = formatStereoName(updatedChannel.name, ' R');
            
            updates[updatedChannel.id] = { ...updates[updatedChannel.id], name: sName };
            nameUpdate = { name: pName };
          } else {
            // Edited channel is Right, partner is Left
            const sName = formatStereoName(updatedChannel.name, ' R');
            const pName = formatStereoName(updatedChannel.name, ' L');
            
            updates[updatedChannel.id] = { ...updates[updatedChannel.id], name: sName };
            nameUpdate = { name: pName };
          }
        }
        
        updates[partner.id] = {
          ...updates[partner.id],
          ...nameUpdate,
          mic: updatedChannel.mic,
          stand: updatedChannel.stand,
          notes: updatedChannel.notes,
          group: updatedChannel.group,
          color: updatedChannel.color
        };
      }
    }
    
    // Apply all updates to the list
    const newList = list.map(ch => {
      if (updates[ch.id]) {
        return { ...ch, ...updates[ch.id] };
      }
      return ch;
    });
    
    // Strict port uniqueness: clear the same subsnake/channel combination if mapped elsewhere
    const sId = updatedChannel.subSnakeId;
    const sChan = updatedChannel.subSnakeChannel;

    let finalInputs = inputs;
    let finalOutputs = outputs;

    if (sId && sChan) {
      finalInputs = (isInput ? newList : inputs).map(ch => {
        if (ch.id !== updatedChannel.id && ch.subSnakeId === sId && ch.subSnakeChannel === sChan) {
          return { ...ch, subSnakeId: undefined, subSnakeChannel: undefined };
        }
        return ch;
      });
      
      finalOutputs = (!isInput ? newList : outputs).map(ch => {
        if (ch.id !== updatedChannel.id && ch.subSnakeId === sId && ch.subSnakeChannel === sChan) {
          return { ...ch, subSnakeId: undefined, subSnakeChannel: undefined };
        }
        return ch;
      });

      setInputs(finalInputs);
      setOutputs(finalOutputs);
    } else {
      if (isInput) {
        finalInputs = newList;
      } else {
        finalOutputs = newList;
      }
      setInputs(finalInputs);
      setOutputs(finalOutputs);
    }

    return { finalInputs, finalOutputs };
  };

  const saveFastInput = (newInputs: Channel[], newOutputs: Channel[]) => {
    setInputs(newInputs);
    setOutputs(newOutputs);
  };

  const handleCreateNewProject = () => {
    const defaultInputGrid = { rows: 3, cols: 8 };
    const defaultOutputGrid = { rows: 3, cols: 4 };

    const newInputs: Channel[] = Array.from({ length: 24 }, (_, i) => ({
      id: `in-${i + 1}`,
      type: 'in',
      number: i + 1,
      name: '',
      mic: '',
      stand: '',
      notes: '',
      color: '#ffffff',
      group: '',
    }));

    const newOutputs: Channel[] = Array.from({ length: 12 }, (_, i) => ({
      id: `out-${i + 1}`,
      type: 'out',
      number: i + 1,
      name: '',
      mic: '',
      stand: '',
      notes: '',
      color: '#ffffff',
      group: '',
    }));

    setInputs(newInputs);
    setOutputs(newOutputs);
    setSubSnakes([]);
    setSettings(prev => ({
      ...prev,
      grid: {
        input: defaultInputGrid,
        output: defaultOutputGrid
      }
    }));
    setTitle('New Patch List');
    setNotes('');
  };

  const handleResizeGrid = (inputGrid: { rows: number, cols: number }, outputGrid: { rows: number, cols: number }) => {
    const newInputsCount = inputGrid.rows * inputGrid.cols;
    const newOutputsCount = outputGrid.rows * outputGrid.cols;

    // Map inputs
    const newInputs: Channel[] = Array.from({ length: newInputsCount }, (_, i) => {
      const existing = inputs[i];
      if (existing) {
        return { ...existing, number: i + 1 };
      }
      return {
        id: `in-${i + 1}`,
        type: 'in',
        number: i + 1,
        name: '',
        mic: '',
        stand: '',
        notes: '',
        color: '#ffffff',
        group: '',
      };
    });

    // Map outputs
    const newOutputs: Channel[] = Array.from({ length: newOutputsCount }, (_, i) => {
      const existing = outputs[i];
      if (existing) {
        return { ...existing, number: i + 1 };
      }
      return {
        id: `out-${i + 1}`,
        type: 'out',
        number: i + 1,
        name: '',
        mic: '',
        stand: '',
        notes: '',
        color: '#ffffff',
        group: '',
      };
    });

    // Sanitize stereo links
    const sanitizedInputs = sanitizeStereoLinks(newInputs);
    const sanitizedOutputs = sanitizeStereoLinks(newOutputs);

    setInputs(sanitizedInputs);
    setOutputs(sanitizedOutputs);
    setSettings(prev => ({
      ...prev,
      grid: {
        input: inputGrid,
        output: outputGrid
      }
    }));
  };

  const addSubSnake = (name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => {
    const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
    const newSnake: SubSnake = {
      id: 'subsnake-' + (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)),
      name: name.slice(0, 6),
      color: color || defaultColor,
      grid,
    };
    setSubSnakes(prev => [...prev, newSnake]);
    return newSnake;
  };

  const updateSubSnake = (id: string, name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => {
    const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
    setSubSnakes(prev => prev.map(s => s.id === id ? { ...s, name: name.slice(0, 6), color: color || s.color || defaultColor, grid } : s));
  };

  const deleteSubSnake = (id: string) => {
    setSubSnakes(prev => prev.filter(s => s.id !== id));
    setInputs(prev => prev.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch));
    setOutputs(prev => prev.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch));
  };

  const clearSubSnakeAssignments = (id: string) => {
    setInputs(prev => prev.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch));
    setOutputs(prev => prev.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch));
  };

  const handleExport = () => {
    const data = { title, notes, settings, inputs, outputs, subSnakes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = title.trim() !== '' ? title : 'EasyPatch';
    a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.easypatch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadImportData = (data: any) => {
    if (data.title) setTitle(data.title);
    if (data.notes !== undefined) setNotes(data.notes);
    if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
    if (data.inputs && Array.isArray(data.inputs)) setInputs(data.inputs.map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' })));
    if (data.outputs && Array.isArray(data.outputs)) setOutputs(data.outputs.map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' })));
    if (data.subSnakes && Array.isArray(data.subSnakes)) {
      setSubSnakes(data.subSnakes.map((s: any) => ({ ...s, name: (s.name || '').slice(0, 6) })));
    } else {
      setSubSnakes([]);
    }
  };

  return {
    title, setTitle,
    notes, setNotes,
    inputs, setInputs,
    outputs, setOutputs,
    settings, setSettings,
    subSnakes, setSubSnakes,
    handleDrop,
    saveEdit,
    saveFastInput,
    handleCreateNewProject,
    handleResizeGrid,
    handleExport,
    loadImportData,
    addSubSnake,
    updateSubSnake,
    deleteSubSnake,
    clearSubSnakeAssignments
  };
}
