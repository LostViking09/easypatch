import React from 'react';
import { CheckSquare, Link2 } from 'lucide-react';
import { Channel, SettingsConfig } from '../types';
import { hexToRgba, getReadableTextColor } from '../utils/colors';
import { motion } from 'motion/react';

interface ChannelCellProps {
  channel: Channel;
  settings: SettingsConfig;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
  onDrop: (sourceId: string, targetId: string) => void;
  isInGroup: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isFirstInRow: boolean;
  isLastInRow: boolean;
  isBottomRow?: boolean;
  subSnakeName?: string;
  subSnakeColor?: string;
  isMultiSelectMode?: boolean;
  onCellMouseDown?: (e: React.MouseEvent) => void;
  onCellMouseEnter?: (e: React.MouseEvent) => void;
}

export const ChannelCell: React.FC<ChannelCellProps> = ({ 
  channel, settings, onClick, isSelected, onDrop, isInGroup, isFirstInGroup, isLastInGroup, isFirstInRow, isLastInRow,
  isBottomRow, subSnakeName, subSnakeColor, isMultiSelectMode, onCellMouseDown, onCellMouseEnter
}) => {
  const isUnused = channel.name.trim() === '';
  const bgColor = isUnused ? '#f1f5f9' : hexToRgba(channel.color, settings.colorOpacity);
  const baseBorderColor = isUnused ? '#cbd5e1' : (channel.color === '#ffffff' || channel.color === '#000000' ? '#cbd5e1' : channel.color);
  const groupBorderColor = hexToRgba(baseBorderColor, settings.groupBorderOpacity ?? 1);
  const groupTextColor = isUnused ? '#9ca3af' : (channel.color !== '#ffffff' && channel.color !== '#000000' ? getReadableTextColor(channel.color) : '#9ca3af');
  
  const badgeStyle: React.CSSProperties = {
    fontSize: `${0.65 * (settings.fontSizes.subSnakeBadge ?? 1)}rem`,
    '--badge-bg': subSnakeColor && subSnakeColor !== '#ffffff' ? hexToRgba(subSnakeColor, 0.12) : '',
    '--badge-border': subSnakeColor && subSnakeColor !== '#ffffff' ? hexToRgba(subSnakeColor, 0.4) : '',
    ...(subSnakeColor && subSnakeColor !== '#ffffff'
      ? {
          backgroundColor: 'var(--badge-bg)',
          borderColor: 'var(--badge-border)',
        }
      : {})
  } as React.CSSProperties;
  
  // Base style with consistent 1px borders to keep the grid aligned
  const style: React.CSSProperties = {
    '--cell-bg': bgColor,
    '--cell-border-color': '#cbd5e1',
    '--group-border-color': groupBorderColor,
    '--group-text-color': groupTextColor,
    backgroundColor: 'var(--cell-bg)',
    borderRight: (isLastInRow || channel.stereoLink === 'next') ? 'none' : '1px solid var(--cell-border-color)',
    borderBottom: isBottomRow ? 'none' : '1px solid var(--cell-border-color)',
    boxShadow: 'none',
  } as React.CSSProperties;

  const isSingleNamedCell = settings.alwaysDrawCellBorders && !isUnused && !isInGroup;

  // Use inset box-shadow for the thick group borders so they don't shrink the content area
  if (isInGroup || isSingleNamedCell) {
    const shadowColor = 'var(--group-border-color)';
    const thickness = '4px';
    
    const shadows = [
      `inset 0 ${thickness} 0 0 ${shadowColor}`, // Top
      `inset 0 -${thickness} 0 0 ${shadowColor}`, // Bottom
    ];
    
    const needsLeftBorder = isFirstInGroup || (isSingleNamedCell && channel.stereoLink !== 'prev');
    if (needsLeftBorder) {
      shadows.push(`inset ${thickness} 0 0 0 ${shadowColor}`); // Left
    }
    
    const needsRightBorder = isLastInGroup || (isSingleNamedCell && channel.stereoLink !== 'next');
    if (needsRightBorder) {
      shadows.push(`inset -${thickness} 0 0 0 ${shadowColor}`); // Right
    } else if (channel.stereoLink !== 'next') {
      // Subtle separator between grouped items
      (style as any)['--group-separator-color'] = hexToRgba(groupBorderColor, 0.3);
      shadows.push(`inset -1px 0 0 0 var(--group-separator-color)`);
    }
    
    style.boxShadow = shadows.join(', ');
  }

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;

  return (
    <motion.div 
      layout="position"
      transition={{ type: "spring", stiffness: 450, damping: 38 }}
    draggable={!isMultiSelectMode}
    onDragStart={(e) => {
      if (isMultiSelectMode) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', channel.id);
      
      if (channel.stereoLink) {
        const currentEl = e.currentTarget as HTMLElement;
        const partnerEl = (channel.stereoLink === 'next'
          ? currentEl.nextElementSibling
          : currentEl.previousElementSibling) as HTMLElement;
          
        if (partnerEl) {
          const currentRect = currentEl.getBoundingClientRect();
          const partnerRect = partnerEl.getBoundingClientRect();
          
          // Clone both cells and set their widths/heights explicitly to preserve styling
          const leftClone = (channel.stereoLink === 'next' ? currentEl : partnerEl).cloneNode(true) as HTMLElement;
          const rightClone = (channel.stereoLink === 'next' ? partnerEl : currentEl).cloneNode(true) as HTMLElement;
          
          leftClone.style.width = `${channel.stereoLink === 'next' ? currentRect.width : partnerRect.width}px`;
          leftClone.style.height = `${channel.stereoLink === 'next' ? currentRect.height : partnerRect.height}px`;
          rightClone.style.width = `${channel.stereoLink === 'next' ? partnerRect.width : currentRect.width}px`;
          rightClone.style.height = `${channel.stereoLink === 'next' ? partnerRect.height : currentRect.height}px`;
          
          // Wrap in an absolute container to serve as the drag image
          const dragImage = document.createElement('div');
          dragImage.style.display = 'flex';
          dragImage.style.flexDirection = 'row';
          dragImage.style.position = 'absolute';
          dragImage.style.top = '-9999px';
          dragImage.style.left = '-9999px';
          dragImage.style.zIndex = '-1000';
          dragImage.style.pointerEvents = 'none';
          
          dragImage.appendChild(leftClone);
          dragImage.appendChild(rightClone);
          document.body.appendChild(dragImage);
          
          // Calculate drag offsets relative to the combined drag image
          const x = e.clientX - currentRect.left;
          const y = e.clientY - currentRect.top;
          
          let dragX = x;
          if (channel.stereoLink === 'prev') {
            dragX += partnerRect.width;
          }
          
          e.dataTransfer.setDragImage(dragImage, dragX, y);
          
          // Remove the off-screen clone container after drag starts
          setTimeout(() => {
            if (dragImage.parentNode) {
              document.body.removeChild(dragImage);
            }
          }, 0);
        }
      }
    }}
    onDragOver={(e) => {
      if (isMultiSelectMode) return;
      e.preventDefault();
    }}
    onDrop={(e) => {
      if (isMultiSelectMode) return;
      e.preventDefault();
      onDrop(e.dataTransfer.getData('text/plain'), channel.id);
    }}
    onClick={onClick}
    onMouseDown={(e) => {
      if (isMultiSelectMode && onCellMouseDown) {
        onCellMouseDown(e);
      }
    }}
    onMouseEnter={(e) => {
      if (isMultiSelectMode && onCellMouseEnter) {
        onCellMouseEnter(e);
      }
    }}
    style={style}
    className={`relative flex flex-col p-2 sm:p-3 cursor-pointer hover:shadow-md transition-shadow duration-150 min-h-[5.5rem] ${pClass('print:min-h-0')} group select-none ${isSelected ? 'z-20' : ''}`}
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
            className={`xlr-silhouette w-32 h-32 sm:w-48 sm:h-48 ${pClass('print:text-black')} text-black`}
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
      {isInGroup && (isFirstInGroup || settings.showGroupNameOnEveryCell) && (
        <div 
          className={`absolute bottom-1 left-2 font-bold z-10 truncate max-w-[85%]`}
          style={{ 
            fontSize: `${0.6 * settings.fontSizes.group}rem`,
            color: 'var(--group-text-color)'
          }}
        >
          {channel.group}
        </div>
      )}

      <div 
        className={`absolute top-1 left-2 right-2 flex items-center justify-between gap-1 font-mono font-bold tracking-tighter text-gray-550 group-hover:text-gray-800 ${pClass('print:text-black')} z-10 min-w-0 flex-nowrap`}
        style={{ fontSize: `${0.875 * settings.fontSizes.number}rem` }}
      >
        {channel.stageboxPort ? (
          <>
            <span className="text-slate-800 text-base sm:text-lg mr-0.5" title={`Physical Port ${channel.stageboxPort}`}>
              {channel.stageboxPort}
            </span>
            {channel.stageboxPort !== channel.number && (
              <span 
                className="flex items-center text-xxs px-1 py-0 rounded bg-slate-200/80 text-slate-600 font-bold font-mono"
                title={`Console Channel ${channel.number}`}
              >
                [{channel.number}]
              </span>
            )}
          </>
        ) : (
          <span className="text-slate-800 text-base sm:text-lg mr-0.5" title={`Console Channel ${channel.number}`}>
            {channel.number}
          </span>
        )}

        {subSnakeName && channel.subSnakeChannel && (
          <span 
            style={badgeStyle}
            className={`flex items-center gap-px text-xxs px-0.5 py-0 rounded border font-bold font-mono tracking-normal shadow-3xs select-none transition-all text-slate-550 group-hover:text-slate-700 min-w-0 ${
              subSnakeColor && subSnakeColor !== '#ffffff'
                ? ''
                : 'border-slate-250 bg-slate-100/90 group-hover:bg-slate-200/90 group-hover:border-slate-355'
            } ${pClass('print:bg-white print:text-black print:border-gray-400')}`}
            title={`${subSnakeName} #${channel.subSnakeChannel}`}
          >
            <span className="truncate">{subSnakeName}</span>
            <span className="flex-shrink-0">
              <span className="opacity-60 mr-px">#</span>
              <span className="font-extrabold">{channel.subSnakeChannel}</span>
            </span>
          </span>
        )}
      </div>



      {/* Centered Bottom-Aligned Stereo Link Badge */}
      {channel.stereoLink === 'next' && (
        <div className="absolute bottom-1.5 right-0 translate-x-1/2 z-30 pointer-events-none">
          <div className="stereo-badge flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-300 bg-blue-50/25 text-blue-600 shadow-sm text-tiny font-bold font-mono select-none">
            <span>L</span>
            <Link2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span>R</span>
          </div>
        </div>
      )}

      {channel.stereoLink === 'prev' && (
        <div className="absolute bottom-1.5 left-0 -translate-x-1/2 z-30 pointer-events-none">
          <div className="stereo-badge flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-300 bg-blue-50/25 text-blue-600 shadow-sm text-tiny font-bold font-mono select-none">
            <span>L</span>
            <Link2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span>R</span>
          </div>
        </div>
      )}
      
      <div className="mt-4 sm:mt-5 flex-1 flex flex-col justify-center items-center text-center w-full z-10">
        <div 
          className={`font-mono font-bold tracking-tighter leading-tight w-full px-1 whitespace-pre-wrap ${pClass('print:text-black')}`}
          style={{ fontSize: `${1 * settings.fontSizes.name}rem` }}
        >
          {channel.name || <span className="text-transparent select-none print:hidden">_</span>}
        </div>
        <div 
          className={`text-gray-700 w-full px-1 mt-0.5 font-medium leading-tight flex flex-col items-center gap-0.5 ${pClass('print:text-black')}`}
          style={{ fontSize: `${0.75 * settings.fontSizes.metadata}rem` }}
        >
          {(channel.mic || channel.stand) ? (
            <div className="flex gap-1 items-center justify-center flex-wrap max-w-full">
              {channel.mic && <span>{channel.mic}</span>}
              {channel.stand && <span className="opacity-75">[{channel.stand}]</span>}
            </div>
          ) : null}
          {channel.notes ? (
            <div className="italic opacity-80 max-w-full break-words text-balance">{channel.notes}</div>
          ) : null}
          {(!channel.mic && !channel.stand && !channel.notes) && (
            <span className="text-transparent select-none print:hidden">_</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
