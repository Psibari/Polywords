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
  // Overrides QuillScrollPanel's derived `reservedHeight`.
  scrollHeight: number;
  // Toggles the DAILY CHALLENGE / ONE REPRESENTS ALL header block above the
  // scroll — Pete is judging on-device whether it earns its ~45pt back.
  headerVisible: boolean;
  // Overrides DailyAnswerCard's entryShell height (default hardcoded 64).
  cardHeight: number;
  // Nudges the fixed top rod and the permanent bottom rod together, as a
  // fallback in case the parchment-tuck fix (commit 8991411) missed on
  // device. Never moves the reward paper's own moving rod.
  rodOffsetY: number;
  setScrollHeight: (v: number) => void;
  setHeaderVisible: (v: boolean) => void;
  setCardHeight: (v: number) => void;
  setRodOffsetY: (v: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const useDailyScrollTuning = create<DailyScrollTuningState>((set) => ({
  scrollHeight: 252,
  headerVisible: false,
  cardHeight: 64,
  rodOffsetY: 0,
  setScrollHeight: (v) => set({ scrollHeight: clamp(v, 160, 340) }),
  setHeaderVisible: (v) => set({ headerVisible: v }),
  setCardHeight: (v) => set({ cardHeight: clamp(v, 48, 96) }),
  setRodOffsetY: (v) => set({ rodOffsetY: clamp(v, -24, 24) }),
}));
