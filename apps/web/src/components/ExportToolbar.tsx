import React, { useState } from 'react';
import { Download, Copy, Check, CloudUpload, RotateCcw } from 'lucide-react';
import { copyImageToClipboard, downloadBlob } from '../lib/imageUtils';

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
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-auto">
      {/* Left: Reset / New image */}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Ganti Gambar</span>
      </button>

      {/* Right: Format selector & Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Format selector */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFormat('image/png')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              format === 'image/png'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
            }`}
          >
            PNG
          </button>
          <button
            type="button"
            onClick={() => setFormat('image/webp')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              format === 'image/webp'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
            }`}
          >
            WebP
          </button>
        </div>

        {/* Copy to clipboard */}
        <button
          type="button"
          onClick={handleCopyClipboard}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Salin langsung untuk ditempel di Figma, WhatsApp, atau dokumen"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Image</span>
            </>
          )}
        </button>

        {/* Cloud Save Button */}
        {onSaveToCloud && (
          <button
            type="button"
            onClick={handleCloudSave}
            disabled={isSavingToCloud}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            title="Simpan hasil olahan ke Cloudflare R2 & D1"
          >
            {savedCloud ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Tersimpan di Cloud</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>{isSavingToCloud ? 'Menyimpan...' : 'Simpan ke Cloud'}</span>
              </>
            )}
          </button>
        )}

        {/* Main Download Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Unduh {format === 'image/png' ? 'PNG' : 'WebP'}</span>
        </button>
      </div>
    </div>
  );
};
