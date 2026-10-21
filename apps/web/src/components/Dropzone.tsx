import React, { useState, useEffect, useRef } from 'react';
import { Upload, Link as LinkIcon, Sparkles, AlertCircle, Sliders } from 'lucide-react';
import type { ModelType } from '../types';

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
    subtitle: 'Rambut & detail halus',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=75',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'product',
    title: 'Produk',
    subtitle: 'Katalog sepatu / e-commerce',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=75',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'car',
    title: 'Kendaraan',
    subtitle: 'Mobil & tepi keras',
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
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200
          ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-white dark:bg-gray-800/80 shadow-sm hover:shadow-md'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Tarik & Letakkan gambar di sini
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              atau klik untuk memilih file dari komputer
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span>Tekan</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 font-mono text-[11px] shadow-2xs">
              Ctrl+V
            </kbd>
            <span>untuk paste langsung</span>
          </div>

          <p className="text-xs text-gray-400">
            Mendukung PNG, JPG, WebP hingga 25 MB
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <form onSubmit={handleFetchUrl} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Atau tempel URL gambar (https://...)"
              disabled={isProcessing || isFetchingUrl}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim() || isProcessing || isFetchingUrl}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isFetchingUrl ? 'Memuat...' : 'Ambil'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={`px-3.5 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors shrink-0
            ${
              showSettings
                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30'
                : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pengaturan AI</span>
        </button>
      </div>

      {showSettings && (
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 space-y-4 text-sm animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200 block">Varian Model AI</span>
              <span className="text-xs text-gray-500">Pilih model inferensi @imgly</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => onModelChange('isnet_fp16')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedModel === 'isnet_fp16'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                isnet_fp16 (Standar)
              </button>
              <button
                type="button"
                onClick={() => onModelChange('isnet_quint8')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedModel === 'isnet_quint8'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                isnet_quint8 (Cepat)
              </button>
              <button
                type="button"
                onClick={() => onModelChange('isnet')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedModel === 'isnet'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                isnet (Presisi Tinggi)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200 block">
                Auto-Resize Cepat (Maks 2048px)
              </span>
              <span className="text-xs text-gray-500">
                Membatasi dimensi gambar sangat besar untuk menghemat RAM & mempercepat segmentasi
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoResize}
                onChange={(e) => onAutoResizeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Atau coba sampel gambar berikut</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={isProcessing || isFetchingUrl}
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/90 hover:border-blue-400 hover:shadow-sm transition-all text-left disabled:opacity-50"
            >
              <img
                src={sample.thumbnail}
                alt={sample.title}
                className="w-12 h-12 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {sample.title}
                </span>
                <span className="block text-xs text-gray-400 truncate">
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
