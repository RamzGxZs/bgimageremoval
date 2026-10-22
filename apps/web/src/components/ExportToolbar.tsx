import React, { useState } from 'react';
import { Download, Copy, Check, CloudUpload, RotateCcw } from 'lucide-react';
import { copyImageToClipboard, downloadBlob } from '../lib/imageUtils';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface ExportToolbarProps {
  onExport: (format: 'image/png' | 'image/webp') => Promise<Blob>;
  originalFilename: string;
  onReset: () => void;
  onSaveToCloud?: (cutoutBlob: Blob) => Promise<void>;
  isSavingToCloud?: boolean;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  onExport,
  originalFilename,
  onReset,
  onSaveToCloud,
  isSavingToCloud = false,
}) => {
  const [format, setFormat] = useState<'image/png' | 'image/webp'>('image/png');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedCloud, setSavedCloud] = useState(false);

  const cleanBaseName = originalFilename.replace(/\.[^/.]+$/, '');

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const blob = await onExport(format);
      const ext = format === 'image/webp' ? 'webp' : 'png';
      downloadBlob(blob, `${cleanBaseName}-nobg.${ext}`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      setIsExporting(true);
      const blob = await onExport('image/png');
      await copyImageToClipboard(blob);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy clipboard error:', err);
      alert('Gagal menyalin gambar ke clipboard.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCloudSave = async () => {
    if (!onSaveToCloud) return;
    try {
      const blob = await onExport('image/png');
      await onSaveToCloud(blob);
      setSavedCloud(true);
      setTimeout(() => setSavedCloud(false), 3000);
    } catch (err) {
      console.error('Cloud save error:', err);
    }
  };

  return (
    <Card className="shadow-xs">
      <CardContent className="p-5 space-y-4">
        {/* Format Selector & Download Primary Button */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-600 dark:text-zinc-400">Format Ekspor</span>
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setFormat('image/png')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer font-medium ${
                  format === 'image/png'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                PNG
              </button>
              <button
                type="button"
                onClick={() => setFormat('image/webp')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer font-medium ${
                  format === 'image/webp'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                WebP
              </button>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full justify-center h-12 text-base font-semibold"
          >
            <Download className="w-5 h-5" />
            <span>Unduh {format === 'image/png' ? 'PNG' : 'WebP'}</span>
          </Button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="text-sm font-medium h-10 justify-center"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Image</span>
              </>
            )}
          </Button>

          {onSaveToCloud ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={handleCloudSave}
              disabled={isSavingToCloud}
              className="text-sm font-medium h-10 justify-center"
            >
              {savedCloud ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersimpan</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>{isSavingToCloud ? 'Menyimpan...' : 'Simpan Cloud'}</span>
                </>
              )}
            </Button>
          ) : (
            <div />
          )}
        </div>

        {/* Reset / Change Image Link */}
        <div className="pt-1 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={onReset}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-9"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ganti Gambar Lain</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
