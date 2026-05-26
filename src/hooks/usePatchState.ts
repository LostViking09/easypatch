import { useState, useEffect } from 'react';
import { Channel, SettingsConfig } from '../types';
import { defaultSettings, initialInputs, initialOutputs } from '../utils/constants';

export function usePatchState() {
  const [title, setTitle] = useState('EasyPatch');
  const [notes, setNotes] = useState('');
  const [inputs, setInputs] = useState<Channel[]>(initialInputs);
  const [outputs, setOutputs] = useState<Channel[]>(initialOutputs);
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);

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
    
    if (savedTitle) setTitle(savedTitle);
    if (savedNotes) setNotes(savedNotes);
    if (savedSettings) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) }); } catch (e) { console.error(e); }
    } else {
      // Migrate old palette setting if exists
      const oldPalette = localStorage.getItem('ar2412-palette');
      if (oldPalette) setSettings(s => ({ ...s, palette: oldPalette as 'qu5' | 'sq' }));
    }

    if (savedInputs) {
      try { setInputs(JSON.parse(savedInputs)); } catch (e) { console.error(e); }
    }
    if (savedOutputs) {
      try { setOutputs(JSON.parse(savedOutputs)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('ar2412-title', title);
    localStorage.setItem('ar2412-notes', notes);
    localStorage.setItem('ar2412-settings', JSON.stringify(settings));
    localStorage.setItem('ar2412-inputs', JSON.stringify(inputs));
    localStorage.setItem('ar2412-outputs', JSON.stringify(outputs));
  }, [title, notes, settings, inputs, outputs]);

  const handleDrop = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIsInput = sourceId.startsWith('in-');
    const targetIsInput = targetId.startsWith('in-');
    if (sourceIsInput !== targetIsInput) return;

    const list = sourceIsInput ? [...inputs] : [...outputs];
    const sourceIdx = list.findIndex(c => c.id === sourceId);
    const targetIdx = list.findIndex(c => c.id === targetId);

    const temp = list[sourceIdx];
    list[sourceIdx] = { ...list[targetIdx], number: sourceIdx + 1 };
    list[targetIdx] = { ...temp, number: targetIdx + 1 };

    if (sourceIsInput) setInputs(list);
    else setOutputs(list);
  };

  const saveEdit = (updatedChannel: Channel) => {
    if (updatedChannel.type === 'in') {
      setInputs(inputs.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch));
    } else {
      setOutputs(outputs.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch));
    }
  };

  const saveFastInput = (newInputs: Channel[], newOutputs: Channel[]) => {
    setInputs(newInputs);
    setOutputs(newOutputs);
  };

  const handleNewProject = (inputGrid: { rows: number, cols: number }, outputGrid: { rows: number, cols: number }) => {
    const newInputs: Channel[] = Array.from({ length: inputGrid.rows * inputGrid.cols }, (_, i) => ({
      id: `in-${i + 1}`,
      type: 'in',
      number: i + 1,
      name: '',
      tech: '',
      color: '#ffffff',
      group: '',
    }));

    const newOutputs: Channel[] = Array.from({ length: outputGrid.rows * outputGrid.cols }, (_, i) => ({
      id: `out-${i + 1}`,
      type: 'out',
      number: i + 1,
      name: '',
      tech: '',
      color: '#ffffff',
      group: '',
    }));

    setInputs(newInputs);
    setOutputs(newOutputs);
    setSettings(prev => ({
      ...prev,
      grid: {
        input: inputGrid,
        output: outputGrid
      }
    }));
    setTitle('New Patch List');
    setNotes('');
  };

  const handleExport = () => {
    const data = { title, notes, settings, inputs, outputs };
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
    if (data.inputs && Array.isArray(data.inputs)) setInputs(data.inputs);
    if (data.outputs && Array.isArray(data.outputs)) setOutputs(data.outputs);
  };

  return {
    title, setTitle,
    notes, setNotes,
    inputs, setInputs,
    outputs, setOutputs,
    settings, setSettings,
    handleDrop,
    saveEdit,
    saveFastInput,
    handleNewProject,
    handleExport,
    loadImportData
  };
}
