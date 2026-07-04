# POLYWORDS Brand Logotype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the bespoke POLYWORDS wordmark lockup (Home screen) and app icon, per `docs/superpowers/specs/2026-07-04-brand-logotype-design.md`.

**Architecture:** One self-contained, import-free source file (`app/ui/pwBrandAssets.ts`) holds three raw SVG-markup string constants — the wordmark lockup, the app-icon monogram, and its Android safe-zone variant — built from a shared four-layer letter recipe (shadow duplicate → white ring → accent ring → fill). That single source is consumed two ways: at runtime by a new `BrandWordmark` component (via `react-native-svg`'s `SvgXml`) for the in-app Home screen, and at build time by a Node/Playwright script that rasterizes the same strings to the PNGs Expo's `app.json` points at for the app icon and splash image. This guarantees the in-app lockup and the shipped icon are pixel-identical, never two hand-maintained copies.

**Tech Stack:** React Native + Expo (existing), `react-native-svg` 15.12.1 (existing dependency, `SvgXml`), `expo-font` (existing, config-plugin based), Playwright (new devDependency, headless Chromium for font-accurate SVG→PNG rasterization), Node 24 native TypeScript execution (no ts-node/tsx needed) for the rasterization script.

## Global Constraints

- Typeface: **Rammetto One** (Google Fonts, SIL Open Font License), used only for the brand logotype — never for general UI. Registered as `FONTS.logotype`, distinct from the existing `FONTS.brand` (`BarlowCondensed-Bold`, used in ~13 files already — do not touch or repurpose that key).
- Two-tone color logic: POLY / "P" = purple family (`#7B2D8B` fill, `#4A1550` shadow). WORDS / "W" = gold family (`#F5C842` fill, `#8A5A16` shadow). Accent ring on each letter uses the *opposite* family's fill color; shadow duplicate uses the *opposite* family's shadow color.
- Letter recipe (identical everywhere): shadow duplicate offset `translate(5,6)` → white ring (`stroke-width: 9`) → accent ring (`stroke-width: 4`) → flat fill on top. Order is draw-order, not `paint-order` — later elements draw over earlier ones.
- Background: radial gradient `#9B5FC9 → #5B2470 → #241338`, used for both the wordmark lockup badge and the app icon — this replaces flat `#1A1830` for brand-mark assets specifically. It must **not** change the in-game screen background token.
- No tagline baked into the logotype. Home's existing `HOME_TAGLINE` stays untouched.
- Polly does not appear in this logo system.
- Per-patch verification (`CLAUDE.md` workflow, no automated test runner exists in this RN app): `npx.cmd tsc --noEmit`, `git diff --check`, `git status --short` after every task.

---

### Task 1: Bundle Rammetto One and register `FONTS.logotype`

**Files:**
- Create: `assets/fonts/RammettoOne-Regular.ttf`
- Modify: `app/constants/fonts.ts`
- Modify: `app.json`

**Interfaces:**
- Produces: `FONTS.logotype` (string constant `'RammettoOne-Regular'`), consumed conceptually by Task 2 (which duplicates the literal string locally — see Task 2's note on why).

- [ ] **Step 1: Download the font file**

Run:
```bash
curl -sL -o assets/fonts/RammettoOne-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/rammettoone/RammettoOne-Regular.ttf"
```

Verify it downloaded correctly:
```bash
file assets/fonts/RammettoOne-Regular.ttf
```
Expected output contains: `TrueType Font data` and `Copyright 2011 The Rammetto Project Authors`.

- [ ] **Step 2: Register the font with Expo**

In `app.json`, find the `expo-font` plugin's `fonts` array and add the new file (keep every existing entry — this is an addition, not a replacement):

```json
      [
        "expo-font",
        {
          "fonts": [
            "./assets/fonts/SuperCartoon-6R791.ttf",
            "./assets/fonts/SuperCarnival-j9Wq0.ttf",
            "./assets/fonts/SuperFrosting-R9z4o.ttf",
            "./assets/fonts/gomarice_okuba_cloud.ttf",
            "./assets/fonts/InterVariable.ttf",
            "./assets/fonts/Poppins-Bold.ttf",
            "./assets/fonts/Poppins-SemiBold.ttf",
            "assets/fonts/BungeeShade-Regular.ttf",
            "assets/fonts/BebasNeue-Regular.ttf",
            "assets/fonts/BarlowCondensed-Bold.ttf",
            "assets/fonts/LilitaOne-Regular.ttf",
            "assets/fonts/RammettoOne-Regular.ttf"
          ]
        }
      ],
```

- [ ] **Step 3: Add the `FONTS.logotype` entry**

In `app/constants/fonts.ts`, add a new key — do **not** touch the existing `brand` key (`BarlowCondensed-Bold`, used across ~13 files already):

```ts
export const FONTS = {
  // Hero word — normal and boss
  wordDisplay: 'BebasNeue-Regular',
  bossWord:    'BebasNeue-Regular',
  heroFace:    'BebasNeue-Regular',

  // All UI — HUD, badges, tile text, labels, results, stamps
  // Always use with textTransform: 'uppercase' except Polly
  ui: 'BarlowCondensed-Bold',
  hud: 'BarlowCondensed-Bold',
  tileCopy: 'BarlowCondensed-Bold',
  label: 'BarlowCondensed-Bold',
  brand: 'BarlowCondensed-Bold',

  // Polly speech only — mixed case, never uppercase
  polly: 'LilitaOne-Regular',

  // Brand logotype only — wordmark lockup + app icon. Never general UI.
  logotype: 'RammettoOne-Regular',

  // Legacy aliases — keep to avoid breaking existing imports
  poppinsBold:     'BarlowCondensed-Bold',
  poppinsSemiBold: 'BarlowCondensed-Bold',
} as const;
```

- [ ] **Step 4: Verify**

Run: `npx.cmd tsc --noEmit` — expect no errors.
Run: `git diff --check` — expect no whitespace errors.
Run: `git status --short` — expect the two modified files plus the new font listed.

- [ ] **Step 5: Commit**

```bash
git add assets/fonts/RammettoOne-Regular.ttf app/constants/fonts.ts app.json
git commit -m "Bundle Rammetto One font for the brand logotype"
```

---

### Task 2: Brand asset source (`pwBrandAssets.ts`)

**Files:**
- Create: `app/ui/pwBrandAssets.ts`

**Interfaces:**
- Consumes: nothing (deliberately import-free — see note below).
- Produces: `brandColors` (object), `APP_ICON_MONOGRAM_SVG` (string), `APP_ICON_MONOGRAM_ADAPTIVE_SVG` (string), `WORDMARK_LOCKUP_SVG` (string). Consumed by Task 3 (`BrandWordmark.tsx`, extensionless import) and Task 4 (`scripts/generate-brand-icons.ts`, extension-included import).

This file must not import anything else. Reason: Task 4's script runs under plain Node (not Metro), which requires explicit file extensions on relative imports; Task 3's component runs under Metro/tsc, which — for this project's `tsconfig.json` (`moduleResolution: "bundler"`, no `allowImportingTsExtensions` yet) — would reject an extension-including import as a type error. Keeping this one file import-free (duplicating the one font-name string locally with a comment) sidesteps the conflict entirely rather than forcing one runtime's constraint onto the other.

Note on the spec's "scale proportionally, not fixed px" requirement: unlike `FoilWord.tsx` (which recomputes deboss/catchlight offsets from a runtime `fontSize` prop because it's reused at many different sizes across the app), these three assets are each one fixed-`viewBox` graphic. All the absolute numbers below (font sizes, stroke widths, offsets) are only ever scaled as a whole via the consumer's `width`/`height` — `BrandWordmark`'s width prop, or the rasterization script's target pixel size — which preserves every internal proportion automatically. That satisfies the spec's intent without needing per-call ratio math.

- [ ] **Step 1: Write the file**

```ts
// Bespoke POLYWORDS brand mark — wordmark lockup + app icon monogram.
// Single source of truth consumed both by the in-app BrandWordmark component
// (via react-native-svg's SvgXml, extensionless import) and by
// scripts/generate-brand-icons.ts (via plain Node, extension-included
// import — see tsconfig.json's allowImportingTsExtensions, added in Task 4).
// Kept import-free on purpose so it works unmodified in both runtimes.

// Keep in sync with FONTS.logotype in app/constants/fonts.ts.
const BRAND_FONT_FAMILY = 'RammettoOne-Regular';

export const brandColors = {
  white: '#FFFFFF',
  purpleFill: '#7B2D8B',
  goldFill: '#F5C842',
  purpleShadow: '#4A1550',
  goldShadow: '#8A5A16',
  radialBgCenter: '#9B5FC9',
  radialBgMid: '#5B2470',
  radialBgEdge: '#241338',
  featherFill: '#F5F0E6',
  featherOutline: '#1A1830',
} as const;

const c = brandColors;

function radialBgDefs(id: string, cx: string, cy: string, r: string): string {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
    <stop offset="0%" stop-color="${c.radialBgCenter}"/>
    <stop offset="55%" stop-color="${c.radialBgMid}"/>
    <stop offset="100%" stop-color="${c.radialBgEdge}"/>
  </radialGradient>`;
}

