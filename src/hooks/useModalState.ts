import { useState, useEffect } from 'react';
import { Channel } from '../types';

export function useModalState(projectId?: string) {
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewProjectConfirmOpen, setIsNewProjectConfirmOpen] = useState(false);
  const [isMultiGroupOpen, setIsMultiGroupOpen] = useState(false);
  const [isMultiColorOpen, setIsMultiColorOpen] = useState(false);
  const [isAssignSubSnakeOpen, setIsAssignSubSnakeOpen] = useState(false);
  const [isSubSnakesOpen, setIsSubSnakesOpen] = useState(false);
  const [isStageboxesOpen, setIsStageboxesOpen] = useState(false);
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [isDashboardOpen, setIsDashboardOpen] = useState(!projectId);

  // If active project changes or dashboard opens, keep state in sync
  useEffect(() => {
    if (!projectId) {
      setIsDashboardOpen(true);
    } else {
      setIsDashboardOpen(false);
    }
  }, [projectId]);

  const isAnyModalOpen =
    !!editingChannel ||
    isSettingsOpen ||
    isNewProjectConfirmOpen ||
    isSubSnakesOpen ||
    isAssignSubSnakeOpen ||
    isStageboxesOpen ||
    isMultiGroupOpen ||
    isMultiColorOpen ||
    isPrintModalOpen ||
    isShareModalOpen ||
    isDashboardOpen;

  return {
    editingChannel, setEditingChannel,
    isSettingsOpen, setIsSettingsOpen,
    isNewProjectConfirmOpen, setIsNewProjectConfirmOpen,
    isMultiGroupOpen, setIsMultiGroupOpen,
    isMultiColorOpen, setIsMultiColorOpen,
    isAssignSubSnakeOpen, setIsAssignSubSnakeOpen,
    isSubSnakesOpen, setIsSubSnakesOpen,
    isStageboxesOpen, setIsStageboxesOpen,
    isPrintModalOpen, setIsPrintModalOpen,
    isShareModalOpen, setIsShareModalOpen,
    isDashboardOpen, setIsDashboardOpen,
    isAnyModalOpen
  };
}
