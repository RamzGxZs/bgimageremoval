import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  SlidersHorizontal,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { ModelType, ProcessProgress } from '../types';
import { Badge } from './ui/badge';

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
  selectedModel = 'imgly',
  onModelChange,
  autoResize = true,
  onAutoResizeChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: Blob, name?: string) => {
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
    },
    [onImageSelected]
  );

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
  }, [isProcessing, validateAndSelect]);

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

  const activeModelName =
    selectedModel === 'imgly'
      ? 'IMG.LY Background Removal'
      : 'BRIA RMBG-1.4 (Offline)';

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
                  ? 'Menyiapkan Model AI...'
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
                <span>Model: {activeModelName}</span>
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

      {/* AI Engine Selection Section */}
      <div className="rounded-xl border border-border bg-card/60 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-foreground">
              Pilihan Mesin AI (100% In-Browser)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Tutup Pengaturan' : 'Opsi Lanjutan'}</span>
          </button>
        </div>

        {/* 2 AI Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Option 1: imgly (Default) */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onModelChange?.('imgly')}
            className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              selectedModel === 'imgly'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                : 'border-border bg-background/50 hover:bg-accent/40 text-muted-foreground'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    selectedModel === 'imgly'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <span>IMG.LY AI</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-primary border-primary/30 bg-primary/10"
                    >
                      Default
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedModel === 'imgly' && (
                <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Model in-browser dari IMG.LY, proses cepat dan ringan untuk berbagai foto.
            </p>
          </button>

          {/* Option 2: BRIA RMBG-1.4 */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onModelChange?.('bria-rmbg-1.4')}
            className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
              selectedModel === 'bria-rmbg-1.4'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                : 'border-border bg-background/50 hover:bg-accent/40 text-muted-foreground'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    selectedModel === 'bria-rmbg-1.4'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground">
                    BRIA RMBG-1.4
                  </div>
                </div>
              </div>
              {selectedModel === 'bria-rmbg-1.4' && (
                <div className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Model SOTA resolusi tinggi berbasis ONNX offline (WebGPU / WASM).
            </p>
          </button>
        </div>

        {/* Collapsible Advanced Settings (e.g. Auto-resize) */}
        {showAdvanced && (
          <div className="pt-2.5 border-t border-border space-y-2 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-foreground">
                  Optimasi Resolusi Maksimal (2048px)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Mencegah browser kehabisan memori RAM saat memproses foto resolusi besar
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
