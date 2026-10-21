import React from 'react';
import { Eraser, Paintbrush, Undo2, Redo2, Eye } from 'lucide-react';
import type { BrushConfig, BrushMode } from '../types';

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
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Left: Mode Selection */}
      <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => onToggleBrushActive(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !isBrushActive
              ? 'bg-white dark:bg-gray-850 text-gray-900 dark:text-gray-100 shadow-2xs'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
          }`}
          title="Mode Pratinjau / Geser"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Pratinjau</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('erase')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isBrushActive && brushConfig.mode === 'erase'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
          }`}
          title="Hapus bagian yang tersisa dari latar belakang"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Hapus (Erase)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('restore')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isBrushActive && brushConfig.mode === 'restore'
              ? 'bg-emerald-500 text-white shadow-2xs'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
          }`}
          title="Pulihkan objek asli yang tidak sengaja terpotong"
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Pulihkan (Restore)</span>
        </button>
      </div>

      {/* Center: Sliders */}
      {isBrushActive && (
        <div className="flex items-center gap-4 flex-1 max-w-md px-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-medium text-gray-500 shrink-0">Ukuran</span>
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
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 w-8 text-right">
              {brushConfig.size}px
            </span>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-medium text-gray-500 shrink-0">Kelembutan</span>
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
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 w-9 text-right">
              {Math.round(brushConfig.hardness * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Right: Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
