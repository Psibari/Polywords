import { LossCause } from './polyRunEngine';

// Results screen verdictSub copy. Ordinary Hunt loss has one locked subtitle;
// actual Haunted outcomes are communicated by the HAUNTED result/consequence
// system instead of borrowing haunt language here.
export const LOSS_CAUSE_LINES = {
  ordinary: 'Your book got closed.',
  // Shown under BUSTER, the label for a lost MASTER'S REMATCH (Pete, 2026-10-07).
  rematchLost: 'Bird brain',
} as const;

// Kept as a pure resolver so ResultsScreen's call site stays stable. The old
// cause/ghost-specific lines were deliberately retired: an ordinary loss must
// not imply that this run created a Haunt when it did not.
export function pickLossVerdictLine(
  _ghostCount: number,
  _lossCause: LossCause,
  _roll: number,
): string {
  return LOSS_CAUSE_LINES.ordinary;
}
