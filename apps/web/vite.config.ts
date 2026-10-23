import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function serveOrtAssets() {
  const handler = (
    req: import('node:http').IncomingMessage,
    res: import('node:http').ServerResponse,
    next: () => void
  ) => {
    const rawUrl = req.url ? req.url.split('?')[0] : ''
    if (rawUrl.startsWith('/ort/')) {
      const relativePath = rawUrl.replace(/^\/ort\//, '')
      const filePath = path.resolve(__dirname, 'public/ort', relativePath)
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath)
        if (ext === '.wasm') {
          res.setHeader('Content-Type', 'application/wasm')
        } else if (ext === '.mjs' || ext === '.js') {
          res.setHeader('Content-Type', 'application/javascript')
        }
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(filePath).pipe(res)
        return
      }
    }
    next()
  }

  return {
    name: 'serve-ort-assets',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server: import('vite').PreviewServer) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveOrtAssets(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
      ],
      manifest: {
        name: 'Personal AI Background Remover',
        short_name: 'BG Remover',
        description: 'Hapus latar belakang gambar berbasis AI secara instan langsung di browser.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,onnx,json}'],
        maximumFileSizeToCacheInBytes: 65 * 1024 * 1024, // 65MB for RMBG-1.4 model and ONNX wasm
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
