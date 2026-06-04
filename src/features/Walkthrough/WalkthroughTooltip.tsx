import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WalkthroughStep } from '../../utils/walkthroughSteps';
import { useWalkthrough } from './WalkthroughContext';
import { X, ChevronRight, Check, List, LayoutGrid, AlertCircle, Info } from 'lucide-react';

const renderActionLabel = (text: string) => {
  const parts = text.split(/(\[[a-zA-Z0-9\s]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const type = part.slice(1, -1).toLowerCase();
      if (type === 'list' || type === 'table') {
        return (
          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800 shadow-2xs mx-0.5 align-middle">
            <List className="w-3 h-3 text-slate-500" />
            <span>Table</span>
          </span>
        );
      }
      if (type === 'grid') {
        return (
          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-800 shadow-2xs mx-0.5 align-middle">
            <LayoutGrid className="w-3 h-3 text-slate-500" />
            <span>Grid</span>
          </span>
        );
      }
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

interface TooltipProps {
  step: WalkthroughStep;
  targetRect: DOMRect | null;
  totalSteps: number;
}

export const WalkthroughTooltip: React.FC<TooltipProps> = ({ step, targetRect, totalSteps }) => {
  const { currentStepIndex, nextStep, skipTour, requestSkipTour, isModalOpen } = useWalkthrough();
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [tooltipHeight, setTooltipHeight] = React.useState(250);

  React.useEffect(() => {
    const measure = () => {
      if (tooltipRef.current) {
        setTooltipHeight(tooltipRef.current.offsetHeight);
      }
    };
    
    measure();
    
    if (tooltipRef.current && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(tooltipRef.current);
      return () => observer.disconnect();
    }
  }, [step]);

  if (!targetRect) return null;

  const isLastStep = currentStepIndex === totalSteps - 1;

  // Calculate position based on placement
  let top = 0;
  let left = 0;
  
  const tooltipWidth = 320;
  const margin = 16;

  switch (step.placement) {
    case 'bottom':
      top = targetRect.bottom + margin;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      break;
    case 'top':
      top = targetRect.top - margin - tooltipHeight;
      left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
      break;
    case 'left':
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.left - tooltipWidth - margin;
      break;
    case 'right':
      top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
      left = targetRect.right + margin;
      break;
    case 'center':
    default:
      top = window.innerHeight / 2 - (tooltipHeight / 2);
      left = window.innerWidth / 2 - (tooltipWidth / 2);
      break;
  }

  // Keep within bounds
  if (left < margin) left = margin;
  if (left + tooltipWidth > window.innerWidth - margin) {
    left = window.innerWidth - tooltipWidth - margin;
  }
  
  // Prevent top/bottom clipping & handle flipping
  if (top < margin) {
    if (step.placement === 'top') {
      top = targetRect.bottom + margin; // Flip to bottom
    } else {
      top = margin;
    }
  }
  
  if (top + tooltipHeight > window.innerHeight - margin) {
    if (step.placement === 'bottom') {
      top = targetRect.top - margin - tooltipHeight; // Flip to top
    } else {
      top = window.innerHeight - tooltipHeight - margin;
    }
  }

  // Ensure it doesn't get pushed off the top even after flipping
  if (top < margin) top = margin;

  return (
    <motion.div
      ref={tooltipRef}
      className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-100 p-5 w-[320px] pointer-events-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, top, left }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        top: { type: 'spring', damping: 25, stiffness: 300 },
        left: { type: 'spring', damping: 25, stiffness: 300 },
        opacity: { duration: 0.2 }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 text-lg">{step.title}</h3>
        <button onClick={requestSkipTour} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
        {step.content}
      </p>

      {step.actionLabel && (
        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2.5 shadow-sm animate-in zoom-in-95 duration-250">
          <div className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </div>
          <div className="text-xs text-blue-950 leading-normal">
            <span className="font-bold uppercase tracking-wider text-[9px] text-blue-500 block mb-0.5">Action Required</span>
            <span className="font-medium">{renderActionLabel(step.actionLabel)}</span>
          </div>
        </div>
      )}

      {step.shortcuts && step.shortcuts.length > 0 && (
        <div className="mb-6 bg-slate-50/80 p-3 rounded-lg border border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shortcuts</h4>
          <ul className="space-y-2">
            {step.shortcuts.map((sc, i) => (
              <li key={i} className="flex items-center justify-between text-xs text-slate-600">
                <span className="text-slate-500 opacity-90">{sc.description}</span>
                <span className="flex items-center gap-1">
                  {sc.keys.map((k, ki) => (
                    <React.Fragment key={ki}>
                      <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold shadow-sm text-slate-700">{k}</kbd>
                      {ki < sc.keys.length - 1 && <span className="text-slate-300 text-[10px]">+</span>}
                    </React.Fragment>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step.exploreOption && (
        <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2.5 shadow-sm text-indigo-900 text-xs italic">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <span>{step.exploreOption}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>
        
        <div className="flex gap-2">
          <button 
            onClick={requestSkipTour}
            className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Skip
          </button>
          
          {step.actionEvent ? (
            <button
              disabled
              className="flex items-center gap-1 bg-slate-200 text-slate-400 px-4 py-1.5 rounded-lg text-sm font-semibold cursor-not-allowed shadow-sm"
            >
              <>Next <ChevronRight className="w-4 h-4" /></>
            </button>
          ) : (
            <button
              onClick={isLastStep ? skipTour : nextStep}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              {isLastStep ? (
                <>Done <Check className="w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
