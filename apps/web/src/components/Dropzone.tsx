import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, AlertCircle, Zap, Cpu, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import type { ModelType, ProcessProgress } from '../types';

interface DropzoneProps {
  onImageSelected: (file: Blob, filename?: string) => void;
  isProcessing: boolean;
  progress?: ProcessProgress;
  selectedModel?: ModelType;
  onModelChange?: (model: ModelType) => void;
  autoResize?: boolean;
  onAutoResizeChange?: (enabled: boolean) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onImageSelected,
  isProcessing,
  progress,
  selectedModel = 'bria-rmbg-1.4',
  onModelChange,
  autoResize = true,
  onAutoResizeChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: Blob, name?: string) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validTypes.includes(file.type) && !name?.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setErrorMessage('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Ukuran gambar maksimal 25 MB.');
      return;
    }

    onImageSelected(file, name || (file as File).name || 'image.png');
  };

  // Global clipboard paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isProcessing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            validateAndSelect(file, 'pasted-image.png');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isProcessing, onImageSelected]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSelect(file, file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSelect(file, file.name);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3.5">
      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative min-h-[220px] sm:min-h-[250px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 sm:p-8 text-center select-none
          ${
            isProcessing
              ? 'border-border bg-muted/40 cursor-default'
              : isDragOver
              ? 'border-primary bg-accent/60 cursor-pointer scale-[1.01]'
              : 'border-border bg-card hover:border-muted-foreground/40 hover:bg-accent/30 cursor-pointer shadow-xs hover:shadow-md'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          // In-place loading state with progress bar
          <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-md animate-in fade-in duration-200">
            <Loader2 className="w-9 h-9 text-primary animate-spin" />

            <div className="space-y-1 w-full text-center">
              <p className="text-base font-semibold text-foreground">
                {progress?.stage === 'downloading'
                  ? 'Menyiapkan Model AI Offline...'
                  : 'Memotong Latar Belakang...'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {progress?.message || 'Memproses segmentasi AI...'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full space-y-1.5">
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, progress?.percent || 0)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Model: BRIA RMBG-1.4 (Offline)</span>
                <span className="font-mono font-medium text-foreground">
                  {progress?.percent || 0}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Default upload prompt
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full border border-border bg-secondary flex items-center justify-center text-foreground shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold text-foreground">
                Pilih gambar atau tarik ke sini
              </p>
              <p className="text-xs text-muted-foreground">
                Format PNG, JPG, atau WebP hingga 25 MB
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-border bg-secondary/50 text-xs text-muted-foreground">
              <span>atau tekan</span>
              <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[11px] font-semibold text-foreground shadow-2xs">
                Ctrl+V
              </kbd>
              <span>untuk paste</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Model Controls & Offline Information */}
      <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-muted-foreground">
              100% Offline AI — BRIA RMBG-1.4 SOTA
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showSettings ? 'Tutup Pengaturan' : 'Opsi AI'}</span>
          </button>
        </div>

        {/* Collapsible AI settings */}
        {showSettings && (
          <div className="pt-2.5 border-t border-border space-y-2.5 animate-in fade-in-50 duration-150">
            {/* Model Mode Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Mode Akselerasi Perangkat:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onModelChange?.('bria-rmbg-1.4')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                    selectedModel === 'bria-rmbg-1.4' || selectedModel === 'bria-rmbg-webgpu'
                      ? 'border-primary bg-background font-medium shadow-2xs text-foreground'
                      : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Auto (WebGPU)</div>
                    <div className="text-[10px] text-muted-foreground">Kencang via GPU perangkat</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onModelChange?.('bria-rmbg-wasm')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                    selectedModel === 'bria-rmbg-wasm'
                      ? 'border-primary bg-background font-medium shadow-2xs text-foreground'
                      : 'border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">WASM Multi-thread</div>
                    <div className="text-[10px] text-muted-foreground">Universal di semua CPU</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Auto-resize toggle */}
            <div className="flex items-center justify-between pt-0.5">
              <div>
                <div className="text-xs font-medium text-foreground">
                  Optimasi Resolusi Maksimal (2048px)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Mencegah browser kehabisan memori RAM saat memproses foto besar
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoResize}
                onChange={(e) => onAutoResizeChange?.(e.target.checked)}
                className="w-4 h-4 rounded border-input text-primary accent-primary focus:ring-ring cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
