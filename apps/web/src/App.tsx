import { useState, useEffect } from 'react';
import {
  Sparkles,
  History,
  ArrowLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { EditorCanvas } from './components/EditorCanvas';
import { BrushToolbar } from './components/BrushToolbar';
import { BackgroundPanel } from './components/BackgroundPanel';
import { ExportToolbar } from './components/ExportToolbar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { PWAPrompt } from './components/PWAPrompt';
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

  // Theme toggle state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-semibold text-base tracking-tight">
              BG Remover
            </span>
            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5">
              AI Client-side
            </Badge>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setIsHistoryOpen(true)}
              className="h-9 text-sm font-medium"
            >
              <History className="w-4 h-4" />
              <span>Riwayat</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {!result ? (
          // Ingestion View: Simple Title + In-Place Dropzone (Enlarged)
          <div className="w-full flex flex-col items-center space-y-8 max-w-2xl mx-auto my-auto py-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Hapus Latar Belakang
              </h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400">
                Unggah gambar untuk menghapus latar belakang secara otomatis dengan AI lokal.
              </p>
            </div>

            <Dropzone
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              progress={progress}
            />
          </div>
        ) : (
          // Two-Column Studio Editor View
          <div className="w-full flex flex-col space-y-4">
            {/* Meta Bar */}
            <div className="flex flex-wrap items-center justify-between px-1 gap-2">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  className="h-9 w-9"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md">
                    {currentFilename}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{result.width} × {result.height} px</span>
                    <span>•</span>
                    <span className="font-mono">{(result.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Canvas & Brush Controls */}
              <div className="lg:col-span-8 flex flex-col space-y-3">
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

              {/* Right Column (Sidebar Inspector): Export Actions & Background Options */}
              <div className="lg:col-span-4 flex flex-col space-y-4 lg:sticky lg:top-20">
                <ExportToolbar
                  onExport={(format) => exportBlob(bgConfig, format)}
                  originalFilename={currentFilename}
                  onReset={handleReset}
                  onSaveToCloud={handleSaveToCloud}
                  isSavingToCloud={isSavingToCloud}
                />

                <BackgroundPanel
                  bgConfig={bgConfig}
                  onBgConfigChange={setBgConfig}
                  onSelectBackgroundImage={handleSelectBackgroundImage}
                  bgImageName={bgImageName}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectImage={handleLoadFromHistory}
      />

      {/* PWA Offline & Install Prompt */}
      <PWAPrompt />
    </div>
  );
}

export default App;
