import React from 'react';
import { Channel } from '../types';

export function useMassAssignment(
  inputs: Channel[],
  setInputs: React.Dispatch<React.SetStateAction<Channel[]>>,
  outputs: Channel[],
  setOutputs: React.Dispatch<React.SetStateAction<Channel[]>>,
  selectedIds: string[],
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  setIsMultiEdit: React.Dispatch<React.SetStateAction<boolean>>,
  setIsMultiGroupOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setIsMultiColorOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setIsAssignSubSnakeOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  const handleMassAssignGroup = (group: string, colorMode: 'none' | 'uncolored' | 'all') => {
    const allChs = [...inputs, ...outputs];
    const groupColor = allChs.find(
      ch => ch.group?.trim().toLowerCase() === group.trim().toLowerCase() && ch.color && ch.color !== '#ffffff'
    )?.color;

    const updateList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        let updatedColor = ch.color;
        if (groupColor && colorMode !== 'none') {
          if (colorMode === 'all' || !ch.color || ch.color === '#ffffff') {
            updatedColor = groupColor;
          }
        }
        return { ...ch, group, color: updatedColor };
      }
      return ch;
    });
    setInputs(updateList(inputs));
    setOutputs(updateList(outputs));
    setIsMultiGroupOpen(false);
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  const handleMassAssignColor = (color: string) => {
    const updateList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        return { ...ch, color };
      }
      return ch;
    });
    setInputs(updateList(inputs));
    setOutputs(updateList(outputs));
    setIsMultiColorOpen(false);
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  const handleMassAssignSubSnake = (subSnakeId: string, startPort: number) => {
    const selectedInputs = inputs.filter(ch => selectedIds.includes(ch.id));
    const selectedOutputs = outputs.filter(ch => selectedIds.includes(ch.id));

    const updateList = (list: Channel[], selectedForType: Channel[], type: 'in' | 'out') => {
      return list.map(ch => {
        if (selectedIds.includes(ch.id) && ch.type === type) {
          const idx = selectedForType.findIndex(c => c.id === ch.id);
          return {
            ...ch,
            subSnakeId,
            subSnakeChannel: startPort + idx
          };
        } else if (ch.subSnakeId === subSnakeId && ch.subSnakeChannel !== undefined && ch.type === type) {
          const portMin = startPort;
          const portMax = startPort + selectedForType.length - 1;
          if (ch.subSnakeChannel >= portMin && ch.subSnakeChannel <= portMax) {
            return { ...ch, subSnakeId: undefined, subSnakeChannel: undefined };
          }
        }
        return ch;
      });
    };

    setInputs(prev => updateList(prev, selectedInputs, 'in'));
    setOutputs(prev => updateList(prev, selectedOutputs, 'out'));
    setIsAssignSubSnakeOpen(false);
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  return {
    handleMassAssignGroup,
    handleMassAssignColor,
    handleMassAssignSubSnake
  };
}
