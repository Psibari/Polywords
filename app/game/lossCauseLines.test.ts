import { LOSS_CAUSE_LINES, pickLossVerdictLine } from './lossCauseLines';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

const ORDINARY_LOSS = 'Your book got closed.';

// Ordinary Hunt loss has one locked subtitle regardless of why the run ended
// or how many existing Haunts the player already carries. Haunt language is
// reserved for a real Haunted outcome, which Results handles separately.
eq(LOSS_CAUSE_LINES.ordinary, ORDINARY_LOSS, 'ordinary.copy');
eq(pickLossVerdictLine(0, 'trap', 0), ORDINARY_LOSS, 'cause.trap');
eq(pickLossVerdictLine(0, 'rejectedReal', 0), ORDINARY_LOSS, 'cause.rejectedReal');
eq(pickLossVerdictLine(0, 'wrongCall', 0), ORDINARY_LOSS, 'cause.wrongCall');
eq(pickLossVerdictLine(0, null, 0), ORDINARY_LOSS, 'cause.null');
eq(pickLossVerdictLine(2, 'trap', 0), ORDINARY_LOSS, 'ghosts.two.noHauntCopy');
eq(pickLossVerdictLine(3, null, 0.99), ORDINARY_LOSS, 'ghosts.three.noHauntCopy');

// MASTER'S REMATCH loss keeps its separately approved BUSTER subtitle.
eq(LOSS_CAUSE_LINES.rematchLost, 'Bird brain', 'rematchLost.copy');

console.log('OK — lossCauseLines: all assertions passed');
