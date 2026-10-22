import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon, Sparkles, AlertCircle, Sliders } from 'lucide-react';
import type { ModelType } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface DropzoneProps {
  onImageSelected: (file: Blob, filename?: string) => void;
  isProcessing: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  autoResize: boolean;
  onAutoResizeChange: (enabled: boolean) => void;
}

const SAMPLE_IMAGES = [
  {
    id: 'portrait',
    title: 'Potret',
    subtitle: 'Rambut & detail tepi',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=75',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'product',
    title: 'Produk',
    subtitle: 'Sepatu & e-commerce',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=75',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'car',
    title: 'Kendaraan',
    subtitle: 'Mobil & kontur tegas',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=200&q=75',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85',
  },
];

export const Dropzone: React.FC<DropzoneProps> = ({
  onImageSelected,
  isProcessing,
  selectedModel,
  onModelChange,
  autoResize,
  onAutoResizeChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setErrorMessage('Format gambar tidak didukung. Harap gunakan JPEG, PNG, atau WebP.');
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage('Ukuran gambar terlalu besar (maksimal 25 MB).');
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

  const handleFetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isProcessing) return;

    setIsFetchingUrl(true);
    setErrorMessage(null);

    try {
      const response = await fetch(urlInput.trim());
      if (!response.ok) throw new Error('Gagal mengunduh gambar dari URL.');

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error('URL tidak mengarah ke file gambar yang valid.');
      }

      const blob = await response.blob();
      const filename = urlInput.split('/').pop()?.split('?')[0] || 'url-image.png';
      validateAndSelect(blob, filename);
      setUrlInput('');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil gambar. Pastikan URL dapat diakses publik atau izin CORS mengizinkan.'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSelectSample = async (sample: (typeof SAMPLE_IMAGES)[0]) => {
    if (isProcessing) return;
    setIsFetchingUrl(true);
    setErrorMessage(null);

    try {
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error('Gagal memuat sampel gambar.');
      const blob = await response.blob();
      validateAndSelect(blob, `sample-${sample.id}.jpg`);
    } catch {
      setErrorMessage('Gagal memuat sampel gambar. Silakan coba lagi.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Drag & Drop Main Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border border-dashed p-10 text-center transition-colors
          ${
            isDragOver
              ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800/60'
              : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-400 dark:hover:border-zinc-700'
          }
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Upload className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Pilih file gambar atau tarik ke sini
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Mendukung JPEG, PNG, WebP hingga 25 MB
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] text-zinc-600 dark:text-zinc-400">
            <span>Atau tekan</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px]">
              Ctrl+V
            </kbd>
            <span>untuk paste langsung</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* URL Ingestion & Settings Button */}
      <div className="flex gap-2 items-center">
        <form onSubmit={handleFetchUrl} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Tempel tautan URL gambar..."
              disabled={isProcessing || isFetchingUrl}
              className="pl-8 text-xs"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!urlInput.trim() || isProcessing || isFetchingUrl}
          >
            {isFetchingUrl ? 'Memuat...' : 'Ambil'}
          </Button>
        </form>

        <Button
          type="button"
          variant={showSettings ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Pengaturan AI</span>
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100 block">Model Inferensi</span>
              <span className="text-zinc-500">Pilih model segmentasi objek</span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
              <button
                type="button"
                onClick={() => onModelChange('isnet_fp16')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedModel === 'isnet_fp16'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                isnet_fp16 (Standar)
              </button>
              <button
                type="button"
                onClick={() => onModelChange('isnet_quint8')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedModel === 'isnet_quint8'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                isnet_quint8 (Cepat)
              </button>
              <button
                type="button"
                onClick={() => onModelChange('isnet')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  selectedModel === 'isnet'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-xs font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                isnet (Presisi)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                Batasi Resolusi (Maks 2048px)
              </span>
              <span className="text-zinc-500">
                Otomatis resize dimensi raksasa agar pemrosesan hemat memori
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoResize}
              onChange={(e) => onAutoResizeChange(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-zinc-950 dark:accent-zinc-100"
            />
          </div>
        </Card>
      )}

      {/* Sample Images */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Atau coba sampel gambar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={isProcessing || isFetchingUrl}
              className="flex items-center gap-2.5 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-left transition-colors disabled:opacity-50 cursor-pointer"
            >
              <img
                src={sample.thumbnail}
                alt={sample.title}
                className="w-10 h-10 rounded-md object-cover shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {sample.title}
                </span>
                <span className="block text-[11px] text-zinc-500 truncate">
                  {sample.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
