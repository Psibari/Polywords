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
  wordmarkShadow: '#6B3E88',
  wordmarkOutline: '#2A1245',
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
    <text x="0" y="0" text-anchor="middle" font-family="${BRAND_FONT_FAMILY}" font-size="${fontSize}" fill="${fill}" stroke="none" stroke-width="0">${glyph}</text>`;
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
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
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

// Simplified single-word treatment (approved 2026-07-04): one word, one
// gold fill, one purple shadow duplicate, one dark outline. No per-word
// two-tone split, no badge background, no feather — those drove both the
// SvgXml rendering issues and a look that didn't match the approved
// reference. Background is deliberately left untransparent (no <rect>) so
// this sits directly on top of whatever the consumer renders behind it
// (Home screen art, or the splash screen's own backgroundColor).
export const WORDMARK_LOCKUP_SVG = `
<svg width="460" height="170" viewBox="0 0 460 170" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <path id="wordmarkArc" d="M 20,110 Q 230,60 440,110" fill="none"/>
  </defs>

  <text font-family="${BRAND_FONT_FAMILY}" font-size="52" fill="${c.wordmarkShadow}" transform="translate(6,8)"><textPath href="#wordmarkArc" startOffset="50%" text-anchor="middle">POLYWORDS</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="52" fill="${c.wordmarkOutline}" stroke="${c.wordmarkOutline}" stroke-width="6"><textPath href="#wordmarkArc" startOffset="50%" text-anchor="middle">POLYWORDS</textPath></text>
  <text font-family="${BRAND_FONT_FAMILY}" font-size="52" fill="${c.goldFill}" stroke="none" stroke-width="0"><textPath href="#wordmarkArc" startOffset="50%" text-anchor="middle">POLYWORDS</textPath></text>
</svg>`;