// Four stacked layers per glyph: shadow duplicate (opposite-family dark
// shade, offset down-right) -> white outer ring -> opposite-family accent
// ring -> flat fill on top. Order matters: later elements draw over earlier
// ones, which is what creates the ring effect (no paint-order needed).
function letterLayers(
  glyph: string,
  fontSize: number,
  fill: string,
  accentRing: string,
  shadow: string,
): string {
  return `
    <text x="0" y="0" text-anchor="middle" font-family="${BRAND_FONT_FAMILY}" font-size="${fontSize}" fill="${shadow}" transform="translate(5,6)">${glyph}</text>
    <text x="0" y="0" text-anchor="middle" font-family="${BRAND_FONT_FAMILY}" font-size="${fontSize}" fill="${c.white}" stroke="${c.white}" stroke-width="9">${glyph}</text>
    <text x="0" y="0" text-anchor="middle" font-family="${BRAND_FONT_FAMILY}" font-size="${fontSize}" fill="${accentRing}" stroke="${accentRing}" stroke-width="4">${glyph}</text>
    <text x="0" y="0" text-anchor="middle" font-family="${BRAND_FONT_FAMILY}" font-size="${fontSize}" fill="${fill}">${glyph}</text>`;
}

function monogramLetters(): string {
  return `
    <g transform="translate(118,118)">
      ${letterLayers('W', 88, c.goldFill, c.purpleFill, c.purpleShadow)}
    </g>
    <g transform="translate(72,88)">
      ${letterLayers('P', 100, c.purpleFill, c.goldFill, c.goldShadow)}
    </g>`;
}

