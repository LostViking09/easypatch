import React from 'react';
import { Channel } from '../../types';
import { ChannelCell } from '../../components/ChannelCell';

interface PatchGridSectionProps {
  channels: Channel[];
  type: 'INPUT' | 'OUTPUT';
  cols: number;
  flexClass: string;
  settings: any;
  subSnakes: any[];
  selectedIds: string[];
  isMultiEdit: boolean;
  onCellClick: (ch: Channel, e: React.MouseEvent) => void;
  onCellDrop: (sourceId: string, targetId: string) => void;
  onCellMouseDown: (ch: Channel, e: React.MouseEvent) => void;
  onCellMouseEnter: (ch: Channel, e: React.MouseEvent) => void;
}

export function PatchGridSection({
  channels,
  type,
  cols,
  flexClass,
  settings,
  subSnakes,
  selectedIds,
  isMultiEdit,
  onCellClick,
  onCellDrop,
  onCellMouseDown,
  onCellMouseEnter
}: PatchGridSectionProps) {
  if (channels.length === 0 || cols <= 0) return null;

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;

  const cells = channels.map((ch, index) => {
    const isInGroup = !!ch.group && ch.group.trim() !== '';
    const isFirstInGroup = isInGroup && (index === 0 || channels[index - 1].group !== ch.group);
    const isLastInGroup = isInGroup && (index === channels.length - 1 || channels[index + 1].group !== ch.group);
    const isFirstInRow = index % cols === 0;
    const isLastInRow = index % cols === cols - 1;
    const isBottomRow = index >= channels.length - cols;
    const subSnake = subSnakes.find(s => s.id === ch.subSnakeId);
    const subSnakeName = subSnake?.name;
    const subSnakeColor = subSnake?.color;

    return (
      <ChannelCell
        key={ch.id}
        channel={ch}
        settings={settings}
        onClick={(e) => onCellClick(ch, e)}
        isSelected={selectedIds.includes(ch.id)}
        onDrop={onCellDrop}
        isInGroup={isInGroup}
        isFirstInGroup={isFirstInGroup}
        isLastInGroup={isLastInGroup}
        isFirstInRow={isFirstInRow}
        isLastInRow={isLastInRow}
        isBottomRow={isBottomRow}
        subSnakeName={subSnakeName}
        subSnakeColor={subSnakeColor}
        isMultiSelectMode={isMultiEdit}
        onCellMouseDown={(e) => onCellMouseDown(ch, e)}
        onCellMouseEnter={(e) => onCellMouseEnter(ch, e)}
      />
    );
  });

  const rows: React.ReactNode[] = [];
  for (let i = 0; i < cells.length; i += cols) {
    const rowCells = cells.slice(i, i + cols);
    rows.push(
      <div key={i} className="grid-row-wrapper">
        {rowCells}
      </div>
    );
  }

  return (
    <div className={`print-section-wrapper ${flexClass} flex flex-col`}>
      <div className={`bg-slate-800 text-white px-3 py-1.5 rounded-t-lg ${pClass('print:bg-gray-200 print:text-black print:border print:border-b-0 print:border-gray-400')}`}>
        <h2 className="text-sm font-bold tracking-wider uppercase">{type}</h2>
      </div>
      <div
        data-tour="patch-grid"
        className={`grid gap-0 flex-1 bg-slate-100 rounded-b-lg border border-slate-300 overflow-hidden ${pClass('print:bg-white print:border-gray-400 print:border')}`}
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: '1fr',
          ['--grid-cols' as any]: cols
        }}
      >
        {rows}
      </div>
    </div>
  );
}
