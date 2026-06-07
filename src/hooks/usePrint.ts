import { useState, useEffect } from 'react';
import { PrintOptions } from '../types';

interface UsePrintProps {
  setIsPrintModalOpen: (val: boolean) => void;
}

export function usePrint({ setIsPrintModalOpen }: UsePrintProps) {
  const [printOptions, setPrintOptions] = useState<PrintOptions | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printTrigger, setPrintTrigger] = useState(false);

  useEffect(() => {
    if (printTrigger) {
      const timer = setTimeout(() => {
        window.print();
        setPrintTrigger(false);
        setIsPrinting(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [printTrigger]);

  const handleConfirmPrint = (options: PrintOptions) => {
    setPrintOptions(options);
    setIsPrintModalOpen(false);
    setIsPrinting(true);
    setPrintTrigger(true);
  };

  return {
    printOptions,
    isPrinting,
    handleConfirmPrint
  };
}
