import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Daily haptics sit on what the player sees (Pete, 2026-10-11). The screen and
// the answer card are React Native components that do not run under node, so
// these pin their structure in the source, the same way dailyCoinFinale.test.ts
// pins the reward haptic.

const card = readFileSync(join(__dirname, '../components/DailyAnswerCard.tsx'), 'utf8');
const screen = readFileSync(join(__dirname, '../screens/DailyChallengeScreen.tsx'), 'utf8');
const haptics = readFileSync(join(__dirname, '../utils/haptics.ts'), 'utf8');

function between(source: string, start: string, end: string): string {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `found ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, `found ${end} after ${start}`);
  return source.slice(from, to);
}

const count = (source: string, needle: string) => source.split(needle).length - 1;

// Touch-down: one press tap per touch, never on a move, never on a disabled or
// claimed block.
{
  assert.equal(count(card, "Haptics.cueAsync('pressSteady')"), 1, 'one press cue in the card');
  const grant = between(card, 'onPanResponderGrant:', 'onPanResponderMove:');
  const guard = grant.indexOf('if (interactionDisabledRef.current || claimedRef.current) return;');
  const press = grant.indexOf("Haptics.cueAsync('pressSteady')");
  assert.ok(guard >= 0 && press > guard, 'the press cue fires at touch-down, after the disabled/claimed return');
  const move = between(card, 'onPanResponderMove:', 'onPanResponderRelease:');
  assert.ok(!move.includes('pressSteady'), 'no press cue while the finger moves');
  assert.ok(move.includes("Haptics.cueAsync('gestureThreshold')"), 'the threshold cue is unchanged');
}

// Gate landing: one Medium tap when the drop finishes, on the normal and the
// win path, never when the drop is interrupted.
{
  assert.match(
    haptics,
    /case 'dailyGateShut':\s*return ExpoHaptics\.impactAsync\(ExpoHaptics\.ImpactFeedbackStyle\.Medium\);/,
    'dailyGateShut is one Medium impact',
  );
  assert.equal(count(screen, "Haptics.cueAsync('dailyGateShut')"), 1, 'one gate-land cue');
  const at = screen.indexOf("Haptics.cueAsync('dailyGateShut')");
  const guard = 'if (!finished || completingCandidateRef.current !== candidate) return;';
  const guardAt = screen.lastIndexOf(guard, at);
  assert.ok(guardAt > 0, 'the cue sits behind the finished / same-claim guard');
  const gap = screen.slice(guardAt + guard.length, at);
  assert.ok(/^\s*(\/\/[^\n]*\n\s*)*$/.test(gap), 'nothing but a comment between the guard and the cue');
  const drop = screen.lastIndexOf('Animated.timing(gatePosition, {', guardAt);
  assert.ok(screen.slice(drop, guardAt).includes('toValue: 1,'), 'the guard belongs to the gate drop');
  const win = screen.indexOf('runGoldCoinFinale();', at);
  assert.ok(win > at && !screen.slice(at, win).includes('return;'), 'the cue fires before the win branch, so the win gets it too');
}

// Wrong claim: one haptic, when the gate hits the stop (the shimmy's first
// leg); at the claim only under reduced motion, where there is no shimmy.
{
  assert.match(screen, /const DAILY_WRONG_GATE_STOP_MS = 75;/, 'the stop lands 75 ms in');
  assert.equal(count(screen, "Haptics.cueAsync('wrong')"), 2, 'one wrong cue per branch');
  const wrong = between(screen, '// Wrong — the gate slams down', 'const wrongExitMs');
  assert.match(
    wrong,
    /if \(reduceMotion === false\) \{[\s\S]*?setTimeout\(\(\) => \{\s*wrongGateStopTimerRef\.current = null;\s*Haptics\.cueAsync\('wrong'\);\s*\}, DAILY_WRONG_GATE_STOP_MS\);/,
    'with motion, the cue waits for the stop',
  );
  assert.match(
    wrong,
    /Animated\.timing\(gatePosition, \{\s*toValue: 1\.06,\s*duration: DAILY_WRONG_GATE_STOP_MS,/,
    'the shimmy\'s first leg runs on the same constant',
  );
  assert.match(
    wrong,
    /\} else \{\s*(\/\/[^\n]*\n\s*)*Haptics\.cueAsync\('wrong'\);\s*\}/,
    'reduced motion: the cue at the claim, in the other branch only',
  );
  const beforeBranch = wrong.slice(0, wrong.indexOf('if (reduceMotion === false)'));
  assert.ok(!beforeBranch.includes("Haptics.cueAsync('wrong')"), 'no wrong cue at the claim with motion on');
  assert.match(screen, /useEffect\(\(\) => clearWrongGateStopTimer, \[\]\);/, 'the pending cue is cleared on unmount');
}

// Feather loss: the shake and pulse stay; no haptic of its own.
{
  const feather = between(
    screen,
    'const current = displayedDailySession?.chancesRemaining;',
    '}, [displayedDailySession?.chancesRemaining]);',
  );
  assert.ok(feather.includes('featherPulse'), 'the feather pulse is still there');
  assert.ok(!feather.includes('Haptics.'), 'the feather effect fires no haptic');
  assert.ok(!screen.includes('ImpactFeedbackStyle.Heavy'), 'no Heavy anywhere on the Daily screen');
  assert.ok(!screen.includes('NotificationFeedbackType.Error'), 'no extra Error on the Daily screen');
}

console.log('dailyHaptics tests passed');
