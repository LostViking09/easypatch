import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Network, HelpCircle, Grid, AlertTriangle, Unlink, Pipette } from 'lucide-react';
import { Channel, SubSnake, SettingsConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ModalBase } from './ModalBase';
import { ModalHelpBox } from './ModalHelpBox';
import { useWalkthrough } from '../features/Walkthrough/WalkthroughContext';
import { WALKTHROUGH_STEPS } from '../utils/walkthroughSteps';
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
  const { isActive: isTourActive, currentStepIndex } = useWalkthrough();
  const step = WALKTHROUGH_STEPS[currentStepIndex];
  const isTourPaused = isTourActive && (!step || !step.actionEvent);
  const [isHelpOpen, setIsHelpOpen] = useState(isTourPaused);

  const getMappedCount = (snakeId: string) => {
    return inputs.filter(c => c.subSnakeId === snakeId).length + outputs.filter(c => c.subSnakeId === snakeId).length;
  };

  return (
    <>
      <ModalBase onClose={onClose} maxWidthClass="max-w-4xl">
        <div data-tour="subsnakes-modal" className="max-h-[90vh] flex flex-col w-full">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg">Manage SubSnakes</h3>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={`transition-colors flex items-center gap-1.5 text-sm font-bold ${isHelpOpen ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-300'}`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Help</span>
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-slate-300 hover:text-white transition-colors p-2 -m-2"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <div className="px-6 pt-4 pb-0 -mb-2">
          <ModalHelpBox
            isOpen={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
            title="SubSnake Manager Guide"
            content={
              <>
                <p className="mb-2">Create subsnakes (like a Drum Drop or Stage Left box) here. You can then assign any channel to them using the edit modal or multi-select mode.</p>
                <p><strong>Hint:</strong> To quickly assign multiple channels to a subsnake, use the <strong>Multi-Select</strong> option on the main screen.</p>
              </>
            }
          />
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
        <div className="p-4 border-t flex justify-end gap-4 bg-slate-50">
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

