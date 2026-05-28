import React, { useState } from 'react';
import { MotionGlobalConfig } from 'motion/react';
import { Channel } from './types';
import { PrintStyles } from './components/PrintStyles';
import { ToastRenderer } from './components/ToastRenderer';
import { ViewSwitcher } from './features/ViewSwitcher/ViewSwitcher';
import { useMassAssignment } from './hooks/useMassAssignment';
import { usePatchState } from './hooks/usePatchState';
import { useMultiSelect } from './hooks/useMultiSelect';
import { useToast } from './hooks/useToast';

import { Header } from './features/Header/Header';
import { ProjectHeader } from './features/ProjectHeader/ProjectHeader';
import { PatchGridSection } from './features/PatchGrid/PatchGridSection';
import { MultiEditBar } from './features/MultiEditBar/MultiEditBar';
import { AppModals } from './features/Modals/AppModals';
import { SubSnakeView } from './features/SubSnakeView/SubSnakeView';

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
  const [currentView, setCurrentView] = useState<'main' | 'subsnake'>('main');

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

  const {
    handleMassAssignGroup,
    handleMassAssignColor,
    handleMassAssignSubSnake
  } = useMassAssignment(
    inputs, setInputs,
    outputs, setOutputs,
    selectedIds, setSelectedIds,
    setIsMultiEdit, setIsMultiGroupOpen, setIsMultiColorOpen, setIsAssignSubSnakeOpen
  );

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;
  const shouldStackPrint = inputs.length > 24 || outputs.length > 16;
  const activeView = (currentView === 'main' || subSnakes.some(s => s.id === currentView)) ? currentView : 'main';
  const isMultiPagePrint = shouldStackPrint || activeView !== 'main' || (settings.includeSubSnakesInPrint && subSnakes.length > 0);

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col print:bg-white ${pClass('print:bg-white')} ${settings.printTheme === 'bw' ? 'print-bw-mode' : ''}`}>
      <PrintStyles isMultiPagePrint={isMultiPagePrint} settings={settings} />

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:mb-0 print:gap-0">
              <ProjectHeader
                title={title}
                setTitle={setTitle}
                notes={notes}
                setNotes={setNotes}
              />

              {/* View Switcher Segmented Control */}
              <ViewSwitcher
                subSnakes={subSnakes}
                inputs={inputs}
                outputs={outputs}
                currentView={currentView}
                setCurrentView={setCurrentView}
                activeView={activeView}
              />
            </div>

            {/* Main Patch Grid */}
            <div 
              className={`print-grid-container flex-col lg:flex-row gap-6 lg:gap-8 flex-1 ${
                shouldStackPrint ? 'print-stacked' : 'print-side-by-side'
              } ${activeView === 'main' ? 'flex print:flex' : 'hidden print:hidden'}`}
            >
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

            <div 
              className={`${
                activeView !== 'main' 
                  ? 'block print:block' 
                  : `hidden ${(settings.includeSubSnakesInPrint && subSnakes.length > 0) ? 'print:block print-subsnake-page-break' : 'print:hidden'}`
              }`}
            >
              <SubSnakeView
                subSnakes={subSnakes}
                inputs={inputs}
                outputs={outputs}
                settings={settings}
                selectedSubSnakeId={activeView === 'main' ? 'all' : activeView}
                isPrintMode={activeView === 'main'}
                projectTitle={title}
                projectNotes={notes}
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
      <ToastRenderer toast={toast} setToast={setToast} />
    </div>
  );
}
