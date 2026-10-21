export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ALLOWED_ORIGIN?: string;
  PERSONAL_SECRET_KEY?: string;
}

export interface ImageRecord {
  id: string;
  original_filename: string;
  r2_cutout_key: string;
  r2_original_key: string | null;
  mime_type: string;
  width: number;
  height: number;
  file_size_bytes: number;
  model_used: string;
  bg_config_json: string | null;
  created_at: number;
}
