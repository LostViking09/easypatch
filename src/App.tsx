import React, { useState, useEffect } from 'react';
import { MotionGlobalConfig, AnimatePresence } from 'motion/react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Channel, PrintOptions } from './types';
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
import { TableView } from './features/TableView/TableView';
import { UrlImportConfirmModal } from './components/UrlImportConfirmModal';
import { compressData, decompressData } from './utils/urlSharing';
import { DashboardModal } from './features/Dashboard/DashboardModal';
import { db, Project } from './services/db';
import { defaultSettings, createEmptyInputs, createEmptyOutputs } from './utils/constants';
import { FileText, FolderOpen } from 'lucide-react';

const getCleanPathname = () => {
  let path = window.location.pathname;
  if (path.includes('http://') || path.includes('https://')) {
    const idx = path.indexOf('http://') !== -1 ? path.indexOf('http://') : path.indexOf('https://');
    const absoluteUrl = path.substring(idx);
    try {
      path = new URL(absoluteUrl).pathname;
    } catch (e) {
      path = '/easypatch/';
    }
  }
  return path;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Editor />} />
      <Route path="/project/:id" element={<Editor />} />
    </Routes>
  );
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    saveFastInput,
    handleResizeGrid,
    handleExport,
    addSubSnake,
    updateSubSnake,
    deleteSubSnake,
    clearSubSnakeAssignments
  } = usePatchState(id);

  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFastInputOpen, setIsFastInputOpen] = useState(false);
  const [isResizeGridOpen, setIsResizeGridOpen] = useState(false);
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false);
  const [isMultiGroupOpen, setIsMultiGroupOpen] = useState(false);
  const [isMultiColorOpen, setIsMultiColorOpen] = useState(false);
  const [isAssignSubSnakeOpen, setIsAssignSubSnakeOpen] = useState(false);
  const [isSubSnakesOpen, setIsSubSnakesOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('main');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'table'>('grid');
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printTrigger, setPrintTrigger] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const [sharedPatchData, setSharedPatchData] = useState<any>(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(!id);

  const { toast, setToast } = useToast();

  // If active project changes or dashboard opens, keep state in sync
  useEffect(() => {
    if (!id) {
      setIsDashboardOpen(true);
    } else {
      setIsDashboardOpen(false);
    }
  }, [id]);

  const isAnyModalOpen =
    !!editingChannel ||
    isSettingsOpen ||
    isFastInputOpen ||
    isResizeGridOpen ||
    isNewProjectConfirmOpen ||
    isSubSnakesOpen ||
    isAssignSubSnakeOpen ||
    isMultiGroupOpen ||
    isMultiColorOpen ||
    isPrintModalOpen ||
    isShareModalOpen ||
    isDashboardOpen;

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
    MotionGlobalConfig.skipAnimations = userSettings.animationsEnabled === false;
  }, [userSettings.animationsEnabled]);

  React.useEffect(() => {
    if (printTrigger) {
      const timer = setTimeout(() => {
        window.print();
        setPrintTrigger(false);
        setIsPrinting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [printTrigger]);

  const handleConfirmPrint = (options: PrintOptions) => {
    setPrintOptions(options);
    setIsPrintModalOpen(false);
    setIsPrinting(true);
    setPrintTrigger(true);
  };

  React.useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#import=')) {
        try {
          const base64Data = hash.replace('#import=', '');
          const data = await decompressData(base64Data);
          if (data && (data.inputs || data.outputs || data.settings)) {
            setSharedPatchData(data);
          }
        } catch (e) {
          console.error('Failed to import shared patch:', e);
          setToast({ message: 'Invalid or corrupted shared link.', type: 'error' });
        } finally {
          const cleanPath = getCleanPathname();
          window.history.replaceState(null, '', cleanPath + window.location.search);
        }
      }
    };
    handleHash();
  }, [setToast]);

  const handleShare = async () => {
    if (!id) return;
    try {
      const data = { title, notes, settings, inputs, outputs, subSnakes };
      const base64 = await compressData(data);
      const cleanPath = getCleanPathname();
      const url = `${window.location.origin}${cleanPath}#import=${base64}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to generate share link. Your browser may not support compression.', type: 'error' });
    }
  };

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
      title: 'New Patch List',
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
      setToast({ message: 'New patch list created.', type: 'success' });
      navigate(`/project/${newId}`);
    } catch (err) {
      console.error('Failed to create new patch:', err);
      setToast({ message: 'Failed to create new patch list.', type: 'error' });
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
      updatedAt: Date.now()
    };

    try {
      await db.projects.add(newProject);
      setToast({ message: 'Patch list imported successfully.', type: 'success' });
      navigate(`/project/${newId}`);
    } catch (err) {
      console.error('Failed to import patch:', err);
      setToast({ message: 'Failed to import patch list file.', type: 'error' });
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
          setIsFastInputOpen={setIsFastInputOpen}
          isMultiEdit={isMultiEdit}
          setIsMultiEdit={setIsMultiEdit}
          setSelectedIds={setSelectedIds}
          setIsResizeGridOpen={setIsResizeGridOpen}
          setIsSubSnakesOpen={setIsSubSnakesOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          setIsPrintModalOpen={setIsPrintModalOpen}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          saveStatus={saveStatus}
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
                className={`print-grid-container flex-col lg:flex-row gap-6 lg:gap-8 flex-1 ${
                  shouldStackPrint ? 'print-stacked' : 'print-side-by-side'
                } ${activeView === 'main' && layoutMode === 'grid' ? 'flex print:flex' : 'hidden print:hidden'}`}
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
        <div className="hidden print:flex flex-col w-full print-preview-container">
          {/* Main Input Grid */}
          {printOptions.mainInput.printGrid && (
            <div className="print-subsnake-page-break">
              <div className="print-grid-container print-stacked">
                <PatchGridSection
                  channels={inputs}
                  type="INPUT"
                  cols={settings.grid.input.cols}
                  flexClass=""
                  settings={settings}
                  subSnakes={subSnakes}
                  selectedIds={[]}
                  isMultiEdit={false}
                  onCellClick={() => {}}
                  onCellDrop={() => {}}
                  onCellMouseDown={() => {}}
                  onCellMouseEnter={() => {}}
                />
              </div>
            </div>
          )}

          {/* Main Output Grid */}
          {printOptions.mainOutput.printGrid && (
            <div className="print-subsnake-page-break">
              <div className="print-grid-container print-stacked">
                <PatchGridSection
                  channels={outputs}
                  type="OUTPUT"
                  cols={settings.grid.output.cols}
                  flexClass=""
                  settings={settings}
                  subSnakes={subSnakes}
                  selectedIds={[]}
                  isMultiEdit={false}
                  onCellClick={() => {}}
                  onCellDrop={() => {}}
                  onCellMouseDown={() => {}}
                  onCellMouseEnter={() => {}}
                />
              </div>
            </div>
          )}

          {/* Main Input Table */}
          {printOptions.mainInput.printTable && (
            <div className="print-subsnake-page-break w-full max-w-7xl mx-auto">
              <TableView
                inputs={inputs}
                outputs={[]}
                subSnakes={subSnakes}
                settings={settings}
                projectTitle={title}
                projectNotes={notes}
              />
            </div>
          )}

          {/* Main Output Table */}
          {printOptions.mainOutput.printTable && (
            <div className="print-subsnake-page-break w-full max-w-7xl mx-auto">
              <TableView
                inputs={[]}
                outputs={outputs}
                subSnakes={subSnakes}
                settings={settings}
                projectTitle={title}
                projectNotes={notes}
              />
            </div>
          )}

          {/* SubSnakes */}
          {subSnakes.map(snake => {
            const options = printOptions.subSnakes[snake.id];
            if (!options) return null;

            return (
              <React.Fragment key={snake.id}>
                {options.printGrid && (
                  <div className="print-subsnake-page-break">
                    <SubSnakeView
                      subSnakes={[snake]}
                      inputs={inputs}
                      outputs={outputs}
                      settings={settings}
                      selectedSubSnakeId={snake.id}
                      isPrintMode={true}
                      projectTitle={title}
                      projectNotes={notes}
                      layoutMode="grid"
                    />
                  </div>
                )}
                {options.printTable && (
                  <div className="print-subsnake-page-break">
                    <SubSnakeView
                      subSnakes={[snake]}
                      inputs={inputs}
                      outputs={outputs}
                      settings={settings}
                      selectedSubSnakeId={snake.id}
                      isPrintMode={true}
                      projectTitle={title}
                      projectNotes={notes}
                      layoutMode="table"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
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
          isFastInputOpen={isFastInputOpen} setIsFastInputOpen={setIsFastInputOpen}
          isMultiGroupOpen={isMultiGroupOpen} setIsMultiGroupOpen={setIsMultiGroupOpen}
          isMultiColorOpen={isMultiColorOpen} setIsMultiColorOpen={setIsMultiColorOpen}
          isAssignSubSnakeOpen={isAssignSubSnakeOpen} setIsAssignSubSnakeOpen={setIsAssignSubSnakeOpen}
          isSubSnakesOpen={isSubSnakesOpen} setIsSubSnakesOpen={setIsSubSnakesOpen}
          isSettingsOpen={isSettingsOpen} setIsSettingsOpen={setIsSettingsOpen}
          isNewProjectConfirmOpen={isNewProjectConfirmOpen} setIsNewProjectConfirmOpen={setIsNewProjectConfirmOpen}
          isResizeGridOpen={isResizeGridOpen} setIsResizeGridOpen={setIsResizeGridOpen}
          isPrintModalOpen={isPrintModalOpen} setIsPrintModalOpen={setIsPrintModalOpen}
          isShareModalOpen={isShareModalOpen} setIsShareModalOpen={setIsShareModalOpen}
          shareUrl={shareUrl}
          selectedIds={selectedIds}
          
          saveEdit={saveEdit} handleNavigateEdit={handleNavigateEdit} saveFastInput={saveFastInput}
          handleMassAssignGroup={handleMassAssignGroup} handleMassAssignColor={handleMassAssignColor} handleMassAssignSubSnake={handleMassAssignSubSnake}
          addSubSnake={addSubSnake} updateSubSnake={updateSubSnake} deleteSubSnake={deleteSubSnake} clearSubSnakeAssignments={clearSubSnakeAssignments}
          handleCreateNewProject={handleNewPatch} handleResizeGrid={handleResizeGrid}
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
