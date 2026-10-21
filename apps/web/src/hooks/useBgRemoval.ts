import { useState, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';
import type { Config } from '@imgly/background-removal';
import type { ModelType, ProcessProgress } from '../types';
import { resizeImageIfNeeded } from '../lib/imageUtils';

export interface BgRemovalResult {
  cutoutBlob: Blob;
  cutoutUrl: string;
  originalBlob: Blob;
  originalUrl: string;
  width: number;
  height: number;
  durationMs: number;
}

export function useBgRemoval() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessProgress>({
    stage: 'idle',
    current: 0,
    total: 100,
    percent: 0,
    message: '',
  });
  const [result, setResult] = useState<BgRemovalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (
      file: Blob,
      options: {
        model?: ModelType;
        autoResize?: boolean;
        maxDimension?: number;
      } = {}
    ): Promise<BgRemovalResult | null> => {
      const {
        model = 'isnet_fp16',
        autoResize = true,
        maxDimension = 2048,
      } = options;

      setIsProcessing(true);
      setError(null);
      setProgress({
        stage: 'processing',
        current: 0,
        total: 100,
        percent: 0,
        message: 'Mempersiapkan gambar...',
      });

      const startTime = performance.now();

      try {
        // Step 1: Optional Auto-resize
        let workingBlob = file;
        let imgWidth = 0;
        let imgHeight = 0;

        if (autoResize) {
          setProgress((prev) => ({
            ...prev,
            message: 'Mengoptimalkan ukuran gambar...',
          }));
          const resized = await resizeImageIfNeeded(file, maxDimension);
          workingBlob = resized.blob;
          imgWidth = resized.width;
          imgHeight = resized.height;
        }

        // Step 2: Configure @imgly/background-removal
        const config: Config = {
          model,
          output: {
            format: 'image/png',
            quality: 1.0,
          },
          progress: (key: string, current: number, total: number) => {
            const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            const isDownload = key.includes('fetch') || key.includes('download') || key.includes('model');

            setProgress({
              stage: isDownload ? 'downloading' : 'processing',
              key,
              current,
              total,
              percent: pct,
              message: isDownload
                ? `Mengunduh model AI ke browser (${pct}%)...`
                : `Memisahkan objek dari latar belakang (${pct}%)...`,
            });
          },
        };

        // Step 3: Run removal
        const cutoutBlob = await removeBackground(workingBlob, config);

        // Get dimensions if not already measured
        if (!imgWidth || !imgHeight) {
          const img = new Image();
          const tempUrl = URL.createObjectURL(cutoutBlob);
          await new Promise<void>((resolve) => {
            img.onload = () => {
              imgWidth = img.naturalWidth;
              imgHeight = img.naturalHeight;
              URL.revokeObjectURL(tempUrl);
              resolve();
            };
            img.src = tempUrl;
          });
        }

        const cutoutUrl = URL.createObjectURL(cutoutBlob);
        const originalUrl = URL.createObjectURL(workingBlob);
        const durationMs = Math.round(performance.now() - startTime);

        const newResult: BgRemovalResult = {
          cutoutBlob,
          cutoutUrl,
          originalBlob: workingBlob,
          originalUrl,
          width: imgWidth,
          height: imgHeight,
          durationMs,
        };

        setResult(newResult);
        setProgress({
          stage: 'completed',
          current: 100,
          total: 100,
          percent: 100,
          message: `Selesai dalam ${(durationMs / 1000).toFixed(1)}s!`,
        });

        return newResult;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memproses gambar.';
        console.error('Background removal error:', err);
        setError(errorMsg);
        setProgress({
          stage: 'error',
          current: 0,
          total: 100,
          percent: 0,
          message: errorMsg,
        });
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (result) {
      URL.revokeObjectURL(result.cutoutUrl);
      URL.revokeObjectURL(result.originalUrl);
    }
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setProgress({
      stage: 'idle',
      current: 0,
      total: 100,
      percent: 0,
      message: '',
    });
  }, [result]);

  return {
    isProcessing,
    progress,
    result,
    error,
    processImage,
    reset,
  };
}
