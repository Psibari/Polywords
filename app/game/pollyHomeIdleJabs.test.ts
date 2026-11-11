import assert from 'node:assert/strict';
import { POLLY_LINES, type PollyLineId } from './pollyCharacter';
import {
  HOME_IDLE_JABS_ANGRY,
  HOME_IDLE_JABS_NORMAL,
  HOME_IDLE_JAB_FIRST_MS,
  HOME_IDLE_JAB_GAP_MS,
  HOME_IDLE_JAB_MAX_PER_VISIT,
  HOME_IDLE_JAB_RECENT_LIMIT,
  HOME_IDLE_JAB_SHOW_MS,
  homeIdleJabStartMs,
  pickHomeIdleJab,
  rememberHomeIdleJab,
  resolveHomeIdleJabMood,
} from './pollyHomeIdleJabs';

// Pose to mood: the rig poses are normal, angry is the sore loser, and the
// embarrassed pose stays quiet (no approved lines yet).
assert.equal(resolveHomeIdleJabMood('idle'), 'normal');
assert.equal(resolveHomeIdleJabMood('smug'), 'normal');
assert.equal(resolveHomeIdleJabMood('angry'), 'angry');
assert.equal(resolveHomeIdleJabMood('embarrassed'), null);

// The exact approved copy (Pete, 2026-11-11). A wording change must be his.
assert.deepEqual(HOME_IDLE_JABS_NORMAL.map(id => POLLY_LINES[id]), [
  'Scared?',
  'Tick. Tock.',
  'Take your time. I\u2019m winning.',
  'Staring won\u2019t beat me.',
  'Still deciding? Shocking.',
  'Thinking? That\u2019s new.',
  'Are we playing or posing?',
  'Nervous looks good on you.',
  'You blink more than I do.',
  'The button\u2019s right there.',
  'I got all day, pal.',
  'Sooooo...',
  'So are we just gonna stand here or what?',
]);
assert.deepEqual(HOME_IDLE_JABS_ANGRY.map(id => POLLY_LINES[id]), [
  'I let you have that one.',
  'Don\u2019t get comfortable.',
  'Enjoying yourself?',
  'Wipe that look off your face.',
  'I\u2019m not mad. You\u2019re mad.',
  'Quit gloating and play.',
  'Rematch. Now.',
  'What are you looking at?',
  'Cheater.',
  'Who did you pay to play for you?',
  'Must be AI.',
]);

// No line sits in both pools, and no pool repeats a line.
{
  const all = [...HOME_IDLE_JABS_NORMAL, ...HOME_IDLE_JABS_ANGRY];
  assert.equal(new Set(all).size, all.length);
}

// A pick always comes from the mood's own pool, across the whole roll range.
for (const roll of [0, 0.01, 0.25, 0.5, 0.75, 0.999, 1]) {
  assert.ok(HOME_IDLE_JABS_NORMAL.includes(pickHomeIdleJab('normal', [], roll)));
  assert.ok(HOME_IDLE_JABS_ANGRY.includes(pickHomeIdleJab('angry', [], roll)));
}

// Recent lines are skipped, so a visit's jabs never repeat.
{
  let recent: PollyLineId[] = [];
  const said: PollyLineId[] = [];
  for (let i = 0; i < HOME_IDLE_JAB_MAX_PER_VISIT; i += 1) {
    const id = pickHomeIdleJab('normal', recent, 0);
    said.push(id);
    recent = rememberHomeIdleJab(recent, id);
  }
  assert.equal(new Set(said).size, HOME_IDLE_JAB_MAX_PER_VISIT);
}

// The recent list is capped and keeps the newest last.
{
  let recent: PollyLineId[] = [];
  for (const id of HOME_IDLE_JABS_NORMAL) recent = rememberHomeIdleJab(recent, id);
  assert.equal(recent.length, HOME_IDLE_JAB_RECENT_LIMIT);
  assert.equal(recent[recent.length - 1], HOME_IDLE_JABS_NORMAL[HOME_IDLE_JABS_NORMAL.length - 1]);
  // Saying a line again moves it to the end without growing the list.
  const again = rememberHomeIdleJab(recent, recent[0]);
  assert.equal(again.length, HOME_IDLE_JAB_RECENT_LIMIT);
  assert.equal(again[again.length - 1], recent[0]);
}

// With every line recent it still answers (falls back to the whole pool).
assert.ok(HOME_IDLE_JABS_ANGRY.includes(pickHomeIdleJab('angry', [...HOME_IDLE_JABS_ANGRY], 0.5)));

// Both pools are bigger than the recent list, so a fresh line always exists.
assert.ok(HOME_IDLE_JABS_NORMAL.length > HOME_IDLE_JAB_RECENT_LIMIT);
assert.ok(HOME_IDLE_JABS_ANGRY.length > HOME_IDLE_JAB_RECENT_LIMIT);

// Schedule: first jab, then one per gap; a jab is gone before the next starts.
assert.equal(homeIdleJabStartMs(0), HOME_IDLE_JAB_FIRST_MS);
assert.equal(homeIdleJabStartMs(2), HOME_IDLE_JAB_FIRST_MS + 2 * HOME_IDLE_JAB_GAP_MS);
assert.ok(HOME_IDLE_JAB_SHOW_MS + 260 < HOME_IDLE_JAB_GAP_MS);

console.log('pollyHomeIdleJabs: ok');
