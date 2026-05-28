import React, { useState } from 'react';
import { Channel, SubSnake, SettingsConfig } from '../../types';
import { hexToRgba } from '../../utils/colors';
import { InlineEditCell } from '../../components/InlineEditCell';

type EditableField = 'name' | 'mic' | 'stand' | 'notes' | 'group';
const EDITABLE_FIELDS: EditableField[] = ['name', 'mic', 'stand', 'notes', 'group'];

interface TableViewProps {
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
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
}



const ChannelTable: React.FC<ChannelTableProps> = ({ title, channels, subSnakes, settings, projectTitle = '', projectNotes = '', onUpdateChannel, onEditChannel }) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: EditableField, rowIndex: number, colIndex: number } | null>(null);

  if (channels.length === 0) return null;
  const ioLabel = title === 'Inputs' ? 'Input' : 'Output';

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
    <div className={`mb-6 print:mb-6 ${title === 'Outputs' ? 'print-page-break-before' : ''}`}>
      {/* Print Page Header */}
      <div className="hidden print:flex items-center justify-between border-b border-slate-300 pb-1 mb-2 text-slate-555 text-xxs font-extrabold tracking-wider uppercase">
        <span>{projectTitle || 'EasyPatch Sheet'}</span>
        {projectNotes && (
          <span className="normal-case font-semibold italic text-slate-400 text-tiny">
            {projectNotes}
          </span>
        )}
      </div>

      <h3 className="text-lg print:text-base font-bold text-slate-800 mb-3 print:text-slate-900 print:mb-1.5">{title}</h3>

      {/* MOBILE TWO-LINE RESPONSIVE LIST */}
      <div className="block md:hidden print:hidden rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-200 shadow-3xs mb-6">
        {channels.map((ch, index) => {
          const snake = subSnakes.find((s) => s.id === ch.subSnakeId);
          const isEven = index % 2 === 0;

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
              className="flex flex-col gap-2 py-3 px-4"
            >
              {/* Line 1 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-extrabold font-mono text-slate-900 text-lg shrink-0 w-7">{ch.number}</span>
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
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-16">{ioLabel}</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-32">SubSnake</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/4">Name</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/6">Mic/DI</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/6">Stand</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/4">Notes</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-24">Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {channels.map((ch, index) => {
              const snake = subSnakes.find((s) => s.id === ch.subSnakeId);
              const isEven = index % 2 === 0;

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
                  className="print:border-b print:border-gray-250 group"
                >
                  <td 
                    className="px-4 py-2 print:px-3 print:py-0.5 font-bold font-mono text-slate-900 cursor-pointer hover:bg-black/5 print:cursor-default print:hover:bg-transparent transition-colors"
                    onClick={() => onEditChannel?.(ch)}
                  >
                    {ch.number}
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

export const TableView: React.FC<TableViewProps> = ({ inputs, outputs, subSnakes, settings, projectTitle = '', projectNotes = '', onUpdateChannel, onEditChannel }) => {
  return (
    <div className="w-full max-w-7xl mx-auto bg-white p-0 lg:p-6 rounded-xl border-0 lg:border border-slate-200 shadow-none lg:shadow-sm print:p-0 print:border-none print:shadow-none print:mt-4 print:page-break-before">
      <ChannelTable title="Inputs" channels={inputs} subSnakes={subSnakes} settings={settings} projectTitle={projectTitle} projectNotes={projectNotes} onUpdateChannel={onUpdateChannel} onEditChannel={onEditChannel} />
      <ChannelTable title="Outputs" channels={outputs} subSnakes={subSnakes} settings={settings} projectTitle={projectTitle} projectNotes={projectNotes} onUpdateChannel={onUpdateChannel} onEditChannel={onEditChannel} />
    </div>
  );
};
