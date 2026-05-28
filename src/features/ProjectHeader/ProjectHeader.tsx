import React from 'react';
import { Edit3 } from 'lucide-react';

interface ProjectHeaderProps {
  title: string;
  setTitle: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
}

export function ProjectHeader({ title, setTitle, notes, setNotes }: ProjectHeaderProps) {
  return (
    <>
      {/* Editable Title & Notes (Screen) */}
      <div className="mb-6 print:hidden flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-gray-400" />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Project Title..."
            className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full max-w-md"
          />
        </div>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (e.g., date, venue, band)..."
          className="text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full max-w-xl ml-7"
        />
      </div>

      {/* Print Header (Only visible when printing) */}
      <div className="print-header-wrapper hidden print:flex flex-col items-center mb-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        {notes && <p className="text-lg text-gray-700 mt-1">{notes}</p>}
      </div>
    </>
  );
}