export const APP_ICON_MONOGRAM_SVG = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>${radialBgDefs('iconBg', '35%', '30%', '75%')}</defs>
  <rect x="0" y="0" width="200" height="200" fill="url(#iconBg)"/>
  ${monogramLetters()}
</svg>`;

// Android adaptive-icon foreground: content must stay within roughly the
// center 66% of the canvas or launcher masks (circle/squircle/rounded
// square) will clip it. Same letters, scaled and recentered; background
// stays full-bleed so the mask always finds opaque pixels underneath.
export const APP_ICON_MONOGRAM_ADAPTIVE_SVG = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>${radialBgDefs('iconBgAdaptive', '35%', '30%', '75%')}</defs>
  <rect x="0" y="0" width="200" height="200" fill="url(#iconBgAdaptive)"/>
  <g transform="translate(100,100) scale(0.66) translate(-100,-100)">
    ${monogramLetters()}
  </g>
</svg>`;

export const WORDMARK_LOCKUP_SVG = `
<svg viewBox="0 0 460 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${radialBgDefs('wordmarkBg', '50%', '35%', '70%')}
    <path id="wordmarkArc" d="M 60,190 Q 230,110 400,190" fill="none"/>
  </defs>
  <circle cx="230" cy="170" r="140" fill="url(#wordmarkBg)"/>

  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.goldShadow}" transform="translate(5,6)"><textPath href="#wordmarkArc" startOffset="6%">POLY</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.white}" stroke="${c.white}" stroke-width="9"><textPath href="#wordmarkArc" startOffset="6%">POLY</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.goldFill}" stroke="${c.goldFill}" stroke-width="4"><textPath href="#wordmarkArc" startOffset="6%">POLY</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.purpleFill}"><textPath href="#wordmarkArc" startOffset="6%">POLY</textPath></text>

  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.purpleShadow}" transform="translate(5,6)"><textPath href="#wordmarkArc" startOffset="56%">WORDS</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.white}" stroke="${c.white}" stroke-width="9"><textPath href="#wordmarkArc" startOffset="56%">WORDS</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.purpleFill}" stroke="${c.purpleFill}" stroke-width="4"><textPath href="#wordmarkArc" startOffset="56%">WORDS</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="46" fill="${c.goldFill}"><textPath href="#wordmarkArc" startOffset="56%">WORDS</textPath></text>

  <g transform="translate(228,128) rotate(10)">
    <path d="M0,-38 Q-7,-8 0,40 Q7,-8 0,-38 Z" fill="${c.featherFill}" stroke="${c.featherOutline}" stroke-width="2.5"/>
    <path d="M0,-32 L0,36" stroke="${c.featherOutline}" stroke-width="1.5"/>
  </g>
</svg>`;
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit` — expect no errors (this file has zero imports at this point, so it cannot yet hit the `.ts`-extension question Task 4 deals with).
Run: `git diff --check` — expect no whitespace errors.
Run: `git status --short` — expect one new file listed.

- [ ] **Step 3: Commit**

```bash
git add app/ui/pwBrandAssets.ts
git commit -m "Add brand SVG source: wordmark lockup + app icon monogram"
```

---

### Task 3: `BrandWordmark` component + Home screen integration

**Files:**
- Create: `app/components/ui/BrandWordmark.tsx`
- Modify: `app/screens/HomeScreen.tsx`
- Modify: `app/ui/pwHomeMaterials.ts`

**Interfaces:**
- Consumes: `WORDMARK_LOCKUP_SVG` from `app/ui/pwBrandAssets.ts` (Task 2).
- Produces: `BrandWordmark` component, props `{ width: number }`, renders at `height = width * (300/460)`.

- [ ] **Step 1: Write `BrandWordmark.tsx`**

```tsx
import React from 'react';
import { SvgXml } from 'react-native-svg';
import { WORDMARK_LOCKUP_SVG } from '../../ui/pwBrandAssets';

