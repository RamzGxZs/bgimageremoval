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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

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
          : 'Gagal memuat riwayat. Pastikan backend aktif.'
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
    if (!confirm('Hapus gambar ini dari cloud?')) return;

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                Riwayat Cloud
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {total}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 w-8 text-zinc-500"
                title="Konfigurasi API"
              >
                <Key className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={loadHistory}
                disabled={isLoading}
                className="h-8 w-8 text-zinc-500"
                title="Segarkan"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-zinc-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Settings Section */}
          {showSettings && (
            <form
              onSubmit={handleSaveSettings}
              className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
            >
              <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                <span>Pengaturan Cloudflare</span>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>API Base URL</span>
                </label>
                <Input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://...workers.dev"
                  className="h-7 text-xs bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-500 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>Secret Key / PIN</span>
                </label>
                <Input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Kunci rahasia..."
                  className="h-7 text-xs bg-white dark:bg-zinc-950"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-7 text-xs"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="h-7 text-xs">
                  Simpan
                </Button>
              </div>
            </form>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="mt-1 underline text-zinc-900 dark:text-zinc-100 font-medium block"
                  >
                    Buka Pengaturan API
                  </button>
                </div>
              </div>
            )}

            {!isLoading && items.length === 0 && !error && (
              <div className="text-center py-12 text-zinc-400 space-y-2">
                <Layers className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs">Belum ada riwayat gambar di cloud.</p>
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
                  className="flex gap-2.5 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-950 transition-colors cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-md bg-checkerboard border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={fullCutoutUrl}
                      alt={item.originalFilename}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {item.originalFilename}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {item.width} × {item.height} • {formatBytes(item.fileSizeBytes)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="h-6 w-6 text-zinc-400 hover:text-red-500"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
