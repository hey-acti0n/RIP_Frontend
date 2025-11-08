import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "UltraRezina",
        short_name: "UltraRezina",
        start_url: "/RIP_Frontend/",
        display: "standalone",
        background_color: "#1a1c1e",
        theme_color: "#387ef6",
        orientation: "portrait-primary",
        icons: [
          {
            "src": "/logo192.png",
            "type": "image/png", "sizes": "192x192"
          },
          {
            "src": "/logo512.png",
            "type": "image/png", "sizes": "512x512"
          }
        ],
      }
    })
  ],
  base: process.env.NODE_ENV === 'production' ? "/RIP_Frontend/" : "/",
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
})

