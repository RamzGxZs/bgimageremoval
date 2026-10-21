import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, SplitSquareVertical } from 'lucide-react';
import type { BgConfig, BrushConfig } from '../types';

interface EditorCanvasProps {
  width: number;
  height: number;
  bgConfig: BgConfig;
  brushConfig: BrushConfig;
  isBrushActive: boolean;
  onDrawStroke: (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    brushConfig: BrushConfig,
    isFinal: boolean
  ) => void;
  renderComposite: (
    canvas: HTMLCanvasElement,
    bgConfig: BgConfig,
    options?: { splitPos?: number; showComparison?: boolean }
  ) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  width,
  height,
  bgConfig,
  brushConfig,
  isBrushActive,
  onDrawStroke,
  renderComposite,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Split Slider state
  const [splitPos, setSplitPos] = useState<number>(0.5);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Zoom & Pan state
  const [scale, setScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Brush drawing state
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Custom brush circle indicator
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    renderComposite(canvas, bgConfig, {
      splitPos: isComparing ? splitPos : 1,
      showComparison: isComparing,
    });
  }, [width, height, bgConfig, isComparing, splitPos, renderComposite]);

  useEffect(() => {
    updateCanvas();
  }, [updateCanvas]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * width;
    const y = ((clientY - rect.top) / rect.height) * height;

    return {
      x: Math.max(0, Math.min(width, x)),
      y: Math.max(0, Math.min(height, y)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSlider) return;

    if (isBrushActive) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      if (!coords) return;
      isDrawingRef.current = true;
      lastPointRef.current = coords;
      onDrawStroke(coords.x, coords.y, coords.x, coords.y, brushConfig, false);
      updateCanvas();
    } else if (e.button === 0 && (scale > 1 || e.shiftKey)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container && isBrushActive) {
      const rect = container.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    }

    if (isBrushActive && isDrawingRef.current && lastPointRef.current) {
      const coords = getCanvasCoordinates(e.clientX, e.clientY);
      if (!coords) return;
      onDrawStroke(
        lastPointRef.current.x,
        lastPointRef.current.y,
        coords.x,
        coords.y,
        brushConfig,
        false
      );
      lastPointRef.current = coords;
      updateCanvas();
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    } else if (isDraggingSlider && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      setSplitPos(Math.max(0.02, Math.min(0.98, relativeX)));
    }
  };

  const handleMouseUp = () => {
    if (isDrawingRef.current && lastPointRef.current) {
      onDrawStroke(
        lastPointRef.current.x,
        lastPointRef.current.y,
        lastPointRef.current.x,
        lastPointRef.current.y,
        brushConfig,
        true
      );
      isDrawingRef.current = false;
      lastPointRef.current = null;
      updateCanvas();
    }
    setIsPanning(false);
    setIsDraggingSlider(false);
  };

  const handleMouseLeave = () => {
    if (isDrawingRef.current) {
      handleMouseUp();
    }
    setCursorPos((prev) => ({ ...prev, visible: false }));
    setIsPanning(false);
  };

  const handleZoomIn = () => setScale((s) => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));
  const handleResetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center w-full space-y-3">
      {/* Top Toolbar: Compare & Zoom */}
      <div className="flex items-center justify-between w-full max-w-4xl px-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsComparing(!isComparing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isComparing
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Before / After Slider</span>
          </button>
          {isComparing && (
            <span className="text-[11px] text-gray-400">
              Kiri: Asli | Kanan: Hasil Edit
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Perkecil"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Reset Ukuran"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Perbesar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l border-gray-200 dark:border-gray-700"
            title="Sesuaikan Layar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Container with Checkerboard Background */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full max-w-4xl h-[480px] sm:h-[580px] rounded-2xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-700 select-none flex items-center justify-center ${
          bgConfig.type === 'transparent' ? 'bg-checkerboard' : 'bg-gray-950'
        } ${isBrushActive ? 'cursor-none' : scale > 1 ? 'cursor-grab' : 'cursor-default'}`}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
          className="max-w-full max-h-full flex items-center justify-center"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[460px] sm:max-h-[560px] object-contain shadow-lg"
            style={{
              aspectRatio: `${width} / ${height}`,
            }}
          />
        </div>

        {isBrushActive && cursorPos.visible && (
          <div
            className={`pointer-events-none absolute rounded-full border border-dashed transition-transform -translate-x-1/2 -translate-y-1/2 ${
              brushConfig.mode === 'erase'
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-emerald-500 bg-emerald-500/10'
            }`}
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: brushConfig.size * scale,
              height: brushConfig.size * scale,
            }}
          />
        )}

        {isComparing && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSlider(true);
            }}
            className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center -translate-x-1/2"
            style={{ left: `${splitPos * 100}%` }}
          >
            <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
            <div className="w-8 h-8 rounded-full bg-white text-gray-800 shadow-lg border border-gray-200 flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
              ↔
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
