import { create } from 'zustand';

// DEV-ONLY layout knobs for the Polybook spread (PolybookSpread.tsx). Lets
// Pete dial in the page insets on a real device instead of a code-edit-reload
// cycle per nudge. Not persisted — resets to these defaults on every reload.
// Remove this whole file + its usages once values are locked, same as
// dailyScrollTuning.ts does.
//
// Every percentage here is of the BOOK IMAGE, not the screen — the book now
// renders at twice the screen width (one horizontal page per screen), but
// these values carry over unchanged from the old two-pages-at-once screen
// because they were always relative to the art, never the viewport.
//
// Seeded from LexiconPrototype's DEFAULT_POLYBOOK_LAYOUT, the last on-device
// tuning pass for that screen.
type PolybookLayout = {
  pageTopPct: number;
  pageHeightPct: number;
  pageWidthPct: number;
  leftPageLeftPct: number;
  rightPageLeftPct: number;
  contentScale: number;
  sealSize: number;
  // The quill resting beside the book — anchored to the SCREEN (see
  // PolybookSpread's styles.quill), not the page, so it stays put while the
  // pages slide underneath it. offsetX/offsetY are px nudges from that
  // screen anchor (near screen center — the right page's empty middle, since
  // the screen shows one page at a time); angle is degrees; scale multiplies
  // the screen-width-sized base image.
  quillOffsetX: number;
  quillOffsetY: number;
  quillAngle: number;
  quillScale: number;
  quillOpacity: number;
};

type PolybookTuningState = PolybookLayout & {
  setLayout: (patch: Partial<PolybookLayout>) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Same bounds LexiconPrototype's TUNER_FIELDS used, except sealSize's floor
// is lowered — these seals are cramped into a page corner rather than a
// full section icon, so they need to go smaller than 60. Third device pass:
// even 60 read as a trophy on a plinth, so the floor came down further to
// let it go genuinely small.
const BOUNDS: Record<keyof PolybookLayout, [number, number]> = {
  pageTopPct: [0, 40],
  pageHeightPct: [40, 85],
  pageWidthPct: [20, 45],
  leftPageLeftPct: [0, 30],
  rightPageLeftPct: [45, 75],
  contentScale: [0.85, 1.1],
  sealSize: [10, 100],
  quillOffsetX: [-300, 300],
  quillOffsetY: [-300, 300],
  quillAngle: [-180, 180],
  quillScale: [0.2, 3],
  quillOpacity: [0, 1],
};

const DEFAULT_LAYOUT: PolybookLayout = {
  pageTopPct: 13,
  pageHeightPct: 67,
  pageWidthPct: 33.5,
  leftPageLeftPct: 11.5,
  rightPageLeftPct: 55,
  contentScale: 1,
  // Third device pass: 60 filled roughly a third of the page corner — a
  // trophy on a plinth, not the cramped, doesn't-want-to-look-at-them pile
  // the design calls for. This is a starting point only; the corner's own
  // capacity (BEATEN_CORNER_MAX_WIDTH/HEIGHT in PolybookSpread.tsx) is what
  // actually decides how many seals render at whatever size this ends up.
  sealSize: 20,
  // Starting point only, not a final placement. Earlier passes overshot in
  // both directions — first too loud (near-full opacity, oversized), then
  // too faint to read as anything but a smudge over the totals. This pass
  // moves it to the right page's empty middle at a size and opacity meant
  // to read as an object actually resting on the page: present, but
  // clearly behind her writing. Last attempt — see styles.quill's comment.
  quillOffsetX: 0,
  quillOffsetY: 0,
  quillAngle: -35,
  quillScale: 0.85,
  quillOpacity: 0.35,
};

export const usePolybookTuning = create<PolybookTuningState>((set) => ({
  ...DEFAULT_LAYOUT,
  setLayout: (patch) => {
    const next: Partial<PolybookLayout> = {};
    (Object.keys(patch) as (keyof PolybookLayout)[]).forEach((key) => {
      const value = patch[key];
      if (value === undefined) return;
      const [min, max] = BOUNDS[key];
      next[key] = clamp(value, min, max);
    });
    set(next);
  },
}));
