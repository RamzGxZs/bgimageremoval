import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, SplitSquareVertical } from 'lucide-react';
import type { BgConfig, BrushConfig } from '../types';
import { Button } from './ui/button';

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

  const [splitPos, setSplitPos] = useState<number>(0.5);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  const [scale, setScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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
      {/* Top Controls Toolbar - Larger size */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isComparing ? 'secondary' : 'outline'}
            size="default"
            onClick={() => setIsComparing(!isComparing)}
            className="text-sm font-medium h-10 px-4"
          >
            <SplitSquareVertical className="w-4 h-4" />
            <span>Before / After Slider</span>
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 rounded-lg shadow-2xs">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
            title="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 text-sm font-mono font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 cursor-pointer"
            title="Reset Ukuran"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400"
            title="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="h-8 w-8 text-zinc-600 dark:text-zinc-400 border-l border-zinc-200 dark:border-zinc-800 rounded-none pl-2"
            title="Sesuaikan Layar"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Canvas Container - Spacious & Clear */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full h-[480px] sm:h-[560px] lg:h-[620px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 select-none flex items-center justify-center shadow-xs ${
          bgConfig.type === 'transparent' ? 'bg-checkerboard' : 'bg-zinc-900'
        } ${isBrushActive ? 'cursor-none' : scale > 1 ? 'cursor-grab' : 'cursor-default'}`}
      >
        {/* Comparison Labels */}
        {isComparing && (
          <>
            <div className="absolute top-4 left-4 z-10 pointer-events-none px-3 py-1 rounded-md bg-black/75 backdrop-blur-xs text-xs font-semibold text-white shadow">
              Foto Asli
            </div>
            <div className="absolute top-4 right-4 z-10 pointer-events-none px-3 py-1 rounded-md bg-black/75 backdrop-blur-xs text-xs font-semibold text-white shadow">
              Hasil Potongan
            </div>
          </>
        )}

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
            className="max-w-full max-h-[460px] sm:max-h-[540px] lg:max-h-[600px] object-contain shadow-sm"
            style={{
              aspectRatio: `${width} / ${height}`,
            }}
          />
        </div>

        {/* Brush indicator */}
        {isBrushActive && cursorPos.visible && (
          <div
            className="pointer-events-none absolute rounded-full border border-zinc-900 dark:border-zinc-100 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/10 dark:bg-zinc-100/10"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: brushConfig.size * scale,
              height: brushConfig.size * scale,
            }}
          />
        )}

        {/* Split Slider Handle */}
        {isComparing && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSlider(true);
            }}
            className="absolute top-0 bottom-0 z-20 cursor-ew-resize flex items-center justify-center -translate-x-1/2"
            style={{ left: `${splitPos * 100}%` }}
          >
            <div className="w-[2px] h-full bg-white shadow-xs" />
            <div className="w-8 h-8 rounded-full bg-white text-zinc-900 shadow-md border border-zinc-200 flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
              ↔
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
