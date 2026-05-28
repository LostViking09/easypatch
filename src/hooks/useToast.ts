import { useState, useEffect } from 'react';

export type ToastMessage = { message: string; type: 'warning' | 'info' };

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return { toast, setToast };
}
