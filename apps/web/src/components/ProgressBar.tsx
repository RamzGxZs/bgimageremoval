import React from 'react';
import { DownloadCloud, Cpu, AlertCircle } from 'lucide-react';
import type { ProcessProgress } from '../types';

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
    <div className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700/80 space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isError
              ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
              : isDownload
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 animate-pulse'
              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-5 h-5" />
          ) : isDownload ? (
            <DownloadCloud className="w-5 h-5" />
          ) : (
            <Cpu className="w-5 h-5 animate-spin" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {isError
                ? 'Terjadi Kendala'
                : isDownload
                ? 'Mengunduh Model AI (Hanya 1x)'
                : 'Menghapus Latar Belakang...'}
            </h4>
            {!isError && (
              <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400">
                {progress.percent}%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {progress.message}
          </p>
        </div>
      </div>

      {!isError && (
        <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isDownload
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${Math.max(5, progress.percent)}%` }}
          />
        </div>
      )}

      {isDownload && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
          Model AI disimpan di Cache Storage browser Anda untuk pemakaian instan berikutnya secara offline.
        </p>
      )}
    </div>
  );
};
