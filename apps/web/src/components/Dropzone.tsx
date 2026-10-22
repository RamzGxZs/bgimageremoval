import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import type { ProcessProgress } from '../types';

interface DropzoneProps {
  onImageSelected: (file: Blob, filename?: string) => void;
  isProcessing: boolean;
  progress?: ProcessProgress;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onImageSelected,
  isProcessing,
  progress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [isProcessing]);

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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Dropzone Container - Large & Easy to Read */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative min-h-[300px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-10 text-center select-none
          ${
            isProcessing
              ? 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 cursor-default'
              : isDragOver
              ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800/70 cursor-pointer scale-[1.01]'
              : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-700 cursor-pointer shadow-sm hover:shadow'
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
          // In-place loading state with larger progress bar and typography
          <div className="flex flex-col items-center justify-center space-y-5 w-full max-w-md animate-in fade-in duration-200">
            <Loader2 className="w-10 h-10 text-zinc-900 dark:text-zinc-100 animate-spin" />

            <div className="space-y-1.5 w-full text-center">
              <p className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {progress?.stage === 'downloading'
                  ? 'Mengunduh model AI...'
                  : 'Memproses gambar...'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                {progress?.message || 'Menghapus latar belakang...'}
              </p>
            </div>

            {/* Thicker Progress bar */}
            <div className="w-full space-y-2">
              <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, progress?.percent || 0)}%` }}
                />
              </div>
              <div className="flex justify-end">
                <span className="text-sm font-mono font-medium text-zinc-600 dark:text-zinc-400">
                  {progress?.percent || 0}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Default upload prompt - Large & legible
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <p className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Pilih gambar atau tarik ke sini
              </p>
              <p className="text-sm text-zinc-500">
                Mendukung file PNG, JPG, atau WebP hingga 25 MB
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <span>atau tekan</span>
              <kbd className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs font-semibold shadow-2xs">
                Ctrl+V
              </kbd>
              <span>untuk paste</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
