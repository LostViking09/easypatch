import React, { useState, useEffect, useRef } from 'react';
import { Channel, Stagebox, SettingsConfig } from '../../types';
import { PatchGridSection } from './PatchGridSection';

interface StageboxGridRowProps {
  box: Stagebox;
  boxInputs: Channel[];
  boxOutputs: Channel[];
  settings: SettingsConfig;
  subSnakes: any[];
  selectedIds: string[];
  isMultiEdit: boolean;
  onCellClick: (ch: Channel, e: React.MouseEvent) => void;
  onCellDrop: (sourceId: string, targetId: string) => void;
  onCellMouseDown: (ch: Channel, e: React.MouseEvent) => void;
  onCellMouseEnter: (ch: Channel, e: React.MouseEvent) => void;
}

export const StageboxGridRow: React.FC<StageboxGridRowProps> = ({
  box,
  boxInputs,
  boxOutputs,
  settings,
  subSnakes,
  selectedIds,
  isMultiEdit,
  onCellClick,
  onCellDrop,
  onCellMouseDown,
  onCellMouseEnter
}) => {
  const [isStacked, setIsStacked] = useState(false);
  const [thresholdWidth, setThresholdWidth] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  const outputsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsStacked(false);
    setThresholdWidth(null);
  }, [box.grid.output.cols, box.grid.input.cols, boxOutputs.length, boxInputs.length]);

  useEffect(() => {
    // If one of the sections is empty, we don't have side-by-side layout, so custom stacking is not needed
    if (boxInputs.length === 0 || boxOutputs.length === 0) {
      setIsStacked(false);
      setThresholdWidth(null);
      return;
    }

    const rowEl = rowRef.current;
    if (!rowEl) return;

    const checkLayout = () => {
      // If we are below the Tailwind lg breakpoint (1024px) anyway, let Tailwind handle stacking.
      if (window.innerWidth < 1024) {
        setIsStacked(false);
        setThresholdWidth(null);
        return;
      }

      const rowWidth = rowEl.offsetWidth;

      if (!isStacked) {
        const outputsGrid = outputsRef.current?.querySelector('[data-tour="patch-grid"]') as HTMLElement | null;
        if (!outputsGrid) return;

        const outputsWidth = outputsGrid.offsetWidth;
        const outputsHeight = outputsGrid.offsetHeight;
        const outCols = box.grid.output.cols;
        const outRows = Math.ceil(boxOutputs.length / outCols);

        const cellWidth = outputsWidth / outCols;
        const cellHeight = outputsHeight / outRows;

        if (cellWidth > 0 && cellHeight > 0) {
          if (cellHeight > cellWidth * 1.35) {
            setIsStacked(true);
            setThresholdWidth(rowWidth);
          }
        }
      } else {
        const limit = thresholdWidth !== null ? thresholdWidth + 80 : 1200;
        if (rowWidth > limit) {
          setIsStacked(false);
          setThresholdWidth(null);
        }
      }
    };

    checkLayout();

    const observer = new ResizeObserver(() => {
      checkLayout();
    });

    observer.observe(rowEl);
    
    const outputsGrid = outputsRef.current?.querySelector('[data-tour="patch-grid"]');
    if (outputsGrid) observer.observe(outputsGrid);

    window.addEventListener('resize', checkLayout);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkLayout);
    };
  }, [box.grid.output.cols, boxOutputs.length, boxInputs.length, isStacked, thresholdWidth]);

  if (boxInputs.length === 0 && boxOutputs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col mb-1">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-lg text-slate-850 tracking-tight uppercase">{box.name}</h4>
            <span className="text-xs text-slate-555 font-semibold hidden sm:inline">
              ({box.grid.input.cols * box.grid.input.rows} in / {box.grid.output.cols * box.grid.output.rows} out)
            </span>
          </div>
          <div className="flex gap-1.5 print:hidden">
            <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {boxInputs.filter(c => c.name.trim() !== '').length} IN Mapped
            </span>
            <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {boxOutputs.filter(c => c.name.trim() !== '').length} OUT Mapped
            </span>
          </div>
        </div>
        {box.note && (
          <div className="text-sm italic text-slate-500 mt-1 mb-1">
            {box.note}
          </div>
        )}
      </div>
      
      <div 
        ref={rowRef} 
        className={`flex ${isStacked ? 'flex-col' : 'flex-col lg:flex-row'} gap-6 lg:gap-8 flex-1`}
      >
        {boxInputs.length > 0 ? (
          <div ref={inputsRef} className={boxOutputs.length > 0 && !isStacked ? 'flex-[2]' : 'flex-grow flex-1'}>
            <PatchGridSection
              channels={boxInputs}
              type="INPUT"
              cols={box.grid.input.cols}
              flexClass="w-full h-full"
              settings={settings}
              subSnakes={subSnakes}
              selectedIds={selectedIds}
              isMultiEdit={isMultiEdit}
              onCellClick={onCellClick}
              onCellDrop={onCellDrop}
              onCellMouseDown={onCellMouseDown}
              onCellMouseEnter={onCellMouseEnter}
            />
          </div>
        ) : (
          <div className="hidden lg:block flex-[2]" />
        )}
        {boxOutputs.length > 0 ? (
          <div ref={outputsRef} className={boxInputs.length > 0 && !isStacked ? 'flex-[1]' : 'flex-grow flex-1'}>
            <PatchGridSection
              channels={boxOutputs}
              type="OUTPUT"
              cols={box.grid.output.cols}
              flexClass="w-full h-full"
              settings={settings}
              subSnakes={subSnakes}
              selectedIds={selectedIds}
              isMultiEdit={isMultiEdit}
              onCellClick={onCellClick}
              onCellDrop={onCellDrop}
              onCellMouseDown={onCellMouseDown}
              onCellMouseEnter={onCellMouseEnter}
            />
          </div>
        ) : (
          <div className="hidden lg:block flex-[1]" />
        )}
      </div>
    </div>
  );
}
