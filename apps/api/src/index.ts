import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import type { Env, ImageRecord } from './types';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS
app.use('*', async (c, next) => {
  const origin = c.env.ALLOWED_ORIGIN || '*';
  const corsMiddleware = cors({
    origin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'ETag'],
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    if (c.env.DB) {
      await c.env.DB.prepare('SELECT 1').run();
    }
    return c.json({
      ok: true,
      timestamp: Math.floor(Date.now() / 1000),
      environment: 'cloudflare-worker',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database check failed';
    return c.json({ ok: false, error: message }, 500);
  }
});

// Stream image directly from R2 Bucket with high performance caching
app.get('/api/files/:type/:key', async (c) => {
  const type = c.req.param('type');
  const key = c.req.param('key');

  if (type !== 'cutouts' && type !== 'originals') {
    return c.text('Invalid file type', 400);
  }

  const r2Key = `${type}/${key}`;
  const object = await c.env.BUCKET.get(r2Key);

  if (!object) {
    return c.text('Image not found', 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'image/png');
  }

  return new Response(object.body, { headers });
});

// Get history from Cloudflare D1 (Protected by auth PIN / Bearer token)
app.get('/api/history', authMiddleware, async (c) => {
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const offset = Math.max(0, Number(c.req.query('offset') || 0));

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM images_history'
  ).first<{ total: number }>();
  const total = countResult?.total || 0;

  const records = await c.env.DB.prepare(
    `SELECT * FROM images_history ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all<ImageRecord>();

  const items = (records.results || []).map((row) => ({
    id: row.id,
    originalFilename: row.original_filename,
    cutoutUrl: `/api/files/cutouts/${row.r2_cutout_key}`,
    originalUrl: row.r2_original_key ? `/api/files/originals/${row.r2_original_key}` : undefined,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    fileSizeBytes: row.file_size_bytes,
    modelUsed: row.model_used,
    bgConfigJson: row.bg_config_json,
    createdAt: row.created_at,
  }));

  return c.json({ items, total, limit, offset });
});

// Upload image and metadata to Cloudflare R2 + D1
app.post('/api/history', authMiddleware, async (c) => {
  const body = await c.req.parseBody();

  const cutoutFile = body['cutout'];
  if (!cutoutFile || !(cutoutFile instanceof File)) {
    return c.json({ error: 'Missing cutout image file' }, 400);
  }

  const originalFile = body['original'];
  const metadataRaw = body['metadata'];

  let metadata: {
    originalFilename?: string;
    width?: number;
    height?: number;
    modelUsed?: string;
    bgConfigJson?: string;
  } = {};

  if (typeof metadataRaw === 'string') {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      // Ignore JSON parse error, use defaults
    }
  }

  const id = crypto.randomUUID();
  const cutoutKey = `${id}.png`;
  const cutoutMime = cutoutFile.type || 'image/png';

  // 1. Upload Cutout to R2 Bucket
  await c.env.BUCKET.put(`cutouts/${cutoutKey}`, cutoutFile.stream(), {
    httpMetadata: {
      contentType: cutoutMime,
    },
  });

  // 2. Optionally upload original to R2 Bucket
  let originalKey: string | null = null;
  if (originalFile instanceof File) {
    const ext = originalFile.name.split('.').pop() || 'png';
    originalKey = `${id}-orig.${ext}`;
    await c.env.BUCKET.put(`originals/${originalKey}`, originalFile.stream(), {
      httpMetadata: {
        contentType: originalFile.type || 'image/png',
      },
    });
  }

  // 3. Save metadata into D1 SQLite table
  const originalFilename = metadata.originalFilename || (originalFile instanceof File ? originalFile.name : undefined) || 'image.png';
  const width = Number(metadata.width) || 0;
  const height = Number(metadata.height) || 0;
  const fileSizeBytes = cutoutFile.size;
  const modelUsed = metadata.modelUsed || 'isnet_fp16';
  const bgConfigJson = metadata.bgConfigJson || null;

  await c.env.DB.prepare(
    `INSERT INTO images_history (
      id, original_filename, r2_cutout_key, r2_original_key,
      mime_type, width, height, file_size_bytes, model_used,
      bg_config_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`
  )
    .bind(
      id,
      originalFilename,
      cutoutKey,
      originalKey,
      cutoutMime,
      width,
      height,
      fileSizeBytes,
      modelUsed,
      bgConfigJson
    )
    .run();

  return c.json({
    id,
    cutoutUrl: `/api/files/cutouts/${cutoutKey}`,
    originalUrl: originalKey ? `/api/files/originals/${originalKey}` : null,
  });
});

// Delete item from Cloudflare R2 and D1
app.delete('/api/history/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  const record = await c.env.DB.prepare(
    'SELECT * FROM images_history WHERE id = ?'
  )
    .bind(id)
    .first<ImageRecord>();

  if (!record) {
    return c.json({ error: 'History item not found' }, 404);
  }

  // Delete from R2
  await c.env.BUCKET.delete(`cutouts/${record.r2_cutout_key}`);
  if (record.r2_original_key) {
    await c.env.BUCKET.delete(`originals/${record.r2_original_key}`);
  }

  // Delete from D1
  await c.env.DB.prepare('DELETE FROM images_history WHERE id = ?')
    .bind(id)
    .run();

  return c.json({ deleted: true, id });
});

export default app;