const WORDMARK_ASPECT_RATIO = 300 / 460;

type Props = {
  width: number;
};

export function BrandWordmark({ width }: Props) {
  return (
    <SvgXml
      xml={WORDMARK_LOCKUP_SVG}
      width={width}
      height={width * WORDMARK_ASPECT_RATIO}
    />
  );
}
```

- [ ] **Step 2: Remove the now-unused wordmark type tokens**

In `app/ui/pwHomeMaterials.ts`, change:

```ts
export const homeType = {
  wordmark: 68, // width-driven via adjustsFontSizeToFit
  wordmarkTracking: 3,
  tagline: 18,
```

to:

```ts
export const homeType = {
  tagline: 18,
```

- [ ] **Step 3: Wire `BrandWordmark` into `HomeScreen.tsx`**

Replace the import:

```ts
import { FoilWord } from '../components/ui/FoilWord';
```

with:

```ts
import { BrandWordmark } from '../components/ui/BrandWordmark';
```

Add `Dimensions` to the existing `react-native` import:

```ts
import {
  Animated,
  Dimensions,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Add a computed width alongside the other hooks near the top of the component body:

```ts
  const startGame = useGameStore(s => s.startGame);
  const darePulse = useRef(new Animated.Value(0)).current;
  const wordmarkWidth = Math.min(Dimensions.get('window').width - 40, 380);
```

Replace the title block JSX:

```tsx
            {/* Title block — baseline foil wordmark (bespoke logotype: own session) */}
            <View style={styles.titleBlock}>
              <View style={styles.wordmarkBox}>
                <FoilWord
                  word="POLYWORDS"
                  fontSize={homeType.wordmark}
                  baseStyle={styles.wordmark}
                />
              </View>
              <Text style={styles.tagline}>{HOME_TAGLINE}</Text>
            </View>
```

with:

```tsx
            {/* Title block — bespoke POLYWORDS brand lockup */}
            <View style={styles.titleBlock}>
              <View style={styles.wordmarkBox}>
                <BrandWordmark width={wordmarkWidth} />
              </View>
              <Text style={styles.tagline}>{HOME_TAGLINE}</Text>
            </View>
```

Replace the `wordmarkBox`/`wordmark` styles:

```ts
  wordmarkBox: {
    width: '100%',
    height: homeType.wordmark + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: FONTS.wordDisplay,
    fontSize: homeType.wordmark,
    letterSpacing: homeType.wordmarkTracking,
    textAlign: 'center',
    width: '100%',
  },
```

with:

```ts
  wordmarkBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
```

- [ ] **Step 4: Verify**

Run: `npx.cmd tsc --noEmit`
Expected: no errors (confirms `FONTS` is still used elsewhere in the file — it is, at lines further down for `tileCopy`/`hud`/`label` — so its import stays).

Run: `git diff --check`
Expected: no whitespace errors.

- [ ] **Step 5: Device verification**

Run the app (Expo Go / dev client) and open the Home screen. Confirm:
- "POLY" and "WORDS" render on the upward arc, POLY purple / WORDS gold, with the white+accent double ring and offset shadow.
- The feather sits between the two words.
- **If the text renders straight instead of following the arc:** `react-native-svg`'s `SvgXml` parser may need `xlink:href` instead of `href` on the two `<textPath>` elements in `WORDMARK_LOCKUP_SVG` — try that attribute name if so.

Take the device screenshot required before visual commits per `CLAUDE.md`.

- [ ] **Step 6: Commit**

```bash
git add app/components/ui/BrandWordmark.tsx app/screens/HomeScreen.tsx app/ui/pwHomeMaterials.ts
git commit -m "Replace Home screen foil wordmark with bespoke BrandWordmark"
```

---

### Task 4: App icon + splash rasterization

**Files:**
- Modify: `tsconfig.json`
- Modify: `package.json` (new devDependency)
- Create: `scripts/generate-brand-icons.ts`
- Modify (generated, binary): `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png`
- Modify: `app.json`

**Interfaces:**
- Consumes: `APP_ICON_MONOGRAM_SVG`, `APP_ICON_MONOGRAM_ADAPTIVE_SVG`, `WORDMARK_LOCKUP_SVG` from `app/ui/pwBrandAssets.ts` (Task 2); `assets/fonts/RammettoOne-Regular.ttf` (Task 1).

- [ ] **Step 1: Allow `.ts`-extension imports for this one script**

In `tsconfig.json`, add `allowImportingTsExtensions` (requires `noEmit`, already inherited from `expo/tsconfig.base`):

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "allowImportingTsExtensions": true
  }
}
```

- [ ] **Step 2: Add Playwright as a devDependency**

Run:
```bash
npm install --save-dev playwright
npx playwright install chromium
```

- [ ] **Step 3: Write the rasterization script**

```ts
// One-off asset-generation script — NOT part of the RN app bundle. Rasterizes
// the brand SVG sources (app/ui/pwBrandAssets.ts) to the PNG files Expo's
// app.json points at (icon, adaptive-icon foreground, splash). Uses real
// Chromium (via Playwright) rather than a lighter SVG rasterizer because it
// needs to reliably render the bundled RammettoOne-Regular font via a
// data-URI @font-face — librsvg-based rasterizers are unreliable with
// embedded custom web fonts and can silently substitute a fallback font,
// which would ship a broken-looking icon.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  WORDMARK_LOCKUP_SVG,
  APP_ICON_MONOGRAM_SVG,
  APP_ICON_MONOGRAM_ADAPTIVE_SVG,
} from '../app/ui/pwBrandAssets.ts';

