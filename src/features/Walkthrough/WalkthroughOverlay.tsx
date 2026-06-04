import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WALKTHROUGH_STEPS } from '../../utils/walkthroughSteps';
import { useWalkthrough } from './WalkthroughContext';
import { WalkthroughTooltip } from './WalkthroughTooltip';
import { ModalBase } from '../../components/ModalBase';
import { AlertCircle, LogOut } from 'lucide-react';

export const WalkthroughOverlay: React.FC = () => {
  const { isActive, currentStepIndex, isModalOpen, showSkipConfirm, cancelSkipTour, skipTour } = useWalkthrough();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      return;
    }

    const step = WALKTHROUGH_STEPS[currentStepIndex];
    if (!step) return;

    const updateRect = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const blockPos = rect.height > window.innerHeight ? 'start' : 'center';
        el.scrollIntoView({ behavior: 'smooth', block: blockPos });
        
        // Set an immediate rect
        setTargetRect(el.getBoundingClientRect());
        
        // short timeout to let scroll finish before grabbing final rect
        setTimeout(() => {
          setTargetRect(el.getBoundingClientRect());
        }, 300);
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    
    // Fallback polling in case the element moves or mounts late
    const interval = setInterval(() => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(prev => {
          if (!prev || prev.top !== rect.top || prev.left !== rect.left || prev.width !== rect.width || prev.height !== rect.height) {
            return rect;
          }
          return prev;
        });
      }
    }, 500);

    return () => {
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [isActive, currentStepIndex]);
  const step = WALKTHROUGH_STEPS[currentStepIndex];
  const isHiddenByModal = isModalOpen && (!step || !step.actionEvent);

  return (
    <>
      <AnimatePresence>
        {isActive && step && (
          <motion.div 
            key="overlay"
            className={`fixed inset-0 pointer-events-none ${isHiddenByModal ? 'z-40' : 'z-[9998]'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
              <defs>
                <mask id="walkthrough-hole">
                  <rect width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <motion.rect
                      fill="black"
                      rx={8}
                      initial={false}
                      animate={{ 
                        x: targetRect.left - 4, 
                        y: targetRect.top - 4, 
                        width: targetRect.width + 8, 
                        height: targetRect.height + 8 
                      }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(15, 23, 42, 0.6)" mask="url(#walkthrough-hole)" />
            </svg>

            {targetRect && !isHiddenByModal && (
              <WalkthroughTooltip step={step} targetRect={targetRect} totalSteps={WALKTHROUGH_STEPS.length} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isActive && step && isHiddenByModal && (
          <motion.div
            key="paused-pill"
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 pointer-events-auto border border-indigo-500"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <AlertCircle className="w-4 h-4" />
            Tour Paused: Close the window to continue
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSkipConfirm && (
          <ModalBase 
            onClose={cancelSkipTour} 
            zIndexClass="z-[10000]" 
            maxWidthClass="max-w-md"
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">End Tour?</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to exit the walkthrough? If you change your mind, you can always restart it later from the <strong>Project Manager</strong>.
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={cancelSkipTour}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Continue Tour
                </button>
                <button
                  onClick={skipTour}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Yes, End Tour
                </button>
              </div>
            </div>
          </ModalBase>
        )}
      </AnimatePresence>
    </>
  );
};
