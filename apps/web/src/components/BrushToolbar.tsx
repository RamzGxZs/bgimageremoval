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
    <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 sm:p-2 bg-card rounded-xl border border-border shadow-xs shrink-0">
      {/* Mode Selection */}
      <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg border border-border/50">
        <button
          type="button"
          onClick={() => onToggleBrushActive(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            !isBrushActive
              ? 'bg-background text-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
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
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
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
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Pulihkan</span>
        </button>
      </div>

      {/* Sliders */}
      {isBrushActive && (
        <div className="flex items-center gap-4 flex-1 max-w-md px-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Ukuran</span>
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
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[11px] font-mono font-medium text-foreground w-8 text-right">
              {brushConfig.size}px
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Feather</span>
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
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-[11px] font-mono font-medium text-foreground w-8 text-right">
              {Math.round(brushConfig.hardness * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8 text-foreground"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8 text-foreground"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
