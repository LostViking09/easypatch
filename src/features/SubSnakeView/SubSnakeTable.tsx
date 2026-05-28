import React, { useState } from 'react';
import { Channel, SettingsConfig, SubSnake } from '../../types';
import { InlineEditCell } from '../../components/InlineEditCell';

type EditableField = 'name' | 'mic' | 'stand' | 'notes' | 'group';
const EDITABLE_FIELDS: EditableField[] = ['name', 'mic', 'stand', 'notes', 'group'];

interface SubSnakeTableProps {
  title: string;
  totalPorts: number;
  assignedChannels: Channel[];
  type: 'in' | 'out';
  settings: SettingsConfig;
  subSnake: SubSnake;
  onUpdateChannel?: (channel: Channel) => void;
  onEditChannel?: (channel: Channel) => void;
}

export const SubSnakeTable: React.FC<SubSnakeTableProps> = ({
  title,
  totalPorts,
  assignedChannels,
  type,
  settings,
  subSnake,
  onUpdateChannel,
  onEditChannel
}) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: EditableField, rowIndex: number, colIndex: number } | null>(null);

  if (totalPorts === 0) return null;

  const stripeOpacity = settings.tableStripeOpacity ?? 0.05;
  const headerOpacity = settings.tableHeaderOpacity ?? 0.08;

  const headerStyle = {
    '--table-header-opacity': headerOpacity,
    backgroundColor: 'var(--table-header-bg, rgba(15, 23, 42, var(--table-header-opacity)))',
  } as React.CSSProperties;

  // Build the list of port channels, including empty ones
  const portChannels: (Channel | null)[] = [];
  for (let i = 0; i < totalPorts; i++) {
    const portNum = i + 1;
    const assignedCh = assignedChannels.find(c => c.subSnakeChannel === portNum);
    portChannels.push(assignedCh || null);
  }

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

    if (nextRow >= 0 && nextRow < totalPorts) {
      const nextChannel = portChannels[nextRow];
      if (nextChannel) {
        const nextField = EDITABLE_FIELDS[nextCol];
        setTimeout(() => {
          setEditingCell({ id: nextChannel.id, field: nextField, rowIndex: nextRow, colIndex: nextCol });
        }, 0);
        return;
      }
    }
    
    // If next cell is empty or out of bounds, stop editing
    setTimeout(() => setEditingCell(null), 0);
  };

  const handleSave = (ch: Channel, field: EditableField, value: string) => {
    if (ch[field] !== value) {
      onUpdateChannel?.({ ...ch, [field]: value });
    }
    setEditingCell(null);
  };

  const renderEditableCell = (ch: Channel | null, field: EditableField, rowIndex: number, colIndex: number, children: React.ReactNode, className: string = '') => {
    if (!ch) {
      return <td className={`${className} px-4 py-2 print:px-3 print:py-0.5 text-slate-300`}>-</td>;
    }

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
      <div className="hidden print:flex items-center justify-between border-b border-slate-300 pb-1 mb-2 text-slate-555 text-xxs font-extrabold tracking-wider uppercase">
        <span>{title}</span>
      </div>

      <h3 className="text-lg print:text-base font-bold text-slate-800 mb-3 print:text-slate-900 print:mb-1.5 print:hidden">{title}</h3>

      {/* MOBILE TWO-LINE RESPONSIVE LIST */}
      <div className="block md:hidden print:hidden rounded-lg border border-slate-200 overflow-hidden divide-y divide-slate-200 shadow-3xs mb-6">
        {portChannels.map((ch, index) => {
          const portNum = index + 1;
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
              key={`mobile-${portNum}`} 
              style={rowBgStyle}
              className="flex flex-col gap-2 py-3 px-4"
            >
              {/* Line 1 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-extrabold font-mono text-slate-900 text-lg shrink-0 w-7">{portNum}</span>
                  {ch && ch.name.trim() !== '' && (
                    <div 
                      className="w-4 h-4 rounded-sm border border-slate-300 shrink-0"
                      style={ch.color && ch.color !== '#ffffff' ? { backgroundColor: ch.color } : { backgroundColor: 'transparent' }}
                    />
                  )}
                  <span className={`font-bold text-sm sm:text-base truncate ${ch ? 'text-slate-800' : 'text-slate-400 font-normal italic'}`}>
                    {ch ? (ch.name || <span className="text-slate-400 font-normal">-</span>) : 'Empty'}
                  </span>
                </div>
                {ch && (
                  <span className="text-xs px-2 py-0.5 rounded border font-bold font-mono tracking-normal shadow-3xs select-none text-slate-700 shrink-0 border-slate-250 bg-slate-100/90">
                    Console CH {ch.number}
                  </span>
                )}
              </div>

              {/* Line 2 */}
              {ch && (
                <div className="flex flex-wrap items-center text-xs sm:text-sm text-slate-600 gap-x-2 pl-9">
                  {ch.mic && <span className="font-bold text-slate-700">{ch.mic}</span>}
                  {ch.stand && <span className="text-slate-500 opacity-80">[{ch.stand}]</span>}
                  {ch.notes && <span className="italic text-slate-500 opacity-80 truncate max-w-[200px]" title={ch.notes}>{ch.notes}</span>}
                  {!ch.mic && !ch.stand && !ch.notes && (
                    <span className="text-slate-400 italic">No details</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP & PRINT TABLE VIEW */}
      <div className="hidden md:inline-block print:inline-block min-w-full print-table-wrapper overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm print:text-xs text-slate-700">
          <thead 
            className="text-xs print:text-xxs uppercase font-bold text-slate-500 print:text-black print:border-b-2 print:border-black"
            style={headerStyle}
          >
            <tr>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-16">Port</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-24">Console CH</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/4">Name</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/6">Mic/DI</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/6">Stand</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-1/4">Notes</th>
              <th className="px-4 py-2.5 print:px-3 print:py-1.5 w-24">Group</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {portChannels.map((ch, index) => {
              const portNum = index + 1;
              const isEven = index % 2 === 0;

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
                  key={`desktop-${portNum}`} 
                  style={rowStyle}
                  className="print:border-b print:border-gray-250 group"
                >
                  <td className="px-4 py-2 print:px-3 print:py-0.5 font-bold font-mono text-slate-900">
                    {portNum}
                  </td>
                  <td 
                    className={`px-4 py-2 print:px-3 print:py-0.5 ${ch ? 'cursor-pointer hover:bg-black/5 print:cursor-default print:hover:bg-transparent transition-colors font-bold font-mono text-slate-700' : 'text-slate-300'}`}
                    onClick={() => ch && onEditChannel?.(ch)}
                  >
                    {ch ? ch.number : '-'}
                  </td>
                  {renderEditableCell(ch, 'name', index, 0, (
                    <div className="flex items-center gap-2">
                      {ch && (
                        <div 
                          className={`w-3.5 h-3.5 print:w-2.5 print:h-2.5 rounded-sm border border-slate-300 shrink-0 table-color-block hover:brightness-95 cursor-pointer transition-all ${ch.name.trim() === '' ? 'opacity-0' : ''}`}
                          style={ch.color && ch.color !== '#ffffff' ? { backgroundColor: ch.color } : { backgroundColor: 'transparent' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditChannel?.(ch);
                          }}
                        />
                      )}
                      <span className="truncate">{ch?.name || <span className="text-slate-400 font-normal opacity-50 group-hover:opacity-100 transition-opacity">-</span>}</span>
                    </div>
                  ), "font-bold text-slate-800")}
                  {renderEditableCell(ch, 'mic', index, 1, 
                    ch?.mic || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">-</span>,
                    ""
                  )}
                  {renderEditableCell(ch, 'stand', index, 2, 
                    ch?.stand || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">-</span>,
                    ""
                  )}
                  {renderEditableCell(ch, 'notes', index, 3, 
                    <span className="max-w-xs truncate block italic" title={ch?.notes}>{ch?.notes || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity not-italic">-</span>}</span>,
                    ""
                  )}
                  {renderEditableCell(ch, 'group', index, 4, 
                    ch?.group || <span className="text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">-</span>,
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
