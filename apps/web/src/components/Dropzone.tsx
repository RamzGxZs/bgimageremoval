import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import type { ProcessProgress } from '../types';

interface DropzoneProps {
  onImageSelected: (file: Blob, filename?: string) => void;
  isProcessing: boolean;
  progress?: ProcessProgress;
}

const SAMPLE_IMAGES = [
  {
    id: 'portrait',
    title: 'Potret',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'product',
    title: 'Produk',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'car',
    title: 'Mobil',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85',
  },
];

export const Dropzone: React.FC<DropzoneProps> = ({
  onImageSelected,
  isProcessing,
  progress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingSample, setIsFetchingSample] = useState(false);
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

  const handleSelectSample = async (sample: (typeof SAMPLE_IMAGES)[0]) => {
    if (isProcessing || isFetchingSample) return;
    setIsFetchingSample(true);
    setErrorMessage(null);

    try {
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error('Gagal memuat sampel gambar.');
      const blob = await response.blob();
      validateAndSelect(blob, `sample-${sample.id}.jpg`);
    } catch {
      setErrorMessage('Gagal memuat sampel gambar.');
    } finally {
      setIsFetchingSample(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative min-h-[240px] rounded-xl border border-dashed transition-all flex flex-col items-center justify-center p-8 text-center select-none
          ${
            isProcessing
              ? 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 cursor-default'
              : isDragOver
              ? 'border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800/60 cursor-pointer'
              : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-700 cursor-pointer shadow-xs'
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
          // In-place loading state with progress
          <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-xs animate-in fade-in duration-200">
            <Loader2 className="w-7 h-7 text-zinc-900 dark:text-zinc-100 animate-spin" />

            <div className="space-y-1 w-full text-center">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {progress?.stage === 'downloading'
                  ? 'Mengunduh model AI...'
                  : 'Memproses gambar...'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {progress?.message || 'Menghapus latar belakang...'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, progress?.percent || 0)}%` }}
                />
              </div>
              <div className="flex justify-end">
                <span className="text-[11px] font-mono text-zinc-500">
                  {progress?.percent || 0}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Default upload prompt
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
              <Upload className="w-4 h-4" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Pilih gambar atau tarik ke sini
              </p>
              <p className="text-xs text-zinc-500">
                PNG, JPG, atau WebP hingga 25 MB
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span>atau tekan</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">
                Ctrl+V
              </kbd>
            </div>
          </div>
        )}
      </div>

      {/* Error message if any */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Minimal sample links without marketing copywriting */}
      {!isProcessing && (
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-1">
          <span>Coba contoh:</span>
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={isFetchingSample}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 cursor-pointer disabled:opacity-50"
            >
              {sample.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
