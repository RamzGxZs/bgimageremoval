import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Trash2,
  Key,
  Globe,
  RefreshCw,
  AlertCircle,
  HardDrive,
  Clock,
  Layers,
} from 'lucide-react';
import type { HistoryItem } from '../types';
import {
  fetchHistory,
  deleteHistoryItem,
  getApiBaseUrl,
  setApiBaseUrl,
  getApiToken,
  setApiToken,
} from '../lib/api';
import { formatBytes } from '../lib/imageUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (cutoutUrl: string, originalUrl?: string, filename?: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloudflare settings
  const [showSettings, setShowSettings] = useState(false);
  const [apiBaseUrl, setApiBase] = useState(getApiBaseUrl());
  const [apiToken, setToken] = useState(getApiToken());

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHistory(30, 0);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat riwayat. Pastikan backend API aktif dan token valid.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(apiBaseUrl.trim());
    setApiToken(apiToken.trim());
    setShowSettings(false);
    loadHistory();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus gambar ini dari Cloudflare R2 dan D1?')) return;

    try {
      await deleteHistoryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      alert('Gagal menghapus item dari cloud.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-gray-850 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Riwayat Cloud
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                {total}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Konfigurasi API Cloudflare"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={loadHistory}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Segarkan"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cloud Connection Settings Bar */}
          {showSettings && (
            <form
              onSubmit={handleSaveSettings}
              className="p-4 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 space-y-3 text-xs"
            >
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                <span>Pengaturan Koneksi Cloudflare</span>
              </h4>

              <div className="space-y-1">
                <label className="text-gray-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>API Base URL (Worker)</span>
                </label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://personal-bg-remover-api.workers.dev"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>Personal Secret Key / PIN</span>
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Masukkan kunci rahasia Worker..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {error && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="mt-1.5 text-blue-600 underline font-medium block"
                  >
                    Buka Konfigurasi API
                  </button>
                </div>
              </div>
            )}

            {!isLoading && items.length === 0 && !error && (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <Layers className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-sm">Belum ada riwayat gambar di cloud.</p>
                <p className="text-xs">
                  Proses gambar baru dan klik tombol &quot;Simpan ke Cloud&quot;.
                </p>
              </div>
            )}

            {items.map((item) => {
              const fullCutoutUrl = item.cutoutUrl.startsWith('http')
                ? item.cutoutUrl
                : `${apiBaseUrl}${item.cutoutUrl}`;

              const formattedDate = new Date(item.createdAt * 1000).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectImage(fullCutoutUrl, item.originalUrl, item.originalFilename);
                    onClose();
                  }}
                  className="group relative flex gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 bg-white dark:bg-gray-800 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-lg bg-checkerboard border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={fullCutoutUrl}
                      alt={item.originalFilename}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {item.originalFilename}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <span>{item.width} × {item.height}</span>
                        <span>•</span>
                        <span>{formatBytes(item.fileSizeBytes)}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Hapus dari Cloud"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
