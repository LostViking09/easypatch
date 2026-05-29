import React from 'react';
import { SettingsConfig } from '../types';

interface PrintStylesProps {
  isMultiPagePrint: boolean;
  settings: SettingsConfig;
}

export const PrintStyles: React.FC<PrintStylesProps> = ({ isMultiPagePrint, settings }) => {
  return (
    <style>{`
      .grid-row-wrapper {
        display: contents;
      }
      @media print {
        body, html, #root {
          background: white !important;
          ${isMultiPagePrint
            ? `
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            `
            : `
              height: 100% !important;
              min-height: 100% !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            `
          }
        }
        
        /* Single-page side-by-side stretching rules */
        ${!isMultiPagePrint ? `
          .min-h-screen {
            height: 100% !important;
            min-height: 100% !important;
            overflow: hidden !important;
          }
          .main-content {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .main-content > main {
            flex: 1 1 0% !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .main-content > main > div {
            flex: 1 1 0% !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 0 !important;
            padding: 0 !important;
          }
        ` : `
          .min-h-screen, .main-content {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
        `}
        
        .print-grid-container {
          display: flex !important;
          max-height: none !important;
        }
        .print-grid-container.print-stacked {
          display: block !important;
          height: auto !important;
        }
        .print-grid-container.print-stacked .print-section-wrapper {
          display: block !important;
          margin-bottom: 2.5rem !important;
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        .print-grid-container.print-stacked .print-section-wrapper:nth-child(2) {
          page-break-before: always !important;
          break-before: page !important;
        }
        .print-grid-container.print-side-by-side {
          flex-direction: row !important;
          gap: 1.5rem !important;
          height: ${settings.printHeight}% !important;
          flex: 1 1 0% !important;
          min-height: 0 !important;
        }
        .print-grid-container.print-side-by-side .print-section-wrapper {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
        
        /* Print project header page-break rules */
        .print-header-wrapper {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          break-after: avoid-page !important;
        }
        
        /* Force header row to stay attached to grid */
        .print-section-wrapper > div:first-child {
          page-break-after: avoid !important;
          break-after: avoid !important;
          break-after: avoid-page !important;
        }
        
        .print-section-wrapper .grid {
          page-break-before: avoid !important;
          break-before: avoid !important;
          break-before: avoid-page !important;
        }
        
        /* When side by side, keep CSS Grid to allow perfect stretching like on editor */
        .print-side-by-side .grid {
          display: grid !important;
          height: 100% !important;
          grid-auto-rows: 1fr !important;
        }
        
        /* When stacked, use flex rows to allow perfect row stretching and no-split pagination */
        .print-stacked .grid {
          display: block !important;
          height: auto !important;
          page-break-inside: auto !important;
          background-color: transparent !important;
        }
        .print-stacked .grid-row-wrapper {
          display: flex !important;
          flex-direction: row !important;
          align-items: stretch !important;
          width: 100% !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          break-inside: avoid-page !important;
        }
        /* Each cell is styled as a flex child of the row container */
        .print-stacked .grid-row-wrapper > div {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          width: calc(100% / var(--grid-cols, 8)) !important;
          box-sizing: border-box !important;
          height: auto !important; /* Grow naturally so text is never clipped! */
          min-height: 5.5rem !important;
        }
        
        .print-subsnake-page-break {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .print-preview-container > div.print-subsnake-page-break:first-child {
          page-break-before: auto !important;
          break-before: auto !important;
        }
        
        .print-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          break-inside: avoid-page !important;
        }
      }
    `}</style>
  );
};
