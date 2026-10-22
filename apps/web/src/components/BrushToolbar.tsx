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
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
      {/* Mode Selection */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => onToggleBrushActive(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            !isBrushActive
              ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Pratinjau</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('erase')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            isBrushActive && brushConfig.mode === 'erase'
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('restore')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            isBrushActive && brushConfig.mode === 'restore'
              ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Pulihkan</span>
        </button>
      </div>

      {/* Sliders */}
      {isBrushActive && (
        <div className="flex items-center gap-4 flex-1 max-w-sm px-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-medium text-zinc-500 shrink-0">Ukuran</span>
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
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-[11px] font-mono text-zinc-500 w-8 text-right">
              {brushConfig.size}px
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-medium text-zinc-500 shrink-0">Feather</span>
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
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-[11px] font-mono text-zinc-500 w-8 text-right">
              {Math.round(brushConfig.hardness * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
