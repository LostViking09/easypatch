import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface ModalBaseProps {
  onClose: () => void;
  onSubmit?: () => void;
  maxWidthClass?: string; // e.g. 'max-w-md', 'max-w-4xl'
  zIndexClass?: string; // e.g. 'z-50', 'z-[100]'
  children: React.ReactNode;
}

export const ModalBase: React.FC<ModalBaseProps> = ({
  onClose,
  onSubmit,
  maxWidthClass = 'max-w-md',
  zIndexClass = 'z-50',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll locking
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard events: Escape and Enter (when not focused on elements that handle them)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Top-most modal check to support nested modals correctly
      const backdrops = document.querySelectorAll('.modal-backdrop');
      if (
        backdrops.length > 0 &&
        backdrops[backdrops.length - 1] !== containerRef.current?.parentElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (onSubmit) {
          const activeEl = document.activeElement;
          const tagName = activeEl?.tagName;

          // Do not submit if focused on textarea (standard behavior for newlines)
          if (tagName === 'TEXTAREA') {
            return;
          }

          // Do not override standard browser behaviors for focused buttons/links
          if (tagName === 'BUTTON' || tagName === 'A') {
            return;
          }

          // Do not duplicate submit if already focused on a text-like input inside a form
          if (tagName === 'INPUT') {
            return;
          }

          e.preventDefault();
          onSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onSubmit]);

  // Focus management: Focus the first interactive element or the primary/first button
  useEffect(() => {
    if (containerRef.current) {
      const elementList = containerRef.current.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex="0"]'
      );
      const elements = Array.from(elementList) as HTMLElement[];

      const inputElement = elements.find(
        (el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
      );

      if (inputElement) {
        inputElement.focus();
        if (
          inputElement instanceof HTMLInputElement &&
          (inputElement.type === 'text' || inputElement.type === 'number')
        ) {
          inputElement.select();
        }
      } else if (elements.length > 0) {
        const submitBtn = elements.find(
          (el) => el instanceof HTMLButtonElement && el.type === 'submit'
        );
        if (submitBtn) {
          submitBtn.focus();
        } else {
          elements[0].focus();
        }
      }
    }
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden modal-backdrop ${zIndexClass}`}
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidthClass} max-h-full overflow-hidden flex flex-col`}
      >
        {onSubmit ? (
          <form onSubmit={handleFormSubmit} className="flex flex-col h-full w-full min-h-0">
            {children}
          </form>
        ) : (
          <div className="flex flex-col h-full w-full min-h-0">
            {children}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
