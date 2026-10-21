import React, { useRef } from 'react';
import { Layers, Image as ImageIcon, Palette, X, SunMedium } from 'lucide-react';
import type { BgConfig, BgType } from '../types';

interface BackgroundPanelProps {
  bgConfig: BgConfig;
  onBgConfigChange: (config: BgConfig) => void;
  onSelectBackgroundImage: (file: File | null) => void;
  bgImageName?: string | null;
}

const PRESET_COLORS = [
  { name: 'Transparan', value: 'transparent', isTransparent: true },
  { name: 'Putih', value: '#ffffff', border: true },
  { name: 'Hitam', value: '#111827' },
  { name: 'Merah Pasfoto', value: '#db1514', badge: 'Pasfoto' },
  { name: 'Biru Pasfoto', value: '#0090ff', badge: 'Pasfoto' },
  { name: 'Kuning', value: '#eab308' },
  { name: 'Abu-abu', value: '#9ca3af' },
  { name: 'Hijau', value: '#10b981' },
];

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  bgConfig,
  onBgConfigChange,
  onSelectBackgroundImage,
  bgImageName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeSelect = (type: BgType) => {
    onBgConfigChange({
      ...bgConfig,
      type,
    });
  };

  const handleColorSelect = (color: string) => {
    onBgConfigChange({
      ...bgConfig,
      type: 'color',
      color,
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onSelectBackgroundImage(file);
      onBgConfigChange({
        ...bgConfig,
        type: 'image',
      });
    }
  };

  const handleRemoveImage = () => {
    onSelectBackgroundImage(null);
    onBgConfigChange({
      ...bgConfig,
      type: 'transparent',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
      {/* Title & Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <Layers className="w-4 h-4 text-blue-500" />
          <span>Pengaturan Latar Belakang</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeSelect('transparent')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              bgConfig.type === 'transparent'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Transparan
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('color')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              bgConfig.type === 'color'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Warna
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('image')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              bgConfig.type === 'image'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Foto Latar
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect('blur')}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              bgConfig.type === 'blur'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Blur Asli
          </button>
        </div>
      </div>

      {/* Mode-Specific Controls */}
      {bgConfig.type === 'color' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
            Pilihan Warna Preset & Pasfoto
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.filter((p) => !p.isTransparent).map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleColorSelect(preset.value)}
                className={`relative w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
                  preset.border ? 'border border-gray-300 dark:border-gray-600' : ''
                } ${
                  bgConfig.color.toLowerCase() === preset.value.toLowerCase()
                    ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800 scale-105'
                    : ''
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              />
            ))}

            <label className="relative w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer flex items-center justify-center hover:scale-110 transition-transform">
              <input
                type="color"
                value={bgConfig.color}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Palette className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </label>
          </div>
          <div className="text-[11px] text-gray-400">
            Warna saat ini:{' '}
            <span className="font-mono uppercase font-medium text-gray-700 dark:text-gray-300">
              {bgConfig.color}
            </span>
          </div>
        </div>
      )}

      {bgConfig.type === 'blur' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Tingkat Kelembutan Blur (Bokeh)
            </span>
            <span className="font-mono text-gray-500">{bgConfig.blurRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={bgConfig.blurRadius}
            onChange={(e) =>
              onBgConfigChange({
                ...bgConfig,
                blurRadius: Number(e.target.value),
              })
            }
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-[11px] text-gray-400">
            Menggunakan latar belakang asli foto dengan efek bokeh kamera profesional.
          </p>
        </div>
      )}

      {bgConfig.type === 'image' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageFileChange}
            className="hidden"
          />

          {bgImageName ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {bgImageName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                title="Hapus gambar latar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Unggah Foto Latar Belakang Baru</span>
            </button>
          )}
        </div>
      )}

      {/* Drop Shadow Controls */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SunMedium className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
              Efek Bayangan (Drop Shadow)
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={bgConfig.dropShadow}
              onChange={(e) =>
                onBgConfigChange({
                  ...bgConfig,
                  dropShadow: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {bgConfig.dropShadow && (
          <div className="space-y-3 pt-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Blur Bayangan</span>
              <span className="font-mono text-gray-600 dark:text-gray-400">
                {bgConfig.shadowBlur}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={bgConfig.shadowBlur}
              onChange={(e) =>
                onBgConfigChange({
                  ...bgConfig,
                  shadowBlur: Number(e.target.value),
                })
              }
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Jarak Vertikal (Offset)</span>
              <span className="font-mono text-gray-600 dark:text-gray-400">
                {bgConfig.shadowOffsetY}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={bgConfig.shadowOffsetY}
              onChange={(e) =>
                onBgConfigChange({
                  ...bgConfig,
                  shadowOffsetY: Number(e.target.value),
                })
              }
              className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        )}
      </div>
    </div>
  );
};
