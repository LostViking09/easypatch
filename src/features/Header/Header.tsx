import React from 'react';
import { motion } from 'motion/react';
import { Settings, FolderOpen, CheckSquare, Network, Palette, Printer, Share2, Layers } from 'lucide-react';

interface HeaderProps {
  handleShare: () => void;
  isMultiEdit: boolean;
  setIsMultiEdit: (val: boolean) => void;
  setSelectedIds: (val: string[]) => void;
  setIsSubSnakesOpen: (val: boolean) => void;
  setIsStageboxesOpen: (val: boolean) => void;
  setIsSettingsOpen: (val: boolean) => void;
  setIsPrintModalOpen: (val: boolean) => void;
  onOpenDashboard: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export function Header({
  handleShare,
  isMultiEdit,
  setIsMultiEdit,
  setSelectedIds,
  setIsSubSnakesOpen,
  setIsStageboxesOpen,
  setIsSettingsOpen,
  setIsPrintModalOpen,
  onOpenDashboard,
  saveStatus
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white p-4 shadow-md print:hidden flex flex-col xl:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3.5 flex-wrap">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-wide cursor-pointer hover:text-blue-300 transition-colors" onClick={onOpenDashboard}>EasyPatch</h1>
        </div>

        {saveStatus && saveStatus !== 'idle' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-800/80 border border-slate-700/50 transition-all duration-300">
            {saveStatus === 'saving' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-slate-400">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-400">Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="text-rose-400 font-semibold">Save failed</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Projects Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <FolderOpen className="w-4 h-4 text-slate-400" />
          <span>Projects</span>
        </motion.button>

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


        {/* Stageboxes */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsStageboxesOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
          title="Stagebox Setup"
        >
          <Layers className="w-4 h-4" /> Stagebox Setup
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
