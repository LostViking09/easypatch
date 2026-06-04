import React, { useState } from 'react';
import { Channel, SubSnake, SettingsConfig } from '../../types';
import { hexToRgba } from '../../utils/colors';
import { InlineEditCell } from '../../components/InlineEditCell';
import { PrintPageHeader } from '../../components/PrintPageHeader';

type EditableField = 'name' | 'mic' | 'stand' | 'notes' | 'group';
const EDITABLE_FIELDS: EditableField[] = ['name', 'mic', 'stand', 'notes', 'group'];

interface TableViewProps {
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  stageboxes?: import('../../types').Stagebox[];
  settings: SettingsConfig;
  projectTitle?: string;
  projectNotes?: string;
  onUpdateChannel?: (channel: Channel) => void;
  onEditChannel?: (channel: Channel) => void;
}

interface ChannelTableProps {
  title: string;
  channels: Channel[];
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  projectTitle?: string;
  projectNotes?: string;
  onUpdateChannel?: (channel: Channel) => void;
  onEditChannel?: (channel: Channel) => void;
  hasStageboxes?: boolean;
}



const ChannelTable: React.FC<ChannelTableProps> = ({ title, channels, subSnakes, settings, projectTitle = '', projectNotes = '', onUpdateChannel, onEditChannel, hasStageboxes = false }) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: EditableField, rowIndex: number, colIndex: number } | null>(null);

  if (channels.length === 0) return null;
  const ioLabel = hasStageboxes ? 'Port' : (title === 'Inputs' ? 'Input' : 'Output');

  const stripeOpacity = settings.tableStripeOpacity ?? 0.05;
  const headerOpacity = settings.tableHeaderOpacity ?? 0.08;

  const headerStyle = {
    '--table-header-opacity': headerOpacity,
    backgroundColor: 'var(--table-header-bg, rgba(15, 23, 42, var(--table-header-opacity)))',
  } as React.CSSProperties;

  const handleNavigate = (direction: 'next' | 'prev' | 'up' | 'down', currentRow: number, currentCol: number) => {
    let nextRow = currentRow;
    let nextCol = currentCol;
    
    if (direction === 'next') {
      nextCol++;
      if (nextCol >= EDITABLE_FIELDS.length) {
        nextCol = 0;
        nextRow++;
      }
    } else if (direction === 'prev') {
      nextCol--;
      if (nextCol < 0) {
        nextCol = EDITABLE_FIELDS.length - 1;
        nextRow--;
      }
    } else if (direction === 'up') {
      nextRow--;
    } else if (direction === 'down') {
      nextRow++;
    }

    if (nextRow >= 0 && nextRow < channels.length) {
      const nextChannel = channels[nextRow];
      const nextField = EDITABLE_FIELDS[nextCol];
      setTimeout(() => {
        setEditingCell({ id: nextChannel.id, field: nextField, rowIndex: nextRow, colIndex: nextCol });
      }, 0);
    } else {
      setTimeout(() => setEditingCell(null), 0);
    }
  };

  const handleSave = (ch: Channel, field: EditableField, value: string) => {
    if (ch[field] !== value) {
      onUpdateChannel?.({ ...ch, [field]: value });
    }
    setEditingCell(null);
  };

  const renderEditableCell = (ch: Channel, field: EditableField, rowIndex: number, colIndex: number, children: React.ReactNode, className: string) => {
    const isEditing = editingCell?.id === ch.id && editingCell?.field === field;
    return (
      <InlineEditCell
        value={ch[field] || ''}
        isEditing={isEditing}
        onEditStart={() => setEditingCell({ id: ch.id, field, rowIndex, colIndex })}
        onSave={(val) => handleSave(ch, field, val)}
        onCancel={() => setEditingCell(null)}
        onNavigate={(dir) => handleNavigate(dir, rowIndex, colIndex)}
        className={className}
      >
        {children}
      </InlineEditCell>
    );
  };

  return (
    <div className="mb-6 print:mb-6">
      <h3 className="text-lg print:text-base font-bold text-slate-800 mb-3 print:text-slate-900 print:mb-1.5">{title}</h3>

      {/* MOBILE TWO-LINE RESPONSIVE LIST */}
      <div className="block md:hidden print:hidden rounded-lg border border-slate-200 overflow-hidden shadow-3xs mb-6">
        {channels.map((ch, index) => {
          const snake = subSnakes.find((s) => s.id === ch.subSnakeId);
          const isEven = index % 2 === 0;
          const hideBorder = ch.stereoLink === 'next' || index === channels.length - 1;

          const rowBgStyle = !isEven 
            ? ({
                '--table-stripe-opacity': stripeOpacity,
                backgroundColor: 'rgba(15, 23, 42, var(--table-stripe-opacity))',
              } as React.CSSProperties)
            : ({
                backgroundColor: '#ffffff',
              } as React.CSSProperties);

          return (
            <div 
              key={ch.id} 
              style={rowBgStyle}
              className={`flex flex-col gap-2 py-3 px-4 relative ${hideBorder ? '' : 'border-b border-slate-200'}`}
            >
              {ch.stereoLink === 'next' && (
                <div className="absolute left-1.5 w-1.5 top-4 bottom-0 border-l-2 border-t-2 border-blue-400 print:border-black rounded-tl pointer-events-none" />
              )}
              {ch.stereoLink === 'prev' && (
                <div className="absolute left-1.5 w-1.5 top-0 bottom-4 border-l-2 border-b-2 border-blue-400 print:border-black rounded-bl pointer-events-none" />
              )}
              {/* Line 1 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 relative">
                  <span className="font-extrabold font-mono text-slate-900 text-lg shrink-0 flex items-baseline gap-1 mr-1">
                    {ch.stageboxPort ? (
                      <>
                        <span>{ch.stageboxPort}</span>
                        {ch.stageboxPort !== ch.number && (
                          <span className="text-slate-400 text-xs font-semibold">[{ch.number}]</span>
                        )}
                      </>
                    ) : (
                      <span>{ch.number}</span>
                    )}
                  </span>
                  {ch.name.trim() !== '' && (
                    <div 
                      className="w-4 h-4 rounded-sm border border-slate-300 shrink-0"
                      style={ch.color && ch.color !== '#ffffff' ? { backgroundColor: ch.color } : { backgroundColor: 'transparent' }}
                    />
                  )}
                  <span className="font-bold text-slate-800 text-sm sm:text-base truncate">
                    {ch.name || <span className="text-slate-400 font-normal">-</span>}
                  </span>
                </div>
                {snake && (
                  <span 
                    className={`flex items-center gap-px text-xs px-2 py-0.5 rounded border font-bold font-mono tracking-normal shadow-3xs select-none text-slate-700 shrink-0 ${
                      snake.color && snake.color !== '#ffffff'
                        ? ''
                        : 'border-slate-250 bg-slate-100/90'
                    }`}
                    style={
                      snake.color && snake.color !== '#ffffff'
                        ? {
                            backgroundColor: hexToRgba(snake.color, 0.12),
                            borderColor: hexToRgba(snake.color, 0.4),
                          }
                        : {}
                    }
                  >
                    <span className="truncate max-w-[80px]">{snake.name}</span>
                    <span className="flex-shrink-0">
                      <span className="opacity-60 mr-px">#</span>
                      <span className="font-extrabold">{ch.subSnakeChannel}</span>
                    </span>
                  </span>
                )}
              </div>

              {/* Line 2 */}
              <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-600 gap-x-2 pl-9">
                {ch.mic && <span className="font-bold text-slate-700">{ch.mic}</span>}
                {ch.stand && <span className="text-slate-500 opacity-80">[{ch.stand}]</span>}
                {ch.notes && <span className="italic text-slate-500 opacity-80 truncate max-w-[200px]" title={ch.notes}>{ch.notes}</span>}
                {!ch.mic && !ch.stand && !ch.notes && (
                  <span className="text-slate-400 italic">No details</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP & PRINT TABLE VIEW */}
      <div className="hidden md:inline-block print:inline-block min-w-full lg:min-w-[800px] print-table-wrapper overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm print:text-xs text-slate-700">
          <thead 
            className="text-xs print:text-xxs uppercase font-bold text-slate-500 print:text-black print:border-b-2 print:border-black"
            style={headerStyle}
          >
            <tr>
              <th className={`px-4 py-2.5 print:px-3 print:py-1.5 ${hasStageboxes ? 'w-20' : 'w-16'}`}>{ioLabel}</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-32">SubSnake</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/4">Name</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/6">Mic/DI</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/6">Stand</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/4">Notes</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-24">Group</th>
            </tr>
          </thead>
          <tbody className="">
            {channels.map((ch, index) => {
              const snake = subSnakes.find((s) => s.id === ch.subSnakeId);
              const isEven = index % 2 === 0;
              const hideBorder = ch.stereoLink === 'next' || index === channels.length - 1;

              const badgeBg = snake && snake.color && snake.color !== '#ffffff' ? hexToRgba(snake.color, 0.12) : '';
              const badgeBorder = snake && snake.color && snake.color !== '#ffffff' ? hexToRgba(snake.color, 0.4) : '';

              const rowStyle = !isEven 
                ? ({
                    '--table-stripe-opacity': stripeOpacity,
                    backgroundColor: 'var(--table-stripe-bg, rgba(15, 23, 42, var(--table-stripe-opacity)))',
                  } as React.CSSProperties)
                : ({
                    backgroundColor: 'var(--table-row-bg, #ffffff)',
                  } as React.CSSProperties);

              return (
                <tr 
                  key={ch.id} 
                  style={rowStyle}
                  className={`group ${hideBorder ? '' : 'border-b border-slate-200 print:border-gray-250'}`}
                >
                  <td 
                    className="relative px-4 py-2 print:px-3 print:py-0.5 font-bold font-mono text-slate-900 cursor-pointer hover:bg-black/5 print:cursor-default print:hover:bg-transparent transition-colors"
                    onClick={() => onEditChannel?.(ch)}
                  >
                    {ch.stereoLink === 'next' && (
                      <div className="absolute left-1 w-1.5 top-[30%] bottom-0 border-l-2 border-t-2 border-blue-400 print:border-black rounded-tl pointer-events-none" />
                    )}
                    {ch.stereoLink === 'prev' && (
                      <div className="absolute left-1 w-1.5 top-0 bottom-[30%] border-l-2 border-b-2 border-blue-400 print:border-black rounded-bl pointer-events-none" />
                    )}
                    {ch.stageboxPort ? (
                      <span className="flex items-baseline gap-1" title={`Physical Port: ${ch.stageboxPort}, Console Channel: ${ch.number}`}>
                        <span>{ch.stageboxPort}</span>
                        {ch.stageboxPort !== ch.number && (
                          <span className="text-slate-400 text-xs font-medium">[{ch.number}]</span>
                        )}
                      </span>
                    ) : (
                      ch.number
                    )}
                  </td>
                  <td 
                    className="px-4 py-2 print:px-3 print:py-0.5 cursor-pointer hover:bg-black/5 print:cursor-default print:hover:bg-transparent transition-colors"
                    onClick={() => onEditChannel?.(ch)}
                  >
                    {snake ? (
                      <span 
                        className={`flex items-center gap-px text-xs print:text-xxs px-1.5 py-0.5 print:py-px rounded border font-bold font-mono tracking-normal shadow-3xs select-none text-slate-700 ${
                          snake.color && snake.color !== '#ffffff'
                            ? ''
                            : 'border-slate-250 bg-slate-100/90'
                        } print:text-black inline-flex w-fit`}
                        style={
                          snake.color && snake.color !== '#ffffff'
                            ? ({
                                '--badge-bg': badgeBg,
                                '--badge-border': badgeBorder,
                                backgroundColor: 'var(--badge-bg)',
                                borderColor: 'var(--badge-border)',
                              } as React.CSSProperties)
                            : {}
                        }
                      >
                        <span className="truncate max-w-[120px] print:max-w-[50px]">{snake.name}</span>
                        <span className="flex-shrink-0">
                          <span className="opacity-60 mr-px">#</span>
                          <span className="font-extrabold">{ch.subSnakeChannel}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  {renderEditableCell(ch, 'name', index, 0, (
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-3.5 h-3.5 print:w-2.5 print:h-2.5 rounded-sm border border-slate-300 shrink-0 table-color-block hover:brightness-95 cursor-pointer transition-all ${ch.name.trim() === '' ? 'opacity-0' : ''}`}
                        style={ch.color && ch.color !== '#ffffff' ? { backgroundColor: ch.color } : { backgroundColor: 'transparent' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditChannel?.(ch);
                        }}
                      />
                      <span className="truncate">{ch.name || <span className="text-slate-400 font-normal opacity-50 group-hover:opacity-100 transition-opacity">-</span>}</span>
                    </div>
                  ), "font-bold text-slate-800")}
                  {renderEditableCell(ch, 'mic', index, 1, 
                    ch.mic || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">-</span>,
                    ""
                  )}
                  {renderEditableCell(ch, 'stand', index, 2, 
                    ch.stand || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">-</span>,
                    ""
                  )}
                  {renderEditableCell(ch, 'notes', index, 3, 
                    <span className="max-w-xs truncate block italic" title={ch.notes}>{ch.notes || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity not-italic">-</span>}</span>,
                    ""
                  )}
                  {renderEditableCell(ch, 'group', index, 4, 
                    ch.group || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">-</span>,
                    ""
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TableView: React.FC<TableViewProps> = ({ inputs, outputs, subSnakes, stageboxes = [], settings, projectTitle = '', projectNotes = '', onUpdateChannel, onEditChannel }) => {
  if (stageboxes.length === 0) {
    return (
      <div data-tour="table-view" className="w-full max-w-7xl mx-auto bg-white p-0 lg:p-6 rounded-xl border-0 lg:border border-slate-200 shadow-none lg:shadow-sm print:p-0 print:border-none print:shadow-none print:mt-4">
        <PrintPageHeader projectTitle={projectTitle} projectNotes={projectNotes} />
        <ChannelTable title="Inputs" channels={inputs} subSnakes={subSnakes} settings={settings} projectTitle={projectTitle} projectNotes={projectNotes} onUpdateChannel={onUpdateChannel} onEditChannel={onEditChannel} hasStageboxes={false} />
        <ChannelTable title="Outputs" channels={outputs} subSnakes={subSnakes} settings={settings} projectTitle={projectTitle} projectNotes={projectNotes} onUpdateChannel={onUpdateChannel} onEditChannel={onEditChannel} hasStageboxes={false} />
      </div>
    );
  }

  return (
    <div data-tour="table-view" className="w-full max-w-7xl mx-auto space-y-8 print:space-y-6">
      {stageboxes.map((box, idx) => {
        const boxInputs = inputs.filter(c => c.stageboxId === box.id);
        const boxOutputs = outputs.filter(c => c.stageboxId === box.id);
        
        if (boxInputs.length === 0 && boxOutputs.length === 0) return null;

        return (
          <div 
            key={box.id} 
            className={`bg-white p-0 lg:p-6 rounded-xl border-0 lg:border border-slate-200 shadow-none lg:shadow-sm print:p-0 print:border-none print:shadow-none print:mt-4 print-avoid-break ${idx > 0 ? 'print-subsnake-page-break' : ''}`}
          >
            <PrintPageHeader projectTitle={projectTitle} projectNotes={projectNotes} />
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-200 print:text-black print:border-black uppercase tracking-wide">
              {box.name}
            </h2>
            {boxInputs.length > 0 && (
              <ChannelTable title="Inputs" channels={boxInputs} subSnakes={subSnakes} settings={settings} onUpdateChannel={onUpdateChannel} onEditChannel={onEditChannel} hasStageboxes={true} />
            )}
            {boxOutputs.length > 0 && (
              <ChannelTable title="Outputs" channels={boxOutputs} subSnakes={subSnakes} settings={settings} onUpdateChannel={onUpdateChannel} onEditChannel={onEditChannel} hasStageboxes={true} />
            )}
          </div>
        );
      })}
    </div>
  );
};
