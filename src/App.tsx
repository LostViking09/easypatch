import React, { useState } from 'react';
import { motion, AnimatePresence, MotionGlobalConfig } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { Channel } from './types';
import { usePatchState } from './hooks/usePatchState';
import { useMultiSelect } from './hooks/useMultiSelect';
import { useToast } from './hooks/useToast';

import { Header } from './features/Header/Header';
import { ProjectHeader } from './features/ProjectHeader/ProjectHeader';
import { PatchGridSection } from './features/PatchGrid/PatchGridSection';
import { MultiEditBar } from './features/MultiEditBar/MultiEditBar';
import { AppModals } from './features/Modals/AppModals';

export default function App() {
  const {
    title, setTitle,
    notes, setNotes,
    inputs, setInputs,
    outputs, setOutputs,
    settings, setSettings,
    subSnakes, setSubSnakes,
    handleDrop,
    saveEdit,
    saveFastInput,
    handleCreateNewProject,
    handleResizeGrid,
    handleExport,
    loadImportData,
    addSubSnake,
    updateSubSnake,
    deleteSubSnake,
    clearSubSnakeAssignments
  } = usePatchState();

  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFastInputOpen, setIsFastInputOpen] = useState(false);
  const [isResizeGridOpen, setIsResizeGridOpen] = useState(false);
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false);
  const [isMultiGroupOpen, setIsMultiGroupOpen] = useState(false);
  const [isMultiColorOpen, setIsMultiColorOpen] = useState(false);
  const [isAssignSubSnakeOpen, setIsAssignSubSnakeOpen] = useState(false);
  const [isSubSnakesOpen, setIsSubSnakesOpen] = useState(false);

  const { toast, setToast } = useToast();

  const isAnyModalOpen =
    !!editingChannel ||
    isSettingsOpen ||
    isFastInputOpen ||
    isResizeGridOpen ||
    isNewProjectConfirmOpen ||
    isSubSnakesOpen ||
    isAssignSubSnakeOpen ||
    isMultiGroupOpen ||
    isMultiColorOpen;

  const {
    isMultiEdit,
    setIsMultiEdit,
    selectedIds,
    setSelectedIds,
    handleCellToggle,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleMultiEditClear
  } = useMultiSelect(inputs, setInputs, outputs, setOutputs, isAnyModalOpen);

  React.useEffect(() => {
    MotionGlobalConfig.skipAnimations = settings.animationsEnabled === false;
  }, [settings.animationsEnabled]);

  const handleCellClick = (ch: Channel, e: React.MouseEvent) => {
    if (!isMultiEdit) {
      setEditingChannel(ch);
    }
  };

  const handleNavigateEdit = (updatedChannel: Channel, direction: 'prev' | 'next') => {
    const { finalInputs, finalOutputs } = saveEdit(updatedChannel);
    const sameTypeChannels = updatedChannel.type === 'in' ? finalInputs : finalOutputs;
    const currentIdx = sameTypeChannels.findIndex(c => c.id === updatedChannel.id);
    if (currentIdx !== -1) {
      const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx >= 0 && nextIdx < sameTypeChannels.length) {
        setEditingChannel(sameTypeChannels[nextIdx]);
      }
    }
  };

  const handleCellDrop = (sourceId: string, targetId: string) => {
    const warning = handleDrop(sourceId, targetId);
    if (warning) {
      setToast({ message: warning, type: 'warning' });
    }
  };

  const handleMassAssignGroup = (group: string, colorMode: 'none' | 'uncolored' | 'all') => {
    const allChs = [...inputs, ...outputs];
    const groupColor = allChs.find(
      ch => ch.group?.trim().toLowerCase() === group.trim().toLowerCase() && ch.color && ch.color !== '#ffffff'
    )?.color;

    const updateList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        let updatedColor = ch.color;
        if (groupColor && colorMode !== 'none') {
          if (colorMode === 'all' || !ch.color || ch.color === '#ffffff') {
            updatedColor = groupColor;
          }
        }
        return { ...ch, group, color: updatedColor };
      }
      return ch;
    });
    setInputs(updateList(inputs));
    setOutputs(updateList(outputs));
    setIsMultiGroupOpen(false);
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  const handleMassAssignColor = (color: string) => {
    const updateList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        return { ...ch, color };
      }
      return ch;
    });
    setInputs(updateList(inputs));
    setOutputs(updateList(outputs));
    setIsMultiColorOpen(false);
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  const handleMassAssignSubSnake = (subSnakeId: string, startPort: number) => {
    const selectedInputs = inputs.filter(ch => selectedIds.includes(ch.id));
    const selectedOutputs = outputs.filter(ch => selectedIds.includes(ch.id));

    const updateList = (list: Channel[], selectedForType: Channel[], type: 'in' | 'out') => {
      return list.map(ch => {
        if (selectedIds.includes(ch.id) && ch.type === type) {
          const idx = selectedForType.findIndex(c => c.id === ch.id);
          return {
            ...ch,
            subSnakeId,
            subSnakeChannel: startPort + idx
          };
        } else if (ch.subSnakeId === subSnakeId && ch.subSnakeChannel !== undefined && ch.type === type) {
          const portMin = startPort;
          const portMax = startPort + selectedForType.length - 1;
          if (ch.subSnakeChannel >= portMin && ch.subSnakeChannel <= portMax) {
            return { ...ch, subSnakeId: undefined, subSnakeChannel: undefined };
          }
        }
        return ch;
      });
    };

    setInputs(prev => updateList(prev, selectedInputs, 'in'));
    setOutputs(prev => updateList(prev, selectedOutputs, 'out'));
    setIsAssignSubSnakeOpen(false);
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;
  const shouldStackPrint = inputs.length > 24 || outputs.length > 16;

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col print:bg-white ${pClass('print:bg-white')}`}>
      <style>{`
        .grid-row-wrapper {
          display: contents;
        }
        @media print {
          body, html, #root {
            background: white !important;
            ${shouldStackPrint
          ? `
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
              `
          : `
                height: 100% !important;
                min-height: 100% !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
              `
        }
          }
          
          /* Single-page side-by-side stretching rules */
          ${!shouldStackPrint ? `
            .min-h-screen {
              height: 100% !important;
              min-height: 100% !important;
              overflow: hidden !important;
            }
            .main-content {
              height: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
            }
            .main-content > main {
              flex: 1 1 0% !important;
              display: flex !important;
              flex-direction: column !important;
              min-height: 0 !important;
              height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .main-content > main > div {
              flex: 1 1 0% !important;
              display: flex !important;
              flex-direction: column !important;
              min-height: 0 !important;
              padding: 0 !important;
            }
          ` : `
            .min-h-screen, .main-content {
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            }
          `}
          
          .print-grid-container {
            display: flex !important;
            max-height: none !important;
          }
          .print-grid-container.print-stacked {
            display: block !important;
            height: auto !important;
          }
          .print-grid-container.print-stacked .print-section-wrapper {
            display: block !important;
            margin-bottom: 2.5rem !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          .print-grid-container.print-stacked .print-section-wrapper:nth-child(2) {
            page-break-before: always !important;
            break-before: page !important;
          }
          .print-grid-container.print-side-by-side {
            flex-direction: row !important;
            gap: 1.5rem !important;
            height: ${settings.printHeight}% !important;
            flex: 1 1 0% !important;
            min-height: 0 !important;
          }
          .print-grid-container.print-side-by-side .print-section-wrapper {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
          }
          
          /* Print project header page-break rules */
          .print-header-wrapper {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            break-after: avoid-page !important;
          }
          
          /* Force header row to stay attached to grid */
          .print-section-wrapper > div:first-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
            break-after: avoid-page !important;
          }
          
          .print-section-wrapper .grid {
            page-break-before: avoid !important;
            break-before: avoid !important;
            break-before: avoid-page !important;
          }
          
          /* When side by side, keep CSS Grid to allow perfect stretching like on editor */
          .print-side-by-side .grid {
            display: grid !important;
            height: 100% !important;
            grid-auto-rows: 1fr !important;
          }
          
          /* When stacked, use flex rows to allow perfect row stretching and no-split pagination */
          .print-stacked .grid {
            display: block !important;
            height: auto !important;
            page-break-inside: auto !important;
            background-color: transparent !important;
          }
          .print-stacked .grid-row-wrapper {
            display: flex !important;
            flex-direction: row !important;
            align-items: stretch !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            break-inside: avoid-page !important;
          }
          /* Each cell is styled as a flex child of the row container */
          .print-stacked .grid-row-wrapper > div {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 !important;
            width: calc(100% / var(--grid-cols, 8)) !important;
            box-sizing: border-box !important;
            height: auto !important; /* Grow naturally so text is never clipped! */
            min-height: 5.5rem !important;
          }
        }
      `}</style>

      <div className="main-content flex flex-col flex-1 h-full">
        <Header
          handleExport={handleExport}
          loadImportData={loadImportData}
          setIsNewProjectConfirmOpen={setIsNewProjectConfirmOpen}
          setIsFastInputOpen={setIsFastInputOpen}
          isMultiEdit={isMultiEdit}
          setIsMultiEdit={setIsMultiEdit}
          setSelectedIds={setSelectedIds}
          setIsResizeGridOpen={setIsResizeGridOpen}
          setIsSubSnakesOpen={setIsSubSnakesOpen}
          setIsSettingsOpen={setIsSettingsOpen}
        />

        {/* Main Content - Grid Layout */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col print:p-0 print:m-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 flex-1 flex flex-col print:border-none print:shadow-none print:p-0">
            
            <ProjectHeader
              title={title}
              setTitle={setTitle}
              notes={notes}
              setNotes={setNotes}
            />

            <div className={`print-grid-container flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 ${shouldStackPrint ? 'print-stacked' : 'print-side-by-side'}`}>
              <PatchGridSection
                channels={inputs}
                type="INPUT"
                cols={settings.grid.input.cols}
                flexClass={outputs.length > 0 ? 'flex-[2]' : 'flex-grow flex-1'}
                settings={settings}
                subSnakes={subSnakes}
                selectedIds={selectedIds}
                isMultiEdit={isMultiEdit}
                onCellClick={handleCellClick}
                onCellDrop={handleCellDrop}
                onCellMouseDown={handleCellMouseDown}
                onCellMouseEnter={handleCellMouseEnter}
              />
              <PatchGridSection
                channels={outputs}
                type="OUTPUT"
                cols={settings.grid.output.cols}
                flexClass={inputs.length > 0 ? 'flex-[1]' : 'flex-grow flex-1'}
                settings={settings}
                subSnakes={subSnakes}
                selectedIds={selectedIds}
                isMultiEdit={isMultiEdit}
                onCellClick={handleCellClick}
                onCellDrop={handleCellDrop}
                onCellMouseDown={handleCellMouseDown}
                onCellMouseEnter={handleCellMouseEnter}
              />
            </div>
          </div>
        </main>
      </div>

      <MultiEditBar
        isMultiEdit={isMultiEdit}
        selectedIds={selectedIds}
        setIsAssignSubSnakeOpen={setIsAssignSubSnakeOpen}
        setIsMultiGroupOpen={setIsMultiGroupOpen}
        setIsMultiColorOpen={setIsMultiColorOpen}
        handleMultiEditClear={handleMultiEditClear}
        setSelectedIds={setSelectedIds}
        setIsMultiEdit={setIsMultiEdit}
      />

      <AppModals
        editingChannel={editingChannel} setEditingChannel={setEditingChannel}
        inputs={inputs} outputs={outputs}
        subSnakes={subSnakes} settings={settings} setSettings={setSettings}
        isFastInputOpen={isFastInputOpen} setIsFastInputOpen={setIsFastInputOpen}
        isMultiGroupOpen={isMultiGroupOpen} setIsMultiGroupOpen={setIsMultiGroupOpen}
        isMultiColorOpen={isMultiColorOpen} setIsMultiColorOpen={setIsMultiColorOpen}
        isAssignSubSnakeOpen={isAssignSubSnakeOpen} setIsAssignSubSnakeOpen={setIsAssignSubSnakeOpen}
        isSubSnakesOpen={isSubSnakesOpen} setIsSubSnakesOpen={setIsSubSnakesOpen}
        isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
        isNewProjectConfirmOpen={isNewProjectConfirmOpen} setIsNewProjectConfirmOpen={setIsNewProjectConfirmOpen}
        isResizeGridOpen={isResizeGridOpen} setIsResizeGridOpen={setIsResizeGridOpen}
        selectedIds={selectedIds}
        
        saveEdit={saveEdit} handleNavigateEdit={handleNavigateEdit} saveFastInput={saveFastInput}
        handleMassAssignGroup={handleMassAssignGroup} handleMassAssignColor={handleMassAssignColor} handleMassAssignSubSnake={handleMassAssignSubSnake}
        addSubSnake={addSubSnake} updateSubSnake={updateSubSnake} deleteSubSnake={deleteSubSnake} clearSubSnakeAssignments={clearSubSnakeAssignments}
        handleCreateNewProject={handleCreateNewProject} handleResizeGrid={handleResizeGrid}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-6 left-1/2 z-50 bg-amber-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold max-w-md border border-amber-400 print:hidden"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
