import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, Upload, Settings, X, Save, Edit3, Palette, Trash2, ListOrdered, AlertTriangle, CheckSquare, Tag, Pipette } from 'lucide-react';

type Channel = {
  id: string;
  type: 'in' | 'out';
  number: number;
  name: string;
  tech: string;
  color: string;
  group?: string;
};

type SettingsConfig = {
  palette: 'qu5' | 'sq';
  fontSizes: {
    number: number;
    name: number;
    tech: number;
    group: number;
  };
  printHeight: number;
  useEditorLookInPrint: boolean;
  colorOpacity: number;
  xlrOpacity: number;
  groupBorderOpacity: number;
  grid: {
    input: { rows: number; cols: number };
    output: { rows: number; cols: number };
  };
};

const defaultSettings: SettingsConfig = {
  palette: 'qu5',
  fontSizes: { number: 1, name: 1, tech: 1, group: 1 },
  printHeight: 100,
  useEditorLookInPrint: true,
  colorOpacity: 0.25,
  xlrOpacity: 0.03,
  groupBorderOpacity: 1,
  grid: {
    input: { rows: 3, cols: 8 },
    output: { rows: 3, cols: 4 },
  },
};

const PALETTES = {
  qu5: [
    { label: 'White', value: '#ffffff' },
    { label: 'Yellow', value: '#e2b116' },
    { label: 'Red', value: '#c43932' },
    { label: 'Green', value: '#01d243' },
    { label: 'LightBlue', value: '#017fba' },
    { label: 'Blue', value: '#0934a5' },
    { label: 'Purple', value: '#4c06be' },
    { label: 'Pink', value: '#fe4adf' },
  ],
  sq: [
    { label: 'White', value: '#ffffff' },
    { label: 'Yellow', value: '#ffff00' },
    { label: 'Red', value: '#fe0000' },
    { label: 'Green', value: '#00ff01' },
    { label: 'LightBlue', value: '#0debff' },
    { label: 'Blue', value: '#0a00ff' },
    { label: 'Pink', value: '#ff00fe' },
    { label: 'Black', value: '#000000' },
  ]
};

const initialInputs: Channel[] = Array.from({ length: 24 }, (_, i) => ({
  id: `in-${i + 1}`,
  type: 'in',
  number: i + 1,
  name: '',
  tech: '',
  color: '#ffffff',
  group: '',
}));

const initialOutputs: Channel[] = Array.from({ length: 12 }, (_, i) => ({
  id: `out-${i + 1}`,
  type: 'out',
  number: i + 1,
  name: '',
  tech: '',
  color: '#ffffff',
  group: '',
}));

