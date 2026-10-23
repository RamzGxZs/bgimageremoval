# Personal AI Background Remover

Web app penghapus latar belakang gambar (*background remover*) berbasis AI dengan pengalaman pengguna setara [remove.bg](https://www.remove.bg), tanpa biaya langganan bulanan.

## Arsitektur & Teknologi Utama

* **Frontend (`apps/web`):** [Vite](https://vite.dev/) + React 19 + TypeScript + Tailwind CSS (Deploy ke Vercel).
* **AI Engine:** **BRIA RMBG-1.4** via [`@huggingface/transformers`](https://github.com/huggingface/transformers.js) — Model segmentasi SOTA (*State of the Art*) yang berjalan **100% Full Offline** langsung di browser pengguna via WebGPU & WebAssembly (`ort-wasm-simd-threaded`). Seluruh bobot model dan binary runtime disimpan secara lokal di repositori (`public/models` dan `public/ort`), tanpa ketergantungan koneksi ke server eksternal saat pemrosesan.
* **Backend API (`apps/api`):** [Hono](https://hono.dev/) di Cloudflare Workers.
* **Database & Storage:** Cloudflare D1 (SQLite serverless) untuk riwayat metadata & Cloudflare R2 untuk penyimpanan blob gambar hasil potongan tanpa biaya *egress*.
* **Package Manager & Runtime:** [Bun](https://bun.sh/) (Monorepo Workspaces).

---

## Fitur Aplikasi

1. **Multi-Source Ingestion:**
   * Drag & drop gambar (JPEG, PNG, WebP hingga 25 MB).
   * Global clipboard paste (`Ctrl+V` / `Cmd+V`).
   * Fetch langsung dari URL gambar publik.
   * Sampel gambar bawaan (potret manusia, katalog sepatu, kendaraan).
   * Opsi auto-resize gambar besar (maks 2048px) untuk menghemat RAM dan mempercepat segmentasi.

2. **Studio Editor Interaktif:**
   * **Before / After Split Slider:** Bandingkan gambar asli dengan hasil potongan secara interaktif.
   * **Penggantian Latar Belakang:**
     * Transparan (*checkerboard*).
     * Warna solid & preset pasfoto instan (Merah Pasfoto `#db1514`, Biru Pasfoto `#0090ff`, Putih, Hitam, Kuning, dsb.) + Color Picker kustom.
     * Unggah foto latar belakang kustom.
     * Efek Bokeh Blur latar belakang asli (slider 0–30px).
   * **Kuas Manual Erase & Restore:**
     * Hapus sisa latar atau pulihkan detail rambut/objek di atas *alpha mask*.
     * Slider ukuran kuas (5–120px) dan kelembutan tepi (*hardness/feather*).
     * Riwayat Undo / Redo hingga 15 langkah (`Ctrl+Z`, `Ctrl+Y`).
   * **Efek Bayangan (Drop Shadow):** Slider blur dan offset bayangan objek.

3. **Ekspor & Riwayat Cloud:**
   * Unduh instan format PNG (lossless) atau WebP (hemat ukuran).
   * Tombol *Copy Image* langsung ke Clipboard.
   * Drawer riwayat gambar (*History Drawer*) yang tersinkronisasi ke Cloudflare D1 + R2.

---

## Panduan Menjalankan Secara Lokal

### 1. Prasyarat
* Pasang [Bun](https://bun.sh/) (v1.1+).

### 2. Jalankan Frontend
```bash
# Dari root direktori
bun run dev
```
Akses frontend di `http://localhost:5173`. Header COOP dan COEP sudah otomatis dikonfigurasikan di Vite dev server untuk performa multi-threading WebAssembly.

### 3. Jalankan Backend (Cloudflare Worker)
```bash
# Dari root direktori
bun run dev:api
```
Worker akan berjalan di `http://localhost:8787` dengan emulasi lokal D1 dan R2.

---

## Panduan Deployment

### 1. Deploy Frontend ke Vercel
* Import folder `apps/web` ke Vercel.
* Konfigurasi header keamanan COOP & COEP telah disediakan di `apps/web/vercel.json`:
  * `Cross-Origin-Opener-Policy: same-origin`
  * `Cross-Origin-Embedder-Policy: credentialless`

### 2. Deploy Backend ke Cloudflare Workers
1. Buat database D1 dan bucket R2 di Cloudflare:
   ```bash
   cd apps/api
   npx wrangler d1 create bg_remover_db
   npx wrangler r2 bucket create bg-remover-storage
   ```
2. Perbarui `database_id` pada `apps/api/wrangler.toml` dengan ID dari langkah sebelumnya.
3. Jalankan migrasi SQL:
   ```bash
   npx wrangler d1 execute bg_remover_db --remote --file=./migrations/0001_initial.sql
   ```
4. Set kunci rahasia autentikasi pribadi:
   ```bash
   npx wrangler secret put PERSONAL_SECRET_KEY
   ```
5. Deploy worker:
   ```bash
   npx wrangler deploy
   ```
