import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Network, HelpCircle, Grid, AlertTriangle, Unlink, Pipette } from 'lucide-react';
import { Channel, SubSnake, SettingsConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ModalBase } from './ModalBase';
import { CreateSubSnakeForm } from './SubSnakes/CreateSubSnakeForm';
import { SubSnakeList } from './SubSnakes/SubSnakeList';
import { DeleteSubSnakeConfirm, ClearSubSnakeConfirm } from './SubSnakes/DeleteSubSnakeConfirm';

interface SubSnakesModalProps {
  subSnakes: SubSnake[];
  inputs: Channel[];
  outputs: Channel[];
  settings: SettingsConfig;
  onClose: () => void;
  onAddSubSnake: (name: string, note?: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
  onUpdateSubSnake: (id: string, name: string, note?: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
  onDeleteSubSnake: (id: string) => void;
  onClearSubSnakeAssignments: (id: string) => void;
}

export const SubSnakesModal: React.FC<SubSnakesModalProps> = ({
  subSnakes,
  inputs,
  outputs,
  settings,
  onClose,
  onAddSubSnake,
  onUpdateSubSnake,
  onDeleteSubSnake,
  onClearSubSnakeAssignments,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subSnakeToDelete, setSubSnakeToDelete] = useState<SubSnake | null>(null);
  const [subSnakeToClear, setSubSnakeToClear] = useState<SubSnake | null>(null);

  const getMappedCount = (snakeId: string) => {
    return inputs.filter(c => c.subSnakeId === snakeId).length + outputs.filter(c => c.subSnakeId === snakeId).length;
  };

  return (
    <>
      <ModalBase onClose={onClose} maxWidthClass="max-w-4xl">
        <div className="max-h-[90vh] flex flex-col w-full">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Manage SubSnakes</h3>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 flex flex-col md:flex-row gap-6">
          <CreateSubSnakeForm
            settings={settings}
            onAddSubSnake={onAddSubSnake}
          />
          <SubSnakeList
            subSnakes={subSnakes}
            settings={settings}
            inputs={inputs}
            outputs={outputs}
            editingId={editingId}
            setEditingId={setEditingId}
            onUpdateSubSnake={onUpdateSubSnake}
            onDeleteRequest={setSubSnakeToDelete}
            onClearRequest={setSubSnakeToClear}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
          <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
            <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>
              <strong>Hint:</strong> To quickly assign multiple channels to a subsnake, use the <strong>Multi-Select</strong> option, on the main screen.
            </span>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm self-end sm:self-auto"
          >
          Close
        </motion.button>
      </div>
        </div>
      </ModalBase>      {/* Delete Confirmation In-App Modal */}
      <DeleteSubSnakeConfirm
        subSnake={subSnakeToDelete}
        mappedCount={subSnakeToDelete ? getMappedCount(subSnakeToDelete.id) : 0}
        onClose={() => setSubSnakeToDelete(null)}
        onConfirm={(id) => {
          onDeleteSubSnake(id);
          setSubSnakeToDelete(null);
        }}
      />

      {/* Clear Assignments Confirmation In-App Modal */}
      <ClearSubSnakeConfirm
        subSnake={subSnakeToClear}
        mappedCount={subSnakeToClear ? getMappedCount(subSnakeToClear.id) : 0}
        onClose={() => setSubSnakeToClear(null)}
        onConfirm={(id) => {
          onClearSubSnakeAssignments(id);
          setSubSnakeToClear(null);
        }}
      />
    </>
  );
};