export default function App() {
  const [title, setTitle] = useState('EasyPatch');
  const [notes, setNotes] = useState('');
  const [inputs, setInputs] = useState<Channel[]>(initialInputs);
  const [outputs, setOutputs] = useState<Channel[]>(initialOutputs);
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFastInputOpen, setIsFastInputOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isMultiEdit, setIsMultiEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMultiEditModalOpen, setIsMultiEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = title.trim() !== '' ? title : 'EasyPatch';
  }, [title]);

  const handleDrop = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIsInput = sourceId.startsWith('in-');
    const targetIsInput = targetId.startsWith('in-');
    if (sourceIsInput !== targetIsInput) return;

    const list = sourceIsInput ? [...inputs] : [...outputs];
    const sourceIdx = list.findIndex(c => c.id === sourceId);
    const targetIdx = list.findIndex(c => c.id === targetId);

    const temp = { ...list[sourceIdx] };
    list[sourceIdx] = { ...list[targetIdx], id: list[sourceIdx].id, number: list[sourceIdx].number, type: list[sourceIdx].type };
    list[targetIdx] = { ...temp, id: list[targetIdx].id, number: list[targetIdx].number, type: list[targetIdx].type };

    if (sourceIsInput) setInputs(list);
    else setOutputs(list);
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

  // Load from localStorage on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem('ar2412-title');
    const savedNotes = localStorage.getItem('ar2412-notes');
    const savedInputs = localStorage.getItem('ar2412-inputs');
    const savedOutputs = localStorage.getItem('ar2412-outputs');
    const savedSettings = localStorage.getItem('ar2412-settings');
    
    if (savedTitle) setTitle(savedTitle);
    if (savedNotes) setNotes(savedNotes);
    if (savedSettings) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) }); } catch (e) { console.error(e); }
    } else {
      // Migrate old palette setting if exists
      const oldPalette = localStorage.getItem('ar2412-palette');
      if (oldPalette) setSettings(s => ({ ...s, palette: oldPalette as 'qu5' | 'sq' }));
    }

    if (savedInputs) {
      try { setInputs(JSON.parse(savedInputs)); } catch (e) { console.error(e); }
    }
    if (savedOutputs) {
      try { setOutputs(JSON.parse(savedOutputs)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('ar2412-title', title);
    localStorage.setItem('ar2412-notes', notes);
    localStorage.setItem('ar2412-settings', JSON.stringify(settings));
    localStorage.setItem('ar2412-inputs', JSON.stringify(inputs));
    localStorage.setItem('ar2412-outputs', JSON.stringify(outputs));
  }, [title, notes, settings, inputs, outputs]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const data = { title, notes, settings, inputs, outputs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = title.trim() !== '' ? title : 'EasyPatch';
    a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.easypatch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.title) setTitle(data.title);
        if (data.notes !== undefined) setNotes(data.notes);
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        if (data.inputs && Array.isArray(data.inputs)) setInputs(data.inputs);
        if (data.outputs && Array.isArray(data.outputs)) setOutputs(data.outputs);
      } catch (error) {
        alert('Error reading file. Please select a valid EasyPatch or JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNewProject = (inputGrid: { rows: number, cols: number }, outputGrid: { rows: number, cols: number }) => {
    const newInputs: Channel[] = Array.from({ length: inputGrid.rows * inputGrid.cols }, (_, i) => ({
      id: `in-${i + 1}`,
      type: 'in',
      number: i + 1,
      name: '',
      tech: '',
      color: '#ffffff',
      group: '',
    }));

    const newOutputs: Channel[] = Array.from({ length: outputGrid.rows * outputGrid.cols }, (_, i) => ({
      id: `out-${i + 1}`,
      type: 'out',
      number: i + 1,
      name: '',
      tech: '',
      color: '#ffffff',
      group: '',
    }));

    setInputs(newInputs);
    setOutputs(newOutputs);
    setSettings(prev => ({
      ...prev,
      grid: {
        input: inputGrid,
        output: outputGrid
      }
    }));
    setTitle('New Patch List');
    setNotes('');
    setIsNewProjectOpen(false);
  };

  const saveEdit = (updatedChannel: Channel) => {
    if (updatedChannel.type === 'in') {
      setInputs(inputs.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch));
    } else {
      setOutputs(outputs.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch));
    }
    setEditingChannel(null);
  };

  const saveFastInput = (newInputs: Channel[], newOutputs: Channel[]) => {
    setInputs(newInputs);
    setOutputs(newOutputs);
    setIsFastInputOpen(false);
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
          onDrop={handleDrop}
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
          <button 
            onClick={() => setIsFastInputOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            <ListOrdered className="w-4 h-4" /> Fast Input
          </button>

          <button 
            onClick={() => {
              setIsMultiEdit(!isMultiEdit);
              if (isMultiEdit) setSelectedIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-all duration-200 ${isMultiEdit ? 'bg-blue-600 ring-4 ring-blue-400/50 text-white font-bold shadow-lg scale-105' : 'bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium'}`}
          >
            <CheckSquare className="w-4 h-4" /> Multi-Select
          </button>

          <div className="w-px h-8 bg-slate-700 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <input 
            type="file" 
            accept=".easypatch,.json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImport} 
          />
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>

          <div className="w-px h-8 bg-slate-700 mx-1 hidden sm:block"></div>

          <button 
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 px-3 py-2 rounded text-sm font-medium transition-colors"
            title="Create New Project"
          >
            <Trash2 className="w-4 h-4" /> New
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm font-medium transition-colors"
          >
            <Palette className="w-4 h-4" /> Settings
          </button>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-bold transition-colors ml-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
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
      {isMultiEdit && selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10">
          <div className="font-bold">{selectedIds.length} channels selected</div>
          <div className="flex gap-2">
            <button onClick={() => setIsMultiEditModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full text-sm font-bold transition-colors">
              Edit
            </button>
            <button onClick={handleMultiEditClear} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full text-sm font-bold transition-colors">
              Clear Cells
            </button>
            <button onClick={() => setSelectedIds([])} className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded-full text-sm font-bold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingChannel && (
        <EditModal 
          channel={editingChannel} 
          allChannels={[...inputs, ...outputs]}
          settings={settings}
          onClose={() => setEditingChannel(null)} 
          onSave={saveEdit} 
        />
      )}

      {/* Fast Input Modal */}
      {isFastInputOpen && (
        <FastInputModal 
          inputs={inputs}
          outputs={outputs}
          onClose={() => setIsFastInputOpen(false)}
          onSave={saveFastInput}
        />
      )}

      {/* Multi-Edit Modal */}
      {isMultiEditModalOpen && (
        <MultiEditModal 
          selectedCount={selectedIds.length}
          activePalette={PALETTES[settings.palette]}
          onClose={() => setIsMultiEditModalOpen(false)}
          onSave={handleMultiEditSave}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          settings={settings} 
          setSettings={setSettings} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {/* New Project Modal */}
      {isNewProjectOpen && (
        <NewProjectModal 
          onClose={() => setIsNewProjectOpen(false)}
          onConfirm={handleNewProject}
        />
      )}
    </div>
  );
}

// --- Components ---

const hexToRgba = (hex: string, alpha: number) => {
  if (hex === '#ffffff') return '#ffffff';
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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

const ChannelCell: React.FC<ChannelCellProps> = ({ 
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

interface EditModalProps {
  channel: Channel;
  allChannels: Channel[];
  settings: SettingsConfig;
  onClose: () => void;
  onSave: (ch: Channel) => void;
}

const EditModal: React.FC<EditModalProps> = ({ channel, allChannels, settings, onClose, onSave }) => {
  const [formData, setFormData] = useState<Channel>({ ...channel });
  const activePalette = PALETTES[settings.palette];

  // Extract unique groups and their colors for autocomplete & auto-color
  const existingGroups = Array.from(new Set(allChannels.map(c => c.group).filter(Boolean))) as string[];
  const groupColors = allChannels.reduce((acc, c) => {
    if (c.group && c.color !== '#ffffff') acc[c.group] = c.color;
    return acc;
  }, {} as Record<string, string>);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGroup = e.target.value;
    setFormData(prev => {
      const updates: Partial<Channel> = { group: newGroup };
      // Auto-apply color if group exists and has a color
      if (groupColors[newGroup]) {
        updates.color = groupColors[newGroup];
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">
            Edit {channel.type === 'in' ? 'Input' : 'Output'} {channel.number}
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
            <input
              ref={inputRef}
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kick, Vox 1..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold tracking-tighter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech details (e.g., mic, stand)</label>
            <input
              type="text"
              value={formData.tech}
              onChange={e => setFormData({ ...formData, tech: e.target.value })}
              placeholder="e.g. Beta52, short stand..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group (Link)</label>
            <input
              type="text"
              list="existing-groups"
              value={formData.group || ''}
              onChange={handleGroupChange}
              placeholder="e.g. Drums, Keys LR"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="existing-groups">
              {existingGroups.map(g => <option key={g} value={g} />)}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">Channels with the same group name are linked. Selecting an existing group applies its color.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {activePalette.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  style={{ 
                    backgroundColor: hexToRgba(color.value, 0.4),
                    borderColor: color.value === '#ffffff' || color.value === '#000000' ? '#d1d5db' : color.value
                  }}
                  className={`w-10 h-10 rounded-md border-2 transition-all ${
                    formData.color.toLowerCase() === color.value.toLowerCase() 
                      ? 'ring-2 ring-offset-1 ring-blue-500 shadow-sm scale-105' 
                      : 'hover:opacity-80'
                  }`}
                  title={color.label}
                />
              ))}
              
              <div className="w-px h-8 bg-gray-300 mx-1"></div>
              
              <div className="relative w-10 h-10 rounded-md border-2 border-gray-300 overflow-hidden hover:opacity-80 transition-opacity flex items-center justify-center bg-gray-50" title="Custom color">
                <Pipette className="w-5 h-5 text-gray-500" />
                <input 
                  type="color" 
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface NewProjectModalProps {
  onClose: () => void;
  onConfirm: (inputGrid: { rows: number, cols: number }, outputGrid: { rows: number, cols: number }) => void;
}

const PRESETS = [
  { name: 'Custom', in: { rows: 3, cols: 8 }, out: { rows: 3, cols: 4 } },
  { name: 'A&H AR2412 (24/12)', in: { rows: 3, cols: 8 }, out: { rows: 3, cols: 4 } },
  { name: 'A&H AB168 (16/8)', in: { rows: 2, cols: 8 }, out: { rows: 2, cols: 4 } },
  { name: 'Behringer S32 (32/16)', in: { rows: 4, cols: 8 }, out: { rows: 4, cols: 4 } },
  { name: 'Behringer S16 (16/8)', in: { rows: 2, cols: 8 }, out: { rows: 2, cols: 4 } },
];

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onConfirm }) => {
  const [inputGrid, setInputGrid] = useState({ rows: 3, cols: 8 });
  const [outputGrid, setOutputGrid] = useState({ rows: 3, cols: 4 });

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PRESETS.find(p => p.name === e.target.value);
    if (preset) {
      setInputGrid(preset.in);
      setOutputGrid(preset.out);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Create New Project
          </h3>
          <button onClick={onClose} className="text-emerald-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">
            Set the dimensions for the new stage box grid. Warning: this will clear current data!
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Presets</label>
              <select onChange={handlePresetChange} className="w-full px-3 py-2 border rounded-md font-medium bg-white">
                {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">INPUT Blocks</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Columns</label>
                  <input 
                    type="number" min="1" max="16"
                    value={inputGrid.cols}
                    onChange={e => setInputGrid({ ...inputGrid, cols: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rows</label>
                  <input 
                    type="number" min="1" max="10"
                    value={inputGrid.rows}
                    onChange={e => setInputGrid({ ...inputGrid, rows: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                Total: {inputGrid.rows * inputGrid.cols} channels
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">OUTPUT Blocks</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Columns</label>
                  <input 
                    type="number" min="1" max="16"
                    value={outputGrid.cols}
                    onChange={e => setOutputGrid({ ...outputGrid, cols: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rows</label>
                  <input 
                    type="number" min="1" max="10"
                    value={outputGrid.rows}
                    onChange={e => setOutputGrid({ ...outputGrid, rows: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs font-bold text-emerald-700">
                Total: {outputGrid.rows * outputGrid.cols} channels
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(inputGrid, outputGrid)}
            className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-sm transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

function MultiEditModal({ selectedCount, activePalette, onClose, onSave }: { selectedCount: number, activePalette: any[], onClose: () => void, onSave: (group: string, color: string) => void }) {
  const [group, setGroup] = useState('');
  const [color, setColor] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-blue-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Edit {selectedCount} channels</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Common Group (Link)</label>
            <input type="text" value={group} onChange={e => setGroup(e.target.value)} placeholder="Leave empty to keep unchanged" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Common Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {activePalette.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)} style={{ backgroundColor: hexToRgba(c.value, 0.4), borderColor: c.value === '#ffffff' || c.value === '#000000' ? '#d1d5db' : c.value }} className={`w-10 h-10 rounded-md border-2 transition-all ${color.toLowerCase() === c.value.toLowerCase() ? 'ring-2 ring-offset-1 ring-blue-500 scale-105' : 'hover:opacity-80'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">If no color is selected, original remains.</p>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
          <button onClick={() => onSave(group, color)} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md">Save</button>
        </div>
      </div>
    </div>
  );
}

function FastInputModal({ inputs, outputs, onClose, onSave }: { inputs: Channel[], outputs: Channel[], onClose: () => void, onSave: (i: Channel[], o: Channel[]) => void }) {
  const [inText, setInText] = useState(inputs.map(c => c.name).join('\n'));
  const [outText, setOutText] = useState(outputs.map(c => c.name).join('\n'));

  const handleSave = () => {
    const inLines = inText.split('\n');
    const outLines = outText.split('\n');
    
    const newInputs = inputs.map((ch, i) => ({ ...ch, name: inLines[i] || '' }));
    const newOutputs = outputs.map((ch, i) => ({ ...ch, name: outLines[i] || '' }));
    
    onSave(newInputs, newOutputs);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Fast Input (One name per line)</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col">
            <label className="font-bold mb-2">INPUT ({inputs.length})</label>
            <div className="flex flex-1 border rounded-md overflow-hidden font-mono text-sm">
              <div className="bg-gray-100 text-gray-400 p-2 text-right select-none border-r">
                {Array.from({length: inputs.length}, (_, i) => <div key={i}>{i+1}</div>)}
              </div>
              <textarea 
                value={inText}
                onChange={e => setInText(e.target.value)}
                rows={inputs.length}
                className="flex-1 p-2 outline-none resize-none whitespace-pre leading-tight"
                placeholder="Kick&#10;Snare&#10;..."
                style={{ lineHeight: '1.25rem' }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="font-bold mb-2">OUTPUT ({outputs.length})</label>
            <div className="flex flex-1 border rounded-md overflow-hidden font-mono text-sm">
              <div className="bg-gray-100 text-gray-400 p-2 text-right select-none border-r">
                {Array.from({length: outputs.length}, (_, i) => <div key={i}>{i+1}</div>)}
              </div>
              <textarea 
                value={outText}
                onChange={e => setOutText(e.target.value)}
                rows={outputs.length}
                className="flex-1 p-2 outline-none resize-none whitespace-pre leading-tight"
                placeholder="Main L&#10;Main R&#10;..."
                style={{ lineHeight: '1.25rem' }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors">
            Mégse
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm">
            <Save className="w-4 h-4" /> Mentés a rácsra
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ settings, setSettings, onClose }: { settings: SettingsConfig, setSettings: (s: SettingsConfig) => void, onClose: () => void }) {
  const handleFullReset = () => {
    if (window.confirm('Are you sure you want to reset everything to factory defaults? All data and settings will be lost!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const updateFontSize = (key: keyof SettingsConfig['fontSizes'], value: number) => {
    setSettings({ ...settings, fontSizes: { ...settings.fontSizes, [key]: value } });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
          <h3 className="font-bold">Settings</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Palette */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Default Color Palette</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="palette" 
                  value="qu5" 
                  checked={settings.palette === 'qu5'} 
                  onChange={() => setSettings({ ...settings, palette: 'qu5' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">Allen & Heath Qu5 Colors</span>
              </label>
              <label className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="palette" 
                  value="sq" 
                  checked={settings.palette === 'sq'} 
                  onChange={() => setSettings({ ...settings, palette: 'sq' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="font-medium">Allen & Heath SQ Colors</span>
              </label>
            </div>
          </div>

          {/* Font Sizes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Font Size Multipliers</label>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              {[
                { key: 'number', label: 'Channel Number' },
                { key: 'name', label: 'Channel Name' },
                { key: 'tech', label: 'Tech Data' },
                { key: 'group', label: 'Group Name' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <label className="text-sm font-medium w-32">{label}</label>
                  <input 
                    type="range" 
                    min="0.5" max="2" step="0.1" 
                    value={settings.fontSizes[key as keyof SettingsConfig['fontSizes']]} 
                    onChange={(e) => updateFontSize(key as keyof SettingsConfig['fontSizes'], parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8 text-right">{settings.fontSizes[key as keyof SettingsConfig['fontSizes']].toFixed(1)}x</span>
                </div>
              ))}
            </div>
          </div>

          {/* Print Height */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Print Height (%)</label>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
              <input 
                type="range" 
                min="50" max="100" step="5" 
                value={settings.printHeight} 
                onChange={(e) => setSettings({ ...settings, printHeight: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs font-mono w-10 text-right">{settings.printHeight}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">If it doesn't fit on one page, lower this value (e.g., 90%).</p>
          </div>

          {/* Print & Display Toggles */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Appearance & Print</label>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.useEditorLookInPrint}
                  onChange={(e) => setSettings({ ...settings, useEditorLookInPrint: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium text-sm">Use editor appearance in print</div>
                  <div className="text-xs text-gray-500">The same colors and styles will appear when printing (recommended).</div>
                </div>
              </label>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Color Opacity</label>
                  <span className="text-xs font-mono">{(settings.colorOpacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" max="0.8" step="0.05" 
                  value={settings.colorOpacity} 
                  onChange={(e) => setSettings({ ...settings, colorOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Group Border Opacity</label>
                  <span className="text-xs font-mono">{(settings.groupBorderOpacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.05" 
                  value={settings.groupBorderOpacity ?? 1} 
                  onChange={(e) => setSettings({ ...settings, groupBorderOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">XLR Silhouette Opacity</label>
                  <span className="text-xs font-mono">{(settings.xlrOpacity * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="0.2" step="0.01" 
                  value={settings.xlrOpacity} 
                  onChange={(e) => setSettings({ ...settings, xlrOpacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-[10px] text-gray-500 italic">Hidden completely at 0%.</p>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="pt-4 border-t border-red-100">
            <button
              onClick={handleFullReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Full Factory Reset (Data + Settings)
            </button>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
