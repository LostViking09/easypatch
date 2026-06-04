import React from 'react';
import { HelpCircle, Edit2, Unlink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Channel, SubSnake, SettingsConfig } from '../../types';
import { EditSubSnakeForm } from './EditSubSnakeForm';

interface SubSnakeListProps {
  subSnakes: SubSnake[];
  settings: SettingsConfig;
  inputs: Channel[];
  outputs: Channel[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdateSubSnake: (id: string, name: string, note?: string, color?: string, grid?: any) => void;
  onDeleteRequest: (snake: SubSnake) => void;
  onClearRequest: (snake: SubSnake) => void;
}

export const SubSnakeList: React.FC<SubSnakeListProps> = ({
  subSnakes,
  settings,
  inputs,
  outputs,
  editingId,
  setEditingId,
  onUpdateSubSnake,
  onDeleteRequest,
  onClearRequest,
}) => {
  const getMappedCount = (snakeId: string, type?: 'in' | 'out') => {
    if (type === 'in') return inputs.filter(c => c.subSnakeId === snakeId).length;
    if (type === 'out') return outputs.filter(c => c.subSnakeId === snakeId).length;
    return inputs.filter(c => c.subSnakeId === snakeId).length + outputs.filter(c => c.subSnakeId === snakeId).length;
  };

  return (
    <div className="md:w-7/12 flex flex-col flex-1">
      <h4 className="font-bold text-slate-800 text-sm tracking-wide uppercase border-b pb-2 mb-3">
        Active SubSnakes ({subSnakes.length})
      </h4>

      {subSnakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-350 text-slate-500 flex-1">
          <HelpCircle className="w-8 h-8 mb-2 text-slate-400" />
          <p className="text-sm font-medium">No SubSnakes created yet.</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[12.5rem]">Create one on the left to map physical stage boxes.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[45vh] md:max-h-none overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {subSnakes.map(snake => {
              const isEditing = editingId === snake.id;
              const inMapped = getMappedCount(snake.id, 'in');
              const outMapped = getMappedCount(snake.id, 'out');
              
              return (
                <motion.div
                  key={snake.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`p-3 border rounded-xl flex items-start justify-between gap-4 transition-all ${
                    isEditing 
                      ? 'border-indigo-500 bg-indigo-50/10 ring-2 ring-indigo-500/20 shadow-md flex-col' 
                      : 'border-slate-205 hover:border-slate-300 hover:shadow-xs bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0 w-full">
                    {isEditing ? (
                      <EditSubSnakeForm
                        snake={snake}
                        settings={settings}
                        onSave={(id, name, note, color, grid) => {
                          onUpdateSubSnake(id, name, note, color, grid);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex flex-col h-full justify-between">
                        <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                          {snake.color && snake.color !== '#ffffff' && (
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: snake.color }}
                            />
                          )}
                          <span>{snake.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xxs text-slate-500 font-medium">
                            {snake.grid ? (
                              <>
                                IN: {snake.grid.input.rows * snake.grid.input.cols > 0 ? `${snake.grid.input.cols}×${snake.grid.input.rows}` : '0'} 
                                <span className="mx-1 text-slate-300">|</span> 
                                OUT: {snake.grid.output.rows * snake.grid.output.cols > 0 ? `${snake.grid.output.cols}×${snake.grid.output.rows}` : '0'}
                              </>
                            ) : 'Dynamic (Auto-size)'}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <div className="flex gap-1.5">
                            {inMapped > 0 && <span className="text-tiny font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{inMapped} IN</span>}
                            {outMapped > 0 && <span className="text-tiny font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{outMapped} OUT</span>}
                            {inMapped === 0 && outMapped === 0 && <span className="text-tiny font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">0 mapped</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingId(snake.id)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg border border-slate-200 transition-colors"
                        title="Edit SubSnake"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      {(inMapped > 0 || outMapped > 0) && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onClearRequest(snake)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-650 rounded-lg border border-amber-200 transition-colors"
                          title="Clear Assignments"
                        >
                          <Unlink className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDeleteRequest(snake)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg border border-red-200 transition-colors"
                        title="Delete SubSnake"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
