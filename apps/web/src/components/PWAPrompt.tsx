import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X, Check } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAPrompt: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showOfflineToast, setShowOfflineToast] = useState<boolean>(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      setShowOfflineToast(true);
      const timer = setTimeout(() => {
        setShowOfflineToast(false);
        setOfflineReady(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  // Capture beforeinstallprompt for PWA install button
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('Install PWA error:', err);
    } finally {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {/* Install PWA Prompt Banner (floating bottom bar if installable and not installed) */}
      {installPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 z-40 max-w-sm w-[calc(100%-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-lg flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm truncate">
                  Pasang Aplikasi
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  Gunakan offline & akses cepat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={handleInstallClick}
                className="h-8 text-xs font-medium px-3"
              >
                Pasang
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setInstallPrompt(null)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Ready Toast Notification */}
      {showOfflineToast && (
        <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg px-3.5 py-2.5 shadow-lg flex items-center gap-2 text-xs font-medium">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Aplikasi siap digunakan secara offline!</span>
          </div>
        </div>
      )}

      {/* New Version Update Banner */}
      {needRefresh && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xl flex items-center gap-3 text-sm">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                Versi Baru Tersedia
              </p>
              <p className="text-[11px] text-zinc-500">
                Segarkan untuk memperbarui aplikasi.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => updateServiceWorker(true)}
                className="h-8 text-xs font-medium px-3 gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Segarkan</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setNeedRefresh(false)}
                className="h-8 w-8 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
