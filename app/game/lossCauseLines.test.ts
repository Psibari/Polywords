import { LOSS_CAUSE_LINES, pickLossVerdictLine } from './lossCauseLines';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
}

// Each cause maps to its own line.
eq(pickLossVerdictLine(0, 'trap', 0), LOSS_CAUSE_LINES.trap, 'cause.trap');
eq(pickLossVerdictLine(0, 'rejectedReal', 0), LOSS_CAUSE_LINES.rejectedReal, 'cause.rejectedReal');
eq(pickLossVerdictLine(0, 'wrongCall', 0), LOSS_CAUSE_LINES.wrongCall, 'cause.wrongCall');

// A null cause falls through to the neutral pool.
eq(pickLossVerdictLine(0, null, 0), LOSS_CAUSE_LINES.neutral[0], 'cause.null.neutralFirst');
eq(pickLossVerdictLine(0, null, 0.99), LOSS_CAUSE_LINES.neutral[1], 'cause.null.neutralLast');

// One ghost does not trigger the haunt line — it takes 2 or more.
eq(pickLossVerdictLine(1, 'trap', 0), LOSS_CAUSE_LINES.trap, 'ghosts.one.noHaunt');
eq(pickLossVerdictLine(1, null, 0), LOSS_CAUSE_LINES.neutral[0], 'ghosts.one.stillNeutral');

// The haunt condition outranks every individual cause, including a
// non-null lossCause that would otherwise win.
eq(pickLossVerdictLine(2, 'trap', 0), LOSS_CAUSE_LINES.haunts, 'ghosts.two.outranksTrap');
eq(pickLossVerdictLine(2, 'rejectedReal', 0), LOSS_CAUSE_LINES.haunts, 'ghosts.two.outranksRejectedReal');
eq(pickLossVerdictLine(2, 'wrongCall', 0), LOSS_CAUSE_LINES.haunts, 'ghosts.two.outranksWrongCall');
eq(pickLossVerdictLine(2, null, 0), LOSS_CAUSE_LINES.haunts, 'ghosts.two.outranksNull');
eq(pickLossVerdictLine(3, 'trap', 0), LOSS_CAUSE_LINES.haunts, 'ghosts.three.stillHaunts');

console.log('OK — lossCauseLines: all assertions passed');
