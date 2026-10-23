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
      <CardContent className="p-3.5 space-y-3.5">
        {/* Header & Tabs */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            <span>Pilihan Latar Belakang</span>
          </div>

          <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-secondary rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => handleTypeSelect('transparent')}
              className={`py-1.5 px-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'transparent'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Transparan
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('color')}
              className={`py-1.5 px-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'color'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Warna
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('image')}
              className={`py-1.5 px-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'image'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Foto
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('blur')}
              className={`py-1.5 px-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                bgConfig.type === 'blur'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              Blur Asli
            </button>
          </div>
        </div>

        {/* Color Palette & Passport Photo Badges */}
        {bgConfig.type === 'color' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Dedicated Passport Photo Quick Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Preset Pasfoto Resmi</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleColorSelect('#dc2626')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    bgConfig.color.toLowerCase() === '#dc2626'
                      ? 'border-primary bg-accent ring-1 ring-primary text-foreground'
                      : 'border-border hover:border-border/80 hover:bg-accent/50 text-foreground'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#dc2626] shrink-0 shadow-2xs" />
                  <span className="truncate">Merah Pasfoto</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleColorSelect('#2563eb')}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                    bgConfig.color.toLowerCase() === '#2563eb'
                      ? 'border-primary bg-accent ring-1 ring-primary text-foreground'
                      : 'border-border hover:border-border/80 hover:bg-accent/50 text-foreground'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#2563eb] shrink-0 shadow-2xs" />
                  <span className="truncate">Biru Pasfoto</span>
                </button>
              </div>
            </div>

            {/* Standard Swatches & Custom Color Picker */}
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Warna Lainnya</span>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleColorSelect(preset.value)}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 cursor-pointer shadow-2xs ${
                      preset.border ? 'border border-border' : ''
                    } ${
                      bgConfig.color.toLowerCase() === preset.value.toLowerCase()
                        ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                        : ''
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}

                <label className="w-7 h-7 rounded-full border border-border overflow-hidden cursor-pointer flex items-center justify-center hover:scale-110 transition-transform bg-secondary shadow-2xs">
                  <input
                    type="color"
                    value={bgConfig.color}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="opacity-0 w-0 h-0"
                  />
                  <Palette className="w-3.5 h-3.5 text-foreground" />
                </label>

                <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase ml-0.5">
                  {bgConfig.color}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Blur Slider */}
        {bgConfig.type === 'blur' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Intensitas Blur</span>
              <span className="font-mono text-muted-foreground text-[11px]">{bgConfig.blurRadius}px</span>
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
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
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
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-secondary/40">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {bgImageName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveImage}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center text-xs font-medium h-9"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Pilih Foto Latar Belakang</span>
              </Button>
            )}
          </div>
        )}

        {/* Drop Shadow Section */}
        <div className="pt-2.5 border-t border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
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
              className="h-4 w-4 rounded border-input text-primary accent-primary focus:ring-ring cursor-pointer"
            />
          </div>

          {bgConfig.dropShadow && (
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
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
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
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
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
