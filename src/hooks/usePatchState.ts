import { useState, useEffect, useRef, useCallback, SetStateAction } from 'react';
import debounce from 'lodash.debounce';
import { Channel, SettingsConfig, SubSnake, UserSettings, Stagebox } from '../types';
import { defaultSettings, initialInputs, initialOutputs, PALETTES, defaultUserSettings, createEmptyInputs, createEmptyOutputs, initialStageboxes } from '../utils/constants';
import { db } from '../services/db';
import { useHistory } from './useHistory';

import { recalculateHardwareMapping, migrateChannelsToNewStageboxes } from '../utils/stageboxOperations';
import { sanitizeStereoLinks, handleDropLogic, saveEditLogic } from '../utils/channelOperations';

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
    stageboxes: initialStageboxes as Stagebox[],
  });

  const inputs = patchData.inputs;
  const outputs = patchData.outputs;
  const subSnakes = patchData.subSnakes;
  const stageboxes = patchData.stageboxes;

  const setInputs = useCallback((valOrFn: SetStateAction<Channel[]>) => {
    setPatchData(prev => ({
      ...prev,
      inputs: typeof valOrFn === 'function' ? valOrFn(prev.inputs) : valOrFn
    }));
  }, [setPatchData]);

  const setOutputs = useCallback((valOrFn: SetStateAction<Channel[]>) => {
    setPatchData(prev => ({
      ...prev,
      outputs: typeof valOrFn === 'function' ? valOrFn(prev.outputs) : valOrFn
    }));
  }, [setPatchData]);

  const setSubSnakes = useCallback((valOrFn: SetStateAction<SubSnake[]>) => {
    setPatchData(prev => ({
      ...prev,
      subSnakes: typeof valOrFn === 'function' ? valOrFn(prev.subSnakes) : valOrFn
    }));
  }, [setPatchData]);

  const setStageboxes = useCallback((valOrFn: SetStateAction<Stagebox[]>) => {
    setPatchData(prev => ({
      ...prev,
      stageboxes: typeof valOrFn === 'function' ? valOrFn(prev.stageboxes) : valOrFn
    }));
  }, [setPatchData]);

  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultUserSettings);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isUnsavedPreview, setIsUnsavedPreview] = useState(false);
  const [sourceId, setSourceId] = useState<string | undefined>(undefined);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    document.title = title.trim() !== '' ? title : 'EasyPatch';
  }, [title]);

  // Load user settings from localStorage (cross-project preferences)
  useEffect(() => {
    const savedUserSettings = localStorage.getItem('easypatch-user-settings');
    if (savedUserSettings) {
      try { setUserSettings({ ...defaultUserSettings, ...JSON.parse(savedUserSettings) }); } catch (e) { console.error(e); }
    }
  }, []);

  // Save user settings to localStorage
  useEffect(() => {
    localStorage.setItem('easypatch-user-settings', JSON.stringify(userSettings));
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
        
        let loadedInputs = (project.inputs || initialInputs).map((ch: Partial<Channel>) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
        let loadedOutputs = (project.outputs || initialOutputs).map((ch: Partial<Channel>) => ({ ...ch, mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
        const inCols = project.settings?.grid?.input?.cols || 8;
        const outCols = project.settings?.grid?.output?.cols || 4;
        const inCount = loadedInputs.length;
        const outCount = loadedOutputs.length;

        const loadedStageboxes = project.stageboxes || [
          {
            id: 'local-io',
            name: 'Main IO',
            order: 0,
            grid: {
              input: {
                rows: Math.max(1, Math.ceil(inCount / inCols)),
                cols: inCols
              },
              output: {
                rows: Math.max(1, Math.ceil(outCount / outCols)),
                cols: outCols
              }
            }
          }
        ];

        loadedInputs = recalculateHardwareMapping(loadedInputs as Channel[], loadedStageboxes, true);
        loadedOutputs = recalculateHardwareMapping(loadedOutputs as Channel[], loadedStageboxes, false);

        const loadedSubSnakes = (project.subSnakes || []).map((s: Partial<SubSnake>) => ({ ...s, name: (s.name || '').slice(0, 16) }));
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
    debounce(async (id: string, data: Record<string, unknown>) => {
      try {
        await db.projects.put({ ...data, id, updatedAt: Date.now() } as any);
        setSaveStatus('saved');
      } catch (err) {
        console.error("Failed to save project", err);
        setSaveStatus('error');
      }
    }, 1000),
    []
  );

  useEffect(() => {
    if (!hasLoadedRef.current || !projectId || isUnsavedPreview) return;

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



  const handleDrop = (sourceId: string, targetId: string): string | null => {
    const { newInputs, newOutputs, warning } = handleDropLogic(sourceId, targetId, inputs, outputs, stageboxes);
    
    if (newInputs) setInputs(newInputs);
    if (newOutputs) setOutputs(newOutputs);
    
    return warning;
  };

  const saveEdit = (updatedChannel: Channel) => {
    const { finalInputs, finalOutputs } = saveEditLogic(updatedChannel, inputs, outputs);
    
    setPatchData(prev => ({
      ...prev,
      inputs: finalInputs,
      outputs: finalOutputs
    }));

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


  const addSubSnake = (name: string, note?: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => {
    const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
    const newSnake: SubSnake = {
      id: 'subsnake-' + (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)),
      name: name.slice(0, 16),
      note: note,
      color: color || defaultColor,
      grid,
    };
    setSubSnakes(prev => [...prev, newSnake]);
    return newSnake;
  };

  const updateSubSnake = (id: string, name: string, note?: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => {
    const defaultColor = PALETTES[settings.palette][0]?.value || '#017fba';
    setSubSnakes(prev => prev.map(s => s.id === id ? { ...s, name: name.slice(0, 16), note: note, color: color || s.color || defaultColor, grid } : s));
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
    const data = { sourceId: projectId, title, notes, settings, inputs, outputs, subSnakes, stageboxes };
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

  const loadImportData = (data: Partial<{ title: string, notes: string, settings: Partial<SettingsConfig>, inputs: Partial<Channel>[], outputs: Partial<Channel>[], subSnakes: Partial<SubSnake>[], stageboxes: Stagebox[], sourceId: string }>, isPreview: boolean = false) => {
    if (isPreview) {
      setIsUnsavedPreview(true);
      setSourceId(data.sourceId);
    }
    if (data.title) setTitle(data.title);
    if (data.notes !== undefined) setNotes(data.notes);
    
    let finalInputs = inputs;
    let finalOutputs = outputs;
    let finalSubSnakes = subSnakes;
    let finalStageboxes = stageboxes;

    if (data.settings) {
      const importedSettings = { ...defaultSettings, ...data.settings };
      delete (importedSettings as any).animationsEnabled;
      delete (importedSettings as any).confirmSubsnakeOverwrite;
      setSettings(importedSettings);
      
      const inCols = importedSettings.grid?.input?.cols || 8;
      const outCols = importedSettings.grid?.output?.cols || 4;
      const actualInRows = (!data.stageboxes && data.inputs) ? Math.max(1, Math.ceil(data.inputs.length / inCols)) : (importedSettings.grid?.input?.rows || 3);
      const actualOutRows = (!data.stageboxes && data.outputs) ? Math.max(1, Math.ceil(data.outputs.length / outCols)) : (importedSettings.grid?.output?.rows || 3);

      if (!data.stageboxes) {
        importedSettings.grid = {
          input: { rows: actualInRows, cols: inCols },
          output: { rows: actualOutRows, cols: outCols }
        };
      }

      const inputCount = actualInRows * inCols;
      const outputCount = actualOutRows * outCols;
      
      const newInputs = createEmptyInputs(inputCount);
      const newOutputs = createEmptyOutputs(outputCount);
      
      if (data.inputs && Array.isArray(data.inputs)) {
        data.inputs.forEach((importedCh) => {
          const idx = newInputs.findIndex(ch => ch.id === importedCh.id || ch.number === importedCh.number);
          if (idx !== -1) {
            newInputs[idx] = { ...newInputs[idx], ...importedCh, mic: importedCh.mic || '', stand: importedCh.stand || '', notes: importedCh.notes || '' };
          }
        });
      }
      if (data.outputs && Array.isArray(data.outputs)) {
        data.outputs.forEach((importedCh) => {
          const idx = newOutputs.findIndex(ch => ch.id === importedCh.id || ch.number === importedCh.number);
          if (idx !== -1) {
            newOutputs[idx] = { ...newOutputs[idx], ...importedCh, mic: importedCh.mic || '', stand: importedCh.stand || '', notes: importedCh.notes || '' };
          }
        });
      }
      finalInputs = newInputs;
      finalOutputs = newOutputs;
    } else {
      if (data.inputs && Array.isArray(data.inputs)) finalInputs = data.inputs.map(ch => ({ ...(ch as Channel), mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
      if (data.outputs && Array.isArray(data.outputs)) finalOutputs = data.outputs.map(ch => ({ ...(ch as Channel), mic: ch.mic || '', stand: ch.stand || '', notes: ch.notes || '' }));
    }

    if (data.subSnakes && Array.isArray(data.subSnakes)) {
      finalSubSnakes = data.subSnakes.map((s) => ({ ...(s as SubSnake), name: (s.name || '').slice(0, 16) }));
    } else {
      finalSubSnakes = [];
    }

    if (data.stageboxes && Array.isArray(data.stageboxes)) {
      finalStageboxes = data.stageboxes;
    } else {
      const inCols = data.settings?.grid?.input?.cols || 8;
      const outCols = data.settings?.grid?.output?.cols || 4;
      const inCount = data.inputs ? data.inputs.length : 24;
      const outCount = data.outputs ? data.outputs.length : 12;

      finalStageboxes = [
        {
          id: 'local-io',
          name: 'Main IO',
          order: 0,
          grid: {
            input: {
              rows: Math.max(1, Math.ceil(inCount / inCols)),
              cols: inCols
            },
            output: {
              rows: Math.max(1, Math.ceil(outCount / outCols)),
              cols: outCols
            }
          }
        }
      ];
    }

    resetPatchData({
      inputs: finalInputs,
      outputs: finalOutputs,
      subSnakes: finalSubSnakes,
      stageboxes: finalStageboxes
    });
  };

  const handleUpdateStageboxes = (newStageboxes: Stagebox[]) => {
    let newInputs = migrateChannelsToNewStageboxes(inputs, newStageboxes, true);
    let newOutputs = migrateChannelsToNewStageboxes(outputs, newStageboxes, false);

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
    isLoaded, saveStatus, isUnsavedPreview, setIsUnsavedPreview, sourceId, setSourceId,
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
