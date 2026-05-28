import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Channel } from '../../types';
import { PALETTES } from '../../utils/constants';

import { EditModal } from '../../components/EditModal';
import { FastInputModal } from '../../components/FastInputModal';
import { MultiGroupModal } from '../../components/MultiGroupModal';
import { MultiColorModal } from '../../components/MultiColorModal';
import { AssignSubSnakeModal } from '../../components/AssignSubSnakeModal';
import { SubSnakesModal } from '../../components/SubSnakesModal';
import { SettingsModal } from '../../components/SettingsModal';
import { NewProjectConfirmModal } from '../../components/NewProjectConfirmModal';
import { ResizeGridModal } from '../../components/ResizeGridModal';

interface AppModalsProps {
  editingChannel: Channel | null;
  setEditingChannel: (ch: Channel | null) => void;
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: any[];
  settings: any;
  setSettings: (val: any) => void;
  isFastInputOpen: boolean;
  setIsFastInputOpen: (val: boolean) => void;
  isMultiGroupOpen: boolean;
  setIsMultiGroupOpen: (val: boolean) => void;
  isMultiColorOpen: boolean;
  setIsMultiColorOpen: (val: boolean) => void;
  isAssignSubSnakeOpen: boolean;
  setIsAssignSubSnakeOpen: (val: boolean) => void;
  isSubSnakesOpen: boolean;
  setIsSubSnakesOpen: (val: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (val: boolean) => void;
  isNewProjectConfirmOpen: boolean;
  setIsNewProjectConfirmOpen: (val: boolean) => void;
  isResizeGridOpen: boolean;
  setIsResizeGridOpen: (val: boolean) => void;
  selectedIds: string[];
  
  saveEdit: (updatedChannel: Channel) => { finalInputs: Channel[], finalOutputs: Channel[] };
  handleNavigateEdit: (updatedChannel: Channel, direction: 'prev' | 'next') => void;
  saveFastInput: (ins: Channel[], outs: Channel[]) => void;
  handleMassAssignGroup: (group: string, colorMode: 'none' | 'uncolored' | 'all') => void;
  handleMassAssignColor: (color: string) => void;
  handleMassAssignSubSnake: (subSnakeId: string, startPort: number) => void;
  addSubSnake: (s: any) => void;
  updateSubSnake: (s: any) => void;
  deleteSubSnake: (id: string) => void;
  clearSubSnakeAssignments: (id: string) => void;
  handleCreateNewProject: () => void;
  handleResizeGrid: (g: any) => void;
}

export function AppModals({
  editingChannel, setEditingChannel,
  inputs, outputs,
  subSnakes, settings, setSettings,
  isFastInputOpen, setIsFastInputOpen,
  isMultiGroupOpen, setIsMultiGroupOpen,
  isMultiColorOpen, setIsMultiColorOpen,
  isAssignSubSnakeOpen, setIsAssignSubSnakeOpen,
  isSubSnakesOpen, setIsSubSnakesOpen,
  isSettingsOpen, setIsSettingsOpen,
  isNewProjectConfirmOpen, setIsNewProjectConfirmOpen,
  isResizeGridOpen, setIsResizeGridOpen,
  selectedIds,
  
  saveEdit, handleNavigateEdit, saveFastInput,
  handleMassAssignGroup, handleMassAssignColor, handleMassAssignSubSnake,
  addSubSnake, updateSubSnake, deleteSubSnake, clearSubSnakeAssignments,
  handleCreateNewProject, handleResizeGrid
}: AppModalsProps) {
  return (
    <>
      <AnimatePresence>
        {editingChannel && (
          <EditModal
            key={editingChannel.id}
            channel={editingChannel}
            allChannels={[...inputs, ...outputs]}
            subSnakes={subSnakes}
            settings={settings}
            onClose={() => setEditingChannel(null)}
            onSave={saveEdit}
            onNavigate={handleNavigateEdit}
          />
        )}
      </AnimatePresence>
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
            onClearSubSnakeAssignments={clearSubSnakeAssignments}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            setSettings={setSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
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
    </>
  );
}
