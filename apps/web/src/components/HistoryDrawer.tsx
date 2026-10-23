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
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-background border-l border-border shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-base text-foreground">
                Riwayat Cloud
              </span>
              <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                {total}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Konfigurasi API"
              >
                <Key className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={loadHistory}
                disabled={isLoading}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Segarkan"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Settings Section */}
          {showSettings && (
            <form
              onSubmit={handleSaveSettings}
              className="p-4 bg-muted/40 border-b border-border space-y-3 text-sm"
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span>Pengaturan Cloudflare</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Globe className="w-3.5 h-3.5" />
                  <span>API Base URL</span>
                </label>
                <Input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder="https://...workers.dev"
                  className="h-9 text-sm bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Key className="w-3.5 h-3.5" />
                  <span>Secret Key / PIN</span>
                </label>
                <Input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Kunci rahasia..."
                  className="h-9 text-sm bg-background"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-8 text-xs font-medium"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                  Simpan
                </Button>
              </div>
            </form>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="mt-1.5 underline text-foreground font-medium block text-xs cursor-pointer"
                  >
                    Buka Pengaturan API
                  </button>
                </div>
              </div>
            )}

            {!isLoading && items.length === 0 && !error && (
              <div className="text-center py-16 text-muted-foreground space-y-3">
                <Layers className="w-10 h-10 mx-auto stroke-1 text-muted-foreground" />
                <p className="text-sm">Belum ada riwayat gambar di cloud.</p>
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
                  className="flex gap-3 p-2.5 rounded-lg border border-border hover:border-ring/50 bg-card hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-md bg-checkerboard border border-border overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={fullCutoutUrl}
                      alt={item.originalFilename}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {item.originalFilename}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.width} × {item.height} • {formatBytes(item.fileSizeBytes)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
