import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalkthroughContextProps {
  isActive: boolean;
  currentStepIndex: number;
  hasCompletedTour: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  requestSkipTour: () => void;
  cancelSkipTour: () => void;
  showSkipConfirm: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
}

const WalkthroughContext = createContext<WalkthroughContextProps | undefined>(undefined);

export const WalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('easypatch_tour_completed');
    if (completed === 'true') {
      setHasCompletedTour(true);
    }
  }, []);

  const startTour = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    setCurrentStepIndex(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
  };

  const requestSkipTour = () => setShowSkipConfirm(true);
  const cancelSkipTour = () => setShowSkipConfirm(false);

  const skipTour = () => {
    setShowSkipConfirm(false);
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem('easypatch_tour_completed', 'true');
  };

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        currentStepIndex,
        hasCompletedTour,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        requestSkipTour,
        cancelSkipTour,
        showSkipConfirm,
        isModalOpen,
        setIsModalOpen
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useWalkthrough = () => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};