const FONT_PATH = path.resolve(import.meta.dirname, '../assets/fonts/RammettoOne-Regular.ttf');
const OUT_DIR = path.resolve(import.meta.dirname, '../assets');

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
  { svg: WORDMARK_LOCKUP_SVG, file: path.join(OUT_DIR, 'splash-icon.png'), width: 1200, height: 783 },
];

async function main(): Promise<void> {
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
    await page.screenshot({ path: target.file });
    await page.close();
    console.log(`Wrote ${target.file} (${target.width}x${target.height})`);
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Run it**

Run: `node scripts/generate-brand-icons.ts`

Expected output:
```
Wrote .../assets/icon.png (1024x1024)
Wrote .../assets/adaptive-icon.png (1024x1024)
Wrote .../assets/splash-icon.png (1200x783)
```

- [ ] **Step 5: Verify the font rendered correctly (not a fallback)**

Use the Read tool on each of the three generated PNGs to view them directly:
- `assets/icon.png` — chunky rounded "P"/"W" monogram (Rammetto One), purple P upper-left overlapping gold W lower-right, white+accent rings, radial purple background. If the letters look like a generic system serif/sans instead of the bouncy rounded Rammetto One shapes, the `@font-face` didn't apply — check the base64 embed and the `document.fonts.ready` wait.
- `assets/adaptive-icon.png` — same monogram, visibly smaller and centered with clear margin to every edge (the 0.66 safe-zone scale).
- `assets/splash-icon.png` — the full "POLY [feather] WORDS" arc lockup.

- [ ] **Step 6: Update `app.json`**

Change `splash.backgroundColor` and `android.adaptiveIcon.backgroundColor` from `"#ffffff"` to the radial gradient's dark edge color, so any visible margin around the generated art blends with the brand background instead of flashing white:

```json
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#241338"
    },
```

```json
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#241338"
      },
```

- [ ] **Step 7: Verify**

Run: `npx.cmd tsc --noEmit` — expect no errors (the new `allowImportingTsExtensions` flag is purely additive/permissive, it should not change the outcome for any existing extensionless import elsewhere in the app).
Run: `git diff --check` — expect no whitespace errors.
Run: `git status --short` — expect the modified/generated files listed in this task.

- [ ] **Step 8: Commit**

```bash
git add tsconfig.json package.json package-lock.json scripts/generate-brand-icons.ts assets/icon.png assets/adaptive-icon.png assets/splash-icon.png app.json
git commit -m "Generate app icon, adaptive icon, and splash from brand SVG source"
```

---

## Explicitly out of scope (per the spec)

- Marketing/store-listing hero art beyond the icon + wordmark lockup.
- Any change to Polly's perch/pose art system.
- Any change to the in-game (non-logo) `Background` token or general palette usage.
