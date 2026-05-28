import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig, MotionGlobalConfig } from 'motion/react';
import { Printer, Download, Upload, Settings, Save, Edit3, Palette, Trash2, ListOrdered, CheckSquare, AlertCircle, X, Grid, Plus, Network, Folder } from 'lucide-react';
import { Channel } from './types';
import { usePatchState } from './hooks/usePatchState';
import { ChannelCell } from './components/ChannelCell';
import { EditModal } from './components/EditModal';
import { FastInputModal } from './components/FastInputModal';
import { SettingsModal } from './components/SettingsModal';
import { ResizeGridModal } from './components/ResizeGridModal';
import { NewProjectConfirmModal } from './components/NewProjectConfirmModal';
import { SubSnakesModal } from './components/SubSnakesModal';
import { AssignSubSnakeModal } from './components/AssignSubSnakeModal';
import { MultiGroupModal } from './components/MultiGroupModal';
import { MultiColorModal } from './components/MultiColorModal';
import { PALETTES } from './utils/constants';

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
    deleteSubSnake
  } = usePatchState();

  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFastInputOpen, setIsFastInputOpen] = useState(false);
  const [isResizeGridOpen, setIsResizeGridOpen] = useState(false);
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false);
  const [isMultiEdit, setIsMultiEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiGroupOpen, setIsMultiGroupOpen] = useState(false);
  const [isMultiColorOpen, setIsMultiColorOpen] = useState(false);
  const [isAssignSubSnakeOpen, setIsAssignSubSnakeOpen] = useState(false);
  const [isSubSnakesOpen, setIsSubSnakesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag selection and shift-click state refs
  const isSelectingRange = useRef(false);
  const selectionMode = useRef<'select' | 'deselect'>('select');
  const lastSelectedId = useRef<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'info' } | null>(null);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  React.useEffect(() => {
    MotionGlobalConfig.skipAnimations = settings.animationsEnabled === false;
  }, [settings.animationsEnabled]);

  // Global mouseup listener to terminate drag range selection
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      isSelectingRange.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleCellToggle = (id: string, forceMode?: 'select' | 'deselect') => {
    setSelectedIds(prev => {
      const exists = prev.includes(id);
      const mode = forceMode || (exists ? 'deselect' : 'select');
      
      if (mode === 'select' && !exists) {
        return [...prev, id];
      } else if (mode === 'deselect' && exists) {
        return prev.filter(item => item !== id);
      }
      return prev;
    });
  };

  const handleCellClick = (ch: Channel, e: React.MouseEvent) => {
    if (isMultiEdit) {
      if (e.shiftKey && lastSelectedId.current) {
        const allSeq = [...inputs, ...outputs];
        const lastIdx = allSeq.findIndex(c => c.id === lastSelectedId.current);
        const currentIdx = allSeq.findIndex(c => c.id === ch.id);
        if (lastIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(lastIdx, currentIdx);
          const end = Math.max(lastIdx, currentIdx);
          const rangeIds = allSeq.slice(start, end + 1).map(c => c.id);
          
          setSelectedIds(prev => {
            const newSelection = [...prev];
            rangeIds.forEach(id => {
              if (!newSelection.includes(id)) {
                newSelection.push(id);
              }
            });
            return newSelection;
          });
        }
        lastSelectedId.current = ch.id;
      }
    } else {
      setEditingChannel(ch);
    }
  };

  const handleCellMouseDown = (ch: Channel, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    if (e.shiftKey) return; // Shift key reserved for block select
    
    isSelectingRange.current = true;
    const exists = selectedIds.includes(ch.id);
    const mode = exists ? 'deselect' : 'select';
    selectionMode.current = mode;
    handleCellToggle(ch.id, mode);
    lastSelectedId.current = ch.id;
  };

  const handleCellMouseEnter = (ch: Channel, e: React.MouseEvent) => {
    if (!isSelectingRange.current) return;
    handleCellToggle(ch.id, selectionMode.current);
    lastSelectedId.current = ch.id;
  };

  const handleCellDrop = (sourceId: string, targetId: string) => {
    const warning = handleDrop(sourceId, targetId);
    if (warning) {
      setToast({ message: warning, type: 'warning' });
    }
  };

  const handleMassAssignGroup = (group: string) => {
    const updateList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        return { ...ch, group };
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

  const handleMultiEditClear = () => {
    const clearList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        return { ...ch, name: '', tech: '', group: '', color: '#ffffff' };
      }
      return ch;
    });
    setInputs(clearList(inputs));
    setOutputs(clearList(outputs));
    setSelectedIds([]);
    setIsMultiEdit(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        loadImportData(data);
      } catch (error) {
        alert('Error reading file. Please select a valid EasyPatch or JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderGrid = (channels: Channel[], columns: number) => {
    if (columns <= 0) return null;
    const cells = channels.map((ch, index) => {
      const isInGroup = !!ch.group && ch.group.trim() !== '';
      const isFirstInGroup = isInGroup && (index === 0 || channels[index - 1].group !== ch.group);
      const isLastInGroup = isInGroup && (index === channels.length - 1 || channels[index + 1].group !== ch.group);
      const isFirstInRow = index % columns === 0;
      const isLastInRow = index % columns === columns - 1;
      const subSnake = subSnakes.find(s => s.id === ch.subSnakeId);
      const subSnakeName = subSnake?.name;
      const subSnakeColor = subSnake?.color;

      return (
        <ChannelCell
          key={ch.id}
          channel={ch}
          settings={settings}
          onClick={(e) => handleCellClick(ch, e)}
          isSelected={selectedIds.includes(ch.id)}
          onDrop={handleCellDrop}
          isInGroup={isInGroup}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          isFirstInRow={isFirstInRow}
          isLastInRow={isLastInRow}
          subSnakeName={subSnakeName}
          subSnakeColor={subSnakeColor}
          isMultiSelectMode={isMultiEdit}
          onCellMouseDown={(e) => handleCellMouseDown(ch, e)}
          onCellMouseEnter={(e) => handleCellMouseEnter(ch, e)}
        />
      );
    });

    const rows: React.ReactNode[] = [];
    for (let i = 0; i < cells.length; i += columns) {
      const rowCells = cells.slice(i, i + columns);
      rows.push(
        <div key={i} className="grid-row-wrapper">
          {rowCells}
        </div>
      );
    }
    return rows;
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
        {/* Header - Hidden in Print */}
        <header className="bg-slate-900 text-white p-4 shadow-md print:hidden flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold tracking-wide">EasyPatch</h1>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsFastInputOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              <ListOrdered className="w-4 h-4" /> Fast Input
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsMultiEdit(!isMultiEdit);
                if (isMultiEdit) setSelectedIds([]);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-all duration-200 ${isMultiEdit ? 'bg-blue-600 ring-4 ring-blue-400/50 text-white font-bold shadow-lg scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium'}`}
            >
              <CheckSquare className="w-4 h-4" /> Multi-Select
            </motion.button>

            <div className="w-px h-8 bg-slate-700 mx-1 hidden sm:block"></div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              <Upload className="w-4 h-4" /> Import
            </motion.button>
            <input
              type="file"
              accept=".easypatch,.json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImport}
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </motion.button>

            <div className="w-px h-8 bg-slate-700 mx-1 hidden sm:block"></div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsNewProjectConfirmOpen(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
              title="Create New Project"
            >
              <Plus className="w-4 h-4" /> New
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsResizeGridOpen(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
              title="Resize Grid"
            >
              <Grid className="w-4 h-4" /> Resize Grid
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSubSnakesOpen(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
              title="Manage SubSnakes"
            >
              <Network className="w-4 h-4 text-indigo-400" /> SubSnakes
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              <Palette className="w-4 h-4" /> Settings
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-bold transition-colors ml-2"
            >
              <Printer className="w-4 h-4" /> Print
            </motion.button>
          </div>
        </header>

        {/* Main Content - Grid Layout */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col print:p-0 print:m-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 flex-1 flex flex-col print:border-none print:shadow-none print:p-0">

            {/* Editable Title & Notes (Screen) */}
            <div className="mb-6 print:hidden flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-gray-400" />
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Project Title..."
                  className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full max-w-md"
                />
              </div>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes (e.g., date, venue, band)..."
                className="text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full max-w-xl ml-7"
              />
            </div>

            {/* Print Header (Only visible when printing) */}
            <div className="print-header-wrapper hidden print:flex flex-col items-center mb-4">
              <h1 className="text-3xl font-bold">{title}</h1>
              {notes && <p className="text-lg text-gray-700 mt-1">{notes}</p>}
            </div>

            <div className={`print-grid-container flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 ${shouldStackPrint ? 'print-stacked' : 'print-side-by-side'}`}>

              {/* INPUT Section */}
              {inputs.length > 0 && (
                <div className={`print-section-wrapper ${outputs.length > 0 ? 'flex-[2]' : 'flex-grow flex-1'} flex flex-col`}>
                  <div className={`bg-slate-800 text-white px-3 py-1.5 rounded-t-lg ${pClass('print:bg-gray-200 print:text-black print:border print:border-b-0 print:border-gray-400')}`}>
                    <h2 className="text-sm font-bold tracking-wider uppercase">INPUT</h2>
                  </div>
                  <div
                    className={`grid gap-0 flex-1 bg-slate-100 rounded-b-lg border-t border-l border-slate-300 overflow-hidden ${pClass('print:bg-white print:border-gray-400 print:border-t print:border-l')}`}
                    style={{
                      gridTemplateColumns: `repeat(${settings.grid.input.cols}, minmax(0, 1fr))`,
                      gridAutoRows: '1fr',
                      ['--grid-cols' as any]: settings.grid.input.cols
                    }}
                  >
                    {renderGrid(inputs, settings.grid.input.cols)}
                  </div>
                </div>
              )}

              {/* OUTPUT Section */}
              {outputs.length > 0 && (
                <div className={`print-section-wrapper ${inputs.length > 0 ? 'flex-[1]' : 'flex-grow flex-1'} flex flex-col`}>
                  <div className={`bg-slate-800 text-white px-3 py-1.5 rounded-t-lg ${pClass('print:bg-gray-200 print:text-black print:border print:border-b-0 print:border-gray-400')}`}>
                    <h2 className="text-sm font-bold tracking-wider uppercase">OUTPUT</h2>
                  </div>
                  <div
                    className={`grid gap-0 flex-1 bg-slate-100 rounded-b-lg border-t border-l border-slate-300 overflow-hidden ${pClass('print:bg-white print:border-gray-400 print:border-t print:border-l')}`}
                    style={{
                      gridTemplateColumns: `repeat(${settings.grid.output.cols}, minmax(0, 1fr))`,
                      gridAutoRows: '1fr',
                      ['--grid-cols' as any]: settings.grid.output.cols
                    }}
                  >
                    {renderGrid(outputs, settings.grid.output.cols)}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div> {/* End main-content */}

      {/* Floating Action Bar for Multi-edit */}
      <AnimatePresence>
        {isMultiEdit && selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 80, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 bg-slate-800 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40"
          >
            <div className="font-bold">{selectedIds.length} channels selected</div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAssignSubSnakeOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <Network className="w-4 h-4 text-indigo-200" /> SubSnake
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMultiGroupOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <Folder className="w-4 h-4 text-blue-200" /> Group
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMultiColorOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <Palette className="w-4 h-4 text-emerald-200" /> Color
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMultiEditClear}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4 text-red-200" /> Clear
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedIds([])}
                className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingChannel && (
          <EditModal
            channel={editingChannel}
            allChannels={[...inputs, ...outputs]}
            subSnakes={subSnakes}
            settings={settings}
            onClose={() => setEditingChannel(null)}
            onSave={saveEdit}
          />
        )}
      </AnimatePresence>

      {/* Fast Input Modal */}
      <AnimatePresence>
        {isFastInputOpen && (
          <FastInputModal
            inputs={inputs}
            outputs={outputs}
            onClose={() => setIsFastInputOpen(false)}
            onSave={saveFastInput}
          />
        )}
      </AnimatePresence>

      {/* Multi-Group Modal */}
      <AnimatePresence>
        {isMultiGroupOpen && (
          <MultiGroupModal
            selectedCount={selectedIds.length}
            allChannels={[...inputs, ...outputs]}
            onClose={() => setIsMultiGroupOpen(false)}
            onSave={handleMassAssignGroup}
          />
        )}
      </AnimatePresence>

      {/* Multi-Color Modal */}
      <AnimatePresence>
        {isMultiColorOpen && (
          <MultiColorModal
            selectedCount={selectedIds.length}
            activePalette={PALETTES[settings.palette]}
            onClose={() => setIsMultiColorOpen(false)}
            onSave={handleMassAssignColor}
          />
        )}
      </AnimatePresence>

      {/* Assign to SubSnake Modal */}
      <AnimatePresence>
        {isAssignSubSnakeOpen && (
          <AssignSubSnakeModal
            selectedCount={selectedIds.length}
            selectedIds={selectedIds}
            inputs={inputs}
            outputs={outputs}
            subSnakes={subSnakes}
            settings={settings}
            onClose={() => setIsAssignSubSnakeOpen(false)}
            onSave={handleMassAssignSubSnake}
            onAddSubSnake={addSubSnake}
          />
        )}
      </AnimatePresence>

      {/* SubSnakes Modal */}
      <AnimatePresence>
        {isSubSnakesOpen && (
          <SubSnakesModal
            subSnakes={subSnakes}
            inputs={inputs}
            outputs={outputs}
            settings={settings}
            onClose={() => setIsSubSnakesOpen(false)}
            onAddSubSnake={addSubSnake}
            onUpdateSubSnake={updateSubSnake}
            onDeleteSubSnake={deleteSubSnake}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            setSettings={setSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* New Project Confirm Modal */}
      <AnimatePresence>
        {isNewProjectConfirmOpen && (
          <NewProjectConfirmModal
            onClose={() => setIsNewProjectConfirmOpen(false)}
            onConfirm={() => {
              handleCreateNewProject();
              setIsNewProjectConfirmOpen(false);
              setIsResizeGridOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Resize Grid Modal */}
      <AnimatePresence>
        {isResizeGridOpen && (
          <ResizeGridModal
            onClose={() => setIsResizeGridOpen(false)}
            onConfirm={handleResizeGrid}
            currentGrid={settings.grid}
            inputs={inputs}
            outputs={outputs}
          />
        )}
      </AnimatePresence>

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
