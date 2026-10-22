import React, { useRef } from 'react';
import { Layers, Image as ImageIcon, Palette, X, SunMedium } from 'lucide-react';
import type { BgConfig, BgType } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface BackgroundPanelProps {
  bgConfig: BgConfig;
  onBgConfigChange: (config: BgConfig) => void;
  onSelectBackgroundImage: (file: File | null) => void;
  bgImageName?: string | null;
}

const PRESET_COLORS = [
  { name: 'Putih', value: '#ffffff', border: true },
  { name: 'Hitam', value: '#09090b' },
  { name: 'Abu-abu Terang', value: '#f4f4f5', border: true },
  { name: 'Abu-abu Gelap', value: '#52525b' },
  { name: 'Kuning', value: '#eab308' },
  { name: 'Hijau', value: '#16a34a' },
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
    <Card className="shadow-xs">
      <CardContent className="p-5 space-y-5">
        {/* Header & Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Layers className="w-4 h-4" />
            <span>Pilihan Latar Belakang</span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <button
              type="button"
              onClick={() => handleTypeSelect('transparent')}
              className={`py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'transparent'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Transparan
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('color')}
              className={`py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'color'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Warna
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('image')}
              className={`py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'image'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Foto
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('blur')}
              className={`py-2 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'blur'
                  ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Blur Asli
            </button>
          </div>
        </div>

        {/* Color Palette & Passport Photo Badges */}
        {bgConfig.type === 'color' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Dedicated Passport Photo Quick Buttons - Larger & Legible */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Preset Pasfoto Resmi</span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleColorSelect('#dc2626')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    bgConfig.color.toLowerCase() === '#dc2626'
                      ? 'border-zinc-950 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 ring-1 ring-zinc-950 dark:ring-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#dc2626] shrink-0 shadow-2xs" />
                  <span className="truncate">Merah Pasfoto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleColorSelect('#2563eb')}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    bgConfig.color.toLowerCase() === '#2563eb'
                      ? 'border-zinc-950 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 ring-1 ring-zinc-950 dark:ring-zinc-100'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#2563eb] shrink-0 shadow-2xs" />
                  <span className="truncate">Biru Pasfoto</span>
                </button>
              </div>
            </div>

            {/* Standard Swatches & Custom Color Picker */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Warna Lainnya</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleColorSelect(preset.value)}
                    className={`w-9 h-9 rounded-full transition-transform hover:scale-110 cursor-pointer shadow-2xs ${
                      preset.border ? 'border border-zinc-200 dark:border-zinc-700' : ''
                    } ${
                      bgConfig.color.toLowerCase() === preset.value.toLowerCase()
                        ? 'ring-2 ring-zinc-950 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-950'
                        : ''
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}

                <label className="w-9 h-9 rounded-full border border-zinc-300 dark:border-zinc-700 overflow-hidden cursor-pointer flex items-center justify-center hover:scale-110 transition-transform bg-zinc-50 dark:bg-zinc-900 shadow-2xs">
                  <input
                    type="color"
                    value={bgConfig.color}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="opacity-0 w-0 h-0"
                  />
                  <Palette className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                </label>

                <span className="text-xs font-mono font-medium text-zinc-500 uppercase ml-1">
                  {bgConfig.color}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Blur Slider */}
        {bgConfig.type === 'blur' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Intensitas Blur</span>
              <span className="font-mono text-zinc-500 text-xs">{bgConfig.blurRadius}px</span>
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
              className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
          </div>
        )}

        {/* Custom Image Upload */}
        {bgConfig.type === 'image' && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {bgImageName ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ImageIcon className="w-5 h-5 text-zinc-500 shrink-0" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {bgImageName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveImage}
                  className="h-8 w-8 text-zinc-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center text-sm font-medium h-11"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Pilih Foto Latar Belakang</span>
              </Button>
            )}
          </div>
        )}

        {/* Drop Shadow Section */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Drop Shadow
              </span>
            </div>
            <input
              type="checkbox"
              checked={bgConfig.dropShadow}
              onChange={(e) =>
                onBgConfigChange({
                  ...bgConfig,
                  dropShadow: e.target.checked,
                })
              }
              className="h-4.5 w-4.5 rounded border-zinc-300 text-zinc-900 accent-zinc-900 focus:ring-zinc-950 dark:accent-zinc-100"
            />
          </div>

          {bgConfig.dropShadow && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                  <span>Blur</span>
                  <span className="font-mono">{bgConfig.shadowBlur}px</span>
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
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500 font-medium">
                  <span>Offset Y</span>
                  <span className="font-mono">{bgConfig.shadowOffsetY}px</span>
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
                  className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
