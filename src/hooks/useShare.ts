import { useState, useEffect } from 'react';
import { compressData, decompressData } from '../utils/urlSharing';
import { Channel, SettingsConfig, SubSnake } from '../types';

export const getCleanPathname = () => {
  let path = window.location.pathname;
  if (path.includes('http://') || path.includes('https://')) {
    const idx = path.indexOf('http://') !== -1 ? path.indexOf('http://') : path.indexOf('https://');
    const absoluteUrl = path.substring(idx);
    try {
      path = new URL(absoluteUrl).pathname;
    } catch (e) {
      path = '/easypatch/';
    }
  }
  return path;
};

interface UseShareProps {
  id?: string;
  title: string;
  notes: string;
  settings: SettingsConfig;
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  stageboxes: import('../types').Stagebox[];
  setToast: (toast: any) => void;
  setIsShareModalOpen: (val: boolean) => void;
}

export function useShare({
  id,
  title,
  notes,
  settings,
  inputs,
  outputs,
  subSnakes,
  stageboxes,
  setToast,
  setIsShareModalOpen
}: UseShareProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [sharedPatchData, setSharedPatchData] = useState<any>(null);

  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#import=')) {
        try {
          const base64Data = hash.replace('#import=', '');
          const data = await decompressData(base64Data);
          if (data && (data.inputs || data.outputs || data.settings)) {
            setSharedPatchData(data);
          } else {
            throw new Error('Invalid patch data format');
          }
        } catch (e) {
          console.error('Failed to import shared patch:', e);
          setToast({ message: 'Invalid or corrupted shared link.', type: 'error' });
        } finally {
          const cleanPath = getCleanPathname();
          window.history.replaceState(null, '', cleanPath + window.location.search);
        }
      }
    };
    handleHash();
  }, [setToast]);

  const handleShare = async () => {
    if (!id) return;
    try {
      const data = { title, notes, settings, inputs, outputs, subSnakes, stageboxes };
      const base64 = await compressData(data);
      const cleanPath = getCleanPathname();
      const url = `${window.location.origin}${cleanPath}#import=${base64}`;
      setShareUrl(url);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to generate share link. Your browser may not support compression.', type: 'error' });
    }
  };

  return {
    shareUrl,
    sharedPatchData,
    setSharedPatchData,
    handleShare
  };
}
