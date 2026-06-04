import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X } from 'lucide-react';

interface WalkthroughShortcut {
  keys: string[];
  description: string;
}

interface ModalHelpBoxProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content: React.ReactNode;
  shortcuts?: WalkthroughShortcut[];
}

export const ModalHelpBox: React.FC<ModalHelpBoxProps> = ({
  isOpen,
  onClose,
  title = 'Help & Tips',
  content,
  shortcuts
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-blue-400 hover:text-blue-700 transition-colors p-2 -m-2"
              aria-label="Close Help"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <h4 className="font-bold text-sm text-blue-900">{title}</h4>
                <div className="text-sm text-blue-800 leading-relaxed">
                  {content}
                </div>
                {shortcuts && shortcuts.length > 0 && (
                  <div className="mt-3 bg-blue-100/50 p-3 rounded-lg border border-blue-200/50">
                    <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">Keyboard Shortcuts</h5>
                    <ul className="space-y-1.5">
                      {shortcuts.map((shortcut, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-xs text-blue-800">
                          <span className="flex gap-1">
                            {shortcut.keys.map((key, kIdx) => (
                              <kbd key={kIdx} className="px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-mono shadow-sm text-blue-900 font-bold">
                                {key}
                              </kbd>
                            ))}
                          </span>
                          <span>{shortcut.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
