import { Channel, Stagebox } from '../types';

export const recalculateHardwareMapping = (channels: Channel[], stageboxes: Stagebox[], isInput: boolean): Channel[] => {
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

export const migrateChannelsToNewStageboxes = (oldChannels: Channel[], newStageboxes: Stagebox[], isInput: boolean): Channel[] => {
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
