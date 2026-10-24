import { useRef, useCallback, useState } from 'react';
import type { BgConfig, BrushConfig } from '../types';
import { loadImage } from '../lib/imageUtils';

export interface CompositorOptions {
  originalBlob: Blob;
  cutoutBlob: Blob;
  width: number;
  height: number;
  bgConfig: BgConfig;
  brushConfig: BrushConfig;
}

export function useCanvasCompositor() {
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Undo / Redo history for mask
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [isReady, setIsReady] = useState(false);

  const saveHistoryState = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const state = ctx.getImageData(0, 0, width, height);
      // Truncate redo states
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push(state);

      // Cap at 15 steps
      if (newHistory.length > 15) {
        newHistory.shift();
      }

      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
    } catch (e) {
      console.warn('Failed to save history state', e);
    }
  };

  // Initialize compositor with original image & cutout
  const initialize = useCallback(
    async (originalBlob: Blob, cutoutBlob: Blob, width: number, height: number) => {
      setIsReady(false);
      historyRef.current = [];
      historyIndexRef.current = -1;
      setCanUndo(false);
      setCanRedo(false);

      // Load original image
      const origImg = await loadImage(originalBlob);
      originalImageRef.current = origImg;

      // Load cutout to generate initial mask
      const cutoutImg = await loadImage(cutoutBlob);

      // Setup mask canvas
      let maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) {
        maskCanvas = document.createElement('canvas');
        maskCanvasRef.current = maskCanvas;
      }
      maskCanvas.width = width;
      maskCanvas.height = height;

      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (!maskCtx) return;

      // Draw cutout to extract alpha mask
      maskCtx.clearRect(0, 0, width, height);
      maskCtx.drawImage(cutoutImg, 0, 0, width, height);

      // Convert alpha channel to solid mask
      const imgData = maskCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        }
      }
      maskCtx.putImageData(imgData, 0, 0);

      // Save initial state to history
      saveHistoryState(maskCtx, width, height);
      setIsReady(true);
    },
    []
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0 && maskCanvasRef.current) {
      historyIndexRef.current -= 1;
      const maskCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (maskCtx) {
        maskCtx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(true);
      }
    }
  }, []);

  const redo = useCallback(() => {
    if (
      historyIndexRef.current < historyRef.current.length - 1 &&
      maskCanvasRef.current
    ) {
      historyIndexRef.current += 1;
      const maskCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (maskCtx) {
        maskCtx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
        setCanUndo(true);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    }
  }, []);

  // Set custom background image if user chooses 'image' mode
  const setCustomBackgroundImage = useCallback(async (fileOrUrl: Blob | string | null) => {
    if (!fileOrUrl) {
      backgroundImageRef.current = null;
      return;
    }
    try {
      const img = await loadImage(fileOrUrl);
      backgroundImageRef.current = img;
    } catch (e) {
      console.error('Failed to load background image', e);
      backgroundImageRef.current = null;
    }
  }, []);

  // Stroke brush on the mask canvas
  const drawBrushStroke = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      brushConfig: BrushConfig,
      isFinal = false
    ) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (!maskCtx) return;

      maskCtx.save();
      maskCtx.lineCap = 'round';
      maskCtx.lineJoin = 'round';
      maskCtx.lineWidth = brushConfig.size;

      if (brushConfig.mode === 'erase') {
        maskCtx.globalCompositeOperation = 'destination-out';
        maskCtx.strokeStyle = 'rgba(0, 0, 0, 1)';
      } else {
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.strokeStyle = 'rgba(255, 255, 255, 1)';
      }

      if (brushConfig.hardness < 0.95) {
        maskCtx.shadowBlur = (1 - brushConfig.hardness) * (brushConfig.size / 2);
        maskCtx.shadowColor =
          brushConfig.mode === 'erase' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
      }

      maskCtx.beginPath();
      maskCtx.moveTo(startX, startY);
      maskCtx.lineTo(endX, endY);
      maskCtx.stroke();
      maskCtx.restore();

      if (isFinal) {
        saveHistoryState(maskCtx, maskCanvas.width, maskCanvas.height);
      }
    },
    []
  );

  // Render composite onto a target canvas
  const renderComposite = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      bgConfig: BgConfig,
      options: {
        forExport?: boolean;
        splitPos?: number;
        showComparison?: boolean;
      } = {}
    ) => {
      const { forExport = false, splitPos = 1, showComparison = false } = options;
      const width = targetCanvas.width;
      const height = targetCanvas.height;
      const ctx = targetCanvas.getContext('2d');
      if (!ctx || !originalImageRef.current || !maskCanvasRef.current) return;

      const originalImg = originalImageRef.current;
      const maskCanvas = maskCanvasRef.current;

      const fgCanvas = document.createElement('canvas');
      fgCanvas.width = width;
      fgCanvas.height = height;
      const fgCtx = fgCanvas.getContext('2d');
      if (!fgCtx) return;

      fgCtx.drawImage(originalImg, 0, 0, width, height);
      fgCtx.globalCompositeOperation = 'destination-in';
      fgCtx.drawImage(maskCanvas, 0, 0, width, height);

      ctx.clearRect(0, 0, width, height);

      const renderEdited = (context: CanvasRenderingContext2D) => {
        if (bgConfig.type === 'color') {
          context.fillStyle = bgConfig.color;
          context.fillRect(0, 0, width, height);
        } else if (bgConfig.type === 'blur') {
          context.save();
          context.filter = `blur(${bgConfig.blurRadius}px)`;
          context.drawImage(originalImg, -10, -10, width + 20, height + 20);
          context.restore();
        } else if (bgConfig.type === 'image' && backgroundImageRef.current) {
          const bgImg = backgroundImageRef.current;
          const scale = Math.max(width / bgImg.naturalWidth, height / bgImg.naturalHeight);
          const bgW = bgImg.naturalWidth * scale;
          const bgH = bgImg.naturalHeight * scale;
          const bgX = (width - bgW) / 2;
          const bgY = (height - bgH) / 2;
          context.drawImage(bgImg, bgX, bgY, bgW, bgH);
        }

        if (bgConfig.dropShadow) {
          context.save();
          context.shadowColor = bgConfig.shadowColor;
          context.shadowBlur = bgConfig.shadowBlur;
          context.shadowOffsetY = bgConfig.shadowOffsetY;
          context.drawImage(fgCanvas, 0, 0, width, height);
          context.restore();
        }

        context.drawImage(fgCanvas, 0, 0, width, height);
      };

      if (showComparison && !forExport && splitPos < 1) {
        const splitX = Math.round(width * splitPos);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, height);
        ctx.clip();
        ctx.drawImage(originalImg, 0, 0, width, height);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, width - splitX, height);
        ctx.clip();
        renderEdited(ctx);
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, height);
        ctx.stroke();
        ctx.restore();
      } else {
        renderEdited(ctx);
      }
    },
    []
  );

  // Generate final export Blob
  const exportBlob = useCallback(
    async (
      bgConfig: BgConfig,
      format: 'image/png' | 'image/webp' = 'image/png',
      quality = 0.95
    ): Promise<Blob> => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) throw new Error('Mask canvas not initialized');

      const width = maskCanvas.width;
      const height = maskCanvas.height;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;

      renderComposite(exportCanvas, bgConfig, { forExport: true });

      return new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Export conversion failed'));
          },
          format,
          quality
        );
      });
    },
    [renderComposite]
  );

  return {
    isReady,
    initialize,
    drawBrushStroke,
    renderComposite,
    exportBlob,
    setCustomBackgroundImage,
    undo,
    redo,
    canUndo,
    canRedo,
    maskCanvasRef,
  };
}
