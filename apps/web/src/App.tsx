import { useState, useEffect } from 'react';
import {
  Sparkles,
  History,
  ShieldCheck,
  Zap,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { ProgressBar } from './components/ProgressBar';
import { EditorCanvas } from './components/EditorCanvas';
import { BrushToolbar } from './components/BrushToolbar';
import { BackgroundPanel } from './components/BackgroundPanel';
import { ExportToolbar } from './components/ExportToolbar';
import { HistoryDrawer } from './components/HistoryDrawer';
import { useBgRemoval } from './hooks/useBgRemoval';
import { useCanvasCompositor } from './hooks/useCanvasCompositor';
import type { ModelType, BgConfig, BrushConfig } from './types';
import { uploadHistoryImage } from './lib/api';

export function App() {
  // Global settings
  const [selectedModel, setSelectedModel] = useState<ModelType>('isnet_fp16');
  const [autoResize, setAutoResize] = useState<boolean>(true);
  const [currentFilename, setCurrentFilename] = useState<string>('image.png');
  const [bgImageName, setBgImageName] = useState<string | null>(null);

  // Background Configuration
  const [bgConfig, setBgConfig] = useState<BgConfig>({
    type: 'transparent',
    color: '#ffffff',
    blurRadius: 12,
    dropShadow: false,
    shadowBlur: 16,
    shadowColor: 'rgba(0, 0, 0, 0.35)',
    shadowOffsetY: 8,
  });

  // Brush Configuration
  const [brushConfig, setBrushConfig] = useState<BrushConfig>({
    mode: 'erase',
    size: 35,
    hardness: 0.8,
  });
  const [isBrushActive, setIsBrushActive] = useState<boolean>(false);

  // Cloud History Drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState<boolean>(false);

  // AI Hook
  const { isProcessing, progress, result, processImage, reset: resetRemoval } =
    useBgRemoval();

  // Canvas Compositor Hook
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

  // When AI finishes, initialize the compositor with the original & cutout blobs
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

  // Keyboard shortcuts for Undo / Redo
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

  // Handle image selected from Dropzone or Paste
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

  // Handle custom background image file selection
  const handleSelectBackgroundImage = (file: File | null) => {
    if (file) {
      setBgImageName(file.name);
      setCustomBackgroundImage(file);
    } else {
      setBgImageName(null);
      setCustomBackgroundImage(null);
    }
  };

  // Reset all state to start over
  const handleReset = () => {
    resetRemoval();
    setBgImageName(null);
    setIsBrushActive(false);
  };

  // Save to Cloudflare R2 + D1
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

  // Load image from history drawer
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-gray-900 dark:text-gray-50">
                  Background Remover AI
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Segmentasi objek cepat di browser tanpa biaya server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <History className="w-4 h-4 text-blue-500" />
              <span>Riwayat Cloud</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center">
        {!result ? (
          // Ingestion Screen (Dropzone, Features, Progress)
          <div className="w-full flex flex-col items-center justify-center py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
            {/* Hero Heading */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Hapus Latar Belakang Gambar{' '}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Secara Otomatis & Cepat
                </span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                100% privasi terjaga. Gambar diproses langsung di perangkat Anda menggunakan WebAssembly & ONNX Runtime Web.
              </p>
            </div>

            {/* Ingestion Dropzone */}
            <Dropzone
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              autoResize={autoResize}
              onAutoResizeChange={setAutoResize}
            />

            {/* Progress Bar */}
            <ProgressBar progress={progress} />

            {/* Value propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Privasi 100% Terjaga
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Gambar tidak dikirim ke server pihak ketiga untuk inferensi AI.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Gratis Tanpa Batas
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Tidak ada limit kuota bulanan atau biaya kredit per gambar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <Layers className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Editor Lengkap
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Preset warna pasfoto, bokeh blur asli, kuas Erase & Restore manual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Post-Processing Studio Editor
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in duration-300">
            {/* Meta Bar */}
            <div className="flex flex-wrap items-center justify-between w-full max-w-4xl px-2 gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Kembali ke halaman unggah"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {currentFilename}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{result.width} × {result.height} px</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {(result.durationMs / 1000).toFixed(1)}s
                    </span>
                    <span>•</span>
                    <span className="uppercase text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">
                      {selectedModel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Canvas */}
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

            {/* Brush & Mask Toolbar */}
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

            {/* Background Panel (Colors, Image, Blur, Shadow) */}
            <div className="w-full max-w-4xl">
              <BackgroundPanel
                bgConfig={bgConfig}
                onBgConfigChange={setBgConfig}
                onSelectBackgroundImage={handleSelectBackgroundImage}
                bgImageName={bgImageName}
              />
            </div>

            {/* Export Toolbar (PNG, WebP, Clipboard, Cloud Save) */}
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
