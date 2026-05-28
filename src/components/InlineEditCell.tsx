import React, { useState, useRef, useEffect } from 'react';

export interface InlineEditCellProps {
  value: string;
  isEditing: boolean;
  onEditStart: () => void;
  onSave: (val: string) => void;
  onCancel: () => void;
  onNavigate: (direction: 'next' | 'prev' | 'up' | 'down') => void;
  className?: string;
  children: React.ReactNode;
}

export const InlineEditCell: React.FC<InlineEditCellProps> = ({
  value,
  isEditing,
  onEditStart,
  onSave,
  onCancel,
  onNavigate,
  className = '',
  children
}) => {
  const [localValue, setLocalValue] = useState(value);
  const saved = useRef(false);

  useEffect(() => {
    if (isEditing) {
      setLocalValue(value);
      saved.current = false;
    }
  }, [isEditing, value]);

  const handleSave = (val: string) => {
    if (!saved.current) {
      saved.current = true;
      onSave(val);
    }
  };

  if (isEditing) {
    return (
      <td className={`${className} p-0 relative align-middle`}>
        <div className="absolute inset-0 flex items-center px-2">
          <input
            autoFocus
            className="w-full bg-blue-50 border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1.5 py-0.5 text-slate-900 text-sm font-medium"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => handleSave(localValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave(localValue);
                onNavigate(e.shiftKey ? 'up' : 'down');
              } else if (e.key === 'Tab') {
                e.preventDefault();
                handleSave(localValue);
                onNavigate(e.shiftKey ? 'prev' : 'next');
              } else if (e.key === 'Escape') {
                e.preventDefault();
                saved.current = true;
                onCancel();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handleSave(localValue);
                onNavigate('up');
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleSave(localValue);
                onNavigate('down');
              }
            }}
          />
        </div>
        <div className="invisible px-4 py-2 print:px-3 print:py-0.5">{children}</div>
      </td>
    );
  }

  return (
    <td 
      className={`${className} px-4 py-2 print:px-3 print:py-0.5 cursor-pointer hover:bg-black/5 print:cursor-default print:hover:bg-transparent transition-colors`}
      onClick={onEditStart}
    >
      {children}
    </td>
  );
};
