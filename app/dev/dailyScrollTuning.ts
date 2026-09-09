import { create } from 'zustand';

// DEV-ONLY tuning knobs for the Daily scroll. Lets Pete dial in the four
// values below live on-device instead of a code-edit-reload cycle per
// nudge. Not persisted — resets to these defaults on every reload. Remove
// this whole file + its usages (DailyScrollTuningPanel.tsx, and the reads
// of scrollHeight/headerVisible/cardHeight/rodOffsetY in
// QuillScrollPanel.tsx, DailyChallengeScreen.tsx and DailyAnswerCard.tsx)
// once scrollHeight, headerVisible, cardHeight and rodOffsetY are settled
// and hard-coded back into the real constants.
//
// The previous knob set (`rod`, `paper`, `contentTopPad`) existed only to
// compensate for the old fixed-height scroll bug; geometry now derives from
// the art itself (see dailyScrollLayout.ts), so those three are gone.
type DailyScrollTuningState = {
  // Overrides QuillScrollPanel's derived `reservedHeight`. null means "use
  // the derived value" — the shipped default, so nothing on device depends
  // on this knob until Pete moves it. The derived value (~243 at a 375pt
  // screen, and device-dependent because the rod's height scales with the
  // panel's width) is a worst-case reservation sized to fit a full
  // three-clue stack; a numeric override is free, so values below roughly
  // the derived one will clip a three-clue stack against `scrollBody`'s
  // `overflow: 'hidden'` rather than reflow it. That is expected for an
  // override knob during tuning, not a bug — the derived value remains the
  // honest floor for full content.
  scrollHeight: number | null;
  // Toggles the DAILY CHALLENGE / ONE REPRESENTS ALL header block above the
  // scroll — Pete is judging on-device whether it earns its ~45pt back.
  headerVisible: boolean;
  // Overrides DailyAnswerCard's entryShell height (default hardcoded 64).
  cardHeight: number;
  // Nudges the fixed top rod and the permanent bottom rod together, as a
  // fallback in case the parchment-tuck fix (commit 8991411) missed on
  // device. Never moves the reward paper's own moving rod. This is meant to
  // be a small cosmetic nudge only — at the +/-24 extremes it visibly
  // decouples the rod art from the parchment it should sit flush against,
  // opening a gap or overlap.
  rodOffsetY: number;
  setScrollHeight: (v: number | null) => void;
  setHeaderVisible: (v: boolean) => void;
  setCardHeight: (v: number) => void;
  setRodOffsetY: (v: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const useDailyScrollTuning = create<DailyScrollTuningState>((set) => ({
  scrollHeight: null,
  headerVisible: false,
  cardHeight: 64,
  rodOffsetY: 0,
  setScrollHeight: (v) => set({ scrollHeight: v === null ? null : clamp(v, 160, 340) }),
  setHeaderVisible: (v) => set({ headerVisible: v }),
  setCardHeight: (v) => set({ cardHeight: clamp(v, 48, 96) }),
  setRodOffsetY: (v) => set({ rodOffsetY: clamp(v, -24, 24) }),
}));
