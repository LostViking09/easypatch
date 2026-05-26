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
            tech: updatedChannel.tech,
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
            tech: updatedChannel.tech,
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
      tech: finalSourceChannel.tech,
      group: finalSourceChannel.group,
      color: finalSourceChannel.color,
      stereoLink: finalSourceChannel.stereoLink
    };
    
    // 3. If the channel is already linked, propagate editing changes (names, tech, group, color)
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
          tech: updatedChannel.tech,
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
    
    if (isInput) setInputs(newList);
    else setOutputs(newList);
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
