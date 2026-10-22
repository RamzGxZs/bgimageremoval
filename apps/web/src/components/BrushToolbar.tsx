import React from 'react';
import { Eraser, Paintbrush, Undo2, Redo2, Eye } from 'lucide-react';
import type { BrushConfig, BrushMode } from '../types';
import { Button } from './ui/button';

interface BrushToolbarProps {
  brushConfig: BrushConfig;
  onBrushConfigChange: (config: BrushConfig) => void;
  isBrushActive: boolean;
  onToggleBrushActive: (active: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const BrushToolbar: React.FC<BrushToolbarProps> = ({
  brushConfig,
  onBrushConfigChange,
  isBrushActive,
  onToggleBrushActive,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const setMode = (mode: BrushMode) => {
    onBrushConfigChange({ ...brushConfig, mode });
    if (!isBrushActive) onToggleBrushActive(true);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
      {/* Mode Selection - Larger tap targets & text */}
      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg">
        <button
          type="button"
          onClick={() => onToggleBrushActive(false)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            !isBrushActive
              ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Pratinjau</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('erase')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            isBrushActive && brushConfig.mode === 'erase'
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Eraser className="w-4 h-4" />
          <span>Hapus</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('restore')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            isBrushActive && brushConfig.mode === 'restore'
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Paintbrush className="w-4 h-4" />
          <span>Pulihkan</span>
        </button>
      </div>

      {/* Sliders - Clear text & comfortable slider tracks */}
      {isBrushActive && (
        <div className="flex items-center gap-5 flex-1 max-w-md px-2">
          <div className="flex items-center gap-2.5 flex-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">Ukuran</span>
            <input
              type="range"
              min={5}
              max={120}
              value={brushConfig.size}
              onChange={(e) =>
                onBrushConfigChange({
                  ...brushConfig,
                  size: Number(e.target.value),
                })
              }
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 w-10 text-right">
              {brushConfig.size}px
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-1">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">Feather</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={brushConfig.hardness}
              onChange={(e) =>
                onBrushConfigChange({
                  ...brushConfig,
                  hardness: Number(e.target.value),
                })
              }
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 w-10 text-right">
              {Math.round(brushConfig.hardness * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Undo / Redo */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-9 w-9 text-zinc-700 dark:text-zinc-300"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-9 w-9 text-zinc-700 dark:text-zinc-300"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
