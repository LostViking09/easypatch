import React, { useState, useEffect, useRef } from 'react';
import { db, Project } from '../../services/db';
import { ModalBase } from '../../components/ModalBase';
import { Plus, Search, Trash2, Copy, Download, Upload, Clock, FileText, ChevronRight, X, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { defaultSettings, createEmptyInputs, createEmptyOutputs } from '../../utils/constants';
import { StorageExplanationModal } from '../../components/StorageExplanationModal';

interface DashboardModalProps {
  onClose: () => void;
  onSelectProject: (id: string) => void;
  activeProjectId?: string;
  hasCompletedTour?: boolean;
  onStartDemo?: () => void;
  onSkipTour?: () => void;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  onClose,
  onSelectProject,
  activeProjectId,
  hasCompletedTour,
  onStartDemo,
  onSkipTour
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deletingProject, setDeletingProject] = useState<{ id: string; title: string } | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects from IndexedDB
  const loadProjects = async () => {
    try {
      const allProjects = await db.projects.toArray();
      // Sort by last modified (updatedAt) desc
      allProjects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setProjects(allProjects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || 'Untitled Patch';
    const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);

    const newProject: Project = {
      id,
      title,
      notes: '',
      settings: defaultSettings,
      inputs: createEmptyInputs(24),
      outputs: createEmptyOutputs(12),
      subSnakes: [],
      updatedAt: Date.now()
    };

    try {
      await db.projects.add(newProject);
      setNewTitle('');
      setIsCreating(false);
      onSelectProject(id);
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Could not create new patch list.');
    }
  };

  const confirmDeleteProject = async () => {
    if (!deletingProject) return;
    try {
      await db.projects.delete(deletingProject.id);
      loadProjects();
      // If they deleted the active project, clear active state
      if (activeProjectId === deletingProject.id) {
        onSelectProject('');
      }
      setDeletingProject(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Could not delete patch list.');
    }
  };

  const handleDuplicateProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
    const duplicated: Project = {
      ...project,
      id: newId,
      title: `${project.title} (Copy)`,
      updatedAt: Date.now()
    };

    try {
      await db.projects.add(duplicated);
      loadProjects();
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  };

  const handleExportProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const data = {
      title: project.title,
      notes: project.notes,
      settings: project.settings,
      inputs: project.inputs,
      outputs: project.outputs,
      subSnakes: project.subSnakes,
      stageboxes: project.stageboxes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'EasyPatch'}-${new Date().toISOString().split('T')[0]}.easypatch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
        
        const importedProject: Project = {
          id,
          title: data.title || file.name.replace(/\.easypatch$|\.json$/i, ''),
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

        await db.projects.add(importedProject);
        loadProjects();
        onSelectProject(id);
        onClose();
      } catch (error) {
        alert('Invalid import file. Please select a valid EasyPatch or JSON patch file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <ModalBase onClose={onClose} maxWidthClass="max-w-xl">
        <div className="bg-slate-800 text-white px-5 py-4 flex justify-between items-center border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <FolderOpenIcon className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg">Project Manager</h3>
          </div>
          {activeProjectId && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              type="button"
              className="text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {!hasCompletedTour && onStartDemo && onSkipTour && (
          <div className="bg-blue-600 text-white p-5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-blue-700">
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-300"/> New to EasyPatch?</h3>
              <p className="text-blue-100 text-sm leading-relaxed">Let us show you around. We can load up a quick demo project and take you on a short tour of the main features.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              <button onClick={onStartDemo} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors whitespace-nowrap text-center cursor-pointer">Load Demo & Tour</button>
              <button onClick={onSkipTour} className="bg-blue-700 border border-blue-500 text-blue-100 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 transition-colors whitespace-nowrap text-center cursor-pointer">Skip Tour</button>
            </div>
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col space-y-4 max-h-[75vh] bg-slate-50 overflow-hidden">
          {/* Actions header */}
          <div className="flex gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0 animate-in fade-in"
            >
              <Plus className="w-4 h-4" /> New Patch
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm shrink-0 animate-in fade-in"
            >
              <Upload className="w-4 h-4" /> Import Patch
            </motion.button>
            
            <input
              type="file"
              accept=".easypatch,.json"
              ref={fileInputRef}
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {/* Create new form overlay / inline */}
          <AnimatePresence>
            {isCreating && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleCreateProject}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 overflow-hidden shrink-0"
              >
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Create New Patch</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. FOH Stage Box, Monitor Patch..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsCreating(false); setNewTitle(''); }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[150px]">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                const dateStr = new Date(project.updatedAt || 0).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      onSelectProject(project.id);
                      onClose();
                    }}
                    className={`group p-4 rounded-xl border bg-white flex justify-between items-center cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200 relative ${
                      isActive ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-200'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -top-2.5 left-4 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Active Patch
                      </span>
                    )}
                    <div className="flex gap-3 items-center min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${isActive ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {project.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {dateStr}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {project.inputs?.length || 24} In / {project.outputs?.length || 12} Out
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        title="Duplicate Patch"
                        onClick={(e) => handleDuplicateProject(project, e)}
                        className="p-1.5 hover:bg-slate-100 hover:text-blue-600 rounded text-slate-500 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        title="Export Patch File"
                        onClick={(e) => handleExportProject(project, e)}
                        className="p-1.5 hover:bg-slate-100 hover:text-emerald-600 rounded text-slate-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        title="Delete Patch"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingProject({ id: project.id, title: project.title });
                        }}
                        className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-slate-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-300 ml-1" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-xl">
                <FolderOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">
                  {searchQuery ? 'No matching patches found' : 'No patches saved yet'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {searchQuery ? 'Try a different search term.' : 'Create a new patch or import one to get started.'}
                </p>
              </div>
            )}
          </div>

          {/* Storage Warning Note */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/60 border border-blue-100/80 rounded-xl text-blue-800 text-xs shrink-0 animate-in fade-in duration-300">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Storage Notice:</span> Projects are saved in your browser's database. Clearing browser data will delete them. <span className="font-medium">Be sure to export important patches to back them up!</span>{' '}
              <button
                type="button"
                onClick={() => setIsExplanationOpen(true)}
                className="text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer ml-1 inline-block"
              >
                Why?
              </button>
            </div>
          </div>

          {hasCompletedTour && onStartDemo && (
            <div className="text-center pt-1 animate-in fade-in duration-500">
              <button
                type="button"
                onClick={onStartDemo}
                className="text-[11px] text-slate-400 hover:text-blue-500 hover:underline transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sparkles className="w-3 h-3 text-blue-400/80" />
                Want to see the tour again? Load Demo & Tour
              </button>
            </div>
          )}

          <div className="text-center pt-2.5 border-t border-slate-200/60 flex justify-between items-center text-[11px] text-slate-400 shrink-0">
            <span>Created by LostViking</span>
            <a
              href="https://buymeacoffee.com/lostviking09"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 hover:underline transition-colors font-medium flex items-center gap-1"
            >
              Buy me a coffee ☕
            </a>
          </div>
        </div>
      </ModalBase>

      {/* Storage Explanation Modal */}
      <AnimatePresence>
        {isExplanationOpen && (
          <StorageExplanationModal onClose={() => setIsExplanationOpen(false)} />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (In-App Modal) */}
      <AnimatePresence>
        {deletingProject && (
          <ModalBase 
            onClose={() => setDeletingProject(null)} 
            onSubmit={confirmDeleteProject} 
            zIndexClass="z-[60]"
            maxWidthClass="max-w-md"
          >
            {/* Header */}
            <div className="bg-red-700 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Trash2 className="w-5 h-5 animate-pulse" /> Delete Patch List?
              </h3>
              <button
                onClick={() => setDeletingProject(null)}
                type="button"
                className="text-red-200 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-slate-50">
              <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-800">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm leading-relaxed">
                  Permanently delete <span className="font-extrabold text-red-900 underline decoration-red-400 decoration-2 underline-offset-2">{deletingProject.title}</span>?
                </div>
              </div>
              <p className="text-xs text-slate-500">
                All input/output channels, subsnakes, and settings will be permanently lost. This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t flex justify-end gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmDeleteProject}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm transition-colors"
              >
                Yes, Delete Patch
              </motion.button>
            </div>
          </ModalBase>
        )}
      </AnimatePresence>
    </>
  );
};

// Reusable SVG icons for DashboardModal to avoid adding missing dependencies
const FolderOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
  </svg>
);
