# Product Requirements Document (PRD): Personal AI Background Remover Web App

**Dokumen Spesifikasi Teknis untuk AI Coding Agent**  
**Versi:** 1.0  
**Target Penggunaan:** Konsumsi Pribadi (Single-User / Personal Cloud)  
**Arsitektur Utama:** Monorepo TypeScript (Frontend [Vite](https://vite.dev/guide/) + [React](https://react.dev/learn/typescript) di [Vercel](https://vercel.com/docs/frameworks/frontend/vite) | Backend [Hono](https://hono.dev/docs/getting-started/cloudflare-workers) + [Cloudflare D1](https://developers.cloudflare.com/d1/examples/d1-and-hono/) + [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) di Cloudflare Workers)

## 1. Ringkasan Proyek & Keputusan Arsitektur

Aplikasi ini adalah *web app* penghapus latar belakang gambar (*background remover*) dengan pengalaman pengguna setara [remove.bg](https://www.remove.bg/f/overview) yang dirancang khusus untuk penggunaan pribadi tanpa biaya langganan bulanan.

### 1.1. Mengapa Inferensi Berjalan di Browser & Dampaknya pada Server Vercel

Paket [`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal) mengeksekusi model *machine learning* (berbasis ONNX Runtime Web melalui WebAssembly dan WebGPU) langsung di dalam *browser* pengguna (*client-side*), bukan di server *backend*:

* **Beban Server Nol (Zero Server Compute):** Server *frontend* di [Vercel](https://vercel.com/docs/frameworks/frontend/vite) hanya bertugas menyajikan aset statis (HTML/CSS/JS) dan *header* keamanan CORS/COOP/COEP, sedangkan [Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/) hanya menangani penyimpanan riwayat gambar. Anda tidak akan terkena batas waktu eksekusi (*serverless timeout*) maupun tagihan komputasi GPU server.
* **Caching Model Otomatis:** Pada pemakaian pertama, *browser* akan mengunduh bobot model AI (~40 MB–80 MB) dari CDN [`@imgly/background-removal-data`](https://www.npmjs.com/package/@imgly/background-removal-data) dan menyimpannya di *Cache Storage* *browser*. Pemakaian berikutnya berjalan instan secara lokal.
* **Syarat Wajib di Vercel (`vercel.json`):** Agar akselerasi *multi-threading* WebAssembly (`SharedArrayBuffer`) berjalan maksimal, konfigurasi deployment di Vercel wajib menyertakan HTTP *response headers* `Cross-Origin-Opener-Policy: same-origin` dan `Cross-Origin-Embedder-Policy: require-corp` (atau `credentialless`).

### 1.2. Rekomendasi Penyimpanan Cloud: Cloudflare R2 vs Cloudflare Images

Untuk mendampingi *backend* [Hono](https://hono.dev/docs/) dan database [Cloudflare D1](https://developers.cloudflare.com/d1/), sangat disarankan menggunakan **[Cloudflare R2](https://www.cloudflare.com/products/r2/)** dibandingkan [Cloudflare Images](https://developers.cloudflare.com/images/):

| Parameter Perbandingan | [Cloudflare R2](https://developers.cloudflare.com/r2/pricing/) (Direkomendasikan) | [Cloudflare Images](https://developers.cloudflare.com/images/pricing/) |
| :--- | :--- | :--- |
| **Biaya Paket Gratis (Free Tier)** | Gratis 10 GB/bulan penyimpanan + 1 juta operasi tulis & 10 juta operasi baca/bulan | Fitur penyimpanan (*Storage*) hanya tersedia di paket berbayar ($5/bulan per 100.000 gambar) |
| **Biaya Bandwidth Keluar (Egress)** | $0 (Gratis sepenuhnya tanpa biaya *egress*) | Mengandalkan tarif *requests delivered* di atas kuota paket berbayar |
| **Integrasi dengan Hono Worker** | Native Worker Binding (`c.env.R2_BUCKET.put()` / `.get()`) tanpa perlu API token eksternal | Memerlukan pemanggilan REST API multipart ke *endpoint* Cloudflare Account API |
| **Kesesuaian Kebutuhan** | Sangat cocok untuk menyimpan *file* PNG/WebP hasil olahan Canvas dari *browser* | Lebih cocok untuk *pipeline* *auto-resizing* ribuan katalog *e-commerce* skala besar |

## 2. Tech Stack & Struktur Monorepo

Gunakan arsitektur monorepo ringan berbasis [pnpm workspaces](https://vite.dev/guide/) atau dua folder terpisah (`apps/web` dan `apps/api`) dengan bahasa **TypeScript** secara menyeluruh:

| Lapisan (Layer) | Teknologi Utama | Peran dan Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend Framework** | [Vite](https://vite.dev/) + [React 19](https://react.dev/learn/typescript) + TypeScript | *Bundle* sangat ringan, tanpa beban SSR yang tidak diperlukan untuk aplikasi *client-side* |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/docs) + Lucide Icons | Desain responsif dan bersih dengan pembuatan *layout* editor cepat |
| **AI Background Removal** | [`@imgly/background-removal`](https://github.com/imgly/background-removal-js) | Eksekusi segmentasi objek langsung di *browser* via WebAssembly / WebGPU |
| **Image Manipulation** | Native HTML5 `<canvas>` API | Komposisi warna latar baru, efek *blur*, serta kuas *Erase/Restore* (*masking*) |
| **Frontend Hosting** | [Vercel](https://vercel.com/docs/frameworks/frontend/vite) | Deployment otomatis dari Git dengan dukungan konfigurasi header `vercel.json` |
| **Backend Framework** | [Hono](https://hono.dev/docs/getting-started/cloudflare-workers) di Cloudflare Workers | *Framework* berbasis Web Standards yang sangat ringan (<14 kB) dan *type-safe* (Hono RPC) |
| **Database Metadata** | [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1) | Database serverless SQLite untuk mencatat riwayat gambar, nama *file*, dimensi, dan pengaturan |
| **Cloud Object Storage** | [Cloudflare R2](https://www.cloudflare.com/products/r2/) | Penyimpanan *blob* biner untuk gambar asli (*original*) dan hasil potongan (*cutout* PNG/WebP) |

### Struktur Direktori yang Diinstruksikan untuk AI Agent

```text
personal-bg-remover/
├── package.json                 # Konfigurasi workspace (pnpm/npm workspaces)
├── apps/
│   ├── web/                     # Frontend (Deploy ke Vercel)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dropzone.tsx         # Drag & drop, file picker, clipboard paste (Ctrl+V)
│   │   │   │   ├── EditorCanvas.tsx     # Preview utama, split slider, zoom/pan
│   │   │   │   ├── BrushToolbar.tsx     # Kuas Erase / Restore manual di atas alpha mask
│   │   │   │   ├── BackgroundPanel.tsx  # Pilih transparan, warna solid, foto latar, blur
│   │   │   │   └── HistoryDrawer.tsx    # Riwayat gambar dari Cloudflare D1 + R2
│   │   │   ├── hooks/
│   │   │   │   ├── useBgRemoval.ts      # Wrapper state & progress @imgly/background-removal
│   │   │   │   └── useCanvasCompositor.ts # Logika menggabungkan foreground, mask, & background
│   │   │   ├── lib/
│   │   │   │   └── api.ts               # Client HTTP ke Hono Worker
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── vercel.json          # Header COOP/COEP untuk akselerasi WASM
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                     # Backend (Deploy ke Cloudflare Workers)
│       ├── src/
│       │   ├── db/
│       │   │   └── schema.ts    # Skema tabel SQLite D1 (Drizzle ORM)
│       │   ├── middleware/
│       │   │   └── auth.ts      # Proteksi PIN / Bearer Token pribadi
│       │   └── index.ts         # Endpoint Hono (Upload R2, List D1, Delete)
│       ├── migrations/          # File SQL migrasi Cloudflare D1
│       ├── wrangler.toml        # Binding D1 Database & R2 Bucket
│       └── package.json
```

## 3. Spesifikasi Fitur Fungsional (Standar Fitur remove.bg)

AI Coding Agent harus mengimplementasikan fitur-fitur berikut secara bertahap:

### 3.1. Modul Input Gambar (Multi-Source Ingestion)
1. **Drag & Drop Zone:** Mendukung format `image/jpeg`, `image/png`, dan `image/webp` hingga ukuran 25 MB.
2. **Global Clipboard Paste:** Pengguna dapat menekan `Ctrl+V` (Windows/Linux) atau `Cmd+V` (macOS) di mana saja pada halaman untuk langsung memproses gambar dari *clipboard*.
3. **URL Image Fetcher & Sample Images:** Input teks untuk mengambil gambar dari URL publik, serta 3 gambar contoh (*potret manusia, produk, mobil*) untuk uji coba instan.
4. **Pre-processing Pintar (Auto-Resize Opsional):** Opsi *toggle* di pengaturan untuk membatasi sisi terpanjang gambar (misalnya maks 2048px untuk mode cepat atau resolusi penuh untuk mode HD) sebelum dikirim ke *engine* `@imgly/background-removal`.

### 3.2. Mesin Penghapus Latar Belakang (`@imgly/background-removal`)
1. **Konfigurasi Model:** Gunakan fungsi `removeBackground(imageBlob, config)` dari [`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal) dengan pilihan model:
   * `isnet_fp16` (Default: Keseimbangan kecepatan dan akurasi tepi rambut/objek).
   * `isnet_quint8` (Mode Cepat: Ukuran model lebih kecil untuk perangkat rendah daya).
   * `isnet` (Mode Presisi Tinggi: Akurasi penuh untuk detail rumit).
2. **Indikator Progres Real-Time:** Manfaatkan *callback* `progress: (key, current, total) => void` untuk menampilkan *progress bar* terpisah antara *"Mengunduh model AI ke browser (hanya sekali)..."* dan *"Memisahkan objek dari latar belakang..."*.
3. **Web Worker Isolation:** Pastikan pemanggilan dijalankan secara asinkron agar animasi UI tetap berjalan mulus (60 FPS) selama inferensi berlangsung.

### 3.3. Studio Penyuntingan Pasca-Proses (Ala remove.bg)
1. **Before / After Split Slider:** Tombol tahan (*hold to compare*) atau *slider* geser untuk membandingkan gambar asli dengan hasil penghapusan latar di atas kanvas berpola *checkerboard* transparan.
2. **Penggantian Latar Belakang (Background Replacement):**
   * **Transparan:** Pola *checkerboard* (default saat diekspor ke PNG/WebP).
   * **Warna Solid & Gradien:** Palet warna cepat (Putih, Hitam, Merah Pasfoto `#db1514`, Biru Pasfoto `#0090ff`) ditambah *custom color picker* (`<input type="color">`).
   * **Gambar Latar Custom:** Unggah gambar latar belakang baru dan atur posisi/skala objek di depannya.
   * **Efek Blur Latar Asli (Bokeh):** Menggunakan kembali gambar asli sebagai latar belakang dengan filter `ctx.filter = 'blur(Npx)'` (slider 0px–30px) sementara objek utama tetap tajam di lapisan depan.
3. **Kuas Manual Erase & Restore (Alpha Mask Refinement):**
   * Simpan *alpha mask* hasil `@imgly` pada `OffscreenCanvas` terpisah.
   * Mode **Erase**: Menghapus area pada *mask* (`globalCompositeOperation = 'destination-out'`).
   * Mode **Restore**: Mengembalikan bagian gambar asli yang tidak sengaja terhapus dengan melukis kembali ke *mask* (`globalCompositeOperation = 'source-over'`).
   * Pengaturan **Ukuran Kuas (Brush Size)** (5px–150px), **Kelembutan Tepi (Hardness/Feather)**, serta riwayat **Undo / Redo** hingga 15 langkah.
4. **Bayangan Objek (Drop Shadow Opsional):** Toggle untuk menambahkan bayangan lembut di belakang objek potongan menggunakan properti `ctx.shadowColor`, `ctx.shadowBlur`, dan `ctx.shadowOffsetY`.

### 3.4. Ekspor & Sinkronisasi Riwayat Cloud (D1 + R2)
1. **Unduh Lokal Instan:** Ekspor kanvas akhir ke format **PNG** (lossless) atau **WebP** (ukuran *file* hemat dengan transparansi) dengan penamaan otomatis `<nama_asli>-nobg.png`.
2. **Salin ke Clipboard:** Tombol *"Copy Image"* menggunakan `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` untuk langsung ditempel ke Figma, WhatsApp, atau dokumen lain.
3. **Simpan ke Cloud Pribadi (Auto/Manual Save):**
   * Mengunggah gambar hasil potongan (*cutout*) dan opsional gambar asli ke **Cloudflare R2** melalui endpoint Hono Worker.
   * Menyimpan metadata ke **Cloudflare D1** sehingga pengguna bisa melihat galeri riwayat pemrosesan di bilah samping (*History Drawer*), mengunduh ulang, atau menghapus item lama.

## 4. Desain Skema Database (Cloudflare D1) & Kontrak API (Hono)

### 4.1. Skema SQLite pada Cloudflare D1 (`apps/api/src/db/schema.ts`)

Jalankan migrasi SQL berikut pada [Cloudflare D1](https://developers.cloudflare.com/d1/examples/d1-and-hono/):

```sql
CREATE TABLE IF NOT EXISTS images_history (
  id TEXT PRIMARY KEY,                     -- UUID v4 atau nanoid
  original_filename TEXT NOT NULL,         -- Nama file asli (misal: "produk-sepatu.jpg")
  r2_cutout_key TEXT NOT NULL,             -- Key objek di R2 untuk gambar tanpa background
  r2_original_key TEXT,                    -- Key objek di R2 untuk gambar asli (opsional)
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'isnet_fp16',
  bg_config_json TEXT,                     -- JSON string menyimpan warna latar / blur terakhir
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_images_created_at ON images_history(created_at DESC);
```

### 4.2. Spesifikasi Endpoint API (`apps/api/src/index.ts` - Hono Framework)

Karena aplikasi ini untuk konsumsi pribadi, gunakan *middleware* autentikasi ringan berbasis header `Authorization: Bearer <PERSONAL_SECRET_KEY>` (atau PIN yang disimpan di `localStorage` *browser* pengguna) agar kuota Cloudflare R2/D1 Anda tidak disalahgunakan oleh publik.

| Method | Endpoint | Deskripsi Fungsional | Request Payload / Query | Response JSON |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Mengecek status Worker dan koneksi D1 | - | `{ "ok": true, "timestamp": 1761056400 }` |
| `GET` | `/api/history` | Mengambil daftar riwayat gambar terbaru dari D1 | `?limit=20&offset=0` | `{ "items": [...], "total": 42 }` |
| `POST` | `/api/history` | Mengunggah *blob* gambar ke R2 dan menyimpan metadata ke D1 | `multipart/form-data` (`cutout`: File, `original`?: File, `metadata`: JSON) | `{ "id": "uuid", "cutoutUrl": "/api/files/cutouts/uuid.png" }` |
| `GET` | `/api/files/:type/:key` | Mengambil *stream* *file* gambar langsung dari R2 Bucket dengan header `Cache-Control` | Parameter URL `:type` (`cutouts` / `originals`) dan `:key` | Binary Image Stream (`image/png` atau `image/webp`) |
| `DELETE` | `/api/history/:id` | Menghapus objek terkait di R2 Bucket sekaligus baris data di D1 | Parameter URL `:id` | `{ "deleted": true, "id": "uuid" }` |

## 5. Konfigurasi Penting untuk AI Coding Agent

### 5.1. Konfigurasi `apps/web/vercel.json` (Wajib untuk WebAssembly & SPA Routing)

Tanpa *header* COOP dan COEP di bawah ini, *browser* akan membatasi `SharedArrayBuffer` dan membuat `@imgly/background-removal` berjalan dalam mode *single-thread* yang lambat:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "credentialless"
        }
      ]
    }
  ]
}
```
*(Catatan Teknis: Gunakan nilai `credentialless` pada `Cross-Origin-Embedder-Policy` agar browser tetap mengizinkan `SharedArrayBuffer` untuk WebAssembly sekaligus mempermudah pemuatan gambar dari endpoint API Cloudflare Worker Anda tanpa terblokir aturan CORP yang kaku).*

### 5.2. Konfigurasi `apps/api/wrangler.toml` (Cloudflare Workers + D1 + R2)

```toml
name = "personal-bg-remover-api"
main = "src/index.ts"
compatibility_date = "2026-10-01"

