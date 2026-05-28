import React from 'react';
import { Network, HelpCircle, Lock, X } from 'lucide-react';
import { Channel, SubSnake, SettingsConfig } from '../../types';
import { ChannelCell } from '../../components/ChannelCell';
import { hexToRgba } from '../../utils/colors';

interface SubSnakeViewProps {
  subSnakes: SubSnake[];
  inputs: Channel[];
  outputs: Channel[];
  settings: SettingsConfig;
  selectedSubSnakeId: string;
  isPrintMode?: boolean;
  projectTitle?: string;
  projectNotes?: string;
}

export const SubSnakeView: React.FC<SubSnakeViewProps> = ({
  subSnakes,
  inputs,
  outputs,
  settings,
  selectedSubSnakeId,
  isPrintMode = false,
  projectTitle = '',
  projectNotes = '',
}) => {
  const [showBanner, setShowBanner] = React.useState(() => {
    if (typeof document === 'undefined') return false;
    return !document.cookie.includes('easypatch-subsnake-banner-dismissed=true');
  });

  const handleDismissBanner = () => {
    document.cookie = "easypatch-subsnake-banner-dismissed=true; max-age=31536000; path=/";
    setShowBanner(false);
  };

  const getMappedCount = (snakeId: string, type?: 'in' | 'out') => {
    if (type === 'in') return inputs.filter(c => c.subSnakeId === snakeId).length;
    if (type === 'out') return outputs.filter(c => c.subSnakeId === snakeId).length;
    return inputs.filter(c => c.subSnakeId === snakeId).length + outputs.filter(c => c.subSnakeId === snakeId).length;
  };

  const getAssignedChannelsForSnake = (snakeId: string) => {
    const sInputs = inputs.filter(c => c.subSnakeId === snakeId);
    const sOutputs = outputs.filter(c => c.subSnakeId === snakeId);
    return { inputs: sInputs, outputs: sOutputs };
  };

  const activeSubSnakes = selectedSubSnakeId === 'all' 
    ? subSnakes 
    : subSnakes.filter(s => s.id === selectedSubSnakeId);

  // If no SubSnakes exist at all
  if (subSnakes.length === 0) {
    if (isPrintMode) return null;
    
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 my-8 print:hidden">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-indigo-500 mb-4 shadow-sm border border-slate-200">
          <Network className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No SubSnakes Configured</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Use the <strong className="text-slate-700">SubSnakes</strong> button in the top menu to create stage boxes (e.g., Drum Snake, Stage Left).
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Once created, you can map console channels to stage box ports in the Channel Edit modal or by multi-selecting channels.
        </p>
      </div>
    );
  }

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;

  // Render a seamless grid replicating the Main IO grid
  const renderGridSection = (
    title: string,
    rowsCount: number,
    colsCount: number,
    assignedChannels: Channel[],
    type: 'in' | 'out'
  ) => {
    const totalPorts = rowsCount * colsCount;
    const cells: React.ReactNode[] = [];


    const portChannels: Channel[] = [];
    for (let i = 0; i < totalPorts; i++) {
      const portNum = i + 1;
      const assignedCh = assignedChannels.find(c => c.subSnakeChannel === portNum);
      const tempCh: Channel = assignedCh 
        ? {
            ...assignedCh,
            number: portNum,
            subSnakeChannel: assignedCh.number
          }
        : {
            id: `ss-port-vacant-${type}-${portNum}`,
            type,
            number: portNum,
            name: '',
            mic: '',
            stand: '',
            notes: '',
            color: '#ffffff',
            group: ''
          };
      portChannels.push(tempCh);
    }

    const cellsMapped = portChannels.map((tempCh, i) => {
      const assignedCh = assignedChannels.find(c => c.subSnakeChannel === tempCh.number);
      const isInGroup = !!tempCh.group && tempCh.group.trim() !== '';
      
      // Calculate grouping boundaries across the port layout
      const isFirstInGroup = isInGroup && (i === 0 || portChannels[i - 1].group !== tempCh.group);
      const isLastInGroup = isInGroup && (i === portChannels.length - 1 || portChannels[i + 1].group !== tempCh.group);
      
      const isFirstInRow = i % colsCount === 0;
      const isLastInRow = i % colsCount === colsCount - 1;
      const isBottomRow = i >= portChannels.length - colsCount;

      return (
        <ChannelCell
          key={tempCh.id}
          channel={tempCh}
          settings={settings}
          onClick={() => {}} // Read-only view
          isSelected={false}
          onDrop={() => {}}
          isInGroup={isInGroup}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          isFirstInRow={isFirstInRow}
          isLastInRow={isLastInRow}
          isBottomRow={isBottomRow}
          subSnakeName={assignedCh ? "Main" : undefined}
          subSnakeColor={assignedCh ? "#cbd5e1" : undefined}
          isMultiSelectMode={true} // Disables dragging & visual visual select indicators
        />
      );
    });

    const rows: React.ReactNode[] = [];
    for (let i = 0; i < cellsMapped.length; i += colsCount) {
      const rowCells = cellsMapped.slice(i, i + colsCount);
      rows.push(
        <div key={i} className="grid-row-wrapper">
          {rowCells}
        </div>
      );
    }

    // Determine a neat maximum width based on the number of columns to prevent cells from stretching too wide
    const maxGridWidth = colsCount <= 2 ? 'max-w-[17.5rem]' : colsCount <= 4 ? 'max-w-[30rem]' : 'max-w-[50rem]';

    return (
      <div className={`print-section-wrapper flex flex-col flex-1 min-w-0 ${maxGridWidth}`}>
        <div className={`bg-slate-800 text-white px-3 py-1.5 rounded-t-lg ${pClass('print:bg-gray-200 print:text-black print:border print:border-b-0 print:border-gray-400')}`}>
          <h5 className="text-xs font-bold tracking-wider uppercase">{title}</h5>
        </div>
        <div
          className={`grid gap-0 flex-1 bg-slate-100 rounded-b-lg border border-slate-300 overflow-hidden ${pClass('print:bg-white print:border-gray-400 print:border')}`}
          style={{
            gridTemplateColumns: `repeat(${colsCount}, minmax(0, 1fr))`,
            gridAutoRows: '1fr',
            ['--grid-cols' as any]: colsCount
          }}
        >
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 flex-1 flex flex-col min-h-0">
      {!isPrintMode && showBanner && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-start justify-between gap-3 text-slate-700 text-xs shadow-3xs relative">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Read-Only Stagebox View</span>
              <p className="text-slate-500 mt-0.5">
                This layout visualizes how channels map to your SubSnakes (stage boxes). To edit assignments, switch to the <b>Main Grid</b> and edit channels directly, or use <b>Multi-Select</b>.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleDismissBanner}
            className="text-slate-400 hover:text-slate-650 transition-colors p-1 rounded-lg hover:bg-indigo-100/50 flex-shrink-0 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid List */}
      <div className={`space-y-12 flex-1 ${isPrintMode ? 'space-y-16' : ''}`}>
        {activeSubSnakes.map((snake, index) => {
          const { inputs: assignedInputs, outputs: assignedOutputs } = getAssignedChannelsForSnake(snake.id);
          const hasInputs = assignedInputs.length > 0;
          const hasOutputs = assignedOutputs.length > 0;
          const isGridDefined = !!snake.grid;
          const breakClass = index > 0 ? 'print-subsnake-page-break' : '';
          const shouldShowPrintHeader = isPrintMode || index > 0;

          return (
            <div
              key={snake.id}
              className={`print-avoid-break ${breakClass} flex flex-col space-y-4`}
            >
              {shouldShowPrintHeader && (
                <div className="hidden print:flex items-center justify-between border-b border-slate-300 pb-1 mb-1 text-slate-500 text-xxs font-extrabold tracking-wider uppercase">
                  <span>{projectTitle || 'EasyPatch Sheet'}</span>
                  {projectNotes && (
                    <span className="normal-case font-semibold italic text-slate-400 text-tiny">
                      {projectNotes}
                    </span>
                  )}
                </div>
              )}

              {/* Compact Sleek Stagebox Header Line */}
              <div className="flex items-center justify-between border-b pb-2 border-slate-250">
                <div className="flex items-center gap-2">
                  <span 
                    className="subsnake-dot w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: snake.color || '#cbd5e1' }}
                  />
                  <h4 className="font-extrabold text-lg text-slate-850 tracking-tight">{snake.name}</h4>
                  <span className="text-xs text-slate-555 font-semibold hidden sm:inline">
                    ({isGridDefined 
                      ? `${(snake.grid?.input.cols || 0) * (snake.grid?.input.rows || 0)} in / ${(snake.grid?.output.cols || 0) * (snake.grid?.output.rows || 0)} out` 
                      : 'Auto-sized Sequential'}
                    )
                  </span>
                </div>
                <div className="flex gap-1.5 print:hidden">
                  <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {assignedInputs.length} IN Mapped
                  </span>
                  <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {assignedOutputs.length} OUT Mapped
                  </span>
                </div>
              </div>

              {/* Grid Layout Section */}
              <div className="w-full">
                {isGridDefined ? (
                  // FIXED GRID LAYOUT
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* Inputs Grid */}
                    {snake.grid!.input.rows * snake.grid!.input.cols > 0 && 
                      renderGridSection(
                        'INPUT CHANNELS', 
                        snake.grid!.input.rows, 
                        snake.grid!.input.cols, 
                        assignedInputs, 
                        'in'
                      )
                    }

                    {/* Outputs Grid */}
                    {snake.grid!.output.rows * snake.grid!.output.cols > 0 && 
                      renderGridSection(
                        'OUTPUT CHANNELS', 
                        snake.grid!.output.rows, 
                        snake.grid!.output.cols, 
                        assignedOutputs, 
                        'out'
                      )
                    }
                  </div>
                ) : (
                  // DYNAMIC LAYOUT LIST
                  <div>
                    {!hasInputs && !hasOutputs ? (
                      <div className="text-center p-6 bg-slate-55 border border-slate-200 border-dashed rounded-xl text-slate-400 text-xs font-semibold max-w-sm mx-auto my-2">
                        No channels currently assigned to this Auto-sized SubSnake Box.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Dynamic Inputs */}
                        {hasInputs && 
                          renderGridSection(
                            'INPUT CHANNELS', 
                            Math.ceil(assignedInputs.length / 4), 
                            4, 
                            assignedInputs.sort((a, b) => (a.subSnakeChannel || 0) - (b.subSnakeChannel || 0)), 
                            'in'
                          )
                        }

                        {/* Dynamic Outputs */}
                        {hasOutputs && 
                          renderGridSection(
                            'OUTPUT CHANNELS', 
                            Math.ceil(assignedOutputs.length / 4), 
                            4, 
                            assignedOutputs.sort((a, b) => (a.subSnakeChannel || 0) - (b.subSnakeChannel || 0)), 
                            'out'
                          )
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
