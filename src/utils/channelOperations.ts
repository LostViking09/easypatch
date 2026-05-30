import { Channel, Stagebox } from '../types';
import { recalculateHardwareMapping } from './stageboxOperations';

export const sanitizeStereoLinks = (channels: Channel[]): Channel[] => {
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

export const handleDropLogic = (
  sourceId: string,
  targetId: string,
  inputs: Channel[],
  outputs: Channel[],
  stageboxes: Stagebox[]
): { newInputs: Channel[] | null; newOutputs: Channel[] | null; warning: string | null } => {
  if (sourceId === targetId) return { newInputs: null, newOutputs: null, warning: null };
  const sourceIsInput = sourceId.startsWith('in-');
  const targetIsInput = targetId.startsWith('in-');
  if (sourceIsInput !== targetIsInput) return { newInputs: null, newOutputs: null, warning: null };

  const list = sourceIsInput ? [...inputs] : [...outputs];
  const sourceIdx = list.findIndex(c => c.id === sourceId);
  const targetIdx = list.findIndex(c => c.id === targetId);
  if (sourceIdx === -1 || targetIdx === -1) return { newInputs: null, newOutputs: null, warning: null };

  const sourceChannel = list[sourceIdx];
  let warning: string | null = null;

  if (sourceChannel.stereoLink) {
    const isNext = sourceChannel.stereoLink === 'next';
    const srcFirst = isNext ? sourceIdx : sourceIdx - 1;
    const srcSecond = srcFirst + 1;

    if (srcFirst < 0 || srcSecond >= list.length) return { newInputs: null, newOutputs: null, warning: null };

    let tgtFirst = isNext ? targetIdx : targetIdx - 1;
    tgtFirst = Math.max(0, Math.min(tgtFirst, list.length - 2));
    const tgtSecond = tgtFirst + 1;

    if (srcFirst === tgtFirst) return { newInputs: null, newOutputs: null, warning: null };

    const tempFirst = list[srcFirst];
    const tempSecond = list[srcSecond];

    list[srcFirst] = { ...list[tgtFirst], number: srcFirst + 1 };
    list[srcSecond] = { ...list[tgtSecond], number: srcSecond + 1 };
    list[tgtFirst] = { ...tempFirst, number: tgtFirst + 1 };
    list[tgtSecond] = { ...tempSecond, number: tgtSecond + 1 };

    if ((tgtFirst + 1) % 2 === 0) {
      warning = `Consoles usually require odd+even pairings (e.g., 1-2). Moving here forms Ch ${tgtFirst + 1}-${tgtFirst + 2} (${sourceIsInput ? 'Input' : 'Output'}).`;
    }

    let sanitized = sanitizeStereoLinks(list);
    sanitized = recalculateHardwareMapping(sanitized, stageboxes, sourceIsInput);
    
    return {
      newInputs: sourceIsInput ? sanitized : null,
      newOutputs: !sourceIsInput ? sanitized : null,
      warning
    };
  } else {
    const temp = list[sourceIdx];
    list[sourceIdx] = { ...list[targetIdx], number: sourceIdx + 1 };
    list[targetIdx] = { ...temp, number: targetIdx + 1 };

    let sanitized = sanitizeStereoLinks(list);
    sanitized = recalculateHardwareMapping(sanitized, stageboxes, sourceIsInput);

    return {
      newInputs: sourceIsInput ? sanitized : null,
      newOutputs: !sourceIsInput ? sanitized : null,
      warning: null
    };
  }
};

export const saveEditLogic = (
  updatedChannel: Channel,
  inputs: Channel[],
  outputs: Channel[]
): { finalInputs: Channel[]; finalOutputs: Channel[] } => {
  const isInput = updatedChannel.type === 'in';
  const list = isInput ? [...inputs] : [...outputs];
  
  const originalIdx = list.findIndex(c => c.id === updatedChannel.id);
  if (originalIdx === -1) return { finalInputs: inputs, finalOutputs: outputs };
  const originalChannel = list[originalIdx];
  
  const updates: Record<string, Partial<Channel>> = {};
  
  const formatStereoName = (name: string, suffix: ' L' | ' R'): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const base = trimmed.replace(/\s+[LRlr]$/, '');
    return `${base}${suffix}`;
  };
  
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
  
  let finalSourceChannel = { ...updatedChannel };
  
  if (updatedChannel.stereoLink === 'next') {
    const partnerIdx = originalIdx + 1;
    if (partnerIdx < list.length) {
      const partner = list[partnerIdx];
      
      if (partner.stereoLink === 'next') {
        const partnersPartnerIdx = partnerIdx + 1;
        if (partnersPartnerIdx < list.length && list[partnersPartnerIdx].stereoLink === 'prev') {
          updates[list[partnersPartnerIdx].id] = { stereoLink: undefined };
        }
      }
      
      const isNewLink = originalChannel.stereoLink !== 'next';
      const partnerHasNoData = partner.name.trim() === '';
      
      if (isNewLink && partnerHasNoData) {
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
      
      if (partner.stereoLink === 'prev') {
        const partnersPartnerIdx = partnerIdx - 1;
        if (partnersPartnerIdx >= 0 && list[partnersPartnerIdx].stereoLink === 'next') {
          updates[list[partnersPartnerIdx].id] = { stereoLink: undefined };
        }
      }
      
      const isNewLink = originalChannel.stereoLink !== 'prev';
      const partnerHasNoData = partner.name.trim() === '';
      
      if (isNewLink && partnerHasNoData) {
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
        updates[partner.id] = {
          stereoLink: 'next',
          group: updatedChannel.group,
          color: updatedChannel.color
        };
      }
    }
  }
  
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
  
  if (updatedChannel.stereoLink === originalChannel.stereoLink && updatedChannel.stereoLink) {
    const partnerIdx = updatedChannel.stereoLink === 'next' ? originalIdx + 1 : originalIdx - 1;
    if (partnerIdx >= 0 && partnerIdx < list.length) {
      const partner = list[partnerIdx];
      
      let nameUpdate = {};
      if (updatedChannel.name !== originalChannel.name) {
        if (updatedChannel.stereoLink === 'next') {
          const sName = formatStereoName(updatedChannel.name, ' L');
          const pName = formatStereoName(updatedChannel.name, ' R');
          updates[updatedChannel.id] = { ...updates[updatedChannel.id], name: sName };
          nameUpdate = { name: pName };
        } else {
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
  
  const newList = list.map(ch => {
    if (updates[ch.id]) {
      return { ...ch, ...updates[ch.id] };
    }
    return ch;
  });
  
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
  } else {
    if (isInput) {
      finalInputs = newList;
    } else {
      finalOutputs = newList;
    }
  }

  return { finalInputs, finalOutputs };
};
