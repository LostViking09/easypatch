import React from 'react';
import { Network } from 'lucide-react';
import { Channel, SubSnake } from '../../types';

interface SubSnakeGridSelectorProps {
  channel: Channel;
  formData: Channel;
  onChange: (updates: Partial<Channel>) => void;
  subSnakes: SubSnake[];
  allChannels: Channel[];
}

export const SubSnakeGridSelector: React.FC<SubSnakeGridSelectorProps> = ({ channel, formData, onChange, subSnakes, allChannels }) => {
  return (
    <div className="border-t border-gray-100 pt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
        <Network className="w-4 h-4 text-indigo-500" />
        <span>Map to SubSnake</span>
      </label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        <button
          type="button"
          onClick={() => onChange({ subSnakeId: undefined, subSnakeChannel: undefined })}
          className={`py-1.5 px-3 text-xs font-bold rounded-md border transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
            !formData.subSnakeId
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          None
        </button>
        {subSnakes.map(s => {
          const isSelected = formData.subSnakeId === s.id;
          const totalCh = s.grid 
            ? (channel.type === 'in' ? s.grid.input.cols * s.grid.input.rows : s.grid.output.cols * s.grid.output.rows) 
            : 'Dyn';
          
          const isDisabled = totalCh === 0;

          return (
            <button
              key={s.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange({ 
                subSnakeId: s.id, 
                subSnakeChannel: formData.subSnakeId === s.id ? (formData.subSnakeChannel || 1) : 1 
              })}
              className={`py-1.5 px-3 text-xs font-bold rounded-md border transition-all flex items-center gap-2 cursor-pointer shadow-3xs ${
                isSelected
                  ? 'bg-slate-800 text-white border-slate-800'
                  : isDisabled
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s.color && s.color !== '#ffffff' && (
                <span 
                  className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
              )}
              <span>{s.name} ({totalCh} ch)</span>
            </button>
          );
        })}
      </div>

      {(() => {
        const selectedSubSnake = subSnakes.find(s => s.id === formData.subSnakeId);
        if (!selectedSubSnake) return null;
        
        const isDynamicSubSnake = selectedSubSnake && !selectedSubSnake.grid;
        
        let totalPorts = 0;
        let gridCols = 4;
        if (selectedSubSnake.grid) {
          const subGrid = channel.type === 'in' ? selectedSubSnake.grid.input : selectedSubSnake.grid.output;
          totalPorts = subGrid.rows * subGrid.cols;
          gridCols = subGrid.cols || 4;
        } else {
          const subSnakeChannels = allChannels.filter(c => c.subSnakeId === selectedSubSnake.id && c.type === channel.type);
          const mappedPorts = subSnakeChannels.map(c => c.subSnakeChannel || 0);
          const highestPort = Math.max(...mappedPorts, 0);
          totalPorts = Math.max(12, Math.ceil((highestPort + 1) / 4) * 4);
        }
        
        const ports = [];

        for (let p = 1; p <= totalPorts; p++) {
          const occupant = allChannels.find(
            c => c.id !== formData.id && c.type === channel.type && c.subSnakeId === selectedSubSnake.id && c.subSnakeChannel === p
          );
          const isSelected = formData.subSnakeChannel === p;
          
          ports.push(
            <button
              key={p}
              type="button"
              onClick={() => onChange({ subSnakeChannel: p })}
              className={`h-9 relative rounded border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? occupant
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs z-10 scale-105 hover:bg-amber-600'
                    : 'bg-blue-600 border-blue-600 text-white shadow-xs z-10 scale-105 hover:bg-blue-700'
                  : occupant
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400'
                  : 'bg-white border-gray-250 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title={
                isSelected
                  ? occupant
                    ? `Port ${p}: Selected. Occupied by ${occupant.type === 'in' ? 'IN' : 'OUT'} ${occupant.number} (${occupant.name || 'Unused'}). Saving will displace it.`
                    : `Port ${p}: Currently selected`
                  : occupant
                  ? `Port ${p}: Occupied by ${occupant.type === 'in' ? 'IN' : 'OUT'} ${occupant.number} (${occupant.name || 'Unused'}). Clicking will select and displace it.`
                  : `Port ${p}: Available`
              }
            >
              <span>{p}</span>
              {occupant && (
                <span className={`text-micro truncate max-w-[90%] px-0.5 mt-0.5 leading-none ${isSelected ? 'text-amber-950 font-bold' : 'text-amber-600'}`}>
                  {(() => {
                    const nameLabel = occupant.name 
                      ? `${occupant.number}: ${occupant.name}` 
                      : `${occupant.type === 'in' ? 'IN' : 'OUT'}${occupant.number}`;
                    return nameLabel.length > 9 ? nameLabel.slice(0, 8) + '..' : nameLabel;
                  })()}
                </span>
              )}
            </button>
          );
        }

        return (
          <div className="space-y-2 mt-2 bg-slate-55 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-2xs font-bold text-slate-500 tracking-wider">Select SubSnake Port</span>
              {isDynamicSubSnake && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xxs font-semibold text-slate-500">Custom Port:</span>
                  <input
                    type="number"
                    min="1"
                    value={formData.subSnakeChannel || ''}
                    onChange={e => onChange({ subSnakeChannel: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-14 px-1 py-0.5 text-xs border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              )}
            </div>
            <div 
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`
              }}
            >
              {ports}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
