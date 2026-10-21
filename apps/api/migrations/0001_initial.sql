CREATE TABLE IF NOT EXISTS images_history (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  r2_cutout_key TEXT NOT NULL,
  r2_original_key TEXT,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'isnet_fp16',
  bg_config_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_images_created_at ON images_history(created_at DESC);
