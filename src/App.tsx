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
import { saveLocalHistory } from './lib/localHistory';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';

export function App() {
  const [selectedModel, setSelectedModel] = useState<ModelType>('imgly');
  const [autoResize, setAutoResize] = useState<boolean>(true);
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

  const { isProcessing, progress, result, processImage, reset: resetRemoval, loadResult } =
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

    const res = await processImage(file, {
      model: selectedModel,
      autoResize,
      maxDimension: 2048,
    });

    if (res) {
      try {
        await saveLocalHistory({
          originalFilename: name,
          cutoutBlob: res.cutoutBlob,
          originalBlob: res.originalBlob,
          mimeType: 'image/png',
          width: res.width,
          height: res.height,
          fileSizeBytes: res.cutoutBlob.size,
          modelUsed: res.modelUsed,
          bgConfigJson: JSON.stringify(bgConfig),
        });
      } catch (saveErr) {
        console.warn('Gagal menyimpan riwayat lokal:', saveErr);
      }
    }
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

  const handleLoadFromHistory = async (
    cutoutBlob: Blob,
    originalBlob?: Blob,
    filename?: string
  ) => {
    const name = filename || 'history-image.png';
    setCurrentFilename(name);
    setBgImageName(null);
    setBgConfig((prev) => ({ ...prev, type: 'transparent' }));
    setIsBrushActive(false);

    const orig = originalBlob || cutoutBlob;
    const cutoutUrl = URL.createObjectURL(cutoutBlob);
    const originalUrl = URL.createObjectURL(orig);

    try {
      const bitmap = await createImageBitmap(cutoutBlob);
      const width = bitmap.width;
      const height = bitmap.height;
      bitmap.close();

      loadResult({
        cutoutBlob,
        cutoutUrl,
        originalBlob: orig,
        originalUrl,
        width,
        height,
        durationMs: 0,
        modelUsed: selectedModel,
      });
    } catch (err) {
      console.error('Failed to load history item:', err);
      alert('Gagal memuat gambar dari riwayat.');
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 shrink-0 border-b border-border bg-background/95 backdrop-blur-xs z-30 px-3 sm:px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {result ? (
            // Studio Mode Header: Back button + Title + Filename + Dimensions
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8 shrink-0"
                title="Ganti Gambar"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <div className="hidden md:flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  BG Remover
                </span>
                <span className="text-border">|</span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">
                  {currentFilename}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border/60 shrink-0">
                  <span>{result.width}×{result.height}</span>
                  <span>•</span>
                  <span>{(result.durationMs / 1000).toFixed(1)}s</span>
                  <span>•</span>
                  <span>{result.modelUsed === 'imgly' ? 'IMG.LY' : 'BRIA'}</span>
                </div>
              </div>
            </div>
          ) : (
            // Ingestion Mode Header
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight text-foreground">
                BG Remover
              </span>
              <Badge
                variant="outline"
                className="text-[11px] font-medium px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {selectedModel === 'imgly' ? 'IMG.LY AI (Default)' : 'BRIA RMBG-1.4 (Offline)'}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="h-8 text-xs font-medium px-2.5"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </Button>
        </div>
      </header>

      {/* Main Single-Viewport Container */}
      <main className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
        {!result ? (
          // Ingestion View: Centered Dropzone (Zero-Scroll Viewport)
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 overflow-y-auto w-full max-w-xl mx-auto">
            <div className="text-center space-y-1 mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Hapus Latar Belakang
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Unggah gambar untuk menghapus latar belakang otomatis langsung di browser (100% Client-Side).
              </p>
            </div>

            <Dropzone
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              progress={progress}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              autoResize={autoResize}
              onAutoResizeChange={setAutoResize}
            />
          </div>
        ) : (
          // Two-Column Studio Editor View (Zero-Scroll Viewport)
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-3 gap-3 overflow-hidden w-full max-w-[1920px] mx-auto">
            {/* Left Column: Dynamic Flex-Sized Canvas & Toolbars */}
            <div className="flex-1 min-h-0 flex flex-col gap-2 min-w-0 overflow-hidden">
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

            {/* Right Column (Sidebar Inspector): Export & Background Controls */}
            <div className="w-full lg:w-80 xl:w-88 flex flex-col min-h-0 shrink-0 gap-2.5 overflow-y-auto pr-0.5">
              <ExportToolbar
                onExport={(format) => exportBlob(bgConfig, format)}
                originalFilename={currentFilename}
                onReset={handleReset}
              />

              <BackgroundPanel
                bgConfig={bgConfig}
                onBgConfigChange={setBgConfig}
                onSelectBackgroundImage={handleSelectBackgroundImage}
                bgImageName={bgImageName}
              />
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
