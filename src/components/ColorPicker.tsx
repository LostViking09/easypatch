import React from 'react';
import { Pipette } from 'lucide-react';
import { hexToRgba } from '../utils/colors';

interface PaletteColor {
  label: string;
  value: string;
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  palette: PaletteColor[];
  size?: 'sm' | 'md' | 'lg';
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  value, 
  onChange, 
  palette,
  size = 'md'
}) => {
  const isCustomColor = !palette.some(c => c.value.toLowerCase() === value.toLowerCase());
  
  const containerClasses = size === 'sm' 
    ? "flex flex-wrap gap-1 items-center bg-white p-1.5 border rounded"
    : size === 'md'
    ? "flex flex-wrap gap-1.5 items-center bg-white p-2 border border-slate-250 rounded-md"
    : "flex flex-wrap gap-2 items-center"; // lg size, no border/bg in original EditModal

  const swatchClasses = size === 'sm'
    ? "w-5 h-5 rounded-full border transition-all cursor-pointer"
    : size === 'md'
    ? "w-6 h-6 rounded-full border transition-all cursor-pointer"
    : "w-10 h-10 rounded-md border-2 transition-all cursor-pointer";

  const customClasses = size === 'sm'
    ? "relative w-5 h-5 rounded-full border border-slate-200 overflow-hidden hover:opacity-85 transition-opacity flex items-center justify-center cursor-pointer bg-gray-50"
    : size === 'md'
    ? "relative w-6 h-6 rounded-full border border-slate-250 overflow-hidden hover:opacity-85 transition-opacity flex items-center justify-center cursor-pointer bg-gray-50"
    : "relative w-10 h-10 rounded-md border-2 border-gray-300 overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center bg-gray-50";

  const pipetteClasses = size === 'sm' ? "w-3 h-3" : size === 'md' ? "w-3.5 h-3.5" : "w-5 h-5";
  const ringClasses = size === 'sm' ? "ring-1.5 ring-offset-1 ring-indigo-500 scale-110 shadow-3xs" : size === 'md' ? "ring-2 ring-offset-1 ring-indigo-500 scale-110 shadow-3xs" : "ring-2 ring-offset-1 ring-blue-500 shadow-sm scale-105";

  return (
    <div className={containerClasses}>
      {palette.map(color => {
        const isSelected = value.toLowerCase() === color.value.toLowerCase();
        return (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            style={{ 
              backgroundColor: hexToRgba(color.value, 0.4),
              borderColor: color.value === '#ffffff' || color.value === '#000000' ? '#e2e8f0' : color.value
            }}
            className={`${swatchClasses} ${
              isSelected ? ringClasses : 'hover:opacity-85'
            }`}
            title={color.label}
          />
        );
      })}
      
      {/* Custom color picker */}
      <div 
        className={`${customClasses} ${isCustomColor ? ringClasses : ''}`}
        style={{
          backgroundColor: isCustomColor
            ? hexToRgba(value, 0.4)
            : '#f8fafc',
          borderColor: isCustomColor
            ? value
            : '#cbd5e1'
        }}
        title="Custom color"
      >
        <Pipette className={`${pipetteClasses} ${
          isCustomColor
            ? 'text-slate-700 font-bold'
            : 'text-slate-500'
        }`} />
        <input 
          type="color" 
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-[-5px] w-10 h-10 cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
};
