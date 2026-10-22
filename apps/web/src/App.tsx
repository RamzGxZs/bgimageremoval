import { useState, useEffect } from 'react';
import {
  Sparkles,
  History,
  ArrowLeft,
} from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { EditorCanvas } from './components/EditorCanvas';
import { BrushToolbar } from './components/BrushToolbar';
import { BackgroundPanel } from './components/BackgroundPanel';
import { ExportToolbar } from './components/ExportToolbar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { useBgRemoval } from './hooks/useBgRemoval';
import { useCanvasCompositor } from './hooks/useCanvasCompositor';
import type { ModelType, BgConfig, BrushConfig } from './types';
import { uploadHistoryImage } from './lib/api';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

export function App() {
  const [selectedModel] = useState<ModelType>('isnet_fp16');
  const [autoResize] = useState<boolean>(true);
  const [currentFilename, setCurrentFilename] = useState<string>('image.png');
  const [bgImageName, setBgImageName] = useState<string | null>(null);

  const [bgConfig, setBgConfig] = useState<BgConfig>({
    type: 'transparent',
    color: '#ffffff',
    blurRadius: 12,
    dropShadow: false,
    shadowBlur: 16,
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    shadowOffsetY: 8,
  });

  const [brushConfig, setBrushConfig] = useState<BrushConfig>({
    mode: 'erase',
    size: 35,
    hardness: 0.8,
  });
  const [isBrushActive, setIsBrushActive] = useState<boolean>(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);

  const { isProcessing, progress, result, processImage, reset: resetRemoval } =
    useBgRemoval();

  const {
    isReady: isCompositorReady,
    initialize: initCompositor,
    drawBrushStroke,
    renderComposite,
    exportBlob,
    setCustomBackgroundImage,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCanvasCompositor();

  useEffect(() => {
    if (result) {
      initCompositor(
        result.originalBlob,
        result.cutoutBlob,
        result.width,
        result.height
      );
    }
  }, [result, initCompositor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleImageSelected = async (file: Blob, filename?: string) => {
    const name = filename || 'image.png';
    setCurrentFilename(name);
    setBgImageName(null);
    setBgConfig((prev) => ({ ...prev, type: 'transparent' }));
    setIsBrushActive(false);

    await processImage(file, {
      model: selectedModel,
      autoResize,
      maxDimension: 2048,
    });
  };

  const handleSelectBackgroundImage = (file: File | null) => {
    if (file) {
      setBgImageName(file.name);
      setCustomBackgroundImage(file);
    } else {
      setBgImageName(null);
      setCustomBackgroundImage(null);
    }
  };

  const handleReset = () => {
    resetRemoval();
    setBgImageName(null);
    setIsBrushActive(false);
  };

  const handleSaveToCloud = async (finalCutoutBlob: Blob) => {
    if (!result) return;
    setIsSavingToCloud(true);
    try {
      await uploadHistoryImage(
        finalCutoutBlob,
        {
          originalFilename: currentFilename,
          width: result.width,
          height: result.height,
          modelUsed: selectedModel,
          bgConfigJson: JSON.stringify(bgConfig),
        },
        result.originalBlob
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan ke cloud';
      alert(msg);
      throw err;
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleLoadFromHistory = async (cutoutUrl: string, originalUrl?: string, filename?: string) => {
    try {
      const res = await fetch(cutoutUrl);
      const cutoutBlob = await res.blob();

      let origBlob = cutoutBlob;
      if (originalUrl) {
        const origRes = await fetch(originalUrl);
        origBlob = await origRes.blob();
      }

      handleImageSelected(origBlob, filename || 'history-image.png');
    } catch {
      alert('Gagal memuat gambar dari riwayat.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              BG Remover
            </span>
            <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
              AI
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="text-xs"
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {!result ? (
          // Ingestion: Just Title and Dropzone (Loading happens inside Dropzone)
          <div className="w-full flex flex-col items-center space-y-6 max-w-xl my-auto py-8">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Hapus Latar Belakang
              </h1>
              <p className="text-xs text-zinc-500">
                Unggah gambar untuk menghapus latar belakang secara otomatis.
              </p>
            </div>

            <Dropzone
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              progress={progress}
            />
          </div>
        ) : (
          // Editor Studio
          <div className="w-full flex flex-col items-center space-y-4">
            {/* Meta Bar */}
            <div className="flex flex-wrap items-center justify-between w-full max-w-4xl px-1">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  className="h-8 w-8"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
                    {currentFilename}
                  </h2>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span>{result.width} × {result.height} px</span>
                    <span>•</span>
                    <span className="font-mono">{(result.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Canvas */}
            {isCompositorReady && (
              <EditorCanvas
                width={result.width}
                height={result.height}
                bgConfig={bgConfig}
                brushConfig={brushConfig}
                isBrushActive={isBrushActive}
                onDrawStroke={drawBrushStroke}
                renderComposite={renderComposite}
              />
            )}

            {/* Brush Toolbar */}
            <div className="w-full max-w-4xl">
              <BrushToolbar
                brushConfig={brushConfig}
                onBrushConfigChange={setBrushConfig}
                isBrushActive={isBrushActive}
                onToggleBrushActive={setIsBrushActive}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </div>

            {/* Background Panel */}
            <div className="w-full max-w-4xl">
              <BackgroundPanel
                bgConfig={bgConfig}
                onBgConfigChange={setBgConfig}
                onSelectBackgroundImage={handleSelectBackgroundImage}
                bgImageName={bgImageName}
              />
            </div>

            {/* Export Toolbar */}
            <ExportToolbar
              onExport={(format) => exportBlob(bgConfig, format)}
              originalFilename={currentFilename}
              onReset={handleReset}
              onSaveToCloud={handleSaveToCloud}
              isSavingToCloud={isSavingToCloud}
            />
          </div>
        )}
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectImage={handleLoadFromHistory}
      />
    </div>
  );
}

export default App;
