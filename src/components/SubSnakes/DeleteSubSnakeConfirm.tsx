import React from 'react';
import { X, Trash2, Unlink, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { ModalBase } from '../ModalBase';
import { SubSnake } from '../../types';

interface DeleteSubSnakeConfirmProps {
  subSnake: SubSnake | null;
  mappedCount: number;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteSubSnakeConfirm: React.FC<DeleteSubSnakeConfirmProps> = ({ subSnake, mappedCount, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {subSnake && (
        <ModalBase
          onClose={onClose}
          onSubmit={() => onConfirm(subSnake.id)}
          maxWidthClass="max-w-md"
          zIndexClass="z-[60]"
        >
          {/* Header */}
          <div className="bg-red-700 text-white px-5 py-3.5 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
              <AlertTriangle className="w-5 h-5 text-red-100 animate-pulse" /> Delete SubSnake?
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-red-205 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-655 leading-relaxed">
              Are you sure you want to delete SubSnake <strong className="text-slate-800">"{subSnake.name}"</strong>?
            </p>
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 text-xs font-semibold leading-relaxed">
              <Trash2 className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                This action is permanent! All <strong className="text-red-900">{mappedCount}</strong> mapped stage channels will lose their subsnake assignment.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-705 hover:bg-slate-205 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </ModalBase>
      )}
    </AnimatePresence>
  );
};

interface ClearSubSnakeConfirmProps {
  subSnake: SubSnake | null;
  mappedCount: number;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ClearSubSnakeConfirm: React.FC<ClearSubSnakeConfirmProps> = ({ subSnake, mappedCount, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {subSnake && (
        <ModalBase
          onClose={onClose}
          onSubmit={() => onConfirm(subSnake.id)}
          maxWidthClass="max-w-md"
          zIndexClass="z-[60]"
        >
          {/* Header */}
          <div className="bg-amber-700 text-white px-5 py-3.5 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
              <AlertTriangle className="w-5 h-5 text-amber-100 animate-pulse" /> Clear Assignments?
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-amber-205 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-slate-655 leading-relaxed">
              Are you sure you want to clear all channel assignments for SubSnake <strong className="text-slate-800">"{subSnake.name}"</strong>?
            </p>
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs font-semibold leading-relaxed">
              <Unlink className="w-4 h-4 text-amber-655 mt-0.5 flex-shrink-0" />
              <div>
                This will clear all <strong className="text-amber-900">{mappedCount}</strong> mapped port assignments. The subsnake itself will NOT be deleted.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-705 hover:bg-slate-205 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              Clear Assignments
            </button>
          </div>
        </ModalBase>
      )}
    </AnimatePresence>
  );
};
