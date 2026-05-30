import { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { Channel, SettingsConfig, SubSnake, UserSettings } from '../types';
import { defaultSettings, initialInputs, initialOutputs, PALETTES, defaultUserSettings, createEmptyInputs, createEmptyOutputs, initialStageboxes } from '../utils/constants';
import { db } from '../services/db';
import { useHistory } from './useHistory';

export const recalculateHardwareMapping = (channels: Channel[], stageboxes: import('../types').Stagebox[], isInput: boolean): Channel[] => {
  let currentIndex = 0;
  const list = [...channels];
  for (const box of stageboxes) {
    const capacity = isInput ? box.grid.input.rows * box.grid.input.cols : box.grid.output.rows * box.grid.output.cols;
    for (let i = 0; i < capacity; i++) {
      if (currentIndex < list.length) {
        list[currentIndex] = {
          ...list[currentIndex],
          stageboxId: box.id,
          stageboxPort: i + 1
        };
        currentIndex++;
      }
    }
  }
  for (let i = currentIndex; i < list.length; i++) {
     list[i] = { ...list[i], stageboxId: undefined, stageboxPort: undefined };
  }
  return list;
};

export function usePatchState(projectId?: string) {
  const [title, setTitle] = useState('EasyPatch');
  const [notes, setNotes] = useState('');
  
  const {
    state: patchData,
    set: setPatchData,
    reset: resetPatchData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory({
    inputs: initialInputs,
    outputs: initialOutputs,
    subSnakes: [] as SubSnake[],
    stageboxes: initialStageboxes as import('../types').Stagebox[],
  });

  const inputs = patchData.inputs;
  const outputs = patchData.outputs;
  const subSnakes = patchData.subSnakes;
  const stageboxes = patchData.stageboxes;

  const setInputs = useCallback((valOrFn: any) => {
    setPatchData(prev => ({
      ...prev,
      inputs: typeof valOrFn === 'function' ? valOrFn(prev.inputs) : valOrFn
    }));
  }, [setPatchData]);

  const setOutputs = useCallback((valOrFn: any) => {
    setPatchData(prev => ({
      ...prev,
      outputs: typeof valOrFn === 'function' ? valOrFn(prev.outputs) : valOrFn
    }));
  }, [setPatchData]);

  const setSubSnakes = useCallback((valOrFn: any) => {
    setPatchData(prev => ({
      ...prev,
      subSnakes: typeof valOrFn === 'function' ? valOrFn(prev.subSnakes) : valOrFn
    }));
  }, [setPatchData]);

  const setStageboxes = useCallback((valOrFn: any) => {
    setPatchData(prev => ({
      ...prev,
      stageboxes: typeof valOrFn === 'function' ? valOrFn(prev.stageboxes) : valOrFn
    }));
  }, [setPatchData]);

  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultUserSettings);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    document.title = title.trim() !== '' ? title : 'EasyPatch';
  }, [title]);

  // Load user settings from localStorage (cross-project preferences)
  useEffect(() => {
    const savedUserSettings = localStorage.getItem('ar2412-user-settings');
    if (savedUserSettings) {
      try { setUserSettings({ ...defaultUserSettings, ...JSON.parse(savedUserSettings) }); } catch (e) { console.error(e); }
    }
  }, []);

  // Save user settings to localStorage
  useEffect(() => {
    localStorage.setItem('ar2412-user-settings', JSON.stringify(userSettings));
  }, [userSettings]);

  // Load project from IndexedDB
  useEffect(() => {
    if (!projectId) {
      setIsLoaded(true);
      hasLoadedRef.current = true;
      return;
    }

    let isMounted = true;
    setIsLoaded(false);

    db.projects.get(projectId).then(project => {
      if (!isMounted) return;
      if (project) {
        setTitle(project.title || 'EasyPatch');
        setNotes(project.notes || '');
        setSettings({ ...defaultSettings, ...project.settings });
        
        let loadedInputs = (project.inputs || initialInputs).map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
        let loadedOutputs = (project.outputs || initialOutputs).map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
        const loadedStageboxes = project.stageboxes || initialStageboxes;

        loadedInputs = recalculateHardwareMapping(loadedInputs, loadedStageboxes, true);
        loadedOutputs = recalculateHardwareMapping(loadedOutputs, loadedStageboxes, false);

        const loadedSubSnakes = (project.subSnakes || []).map((s: any) => ({ ...s, name: (s.name || '').slice(0, 6) }));
        resetPatchData({
          inputs: loadedInputs,
          outputs: loadedOutputs,
          subSnakes: loadedSubSnakes,
          stageboxes: loadedStageboxes
        });
      }
      setIsLoaded(true);
      hasLoadedRef.current = true;
    }).catch(err => {
      console.error("Failed to load project", err);
      if (isMounted) {
        setIsLoaded(true);
        hasLoadedRef.current = true;
      }
    });

    return () => { isMounted = false; };
  }, [projectId]);

  // Debounced save to IndexedDB
  const debouncedSave = useCallback(
    debounce(async (id: string, data: any) => {
      try {
        await db.projects.put({ ...data, id, updatedAt: Date.now() });
        setSaveStatus('saved');
      } catch (err) {
        console.error("Failed to save project", err);
        setSaveStatus('error');
      }
    }, 1000),
    []
  );

  useEffect(() => {
    if (!hasLoadedRef.current || !projectId) return;

    setSaveStatus('saving');
    debouncedSave(projectId, {
      title,
      notes,
      settings,
      inputs,
      outputs,
      subSnakes,
      stageboxes
    });
  }, [title, notes, settings, inputs, outputs, subSnakes, stageboxes, projectId, debouncedSave]);

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
      let sanitized = sanitizeStereoLinks(list);
      sanitized = recalculateHardwareMapping(sanitized, stageboxes, sourceIsInput);
      if (sourceIsInput) setInputs(sanitized);
      else setOutputs(sanitized);

      return warning;
    } else {
      // Normal single channel swap
      const temp = list[sourceIdx];
      list[sourceIdx] = { ...list[targetIdx], number: sourceIdx + 1 };
      list[targetIdx] = { ...temp, number: targetIdx + 1 };

      // Sanitize stereo links to ensure robustness
      let sanitized = sanitizeStereoLinks(list);
      sanitized = recalculateHardwareMapping(sanitized, stageboxes, sourceIsInput);
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

      setPatchData(prev => ({
        ...prev,
        inputs: finalInputs,
        outputs: finalOutputs
      }));
    } else {
      if (isInput) {
        finalInputs = newList;
      } else {
        finalOutputs = newList;
      }
      setPatchData(prev => ({
        ...prev,
        inputs: finalInputs,
        outputs: finalOutputs
      }));
    }

    return { finalInputs, finalOutputs };
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

    resetPatchData({
      inputs: newInputs,
      outputs: newOutputs,
      subSnakes: [],
      stageboxes: initialStageboxes
    });
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
    setPatchData(prev => ({
      ...prev,
      subSnakes: prev.subSnakes.filter(s => s.id !== id),
      inputs: prev.inputs.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch),
      outputs: prev.outputs.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch)
    }));
  };

  const clearSubSnakeAssignments = (id: string) => {
    setPatchData(prev => ({
      ...prev,
      inputs: prev.inputs.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch),
      outputs: prev.outputs.map(ch => ch.subSnakeId === id ? { ...ch, subSnakeId: undefined, subSnakeChannel: undefined } : ch)
    }));
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
    
    let finalInputs = inputs;
    let finalOutputs = outputs;
    let finalSubSnakes = subSnakes;
    let finalStageboxes = stageboxes;

    if (data.settings) {
      const importedSettings = { ...defaultSettings, ...data.settings };
      delete importedSettings.animationsEnabled;
      delete importedSettings.confirmSubsnakeOverwrite;
      setSettings(importedSettings);
      
      const inputCount = (importedSettings.grid?.input?.rows || 3) * (importedSettings.grid?.input?.cols || 8);
      const outputCount = (importedSettings.grid?.output?.rows || 3) * (importedSettings.grid?.output?.cols || 4);
      
      const newInputs = createEmptyInputs(inputCount);
      const newOutputs = createEmptyOutputs(outputCount);
      
      if (data.inputs && Array.isArray(data.inputs)) {
        data.inputs.forEach((importedCh: any) => {
          const idx = newInputs.findIndex(ch => ch.id === importedCh.id || ch.number === importedCh.number);
          if (idx !== -1) {
            newInputs[idx] = { ...newInputs[idx], ...importedCh, mic: importedCh.mic || '', stand: importedCh.stand || '', notes: importedCh.notes || '' };
          }
        });
      }
      if (data.outputs && Array.isArray(data.outputs)) {
        data.outputs.forEach((importedCh: any) => {
          const idx = newOutputs.findIndex(ch => ch.id === importedCh.id || ch.number === importedCh.number);
          if (idx !== -1) {
            newOutputs[idx] = { ...newOutputs[idx], ...importedCh, mic: importedCh.mic || '', stand: importedCh.stand || '', notes: importedCh.notes || '' };
          }
        });
      }
      finalInputs = newInputs;
      finalOutputs = newOutputs;
    } else {
      if (data.inputs && Array.isArray(data.inputs)) finalInputs = data.inputs.map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
      if (data.outputs && Array.isArray(data.outputs)) finalOutputs = data.outputs.map((ch: any) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
    }

    if (data.subSnakes && Array.isArray(data.subSnakes)) {
      finalSubSnakes = data.subSnakes.map((s: any) => ({ ...s, name: (s.name || '').slice(0, 6) }));
    } else {
      finalSubSnakes = [];
    }

    if (data.stageboxes && Array.isArray(data.stageboxes)) {
      finalStageboxes = data.stageboxes;
    } else {
      finalStageboxes = initialStageboxes;
    }

    resetPatchData({
      inputs: finalInputs,
      outputs: finalOutputs,
      subSnakes: finalSubSnakes,
      stageboxes: finalStageboxes
    });
  };

  const handleUpdateStageboxes = (newStageboxes: import('../types').Stagebox[]) => {
    const migrateChannels = (oldChannels: Channel[], isInput: boolean): Channel[] => {
      const oldChannelsMap: Record<string, Channel> = {};
      oldChannels.forEach(ch => {
        if (ch.stageboxId && ch.stageboxPort) {
          oldChannelsMap[`${ch.stageboxId}-${ch.stageboxPort}`] = ch;
        }
      });

      const newChannels: Channel[] = [];
      let absoluteNumber = 1;

      newStageboxes.forEach(box => {
        const cols = isInput ? box.grid.input.cols : box.grid.output.cols;
        const rows = isInput ? box.grid.input.rows : box.grid.output.rows;
        const capacity = cols * rows;

        for (let port = 1; port <= capacity; port++) {
          const key = `${box.id}-${port}`;
          const oldCh = oldChannelsMap[key];

          if (oldCh) {
            newChannels.push({
              ...oldCh,
              number: absoluteNumber,
              stageboxId: box.id,
              stageboxPort: port
            });
          } else {
            newChannels.push({
              id: `${isInput ? 'in' : 'out'}-${box.id}-${port}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: isInput ? 'in' : 'out',
              number: absoluteNumber,
              name: '',
              mic: '',
              stand: '',
              notes: '',
              color: '#ffffff',
              group: '',
              stageboxId: box.id,
              stageboxPort: port
            });
          }
          absoluteNumber++;
        }
      });

      return newChannels;
    };

    let newInputs = migrateChannels(inputs, true);
    let newOutputs = migrateChannels(outputs, false);

    // Sanitize stereo links
    let sanitizedInputs = sanitizeStereoLinks(newInputs);
    let sanitizedOutputs = sanitizeStereoLinks(newOutputs);

    // Recalculate physical mappings just in case
    sanitizedInputs = recalculateHardwareMapping(sanitizedInputs, newStageboxes, true);
    sanitizedOutputs = recalculateHardwareMapping(sanitizedOutputs, newStageboxes, false);

    setPatchData(prev => ({
      ...prev,
      stageboxes: newStageboxes,
      inputs: sanitizedInputs,
      outputs: sanitizedOutputs
    }));
  };

  return {
    title, setTitle,
    notes, setNotes,
    inputs, setInputs,
    outputs, setOutputs,
    settings, setSettings,
    userSettings, setUserSettings,
    subSnakes, setSubSnakes,
    stageboxes, setStageboxes,
    isLoaded, saveStatus,
    handleDrop,
    saveEdit,
    handleCreateNewProject,
    handleUpdateStageboxes,
    handleExport,
    loadImportData,
    addSubSnake,
    updateSubSnake,
    deleteSubSnake,
    clearSubSnakeAssignments,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
