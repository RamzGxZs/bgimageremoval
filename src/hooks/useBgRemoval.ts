import { useState, useCallback } from 'react';
import { env, AutoModel, AutoProcessor, RawImage } from '@huggingface/transformers';
import { removeBackground } from '@imgly/background-removal';
import type { ModelType, ProcessProgress } from '../types';
import { resizeImageIfNeeded } from '../lib/imageUtils';

// Configure transformers.js for offline local execution of BRIA RMBG-1.4
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/models/';
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const ortConfig = {
  mjs: `${origin}/ort/ort-wasm-simd-threaded.asyncify.mjs`,
  wasm: `${origin}/ort/ort-wasm-simd-threaded.asyncify.wasm`,
};

if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = ortConfig;
} else {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (env as any).backends = {
    ...env.backends,
    onnx: {
      ...env.backends?.onnx,
      wasm: { wasmPaths: ortConfig },
    },
  };
}

export interface BgRemovalResult {
  cutoutBlob: Blob;
  cutoutUrl: string;
  originalBlob: Blob;
  originalUrl: string;
  width: number;
  height: number;
  durationMs: number;
  modelUsed: ModelType;
}

// Module-level singletons for BRIA model & processor to prevent repeated loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedProcessor: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedModel: any = null;
let cachedDevice: string | null = null;

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
        model = 'imgly',
        autoResize = true,
        maxDimension = 2048,
      } = options;

      setIsProcessing(true);
      setError(null);
      setProgress({
        stage: 'processing',
        current: 5,
        total: 100,
        percent: 5,
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
            current: 10,
            percent: 10,
            message: 'Mengoptimalkan ukuran gambar...',
          }));
          const resized = await resizeImageIfNeeded(file, maxDimension);
          workingBlob = resized.blob;
          imgWidth = resized.width;
          imgHeight = resized.height;
        }

        // --- PATH A: @imgly/background-removal (Default) ---
        if (model === 'imgly') {
          setProgress({
            stage: 'processing',
            current: 15,
            total: 100,
            percent: 15,
            message: 'Menginisialisasi IMG.LY AI...',
          });

          const cutoutBlob = await removeBackground(workingBlob, {
            progress: (key: string, current: number, total: number) => {
              let percent = 20;
              if (total > 0) {
                percent = Math.min(95, Math.max(15, Math.round((current / total) * 100)));
              }
              let stageMsg = 'Menghapus latar belakang dengan IMG.LY AI...';
              if (key && key.includes('fetch')) {
                stageMsg = `Memuat aset model IMG.LY (${percent}%)...`;
              } else if (key && (key.includes('onnx') || key.includes('compute'))) {
                stageMsg = `Memproses segmentasi AI (${percent}%)...`;
              }

              setProgress({
                stage: key && key.includes('fetch') ? 'downloading' : 'processing',
                key,
                current,
                total,
                percent,
                message: stageMsg,
              });
            },
          });

          // Ensure width and height are known
          if (imgWidth === 0 || imgHeight === 0) {
            const bitmap = await createImageBitmap(cutoutBlob);
            imgWidth = bitmap.width;
            imgHeight = bitmap.height;
            bitmap.close();
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
            modelUsed: 'imgly',
          };

          setResult(newResult);
          setProgress({
            stage: 'completed',
            current: 100,
            total: 100,
            percent: 100,
            message: `Selesai dalam ${(durationMs / 1000).toFixed(1)}s! (IMG.LY AI)`,
          });

          return newResult;
        }

        // --- PATH B: BRIA RMBG-1.4 (Local Transformers.js) ---
        const targetDevice = 'webgpu';
        const MODEL_ID = 'briaai/RMBG-1.4';

        if (!cachedProcessor) {
          setProgress({
            stage: 'downloading',
            current: 25,
            total: 100,
            percent: 25,
            message: 'Memuat preprocessor BRIA RMBG-1.4 offline...',
          });
          cachedProcessor = await AutoProcessor.from_pretrained(MODEL_ID);
        }

        if (!cachedModel || cachedDevice !== targetDevice) {
          setProgress({
            stage: 'downloading',
            current: 40,
            total: 100,
            percent: 40,
            message: 'Menginisialisasi model BRIA RMBG-1.4 (WebGPU)...',
          });

          try {
            cachedModel = await AutoModel.from_pretrained(MODEL_ID, {
              dtype: 'q8',
              device: targetDevice,
            });
            cachedDevice = targetDevice;
          } catch (deviceErr) {
            console.warn('WebGPU gagal atau tidak didukung, beralih ke WASM:', deviceErr);
            setProgress({
              stage: 'downloading',
              current: 45,
              total: 100,
              percent: 45,
              message: 'Beralih ke akselerasi WebAssembly (WASM)...',
            });
            cachedModel = await AutoModel.from_pretrained(MODEL_ID, {
              dtype: 'q8',
              device: 'wasm',
            });
            cachedDevice = 'wasm';
          }
        }

        setProgress({
          stage: 'processing',
          current: 55,
          total: 100,
          percent: 55,
          message: 'Menganalisis objek visual & kontur...',
        });

        const rawImg = await RawImage.fromBlob(workingBlob);
        imgWidth = rawImg.width;
        imgHeight = rawImg.height;

        const { pixel_values } = await cachedProcessor(rawImg);

        setProgress({
          stage: 'processing',
          current: 75,
          total: 100,
          percent: 75,
          message: 'Memotong background dengan presisi tinggi...',
        });

        const output = await cachedModel({ input: pixel_values });
        const outputTensor = output.output || output[0];

        setProgress({
          stage: 'processing',
          current: 90,
          total: 100,
          percent: 90,
          message: 'Menyusun alpha mask transparan...',
        });

        const mask = await RawImage.fromTensor(
          outputTensor[0].mul(255).to('uint8')
        ).resize(imgWidth, imgHeight);

        const withAlpha = rawImg.putAlpha(mask);

        let cutoutBlob: Blob;
        try {
          cutoutBlob = await withAlpha.toBlob('image/png', 1.0);
        } catch {
          const canvas = document.createElement('canvas');
          canvas.width = imgWidth;
          canvas.height = imgHeight;
          const ctx = canvas.getContext('2d')!;
          const imgData = ctx.createImageData(imgWidth, imgHeight);
          imgData.data.set(withAlpha.data);
          ctx.putImageData(imgData, 0, 0);
          cutoutBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('Gagal mengekspor blob cutout'))),
              'image/png'
            );
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
          modelUsed: 'bria-rmbg-1.4',
        };

        setResult(newResult);
        setProgress({
          stage: 'completed',
          current: 100,
          total: 100,
          percent: 100,
          message: `Selesai dalam ${(durationMs / 1000).toFixed(1)}s! (BRIA RMBG-1.4 - ${
            cachedDevice === 'webgpu' ? 'WebGPU' : 'WASM'
          })`,
        });

        return newResult;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memproses gambar secara offline.';
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

  const loadResult = useCallback((customResult: BgRemovalResult) => {
    setResult(customResult);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    progress,
    result,
    error,
    processImage,
    loadResult,
    reset,
  };
}
