# Personal AI Background Remover (Fully Frontend)

Web app penghapus latar belakang gambar (*background remover*) berbasis AI yang berjalan **100% di browser (Client-Side / Fully Frontend)** tanpa memerlukan backend server, cloud upload, atau biaya langganan API eksternal.

## Arsitektur & Teknologi Utama

* **Frontend (`apps/web`):** [Vite](https://vite.dev/) + React 19 + TypeScript + Tailwind CSS (Bisa di-deploy ke Vercel, Cloudflare Pages, GitHub Pages, Netlify, dsb.).
* **Dual AI Engine (In-Browser):**
  1. **IMG.LY Background Removal (`@imgly/background-removal`) — [DEFAULT]:** Engine segmentasi canggih berbasis ISNet yang berjalan sangat cepat dan efisien langsung di browser.
  2. **BRIA RMBG-1.4 (`@huggingface/transformers`):** Model segmentasi SOTA (*State of the Art*) yang berjalan offline via WebGPU & WebAssembly multi-threaded. Bobot model ONNX tersimpan lokal di `public/models`.
* **Zero Backend & Zero Cloud:** Tidak ada pengaturan server URL, API token, ataupun upload ke server/cloud. Data dan gambar tidak pernah keluar dari perangkat pengguna (Privacy-First).
* **Local History Storage:** Riwayat pemrosesan tersimpan aman secara lokal di browser pengguna menggunakan **IndexedDB** bawaan (bukan cloud).

---

## Fitur Aplikasi

1. **Multi-Source Ingestion:**
   * Drag & drop gambar (JPEG, PNG, WebP hingga 25 MB).
   * Global clipboard paste (`Ctrl+V` / `Cmd+V`).
   * Pilihan mesin AI: **IMG.LY AI (Default)** vs **BRIA RMBG-1.4**.
   * Opsi auto-resize gambar besar (maks 2048px) untuk menghemat RAM dan mempercepat segmentasi.

2. **Studio Editor Interaktif:**
   * **Penggantian Latar Belakang:**
     * Transparan (*checkerboard*).
     * Warna solid & preset pasfoto instan (Merah Pasfoto `#db1514`, Biru Pasfoto `#0090ff`, Putih, Hitam, Kuning, dsb.) + Color Picker kustom.
     * Unggah foto latar belakang kustom.
     * Efek Bokeh Blur latar belakang asli (slider 0–30px).
   * **Kuas Manual Erase & Restore:**
     * Hapus sisa latar atau pulihkan detail rambut/objek di atas *alpha mask*.
     * Slider ukuran kuas (5–120px) dan kelembutan tepi (*hardness/feather*).
     * Riwayat Undo / Redo (`Ctrl+Z`, `Ctrl+Y`).
   * **Efek Bayangan (Drop Shadow):** Slider blur dan offset bayangan objek.

3. **Ekspor & Riwayat Lokal:**
   * Unduh format PNG (transparan) atau WebP.
   * Tombol *Salin Gambar ke Clipboard* instan.
   * Drawer riwayat gambar (*History Drawer*) lokal di browser via IndexedDB dengan opsi hapus individual atau bersihkan semua.

---

## Panduan Menjalankan Secara Lokal

### 1. Prasyarat
* Pasang [Bun](https://bun.sh/) (v1.1+).

### 2. Jalankan Aplikasi
```bash
# Install dependencies (jika belum)
bun install

# Jalankan development server
bun run dev
```
Buka browser di `http://localhost:5173`. Header COOP dan COEP sudah otomatis dikonfigurasikan di Vite dev server untuk akselerasi WebAssembly / WebGPU.

### 3. Build untuk Produksi
```bash
bun run build
```
Hasil kompilasi statis akan berada di folder `apps/web/dist` dan siap di-host di platform hosting statis manapun (Vercel, Cloudflare Pages, GitHub Pages, Netlify).
