import React from 'react';
import { CheckSquare } from 'lucide-react';
import { Channel, SettingsConfig } from '../types';
import { hexToRgba } from '../utils/colors';

interface ChannelCellProps {
  channel: Channel;
  settings: SettingsConfig;
  onClick: () => void;
  isSelected: boolean;
  onDrop: (sourceId: string, targetId: string) => void;
  isInGroup: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isFirstInRow: boolean;
  isLastInRow: boolean;
}

export const ChannelCell: React.FC<ChannelCellProps> = ({ 
  channel, settings, onClick, isSelected, onDrop, isInGroup, isFirstInGroup, isLastInGroup, isFirstInRow, isLastInRow 
}) => {
  const isUnused = channel.name.trim() === '';
  const bgColor = isUnused ? '#f1f5f9' : hexToRgba(channel.color, settings.colorOpacity);
  const baseBorderColor = isUnused ? '#cbd5e1' : (channel.color === '#ffffff' || channel.color === '#000000' ? '#cbd5e1' : channel.color);
  const groupBorderColor = hexToRgba(baseBorderColor, settings.groupBorderOpacity ?? 1);
  
  // Base style with consistent 1px borders to keep the grid aligned
  const style: React.CSSProperties = {
    backgroundColor: bgColor,
    borderRight: '1px solid #cbd5e1',
    borderBottom: '1px solid #cbd5e1',
    boxShadow: 'none',
  };

  // Use inset box-shadow for the thick group borders so they don't shrink the content area
  if (isInGroup) {
    const shadowColor = groupBorderColor;
    const thickness = '6px';
    
    const shadows = [
      `inset 0 ${thickness} 0 0 ${shadowColor}`, // Top
      `inset 0 -${thickness} 0 0 ${shadowColor}`, // Bottom
    ];
    
    if (isFirstInGroup) {
      shadows.push(`inset ${thickness} 0 0 0 ${shadowColor}`); // Left
    }
    
    if (isLastInGroup) {
      shadows.push(`inset -${thickness} 0 0 0 ${shadowColor}`); // Right
    } else {
      // Subtle separator between grouped items
      shadows.push(`inset -1px 0 0 0 ${hexToRgba(shadowColor, 0.3)}`);
    }
    
    style.boxShadow = shadows.join(', ');
  }

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;

  return (
    <div 
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', channel.id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(e.dataTransfer.getData('text/plain'), channel.id);
      }}
      onClick={onClick}
      style={style}
      className={`relative flex flex-col p-2 sm:p-3 cursor-pointer hover:shadow-md transition-all min-h-[5.5rem] ${pClass('print:min-h-0')} overflow-hidden group ${isSelected ? 'z-20' : ''}`}
    >
      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/80 flex items-center justify-center z-30">
          <CheckSquare className="w-12 h-12 text-white" />
        </div>
      )}

      {/* XLR Silhouette Background */}
      {settings.xlrOpacity > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <svg 
            fill="currentColor" 
            viewBox="0 0 256 256" 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-32 h-32 sm:w-48 sm:h-48 ${pClass('print:text-black')} text-black`}
            style={{ opacity: settings.xlrOpacity }}
          >
            <g fillRule="evenodd">
              <path d="M128 220c-50.81 0-92-41.19-92-92 0-34.045 18.492-63.77 45.98-79.68 26.471 0 69.646.367 92.67.367C201.79 64.685 220 94.216 220 128c0 50.81-41.19 92-92 92zm0-15c42.526 0 77-34.474 77-77 0-26.467-13.353-49.815-33.69-63.675-21.734 0-65.127-.18-86.353-.18C64.47 77.98 51 101.418 51 128c0 42.526 34.474 77 77 77z"/>
              <circle cx="128" cy="176" r="16"/>
              <circle cx="176" cy="134" r="16"/>
              <circle cx="80" cy="135" r="16"/>
            </g>
          </svg>
        </div>
      )}

      {/* Group Name Badge */}
      {isInGroup && isFirstInGroup && (
        <div 
          className={`absolute bottom-1 left-2 font-bold z-10 truncate max-w-[85%] ${pClass('print:text-gray-500')}`}
          style={{ 
            fontSize: `${0.6 * settings.fontSizes.group}rem`,
            color: isUnused ? '#9ca3af' : (channel.color !== '#ffffff' && channel.color !== '#000000' ? channel.color : '#9ca3af')
          }}
        >
          {channel.group}
        </div>
      )}

      <div 
        className={`absolute top-1 left-2 font-mono font-bold tracking-tighter text-gray-500 group-hover:text-gray-800 ${pClass('print:text-black')} z-10`}
        style={{ fontSize: `${0.875 * settings.fontSizes.number}rem` }}
      >
        {channel.number}
      </div>
      
      <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-center items-center text-center w-full z-10">
        <div 
          className={`font-mono font-bold tracking-tighter leading-tight w-full px-1 whitespace-pre-wrap ${pClass('print:text-black')}`}
          style={{ fontSize: `${1 * settings.fontSizes.name}rem` }}
        >
          {channel.name || <span className="text-transparent select-none print:hidden">_</span>}
        </div>
        <div 
          className={`text-gray-700 w-full px-1 mt-0.5 font-medium leading-tight ${pClass('print:text-black')}`}
          style={{ fontSize: `${0.75 * settings.fontSizes.tech}rem` }}
        >
          {channel.tech || <span className="text-transparent select-none print:hidden">_</span>}
        </div>
      </div>
    </div>
  );
};
