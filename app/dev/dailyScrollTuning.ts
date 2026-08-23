import { create } from 'zustand';

// DEV-ONLY tuning knobs for the Daily scroll art (idle rod-and-paper panel +
// reveal-curtain rod+paper). Lets Pete dial in position/size live on-device
// instead of a code-edit-reload cycle per nudge. Not persisted — resets to
// these defaults on every reload. Remove this whole file + its usages once
// values are locked.
//
// `rod` and `paper` are each shared across BOTH places the asset renders
// (DailyPanelFrame's idle top-mounted rod/background, and
// DailyRevealCurtain's reveal rod/background) — one knob set moves both,
// per Pete's ask not to have to tune the same art twice.
//
// scaleX (length) and scaleY (thickness) are independent, not a single
// uniform scale — a uniform scale meant the rod couldn't be shortened to fit
// on screen without also becoming too thin (device-confirmed 2026-08-22).
type Transform = {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
};

type DailyScrollTuningState = {
  rod: Transform;
  paper: Transform;
  // QuillScrollPanel's clue-text top inset — clearance below the idle rod.
  contentTopPad: number;
  setRod: (patch: Partial<Transform>) => void;
  setPaper: (patch: Partial<Transform>) => void;
  setContentTopPad: (v: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Locked in from Pete's on-device tuning pass 2026-08-22 — the earlier
// -60 default offsetX nudge is obsolete now that these real values exist.
const DEFAULT_ROD_TRANSFORM: Transform = { offsetX: 0, offsetY: 0, scaleX: 1.1, scaleY: 0.9 };
const DEFAULT_PAPER_TRANSFORM: Transform = { offsetX: 0, offsetY: 30, scaleX: 1, scaleY: 1 };

export const useDailyScrollTuning = create<DailyScrollTuningState>((set, get) => ({
  rod: { ...DEFAULT_ROD_TRANSFORM },
  paper: { ...DEFAULT_PAPER_TRANSFORM },
  contentTopPad: 42,
  setRod: (patch) => {
    const cur = get().rod;
    set({
      rod: {
        offsetX: clamp(patch.offsetX ?? cur.offsetX, -600, 600),
        offsetY: clamp(patch.offsetY ?? cur.offsetY, -600, 600),
        scaleX: clamp(patch.scaleX ?? cur.scaleX, 0.1, 4),
        scaleY: clamp(patch.scaleY ?? cur.scaleY, 0.1, 4),
      },
    });
  },
  setPaper: (patch) => {
    const cur = get().paper;
    set({
      paper: {
        offsetX: clamp(patch.offsetX ?? cur.offsetX, -600, 600),
        offsetY: clamp(patch.offsetY ?? cur.offsetY, -600, 600),
        scaleX: clamp(patch.scaleX ?? cur.scaleX, 0.1, 4),
        scaleY: clamp(patch.scaleY ?? cur.scaleY, 0.1, 4),
      },
    });
  },
  setContentTopPad: (v) => set({ contentTopPad: clamp(v, 0, 120) }),
}));
