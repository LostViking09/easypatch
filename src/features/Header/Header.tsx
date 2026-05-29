import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, File, ChevronDown, Plus, Upload, Download, ListOrdered, CheckSquare, Grid, Network, Palette, Printer, Share2 } from 'lucide-react';

interface HeaderProps {
  handleExport: () => void;
  handleShare: () => void;
  loadImportData: (data: any) => void;
  setIsNewProjectConfirmOpen: (val: boolean) => void;
  setIsFastInputOpen: (val: boolean) => void;
  isMultiEdit: boolean;
  setIsMultiEdit: (val: boolean) => void;
  setSelectedIds: (val: string[]) => void;
  setIsResizeGridOpen: (val: boolean) => void;
  setIsSubSnakesOpen: (val: boolean) => void;
  setIsSettingsOpen: (val: boolean) => void;
  setIsPrintModalOpen: (val: boolean) => void;
}

export function Header({
  handleExport,
  handleShare,
  loadImportData,
  setIsNewProjectConfirmOpen,
  setIsFastInputOpen,
  isMultiEdit,
  setIsMultiEdit,
  setSelectedIds,
  setIsResizeGridOpen,
  setIsSubSnakesOpen,
  setIsSettingsOpen,
  setIsPrintModalOpen
}: HeaderProps) {
  const [isFileDropdownOpen, setIsFileDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside File Dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileDropdownRef.current && !fileDropdownRef.current.contains(event.target as Node)) {
        setIsFileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  return (
    <header className="bg-slate-900 text-white p-4 shadow-md print:hidden flex flex-col xl:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-blue-400" />
        <h1 className="text-xl font-bold tracking-wide">EasyPatch</h1>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* File Dropdown */}
        <div className="relative" ref={fileDropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFileDropdownOpen(!isFileDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              isFileDropdownOpen
                ? 'bg-slate-700 border-slate-650 text-white'
                : 'bg-slate-800 border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700'
            }`}
          >
            <File className="w-4 h-4 text-slate-400" /> File <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </motion.button>

          <AnimatePresence>
            {isFileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-1.5 w-44 bg-slate-900 border border-slate-850 rounded-lg shadow-xl py-1 z-50"
              >
                <button
                  onClick={() => {
                    setIsNewProjectConfirmOpen(true);
                    setIsFileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsFileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Import
                </button>
                <button
                  onClick={() => {
                    handleExport();
                    setIsFileDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Share Link Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Share2 className="w-4 h-4 text-slate-400" />
          <span>Share Link</span>
        </motion.button>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-slate-800 self-center mx-1.5 hidden sm:block"></div>

        <input
          type="file"
          accept=".easypatch,.json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />

        {/* Fast Input */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFastInputOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ListOrdered className="w-4 h-4" /> Fast Input
        </motion.button>

        {/* Multi-Select */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsMultiEdit(!isMultiEdit);
            if (isMultiEdit) setSelectedIds([]);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium border transition-all duration-200 ${
            isMultiEdit
              ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-lg shadow-blue-500/10'
              : 'bg-slate-800 border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Multi-Select
        </motion.button>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-slate-800 self-center mx-1.5 hidden sm:block"></div>

        {/* Resize Grid */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsResizeGridOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
          title="Resize Grid"
        >
          <Grid className="w-4 h-4" /> Resize Grid
        </motion.button>

        {/* SubSnakes */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSubSnakesOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
          title="Manage SubSnakes"
        >
          <Network className="w-4 h-4" /> SubSnakes
        </motion.button>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-slate-800 self-center mx-1.5 hidden sm:block"></div>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Palette className="w-4 h-4" /> Settings
        </motion.button>

        {/* Print */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsPrintModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print
        </motion.button>
      </div>
    </header>
  );
}
