import React from 'react';

interface PrintPageHeaderProps {
  projectTitle: string;
  projectNotes: string;
}

export const PrintPageHeader: React.FC<PrintPageHeaderProps> = ({ projectTitle, projectNotes }) => {
  return (
    <div className="hidden print:flex items-center justify-between border-b border-slate-300 pb-1 mb-2 text-slate-500 text-xxs font-extrabold tracking-wider uppercase">
      <span>{projectTitle || 'EasyPatch Sheet'}</span>
      {projectNotes && (
        <span className="normal-case font-semibold italic text-slate-400 text-tiny">
          {projectNotes}
        </span>
      )}
    </div>
  );
};
