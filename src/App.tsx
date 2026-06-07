import React, { useState, useEffect } from 'react';
import { MotionGlobalConfig, AnimatePresence } from 'motion/react';
import { Routes, Route, useParams, useNavigate, Link } from 'react-router-dom';
import { Channel } from './types';
import { PrintStyles } from './components/PrintStyles';
import { ToastRenderer } from './components/ToastRenderer';
import { ViewSwitcher } from './features/ViewSwitcher/ViewSwitcher';
import { useMassAssignment } from './hooks/useMassAssignment';
import { usePatchState } from './hooks/usePatchState';
import { useMultiSelect } from './hooks/useMultiSelect';
import { useToast } from './hooks/useToast';
import { useModalState } from './hooks/useModalState';
import { useShare } from './hooks/useShare';
import { usePrint } from './hooks/usePrint';
import { PrintRenderer } from './components/PrintRenderer';

import { Header } from './features/Header/Header';
import { ProjectHeader } from './features/ProjectHeader/ProjectHeader';
import { PatchGridSection } from './features/PatchGrid/PatchGridSection';
import { StageboxGridRow } from './features/PatchGrid/StageboxGridRow';
import { MultiEditBar } from './features/MultiEditBar/MultiEditBar';
import { AppModals } from './features/Modals/AppModals';
import { SubSnakeView } from './features/SubSnakeView/SubSnakeView';
import { TableView } from './features/TableView/TableView';
import { UrlImportConfirmModal } from './components/UrlImportConfirmModal';
import { DashboardModal } from './features/Dashboard/DashboardModal';
import { WalkthroughProvider, useWalkthrough } from './features/Walkthrough/WalkthroughContext';
import { WalkthroughOverlay } from './features/Walkthrough/WalkthroughOverlay';
import { db, Project } from './services/db';
import { defaultSettings, createEmptyInputs, createEmptyOutputs } from './utils/constants';
import demoPatchData from './utils/demoPatch.json';
import { WALKTHROUGH_STEPS } from './utils/walkthroughSteps';
import { FileText, FolderOpen } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-slate-500 text-sm">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FolderOpen className="w-4 h-4" /> Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/project/:id" element={<Editor />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <WalkthroughProvider>
      <AppRoutes />
      <WalkthroughOverlay />
    </WalkthroughProvider>
  );
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasCompletedTour, startTour, skipTour, isActive, currentStepIndex, nextStep, setIsModalOpen } = useWalkthrough();

  const {
    title, setTitle,
    notes, setNotes,
    inputs, setInputs,
    outputs, setOutputs,
    settings, setSettings,
    userSettings, setUserSettings,
    subSnakes, setSubSnakes,
    isLoaded, saveStatus,
    handleDrop,
    saveEdit,
    handleExport,
    addSubSnake,
    updateSubSnake,
    deleteSubSnake,
    clearSubSnakeAssignments,
    stageboxes,
    handleUpdateStageboxes,
    undo,
    redo,
    canUndo,
    canRedo
  } = usePatchState(id);

  const { toast, setToast } = useToast();

  const {
    editingChannel, setEditingChannel,
    isSettingsOpen, setIsSettingsOpen,
    isNewProjectConfirmOpen, setIsNewProjectConfirmOpen,
    isMultiGroupOpen, setIsMultiGroupOpen,
    isMultiColorOpen, setIsMultiColorOpen,
    isAssignSubSnakeOpen, setIsAssignSubSnakeOpen,
    isSubSnakesOpen, setIsSubSnakesOpen,
    isStageboxesOpen, setIsStageboxesOpen,
    isPrintModalOpen, setIsPrintModalOpen,
    isShareModalOpen, setIsShareModalOpen,
    isDashboardOpen, setIsDashboardOpen,
    isAnyModalOpen
  } = useModalState(id);

  const {
    printOptions,
    isPrinting,
    handleConfirmPrint
  } = usePrint({ setIsPrintModalOpen });

  const {
    shareUrl,
    sharedPatchData,
    setSharedPatchData,
    handleShare
  } = useShare({
    id, title, notes, settings, inputs, outputs, subSnakes, stageboxes, setToast, setIsShareModalOpen
  });

  const [currentView, setCurrentView] = useState<string>('main');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');

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

  useEffect(() => {
    setIsModalOpen(isAnyModalOpen);
  }, [isAnyModalOpen, setIsModalOpen]);

  // Auto-advance interactive walkthrough steps
  useEffect(() => {
    if (!isActive) return;
    const step = WALKTHROUGH_STEPS[currentStepIndex];
    if (!step) return;

    if (step.actionEvent === 'open-edit-modal' && editingChannel) {
      nextStep();
    }
    if (step.actionEvent === 'close-edit-modal' && !editingChannel) {
      nextStep();
    }
    if (step.actionEvent === 'switch-table-view' && layoutMode === 'table') {
      nextStep();
    }
  }, [
    isActive, 
    currentStepIndex, 
    editingChannel, 
    layoutMode, 
    nextStep
  ]);

  // Force layout/view modes required by current walkthrough step on entry
  useEffect(() => {
    if (!isActive) return;
    const step = WALKTHROUGH_STEPS[currentStepIndex];
    if (!step) return;

    if (step.requiredLayout && layoutMode !== step.requiredLayout) {
      setLayoutMode(step.requiredLayout);
    }
    if (step.requiredView && currentView !== step.requiredView) {
      setCurrentView(step.requiredView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStepIndex]);

  React.useEffect(() => {
    MotionGlobalConfig.skipAnimations = isPrinting || userSettings.animationsEnabled === false;
  }, [userSettings.animationsEnabled, isPrinting]);

  // Global keyboard shortcuts for Undo / Redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

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

  const handleNewPatch = async () => {
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
    const newProject: Project = {
      id: newId,
      title: 'New Project',
      notes: '',
      settings: defaultSettings,
      inputs: createEmptyInputs(24),
      outputs: createEmptyOutputs(12),
      subSnakes: [],
      updatedAt: Date.now()
    };

    try {
      await db.projects.add(newProject);
      setIsNewProjectConfirmOpen(false);
      setToast({ message: 'New project created.', type: 'success' });
      navigate(`/project/${newId}`);
    } catch (err) {
      console.error('Failed to create new patch:', err);
      setToast({ message: 'Failed to create new project.', type: 'error' });
    }
  };

  const loadDemoAndStartTour = async () => {
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
    
    // Fallback if demoPatch.json is empty or invalid
    const fallbackInputs = createEmptyInputs(24);
    
    const newProject: Project = {
      ...(demoPatchData as any),
      id: newId,
      title: demoPatchData.title || 'Demo Project',
      inputs: demoPatchData.inputs && demoPatchData.inputs.length > 0 ? demoPatchData.inputs : fallbackInputs,
      outputs: demoPatchData.outputs && demoPatchData.outputs.length > 0 ? demoPatchData.outputs : createEmptyOutputs(12),
      settings: demoPatchData.settings || defaultSettings,
      subSnakes: demoPatchData.subSnakes || [],
      updatedAt: Date.now()
    };

    try {
      await db.projects.add(newProject);
      setToast({ message: 'Demo project loaded.', type: 'success' });
      navigate(`/project/${newId}`);
      setTimeout(() => {
        startTour();
      }, 500);
    } catch (err) {
      console.error('Failed to create demo:', err);
    }
  };

  const handleImportPatchData = async (data: any) => {
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
    const newProject: Project = {
      id: newId,
      title: data.title || 'Imported Patch',
      notes: data.notes || '',
      settings: data.settings || defaultSettings,
      inputs: data.inputs || createEmptyInputs(24),
      outputs: data.outputs || createEmptyOutputs(12),
      subSnakes: data.subSnakes || [],
      stageboxes: data.stageboxes || [
        {
          id: 'local-io',
          name: 'Main IO',
          order: 0,
          grid: {
            input: {
              rows: Math.max(1, Math.ceil((data.inputs ? data.inputs.length : 24) / (data.settings?.grid?.input?.cols || 8))),
              cols: data.settings?.grid?.input?.cols || 8
            },
            output: {
              rows: Math.max(1, Math.ceil((data.outputs ? data.outputs.length : 12) / (data.settings?.grid?.output?.cols || 4))),
              cols: data.settings?.grid?.output?.cols || 4
            }
          }
        }
      ],
      updatedAt: Date.now()
    };

    try {
      await db.projects.add(newProject);
      setToast({ message: 'Patch list imported successfully.', type: 'success' });
      
      const params = new URLSearchParams(window.location.search);
      if (params.has('print') || params.has('pdf')) {
        navigate(`/project/${newId}?print=true`);
      } else {
        navigate(`/project/${newId}`);
      }
    } catch (err) {
      console.error('Failed to import patch:', err);
      setToast({ message: 'Failed to import patch list file.', type: 'error' });
    }
  };

  React.useEffect(() => {
    if (sharedPatchData) {
      const params = new URLSearchParams(window.location.search);
      if (params.has('print') || params.has('pdf')) {
        handleImportPatchData(sharedPatchData);
        setSharedPatchData(null);
      }
    }
  }, [sharedPatchData]);

  React.useEffect(() => {
    if (id && isLoaded) {
      const params = new URLSearchParams(window.location.search);
      if (params.has('print') || params.has('pdf')) {
        const hasInputContent = inputs.length > 0;
        const hasOutputContent = outputs.length > 0;
        const initialSubSnakes: Record<string, any> = {};
        subSnakes.forEach(snake => {
          const hasContent = inputs.some(c => c.subSnakeId === snake.id) || outputs.some(c => c.subSnakeId === snake.id);
          initialSubSnakes[snake.id] = { printGrid: hasContent, printTable: hasContent };
        });
        
        handleConfirmPrint({
          mainInput: { printGrid: hasInputContent, printTable: hasInputContent },
          mainOutput: { printGrid: hasOutputContent, printTable: hasOutputContent },
          subSnakes: initialSubSnakes
        });

        params.delete('print');
        params.delete('pdf');
        const newSearch = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isLoaded]);

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
  const isMultiPagePrint = true; // Always true now since we force page breaks per block

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col print:bg-white ${pClass('print:bg-white')} ${settings.printTheme === 'bw' ? 'print-bw-mode' : ''}`}>
      <PrintStyles isMultiPagePrint={isMultiPagePrint} settings={settings} />

      {/* Loading Overlay */}
      {id && !isLoaded && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-2xl flex items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-semibold text-sm">Loading StagePatch...</span>
          </div>
        </div>
      )}

      <div className={`main-content flex flex-col flex-1 h-full ${isPrinting ? 'print:hidden' : ''}`}>
        <Header
          handleShare={handleShare}
          isMultiEdit={isMultiEdit}
          setIsMultiEdit={setIsMultiEdit}
          setSelectedIds={setSelectedIds}
          setIsSubSnakesOpen={setIsSubSnakesOpen}
          setIsStageboxesOpen={setIsStageboxesOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          setIsPrintModalOpen={setIsPrintModalOpen}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          saveStatus={saveStatus}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {/* Blank state if no project ID is active */}
        {!id ? (
          <main className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Welcome to EasyPatch</h2>
              <p className="text-slate-500 text-sm">
                A clean, efficient StagePatch manager for audio engineers. Open your project manager or import an existing patch to start editing.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsDashboardOpen(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <FolderOpen className="w-4 h-4" /> Open Project Manager
                </button>
              </div>
            </div>
          </main>
        ) : (
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
                  layoutMode={layoutMode}
                  setLayoutMode={setLayoutMode}
                />
              </div>

              {/* Main Patch Grid */}
              <div 
                className={`print-grid-container flex-col gap-6 lg:gap-8 flex-1 ${
                  shouldStackPrint ? 'print-stacked' : 'print-side-by-side'
                } ${activeView === 'main' && layoutMode === 'grid' ? 'flex print:flex' : 'hidden print:hidden'}`}
              >
                {stageboxes.map(box => {
                  const boxInputs = inputs.filter(c => c.stageboxId === box.id);
                  const boxOutputs = outputs.filter(c => c.stageboxId === box.id);

                  return (
                    <StageboxGridRow
                      key={box.id}
                      box={box}
                      boxInputs={boxInputs}
                      boxOutputs={boxOutputs}
                      settings={settings}
                      subSnakes={subSnakes}
                      selectedIds={selectedIds}
                      isMultiEdit={isMultiEdit}
                      onCellClick={handleCellClick}
                      onCellDrop={handleCellDrop}
                      onCellMouseDown={handleCellMouseDown}
                      onCellMouseEnter={handleCellMouseEnter}
                    />
                  );
                })}
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
                  stageboxes={stageboxes}
                  isPrintMode={activeView === 'main'}
                  projectTitle={title}
                  projectNotes={notes}
                  onUpdateChannel={saveEdit}
                  onEditChannel={(ch) => setEditingChannel(ch)}
                  layoutMode={layoutMode}
                />
              </div>

              {/* Table View */}
              <div className={`${activeView === 'main' && layoutMode === 'table' ? 'block print:block' : 'hidden print:hidden'} flex-1`}>
                <TableView
                  inputs={inputs}
                  outputs={outputs}
                  subSnakes={subSnakes}
                  stageboxes={stageboxes}
                  settings={settings}
                  projectTitle={title}
                  projectNotes={notes}
                  onUpdateChannel={saveEdit}
                  onEditChannel={(ch) => setEditingChannel(ch)}
                />
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Print View Renderer */}
      {isPrinting && printOptions && (
        <PrintRenderer
          printOptions={printOptions}
          stageboxes={stageboxes}
          inputs={inputs}
          outputs={outputs}
          subSnakes={subSnakes}
          settings={settings}
          title={title}
          notes={notes}
        />
      )}

      {id && (
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
      )}

      {id && (
        <AppModals
          editingChannel={editingChannel} setEditingChannel={setEditingChannel}
          inputs={inputs} outputs={outputs}
          subSnakes={subSnakes} settings={settings} setSettings={setSettings}
          userSettings={userSettings} setUserSettings={setUserSettings}
          isMultiGroupOpen={isMultiGroupOpen} setIsMultiGroupOpen={setIsMultiGroupOpen}
          isMultiColorOpen={isMultiColorOpen} setIsMultiColorOpen={setIsMultiColorOpen}
          isAssignSubSnakeOpen={isAssignSubSnakeOpen} setIsAssignSubSnakeOpen={setIsAssignSubSnakeOpen}
          isSubSnakesOpen={isSubSnakesOpen} setIsSubSnakesOpen={setIsSubSnakesOpen}
          isStageboxesOpen={isStageboxesOpen} setIsStageboxesOpen={setIsStageboxesOpen}
          isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
          isNewProjectConfirmOpen={isNewProjectConfirmOpen} setIsNewProjectConfirmOpen={setIsNewProjectConfirmOpen}
          isPrintModalOpen={isPrintModalOpen} setIsPrintModalOpen={setIsPrintModalOpen}
          isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
          shareUrl={shareUrl}
          selectedIds={selectedIds}
          
          saveEdit={saveEdit} handleNavigateEdit={handleNavigateEdit}
          handleMassAssignGroup={handleMassAssignGroup} handleMassAssignColor={handleMassAssignColor} handleMassAssignSubSnake={handleMassAssignSubSnake}
          addSubSnake={addSubSnake} updateSubSnake={updateSubSnake} deleteSubSnake={deleteSubSnake} clearSubSnakeAssignments={clearSubSnakeAssignments}
          handleCreateNewProject={handleNewPatch}
          stageboxes={stageboxes} handleUpdateStageboxes={handleUpdateStageboxes}
          onConfirmPrint={handleConfirmPrint}
        />
      )}

      {/* Project Manager / Dashboard Modal */}
      <AnimatePresence>
        {isDashboardOpen && (
          <DashboardModal
            onClose={() => {
              if (id) setIsDashboardOpen(false);
            }}
            onSelectProject={(selectedId) => {
              if (selectedId) {
                navigate(`/project/${selectedId}`);
              } else {
                navigate('/');
              }
            }}
            activeProjectId={id}
            hasCompletedTour={hasCompletedTour}
            onStartDemo={loadDemoAndStartTour}
            onSkipTour={skipTour}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <ToastRenderer toast={toast} setToast={setToast} />

      {sharedPatchData && (
        <UrlImportConfirmModal
          title={sharedPatchData.title}
          notes={sharedPatchData.notes}
          onConfirm={() => {
            handleImportPatchData(sharedPatchData);
            setSharedPatchData(null);
          }}
          onCancel={() => setSharedPatchData(null)}
        />
      )}
    </div>
  );
}
