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
    <Card className="shadow-xs shrink-0">
      <CardContent className="p-3.5 space-y-3">
        {/* Format Selector & Download Primary Button */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Format Ekspor</span>
            <div className="flex items-center bg-secondary p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setFormat('image/png')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer font-medium ${
                  format === 'image/png'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                PNG
              </button>
              <button
                type="button"
                onClick={() => setFormat('image/webp')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer font-medium ${
                  format === 'image/webp'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
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
            className="w-full justify-center h-10 text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Unduh {format === 'image/png' ? 'PNG' : 'WebP'}</span>
          </Button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="text-xs font-medium h-8 justify-center px-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
              className="text-xs font-medium h-8 justify-center px-2"
            >
              {savedCloud ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
        <div className="pt-0.5 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground h-7"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ganti Gambar Lain</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
