// One-off asset-generation script — NOT part of the RN app bundle. Rasterizes
// the brand SVG sources (app/ui/pwBrandAssets.ts) to the PNG files Expo's
// app.json points at (icon, adaptive-icon foreground, splash). Uses real
// Chromium (via Playwright) rather than a lighter SVG rasterizer because it
// needs to reliably render the bundled RammettoOne-Regular font via a
// data-URI @font-face — librsvg-based rasterizers are unreliable with
// embedded custom web fonts and can silently substitute a fallback font,
// which would ship a broken-looking icon.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  WORDMARK_LOCKUP_SVG,
  APP_ICON_MONOGRAM_SVG,
  APP_ICON_MONOGRAM_ADAPTIVE_SVG,
} from '../app/ui/pwBrandAssets.ts';

const FONT_PATH = path.resolve(import.meta.dirname, '../assets/fonts/RammettoOne-Regular.ttf');
const OUT_DIR = path.resolve(import.meta.dirname, '../assets');
const BRAND_IMAGES_DIR = path.join(OUT_DIR, 'images/brand');

function pageHtml(svg: string, width: number, height: number, fontBase64: string): string {
  return `<!doctype html>
<html>
<head>
<style>
  @font-face {
    font-family: 'RammettoOne-Regular';
    src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
  }
  html, body { margin: 0; padding: 0; background: transparent; }
  svg { display: block; width: ${width}px; height: ${height}px; }
</style>
</head>
<body>${svg}</body>
</html>`;
}

type Target = { svg: string; file: string; width: number; height: number };

const TARGETS: Target[] = [
  { svg: APP_ICON_MONOGRAM_SVG, file: path.join(OUT_DIR, 'icon.png'), width: 1024, height: 1024 },
  { svg: APP_ICON_MONOGRAM_ADAPTIVE_SVG, file: path.join(OUT_DIR, 'adaptive-icon.png'), width: 1024, height: 1024 },
  { svg: WORDMARK_LOCKUP_SVG, file: path.join(OUT_DIR, 'splash-icon.png'), width: 1200, height: 307 },
  // Static asset for the Home screen — rendered as a plain image (expo-image),
  // not a live SvgXml component, after react-native-svg's SvgXml proved
  // unreliable on-device (clipped to raw viewBox pixel size). 1800x460 is 2x
  // the SVG's 900x230 viewBox, sharp enough for retina phone screens at the
  // ~460pt max width BrandWordmark renders at.
  { svg: WORDMARK_LOCKUP_SVG, file: path.join(BRAND_IMAGES_DIR, 'wordmark.png'), width: 1800, height: 460 },
];

async function main(): Promise<void> {
  mkdirSync(BRAND_IMAGES_DIR, { recursive: true });
  const fontBase64 = readFileSync(FONT_PATH).toString('base64');
  const browser = await chromium.launch();

  for (const target of TARGETS) {
    const page = await browser.newPage({
      viewport: { width: target.width, height: target.height },
      deviceScaleFactor: 1,
    });
    await page.setContent(pageHtml(target.svg, target.width, target.height, fontBase64), {
      waitUntil: 'networkidle',
    });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: target.file, omitBackground: true });
    await page.close();
    console.log(`Wrote ${target.file} (${target.width}x${target.height})`);
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
