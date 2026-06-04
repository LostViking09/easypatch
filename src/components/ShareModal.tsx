import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ModalBase } from './ModalBase';

interface ShareModalProps {
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ shareUrl, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if the browser supports native Web Share API
    if (navigator.share) {
      setCanShare(true);
    }
    // Auto-copy on mount
    handleCopy();
  }, [shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: 'EasyPatch - Shared Patch Setup',
        text: 'Check out this patch setup from EasyPatch!',
        url: shareUrl,
      });
    } catch (err) {
      // Ignore if user cancelled the share sheet
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <ModalBase onClose={onClose} maxWidthClass="max-w-md">
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-400" /> Share Project
        </h3>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          type="button"
          className="text-slate-300 hover:text-white transition-colors p-2 -m-2"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>

      <div className="p-6 flex flex-col items-center gap-6 overflow-y-auto flex-1 min-h-0">
        <p className="text-sm text-gray-600 text-center leading-relaxed">
          Anyone with this link can view and import a complete copy of your current patch configuration.
        </p>

        {/* Link Input and Copy Button */}
        <div className="w-full space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Project Share Link
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              onFocus={(e) => {
                e.target.select();
                setTimeout(() => {
                  e.target.scrollLeft = 0;
                }, 0);
              }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-slate-50 border rounded-lg text-slate-600 focus:outline-none focus:bg-white select-all border-slate-200"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCopy}
              type="button"
              className={`w-28 py-2 text-sm font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all duration-250 cursor-pointer ${
                isCopied 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-slate-800 border-slate-700/50 text-white hover:bg-slate-700'
              }`}
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Conditionally Rendered Native Share Button */}
        {canShare && (
          <div className="w-full pt-2 border-t border-slate-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNativeShare}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share via Device
            </motion.button>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end bg-slate-50">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-6 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          Close
        </motion.button>
      </div>
    </ModalBase>
  );
};
