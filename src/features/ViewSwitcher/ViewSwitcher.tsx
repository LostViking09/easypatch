import React from 'react';
import { LayoutGrid, Network, List } from 'lucide-react';
import { SubSnake, Channel } from '../../types';

interface ViewSwitcherProps {
  subSnakes: SubSnake[];
  inputs: Channel[];
  outputs: Channel[];
  currentView: string;
  setCurrentView: (view: 'main' | string) => void;
  activeView: string;
  layoutMode: 'grid' | 'table';
  setLayoutMode: (mode: 'grid' | 'table') => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  subSnakes,
  inputs,
  outputs,
  setCurrentView,
  activeView,
  layoutMode,
  setLayoutMode
}) => {
  return (
    <div className="flex items-center gap-4 flex-wrap max-w-full print:hidden">
      {/* Layout Mode Switcher */}
      <div className="flex items-center gap-1 bg-slate-105 p-1 rounded-xl border border-slate-200 self-start md:self-auto shadow-3xs">
        <button
          onClick={() => setLayoutMode('grid')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            layoutMode === 'grid'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-250'
              : 'text-slate-555 hover:text-slate-850 hover:bg-slate-200'
          }`}
          title="Grid View"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setLayoutMode('table')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            layoutMode === 'table'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-250'
              : 'text-slate-555 hover:text-slate-850 hover:bg-slate-200'
          }`}
          title="Table View"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* Scope Switcher */}
      <div className="flex items-center gap-1 bg-slate-105 p-1 rounded-xl border border-slate-200 self-start md:self-auto shadow-3xs flex-wrap">
        <button
          onClick={() => setCurrentView('main')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            activeView === 'main'
              ? 'bg-white text-slate-800 shadow-sm border border-slate-250'
              : 'text-slate-555 hover:text-slate-850 hover:bg-slate-200'
          }`}
        >
          <span>Main I/O</span>
        </button>

        {subSnakes.map(snake => {
          const portCount = inputs.filter(c => c.subSnakeId === snake.id).length + outputs.filter(c => c.subSnakeId === snake.id).length;
          return (
            <button
              key={snake.id}
              onClick={() => setCurrentView(snake.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeView === snake.id
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-250'
                  : 'text-slate-555 hover:text-slate-850 hover:bg-slate-200'
              }`}
            >
              <Network 
                className="w-4 h-4" 
                style={{ color: snake.color && snake.color !== '#ffffff' ? snake.color : '#64748b' }} 
              />
              <span>{snake.name}</span>
              {portCount > 0 && (
                <span className="text-tiny bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded-full font-extrabold ml-0.5">
                  {portCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
