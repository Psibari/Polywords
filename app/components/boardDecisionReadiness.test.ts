import { shouldReleaseOpeningDecision } from './boardDecisionReadiness';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

eq(
  shouldReleaseOpeningDecision({
    cardLanded: true,
    boardVisible: true,
    alreadyReleased: false,
  }),
  true,
  'normal opening releases when landed and visible',
);

eq(
  shouldReleaseOpeningDecision({
    cardLanded: true,
    boardVisible: false,
    alreadyReleased: false,
  }),
  false,
  'returning haunt cannot release while card is hidden',
);

eq(
  shouldReleaseOpeningDecision({
    cardLanded: false,
    boardVisible: true,
    alreadyReleased: false,
  }),
  false,
  'boss cannot release before opening card lands',
);

eq(
  shouldReleaseOpeningDecision({
    cardLanded: true,
    boardVisible: true,
    alreadyReleased: true,
  }),
  false,
  'opening readiness releases only once',
);

console.log('boardDecisionReadiness tests passed');
