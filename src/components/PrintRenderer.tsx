import React from 'react';
import { Channel, PrintOptions, SettingsConfig, Stagebox, SubSnake } from '../types';
import { PatchGridSection } from '../features/PatchGrid/PatchGridSection';
import { TableView } from '../features/TableView/TableView';
import { SubSnakeView } from '../features/SubSnakeView/SubSnakeView';

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
      {/* Main Input Grid */}
      {printOptions.mainInput.printGrid &&
        stageboxes.map(box => {
          const boxInputs = inputs.filter(c => c.stageboxId === box.id);
          if (boxInputs.length === 0) return null;
          return (
            <div key={`print-in-${box.id}`} className="print-subsnake-page-break print-avoid-break w-full mb-8">
              <div className="print-grid-container print-stacked flex-col gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <div className="font-bold text-lg border-b border-gray-400 pb-1">{box.name} - Inputs</div>
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
          );
        })
      }

      {/* Main Output Grid */}
      {printOptions.mainOutput.printGrid &&
        stageboxes.map(box => {
          const boxOutputs = outputs.filter(c => c.stageboxId === box.id);
          if (boxOutputs.length === 0) return null;
          return (
            <div key={`print-out-${box.id}`} className="print-subsnake-page-break print-avoid-break w-full mb-8">
              <div className="print-grid-container print-stacked flex-col gap-6 w-full">
                <div className="flex flex-col gap-2 w-full">
                  <div className="font-bold text-lg border-b border-gray-400 pb-1">{box.name} - Outputs</div>
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
          );
        })
      }

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