[vars]
ALLOWED_ORIGIN = "https://nama-app-anda.vercel.app"
# Simpan PERSONAL_SECRET_KEY menggunakan perintah: npx wrangler secret put PERSONAL_SECRET_KEY

[[d1_databases]]
binding = "DB"
database_name = "bg_remover_db"
database_id = "<ISI_DENGAN_DATABASE_ID_DARI_WRANGLER>"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "bg-remover-storage"
```

## 6. Tahapan Implementasi (Action Plan untuk AI Coding Agent)

Instruksikan AI Coding Agent Anda untuk mengeksekusi proyek ini dalam **4 Fase Berurutan**:

1. **Fase 1 — Inisialisasi Monorepo & Inti AI di Browser (`apps/web`):**
   * Buat proyek [Vite](https://vite.dev/guide/) + React + TypeScript + [Tailwind CSS](https://tailwindcss.com/docs).
   * Pasang `@imgly/background-removal` dan konfigurasikan plugin Vite/COOP-COEP header di `vite.config.ts` (`server.headers`).
   * Bangun komponen `Dropzone` (mendukung *drag-and-drop* dan *paste* `Ctrl+V`) serta *hook* `useBgRemoval` dengan *progress bar* pengunduhan model dan pemrosesan.
2. **Fase 2 — Studio Editor & Kanvas Interaktif (`apps/web`):**
   * Bangun `EditorCanvas` dengan *split slider* perbandingan *Before/After*.
   * Bangun `BackgroundPanel` untuk mengganti latar menjadi warna solid (termasuk preset warna pasfoto), gambar latar custom, atau efek *blur* latar asli.
   * Bangun `BrushToolbar` menggunakan `OffscreenCanvas` untuk fitur kuas manual *Erase* dan *Restore* beserta tombol *Undo/Redo* dan ekspor PNG/WebP/Clipboard.
3. **Fase 3 — Backend API Hono, Cloudflare D1, dan R2 (`apps/api`):**
   * Inisialisasi proyek [Hono](https://hono.dev/docs/getting-started/cloudflare-workers) dengan `wrangler`.
   * Buat skema tabel `images_history` di [Cloudflare D1](https://developers.cloudflare.com/d1/) dan hubungkan binding R2 Bucket (`BUCKET`) serta D1 (`DB`).
   * Implementasikan middleware CORS (mengizinkan domain Vercel) dan middleware autentikasi `PERSONAL_SECRET_KEY`, lalu buat rute `POST /api/history`, `GET /api/history`, `GET /api/files/:type/:key`, dan `DELETE /api/history/:id`.
4. **Fase 4 — Integrasi Cloud History & Deployment:**
   * Hubungkan `HistoryDrawer` di *frontend* dengan API Hono Worker agar setiap gambar yang selesai diedit dapat disimpan ke *cloud* dengan satu klik (atau *auto-save*).
   * Uji coba end-to-end secara lokal menggunakan `wrangler dev` dan `vite dev`, lalu deploy *backend* via `wrangler deploy` dan *frontend* ke [Vercel](https://vercel.com/docs/deployments).
