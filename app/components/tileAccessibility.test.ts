// Run with: npx.cmd -y tsx app/components/tileAccessibility.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import {
  CLAIM_ACTION_NAME,
  REJECT_ACTION_NAME,
  CLAIM_REJECT_ACTIONS,
  CLAIM_ONLY_ACTIONS,
  huntActionsForInputMode,
  isHuntDirectionAllowed,
  resolveTileAccessibilityAction,
} from './tileAccessibility';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

// ── resolveTileAccessibilityAction ──────────────────────────────

eq(resolveTileAccessibilityAction('claim'), 'claim', 'claim resolves to claim');
eq(resolveTileAccessibilityAction('reject'), 'reject', 'reject resolves to reject');
eq(resolveTileAccessibilityAction('activate'), null, 'unrecognized OS-standard action is ignored');
eq(resolveTileAccessibilityAction(''), null, 'empty string is ignored');

// ── action descriptors used to build accessibilityActions props ─

eq(CLAIM_REJECT_ACTIONS.length, 2, 'hunt tiles expose exactly two actions');
eq(CLAIM_REJECT_ACTIONS[0].name, CLAIM_ACTION_NAME, 'first hunt action is claim');
eq(CLAIM_REJECT_ACTIONS[1].name, REJECT_ACTION_NAME, 'second hunt action is reject');

eq(CLAIM_ONLY_ACTIONS.length, 1, 'daily cards expose exactly one action');
eq(CLAIM_ONLY_ACTIONS[0].name, CLAIM_ACTION_NAME, 'daily card action is claim');

eq(huntActionsForInputMode('locked').length, 0, 'locked Hunt tile exposes no actions');
eq(huntActionsForInputMode('up-only').length, 1, 'guided REAL exposes one action');
eq(huntActionsForInputMode('up-only')[0].name, CLAIM_ACTION_NAME, 'guided REAL exposes only claim');
eq(huntActionsForInputMode('right-only')[0].name, REJECT_ACTION_NAME, 'guided TRAP exposes only reject');
eq(huntActionsForInputMode('both').length, 2, 'unaided Hunt tile exposes both actions');
eq(isHuntDirectionAllowed('up-only', 'up'), true, 'guided REAL accepts UP');
eq(isHuntDirectionAllowed('up-only', 'right'), false, 'guided REAL rejects RIGHT before commit');
eq(isHuntDirectionAllowed('right-only', 'up'), false, 'guided TRAP rejects UP before commit');
eq(isHuntDirectionAllowed('right-only', 'right'), true, 'guided TRAP accepts RIGHT');

console.log('OK');
