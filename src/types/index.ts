export type ModelType = 'imgly' | 'bria-rmbg-1.4';

export type BgType = 'transparent' | 'color' | 'image' | 'blur';

export interface BgConfig {
  type: BgType;
  color: string;
  imageUrl?: string;
  blurRadius: number; // 0 - 30
  dropShadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetY: number;
}

export type ProcessStage = 'idle' | 'downloading' | 'processing' | 'completed' | 'error';

export interface ProcessProgress {
  stage: ProcessStage;
  key?: string;
  current: number;
  total: number;
  percent: number;
  message: string;
}

export type BrushMode = 'erase' | 'restore';

export interface BrushConfig {
  mode: BrushMode;
  size: number;
  hardness: number;
}

export interface HistoryItem {
  id: string;
  originalFilename: string;
  cutoutBlob: Blob;
  originalBlob?: Blob;
  cutoutUrl: string;
  originalUrl?: string;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  modelUsed: string;
  bgConfigJson?: string;
  createdAt: number;
}
