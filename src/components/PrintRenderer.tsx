import React from 'react';
import { Channel, PrintOptions, SettingsConfig, Stagebox, SubSnake } from '../types';
import { PatchGridSection } from '../features/PatchGrid/PatchGridSection';
import { TableView } from '../features/TableView/TableView';
import { SubSnakeView } from '../features/SubSnakeView/SubSnakeView';
import { PrintPageHeader } from './PrintPageHeader';

interface PrintRendererProps {
  printOptions: PrintOptions;
  stageboxes: Stagebox[];
  inputs: Channel[];
  outputs: Channel[];
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  title: string;
  notes: string;
}

export const PrintRenderer: React.FC<PrintRendererProps> = ({
  printOptions,
  stageboxes,
  inputs,
  outputs,
  subSnakes,
  settings,
  title,
  notes
}) => {
  return (
    <div className="hidden print:flex flex-col w-full print-preview-container">
      {/* Main Grid Views grouped by Stagebox */}
      {stageboxes.map(box => {
        const boxInputs = inputs.filter(c => c.stageboxId === box.id);
        const boxOutputs = outputs.filter(c => c.stageboxId === box.id);
        const hasInputs = printOptions.mainInput.printGrid && boxInputs.length > 0;
        const hasOutputs = printOptions.mainOutput.printGrid && boxOutputs.length > 0;

        if (!hasInputs && !hasOutputs) return null;

        return (
          <div key={`print-stagebox-${box.id}`} className="print-subsnake-page-break w-full mb-8">
            <PrintPageHeader projectTitle={title} projectNotes={notes} />
            <div className="flex flex-col gap-8 w-full mt-2">
              {hasInputs && (
                <div className="print-avoid-break w-full">
                  <div className="print-grid-container print-stacked flex-col gap-6 w-full">
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-250">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-lg text-slate-850 tracking-tight">{box.name} - Inputs</h4>
                          <span className="text-xs text-slate-555 font-semibold hidden sm:inline">
                            ({box.grid.input.cols * box.grid.input.rows} in)
                          </span>
                        </div>
                        <div className="flex gap-1.5 print:hidden">
                          <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {boxInputs.filter(c => c.name.trim() !== '').length} IN Mapped
                          </span>
                        </div>
                      </div>
                      {box.note && (
                        <div className="text-sm italic text-slate-500 mb-2 print:mb-1 -mt-2 print:-mt-1">
                          {box.note}
                        </div>
                      )}
                      <PatchGridSection
                        channels={boxInputs}
                        type="INPUT"
                        cols={box.grid.input.cols}
                        flexClass=""
                        settings={settings}
                        subSnakes={subSnakes}
                        selectedIds={[]}
                        isMultiEdit={false}
                        onCellClick={() => {}}
                        onCellDrop={() => {}}
                        onCellMouseDown={() => {}}
                        onCellMouseEnter={() => {}}
                      />
                    </div>
                  </div>
                </div>
              )}

              {hasOutputs && (
                <div className="print-avoid-break w-full">
                  <div className="print-grid-container print-stacked flex-col gap-6 w-full">
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <div className="flex items-center justify-between border-b pb-2 border-slate-250">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-lg text-slate-850 tracking-tight">{box.name} - Outputs</h4>
                          <span className="text-xs text-slate-555 font-semibold hidden sm:inline">
                            ({box.grid.output.cols * box.grid.output.rows} out)
                          </span>
                        </div>
                        <div className="flex gap-1.5 print:hidden">
                          <span className="text-xxs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {boxOutputs.filter(c => c.name.trim() !== '').length} OUT Mapped
                          </span>
                        </div>
                      </div>
                      {box.note && !hasInputs && (
                        <div className="text-sm italic text-slate-500 mb-2 print:mb-1 -mt-2 print:-mt-1">
                          {box.note}
                        </div>
                      )}
                      <PatchGridSection
                        channels={boxOutputs}
                        type="OUTPUT"
                        cols={box.grid.output.cols}
                        flexClass=""
                        settings={settings}
                        subSnakes={subSnakes}
                        selectedIds={[]}
                        isMultiEdit={false}
                        onCellClick={() => {}}
                        onCellDrop={() => {}}
                        onCellMouseDown={() => {}}
                        onCellMouseEnter={() => {}}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Main Input Table */}
      {printOptions.mainInput.printTable && (
        <div className="print-subsnake-page-break w-full max-w-7xl mx-auto">
          <TableView
            inputs={inputs}
            outputs={[]}
            subSnakes={subSnakes}
            stageboxes={stageboxes}
            settings={settings}
            projectTitle={title}
            projectNotes={notes}
          />
        </div>
      )}

      {/* Main Output Table */}
      {printOptions.mainOutput.printTable && (
        <div className="print-subsnake-page-break w-full max-w-7xl mx-auto">
          <TableView
            inputs={[]}
            outputs={outputs}
            subSnakes={subSnakes}
            stageboxes={stageboxes}
            settings={settings}
            projectTitle={title}
            projectNotes={notes}
          />
        </div>
      )}

      {/* SubSnakes */}
      {subSnakes.map(snake => {
        const options = printOptions.subSnakes[snake.id];
        if (!options) return null;

        return (
          <React.Fragment key={snake.id}>
            {options.printGrid && (
              <div className="print-subsnake-page-break">
                <SubSnakeView
                  subSnakes={[snake]}
                  inputs={inputs}
                  outputs={outputs}
                  settings={settings}
                  selectedSubSnakeId={snake.id}
                  stageboxes={stageboxes}
                  isPrintMode={true}
                  projectTitle={title}
                  projectNotes={notes}
                  layoutMode="grid"
                />
              </div>
            )}
            {options.printTable && (
              <div className="print-subsnake-page-break">
                <SubSnakeView
                  subSnakes={[snake]}
                  inputs={inputs}
                  outputs={outputs}
                  settings={settings}
                  selectedSubSnakeId={snake.id}
                  stageboxes={stageboxes}
                  isPrintMode={true}
                  projectTitle={title}
                  projectNotes={notes}
                  layoutMode="table"
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
