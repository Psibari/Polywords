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
};

type PolybookTuningState = PolybookLayout & {
  setLayout: (patch: Partial<PolybookLayout>) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Same bounds LexiconPrototype's TUNER_FIELDS used, except sealSize's floor
// is lowered — these seals are cramped into a page corner rather than a
// full section icon, so they need to go smaller than 60.
const BOUNDS: Record<keyof PolybookLayout, [number, number]> = {
  pageTopPct: [0, 40],
  pageHeightPct: [40, 85],
  pageWidthPct: [20, 45],
  leftPageLeftPct: [0, 30],
  rightPageLeftPct: [45, 75],
  contentScale: [0.85, 1.1],
  sealSize: [16, 100],
};

const DEFAULT_LAYOUT: PolybookLayout = {
  pageTopPct: 13,
  pageHeightPct: 67,
  pageWidthPct: 33.5,
  leftPageLeftPct: 11.5,
  rightPageLeftPct: 55,
  contentScale: 1,
  sealSize: 60,
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
