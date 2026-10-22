import React from 'react';
import { DownloadCloud, Cpu, AlertCircle } from 'lucide-react';
import type { ProcessProgress } from '../types';
import { Card, CardContent } from './ui/card';

interface ProgressBarProps {
  progress: ProcessProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const isDownload = progress.stage === 'downloading';
  const isError = progress.stage === 'error';

  if (progress.stage === 'idle' || progress.stage === 'completed') {
    return null;
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
              isError
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-600'
                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {isError ? (
              <AlertCircle className="w-4 h-4" />
            ) : isDownload ? (
              <DownloadCloud className="w-4 h-4 animate-pulse" />
            ) : (
              <Cpu className="w-4 h-4 animate-spin" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {isError
                  ? 'Terjadi Kendala'
                  : isDownload
                  ? 'Mengunduh Model AI (Hanya 1x)'
                  : 'Memproses Gambar...'}
              </span>
              {!isError && (
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {progress.percent}%
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {progress.message}
            </p>
          </div>
        </div>

        {!isError && (
          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(4, progress.percent)}%` }}
            />
          </div>
        )}

        {isDownload && (
          <p className="text-[11px] text-zinc-500 text-center">
            Model AI disimpan di cache browser untuk pemrosesan instan berikutnya secara offline.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
