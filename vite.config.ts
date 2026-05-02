/**
 * Vite build-konfiguration for Fjall.
 *
 * Vite er en moderne build-tool der:
 * - Serverer kode under udvikling med hurtig Hot Module Replacement (HMR)
 * - Bundler alt til optimeret JavaScript/CSS ved "npm run build"
 *
 * Plugins:
 * - react(): Gør JSX/TSX-syntaks mulig
 * - tailwindcss(): Genererer CSS fra Tailwind-klasser
 * - VitePWA(): Gør appen installerbar som PWA med service worker
 *
 * Test-konfigurationen i bunden siger at Vitest skal bruge jsdom
 * (en browser-simulation) til at køre React-tests.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // Precache statiske assets — app-skallen indlæses fra cache
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Runtime caching af OpenTopoMap korttiles
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.opentopomap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dage
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "Fjall — Seyðadriv Coordinator",
        short_name: "Fjall",
        description: "Samskipa seyðadriv á Føroyum — GPS, kortstýring og samskifti",
        theme_color: "#292524",
        background_color: "#292524",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
