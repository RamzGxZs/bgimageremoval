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
      <CardContent className="p-4 space-y-3">
        {/* Format Selector & Download Primary Button */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500">Format Ekspor</span>
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setFormat('image/png')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  format === 'image/png'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs font-medium'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                PNG
              </button>
              <button
                type="button"
                onClick={() => setFormat('image/webp')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  format === 'image/webp'
                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs font-medium'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                WebP
              </button>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            size="default"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full justify-center text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Unduh {format === 'image/png' ? 'PNG' : 'WebP'}</span>
          </Button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="text-xs justify-center"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Image</span>
              </>
            )}
          </Button>

          {onSaveToCloud ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloudSave}
              disabled={isSavingToCloud}
              className="text-xs justify-center"
            >
              {savedCloud ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5" />
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
            size="sm"
            onClick={onReset}
            className="text-xs text-zinc-500 hover:text-zinc-900 h-7"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ganti Gambar Lain</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
