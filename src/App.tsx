import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, Upload, Settings, Save, Edit3, Palette, Trash2, ListOrdered, CheckSquare, AlertCircle, X } from 'lucide-react';
import { Channel } from './types';
import { usePatchState } from './hooks/usePatchState';
import { ChannelCell } from './components/ChannelCell';
import { EditModal } from './components/EditModal';
import { FastInputModal } from './components/FastInputModal';
import { MultiEditModal } from './components/MultiEditModal';
import { SettingsModal } from './components/SettingsModal';
import { NewProjectModal } from './components/NewProjectModal';
import { PALETTES } from './utils/constants';

export default function App() {
  const {
    title, setTitle,
    notes, setNotes,
    inputs, setInputs,
    outputs, setOutputs,
    settings, setSettings,
    handleDrop,
    saveEdit,
    saveFastInput,
    handleNewProject,
    handleExport,
    loadImportData
  } = usePatchState();
  
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFastInputOpen, setIsFastInputOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isMultiEdit, setIsMultiEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiEditModalOpen, setIsMultiEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'info' } | null>(null);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleCellDrop = (sourceId: string, targetId: string) => {
    const warning = handleDrop(sourceId, targetId);
    if (warning) {
      setToast({ message: warning, type: 'warning' });
    }
  };

  const handleMultiEditSave = (group: string, color: string) => {
    const updateList = (list: Channel[]) => list.map(ch => {
      if (selectedIds.includes(ch.id)) {
        return { ...ch, group: group !== '' ? group : ch.group, color: color || ch.color };
      }
      return ch;
    });
    setInputs(updateList(inputs));
    setOutputs(updateList(outputs));
    setIsMultiEditModalOpen(false);
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
    return channels.map((ch, index) => {
      const isInGroup = !!ch.group && ch.group.trim() !== '';
      const isFirstInGroup = isInGroup && (index === 0 || channels[index - 1].group !== ch.group);
      const isLastInGroup = isInGroup && (index === channels.length - 1 || channels[index + 1].group !== ch.group);
      const isFirstInRow = index % columns === 0;
      const isLastInRow = index % columns === columns - 1;

      return (
        <ChannelCell 
          key={ch.id} 
          channel={ch} 
          settings={settings}
          onClick={() => {
            if (isMultiEdit) {
              setSelectedIds(prev => prev.includes(ch.id) ? prev.filter(id => id !== ch.id) : [...prev, ch.id]);
            } else {
              setEditingChannel(ch);
            }
          }}
          isSelected={selectedIds.includes(ch.id)}
          onDrop={handleCellDrop}
          isInGroup={isInGroup}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          isFirstInRow={isFirstInRow}
          isLastInRow={isLastInRow}
        />
      );
    });
  };

  const pClass = (cls: string) => settings.useEditorLookInPrint ? '' : cls;

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col ${pClass('print:bg-white print:h-screen print:overflow-hidden')}`}>
      <style>{`
        @media print {
          .print-grid-container {
            height: ${settings.printHeight}vh !important;
            max-height: ${settings.printHeight}vh !important;
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
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 px-3 py-2 rounded text-sm font-medium transition-colors"
            title="Create New Project"
          >
            <Trash2 className="w-4 h-4" /> New
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
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 flex-1 flex flex-col ${pClass('print:border-none print:shadow-none print:p-0')}`}>
          
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
          <div className="hidden print:flex flex-col items-center mb-4">
            <h1 className="text-3xl font-bold">{title}</h1>
            {notes && <p className="text-lg text-gray-700 mt-1">{notes}</p>}
          </div>

          <div className="print-grid-container flex flex-col lg:flex-row gap-6 lg:gap-8 print:flex-row print:gap-4 flex-1">
            
            {/* INPUT Section */}
            <div className="flex-[2] flex flex-col">
              <div className={`bg-slate-800 text-white px-3 py-1.5 rounded-t-lg ${pClass('print:bg-gray-200 print:text-black print:border print:border-b-0 print:border-gray-400')}`}>
                <h2 className="text-sm font-bold tracking-wider uppercase">INPUT</h2>
              </div>
              <div 
                className={`grid gap-0 flex-1 bg-slate-100 rounded-b-lg border-t border-l border-slate-300 overflow-hidden ${pClass('print:bg-white print:border-gray-400 print:border-t print:border-l')}`}
                style={{ 
                  gridTemplateColumns: `repeat(${settings.grid.input.cols}, minmax(0, 1fr))`,
                  gridAutoRows: '1fr'
                }}
              >
                {renderGrid(inputs, settings.grid.input.cols)}
              </div>
            </div>
            
            {/* OUTPUT Section */}
            <div className="flex-[1] flex flex-col">
              <div className={`bg-slate-800 text-white px-3 py-1.5 rounded-t-lg ${pClass('print:bg-gray-200 print:text-black print:border print:border-b-0 print:border-gray-400')}`}>
                <h2 className="text-sm font-bold tracking-wider uppercase">OUTPUT</h2>
              </div>
              <div 
                className={`grid gap-0 flex-1 bg-slate-100 rounded-b-lg border-t border-l border-slate-300 overflow-hidden ${pClass('print:bg-white print:border-gray-400 print:border-t print:border-l')}`}
                style={{ 
                  gridTemplateColumns: `repeat(${settings.grid.output.cols}, minmax(0, 1fr))`,
                  gridAutoRows: '1fr'
                }}
              >
                {renderGrid(outputs, settings.grid.output.cols)}
              </div>
            </div>

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
                onClick={() => setIsMultiEditModalOpen(true)} 
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                Edit
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMultiEditClear} 
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                Clear Cells
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

      {/* Multi-Edit Modal */}
      <AnimatePresence>
        {isMultiEditModalOpen && (
          <MultiEditModal 
            selectedCount={selectedIds.length}
            activePalette={PALETTES[settings.palette]}
            onClose={() => setIsMultiEditModalOpen(false)}
            onSave={handleMultiEditSave}
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

      {/* New Project Modal */}
      <AnimatePresence>
        {isNewProjectOpen && (
          <NewProjectModal 
            onClose={() => setIsNewProjectOpen(false)}
            onConfirm={handleNewProject}
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
