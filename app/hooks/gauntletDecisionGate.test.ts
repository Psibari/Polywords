// Regression: an opened Boss gauntlet card could never be swiped (device,
// 2026-09-29). onDecisionReady releases input at most once per decision
// (decisionReleasedRef, added with first-run onboarding in 4fd809b). The
// visible-word swipes re-armed that guard; a gauntlet pick did not, so the
// gauntlet's opening release left it set, the picked tile's landing was
// ignored, and decisionLocked stayed true under the open card.
//
// useBoardMechanics is a React hook over the store and can't run under node
// (the repo has no hook renderer), so this pins the decision gate at the
// source, and the swipe permission through the real helpers.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isHuntTileInteractive } from '../components/huntDecisionClock';
import { isHuntDirectionAllowed } from '../components/tileAccessibility';

const mechanics = readFileSync(join(__dirname, 'useBoardMechanics.ts'), 'utf8');
const spines = readFileSync(join(__dirname, '../components/BossGauntletSpines.tsx'), 'utf8');

/** The body of `function name(...) { ... }` or `name: () => { ... }`, braces matched. */
function body(source: string, name: string): string {
  const start = source.search(new RegExp(`(function ${name}\\(|${name}: \\(\\) => \\{)`));
  assert.ok(start >= 0, `${name} exists`);
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) return source.slice(open, i + 1);
  }
  throw new Error(`${name} has no closing brace`);
}

const REARM = [
  'presentationReadyRef.current = false;',
  'decisionReleasedRef.current = false;',
];

/** Locks input, then re-arms the release guard, in that order. */
function assertLocksAndRearms(name: string) {
  const fn = body(mechanics, name);
  const lock = fn.indexOf('setDecisionLocked(true);');
  assert.ok(lock >= 0, `${name} locks input for the new decision`);
  REARM.forEach((line) => {
    const at = fn.indexOf(line);
    assert.ok(at > lock, `${name} re-arms the release guard (${line})`);
  });
}

// The guard itself: one release per decision.
{
  const ready = body(mechanics, 'onDecisionReady');
  assert.match(
    ready,
    /if \(externalInputLockedRef\.current \|\| decisionReleasedRef\.current\) return;/,
    'onDecisionReady ignores a second ready signal for the same decision',
  );
  assert.match(ready, /decisionReleasedRef\.current = true;\s*setDecisionLocked\(false\);/, 'a release unlocks input');
}

// Ordinary Hunt: each visible-word swipe starts a new decision (unchanged).
assertLocksAndRearms('onSwipeUp');
assertLocksAndRearms('onSwipeRight');

// Gauntlet: a pick starts a new decision, so the landing can release it.
assertLocksAndRearms('pickGauntletTile');
{
  const pick = body(mechanics, 'pickGauntletTile');
  assert.match(
    pick,
    /if \(decisionLocked \|\| activeGauntletTile !== null\) return;/,
    'no pick while a card is open or input is held',
  );
  assert.ok(
    pick.indexOf('decisionReleasedRef.current = false;') < pick.indexOf('dropGauntletTile(index);'),
    'the guard is re-armed before the tile starts to drop',
  );

  const landed = body(mechanics, 'onGauntletTileLanded');
  assert.ok(
    landed.indexOf('setTileLanded(true);') >= 0 &&
      landed.indexOf('setTileLanded(true);') < landed.indexOf('onDecisionReady();'),
    'the landing marks the tile landed, then releases the decision',
  );
}

// Subsequent cards: a judged card hands back to the pick state, unlocked, and
// the next pick re-arms again (above).
{
  const resolve = body(mechanics, 'resolveGauntletTile');
  assert.match(
    resolve,
    /setGauntletIndex\(-1\);\s*setDecisionLocked\(false\);/,
    'after a non-final card, input returns for the next pick',
  );
}

// The open card: swipeable only once landed and released, both directions.
{
  assert.match(
    spines,
    /disabled=\{inputLocked \|\| \(!resolved && !\(isOpen && tileLanded\)\)\}/,
    'the gauntlet card is held until it is open, landed and input is released',
  );
  const card = spines.slice(spines.indexOf('<SwipeMask'), spines.indexOf('/>', spines.indexOf('<SwipeMask')));
  assert.ok(!/inputMode=/.test(card), 'the gauntlet card takes the default input mode');

  // SwipeMask's own gate, with the gauntlet's default mode ('both').
  const swipeable = (inputLocked: boolean, isOpen: boolean, tileLanded: boolean) =>
    isHuntTileInteractive(inputLocked || !(isOpen && tileLanded), 'both');
  assert.equal(swipeable(true, true, false), false, 'no swipe while the picked card is still dropping');
  assert.equal(swipeable(true, true, true), false, 'no swipe while the decision is still held');
  assert.equal(swipeable(false, true, true), true, 'the landed, released card takes a swipe');
  assert.equal(isHuntDirectionAllowed('both', 'up'), true, 'UP claims the hidden meaning');
  assert.equal(isHuntDirectionAllowed('both', 'right'), true, 'RIGHT rejects it as a trap');
}

console.log('gauntletDecisionGate tests passed');
