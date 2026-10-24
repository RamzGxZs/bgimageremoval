import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  History,
  Trash2,
  RefreshCw,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { HistoryItem } from '../types';
import {
  getLocalHistory,
  deleteLocalHistoryItem,
  clearAllLocalHistory,
} from '../lib/localHistory';
import { formatBytes } from '../lib/imageUtils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (cutoutBlob: Blob, originalBlob?: Blob, filename?: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectImage,
}) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const itemsRef = useRef<HistoryItem[]>([]);
  itemsRef.current = items;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await getLocalHistory(50);
      const mappedItems: HistoryItem[] = records.map((rec) => ({
        id: rec.id,
        originalFilename: rec.originalFilename,
        cutoutBlob: rec.cutoutBlob,
        originalBlob: rec.originalBlob,
        cutoutUrl: URL.createObjectURL(rec.cutoutBlob),
        originalUrl: rec.originalBlob ? URL.createObjectURL(rec.originalBlob) : undefined,
        mimeType: rec.mimeType,
        width: rec.width,
        height: rec.height,
        fileSizeBytes: rec.fileSizeBytes,
        modelUsed: rec.modelUsed,
        bgConfigJson: rec.bgConfigJson,
        createdAt: rec.createdAt,
      }));
      setItems(mappedItems);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat riwayat lokal dari browser.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
    return () => {
      // Clean up created object URLs
      itemsRef.current.forEach((item) => {
        if (item.cutoutUrl) URL.revokeObjectURL(item.cutoutUrl);
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      });
    };
  }, [isOpen, loadHistory]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteLocalHistoryItem(id);
      setItems((prev) => {
        const target = prev.find((i) => i.id === id);
        if (target) {
          URL.revokeObjectURL(target.cutoutUrl);
          if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
        }
        return prev.filter((item) => item.id !== id);
      });
    } catch {
      alert('Gagal menghapus gambar dari riwayat lokal.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua riwayat lokal di browser ini?')) {
      return;
    }
    try {
      await clearAllLocalHistory();
      items.forEach((item) => {
        if (item.cutoutUrl) URL.revokeObjectURL(item.cutoutUrl);
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      });
      setItems([]);
    } catch {
      alert('Gagal membersihkan riwayat lokal.');
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
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-foreground">
                  Riwayat Lokal
                </span>
                <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                  {items.length}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {items.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAll}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  title="Hapus Semua Riwayat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={loadHistory}
                disabled={isLoading}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Segarkan"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Subheader info: 100% Client-Side */}
          <div className="px-4 py-2 bg-muted/40 border-b border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Tersimpan aman di IndexedDB perangkat Anda (Offline)</span>
            <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              Private FE
            </Badge>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            {!isLoading && items.length === 0 && !error && (
              <div className="text-center py-16 text-muted-foreground space-y-3">
                <Layers className="w-10 h-10 mx-auto stroke-1 text-muted-foreground" />
                <p className="text-sm">Belum ada riwayat gambar di browser.</p>
                <p className="text-xs text-muted-foreground/80">
                  Setiap gambar yang Anda proses akan otomatis tersimpan di sini.
                </p>
              </div>
            )}

            {items.map((item) => {
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
                    onSelectImage(item.cutoutBlob, item.originalBlob, item.originalFilename);
                    onClose();
                  }}
                  className="flex gap-3 p-2.5 rounded-lg border border-border hover:border-ring/50 bg-card hover:bg-accent/40 transition-colors cursor-pointer group relative"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-md bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center relative pattern-checkerboard">
                    <img
                      src={item.cutoutUrl}
                      alt={item.originalFilename}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground truncate pr-6">
                        {item.originalFilename}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                        <span>{item.width}×{item.height}</span>
                        <span>•</span>
                        <span>{formatBytes(item.fileSizeBytes)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        {item.modelUsed === 'imgly' ? 'IMG.LY AI' : 'BRIA RMBG-1.4'}
                      </span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Hapus dari riwayat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
