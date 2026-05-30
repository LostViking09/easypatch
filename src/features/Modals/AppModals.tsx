import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Channel, SubSnake, SettingsConfig, UserSettings, PrintOptions, Stagebox } from '../../types';
import { PALETTES } from '../../utils/constants';

import { EditModal } from '../../components/EditModal';
import { MultiGroupModal } from '../../components/MultiGroupModal';
import { MultiColorModal } from '../../components/MultiColorModal';
import { AssignSubSnakeModal } from '../../components/AssignSubSnakeModal';
import { SubSnakesModal } from '../../components/SubSnakesModal';
import { SettingsModal } from '../../components/SettingsModal';
import { StageboxesModal } from '../../components/StageboxesModal';
import { NewProjectConfirmModal } from '../../components/NewProjectConfirmModal';
import { PrintModal } from '../../components/PrintModal';
import { ShareModal } from '../../components/ShareModal';

interface AppModalsProps {
  editingChannel: Channel | null;
  setEditingChannel: (ch: Channel | null) => void;
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  setSettings: React.Dispatch<React.SetStateAction<SettingsConfig>>;
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
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
  isStageboxesOpen: boolean;
  setIsStageboxesOpen: (val: boolean) => void;
  isNewProjectConfirmOpen: boolean;
  setIsNewProjectConfirmOpen: (val: boolean) => void;
  isPrintModalOpen: boolean;
  setIsPrintModalOpen: (val: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (val: boolean) => void;
  shareUrl: string;
  selectedIds: string[];
  
  saveEdit: (updatedChannel: Channel) => { finalInputs: Channel[], finalOutputs: Channel[] };
  handleNavigateEdit: (updatedChannel: Channel, direction: 'prev' | 'next') => void;
  handleMassAssignGroup: (group: string, colorMode: 'none' | 'uncolored' | 'all') => void;
  handleMassAssignColor: (color: string) => void;
  handleMassAssignSubSnake: (subSnakeId: string, startPort: number) => void;
  addSubSnake: (name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => SubSnake;
  updateSubSnake: (id: string, name: string, color?: string, grid?: { input: { rows: number; cols: number }; output: { rows: number; cols: number } }) => void;
  deleteSubSnake: (id: string) => void;
  clearSubSnakeAssignments: (id: string) => void;
  handleCreateNewProject: () => void;
  handleUpdateStageboxes: (newStageboxes: Stagebox[]) => void;
  stageboxes: Stagebox[];
  onConfirmPrint: (options: PrintOptions) => void;
}

export function AppModals({
  editingChannel, setEditingChannel,
  inputs, outputs,
  subSnakes, settings, setSettings,
  userSettings, setUserSettings,
  isMultiGroupOpen, setIsMultiGroupOpen,
  isMultiColorOpen, setIsMultiColorOpen,
  isAssignSubSnakeOpen, setIsAssignSubSnakeOpen,
  isSubSnakesOpen, setIsSubSnakesOpen,
  isSettingsOpen, setIsSettingsOpen,
  isStageboxesOpen, setIsStageboxesOpen,
  isNewProjectConfirmOpen, setIsNewProjectConfirmOpen,
  isPrintModalOpen, setIsPrintModalOpen,
  isShareModalOpen, setIsShareModalOpen,
  shareUrl,
  selectedIds,
  
  saveEdit, handleNavigateEdit,
  handleMassAssignGroup, handleMassAssignColor, handleMassAssignSubSnake,
  addSubSnake, updateSubSnake, deleteSubSnake, clearSubSnakeAssignments,
  handleCreateNewProject, handleUpdateStageboxes, stageboxes, onConfirmPrint
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
            userSettings={userSettings}
            onClose={() => setEditingChannel(null)}
            onSave={saveEdit}
            onNavigate={handleNavigateEdit}
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
            userSettings={userSettings}
            setUserSettings={setUserSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isStageboxesOpen && (
          <StageboxesModal
            stageboxes={stageboxes}
            onClose={() => setIsStageboxesOpen(false)}
            onUpdateStageboxes={handleUpdateStageboxes}
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
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isPrintModalOpen && (
          <PrintModal
            onClose={() => setIsPrintModalOpen(false)}
            onConfirm={onConfirmPrint}
            inputs={inputs}
            outputs={outputs}
            subSnakes={subSnakes}
            settings={settings}
            setSettings={setSettings}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isShareModalOpen && (
          <ShareModal
            shareUrl={shareUrl}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
