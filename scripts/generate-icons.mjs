/**
 * generate-icons.mjs
 *
 * Genererer PWA-ikoner fra en SVG-skabelon.
 * Bruger sharp til at konvertere SVG → PNG i 3 størrelser:
 *   - 512×512  (Android splash / maskable)
 *   - 192×192  (Android/Chrome PWA-ikon)
 *   - 180×180  (iOS Apple Touch Icon)
 *
 * Kør: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

// SVG med bogstavet "F" på stone-800 baggrund (#292524)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#292524"/>
  <text
    x="256" y="360"
    font-family="system-ui, sans-serif"
    font-size="360"
    font-weight="700"
    fill="#fafaf9"
    text-anchor="middle"
  >F</text>
</svg>`;

const icons = [
  { size: 512, name: "pwa-512x512.png" },
  { size: 192, name: "pwa-192x192.png" },
  { size: 180, name: "apple-touch-icon-180x180.png" },
];

for (const { size, name } of icons) {
  const outPath = resolve(publicDir, name);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log(`✓ ${name} (${size}×${size})`);
}

console.log("\nAlle ikoner genereret i public/");
