import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The Daily's pause icon and card (Pete, 2026-10-29). One card, no quit:
// leaving the Daily costs nothing and an unfinished Daily can be resumed.
const daily = readFileSync(new URL('./DailyChallengeScreen.tsx', import.meta.url), 'utf8');
const card = readFileSync(new URL('../components/DailyPauseCard.tsx', import.meta.url), 'utf8');
const copy = readFileSync(new URL('../ui/dailyPauseCopy.ts', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

// Pete's final wording, exact.
assert.match(copy, /export const DAILY_PAUSE_KICKER = 'CHALLENGE STILL STANDS\.';/);
assert.match(copy, /export const DAILY_PAUSE_POLLY_LINE = "You got until midnight, I'll be waiting\.";/);
assert.match(copy, /export const DAILY_PAUSE_CONTINUE = 'CONTINUE';/);
assert.match(copy, /export const DAILY_PAUSE_HOME = 'HOME';/);
assert.match(copy, /export const DAILY_PAUSE_SETTINGS = 'SETTINGS';/);

// No quit, no forfeit, no body text.
for (const source of [card, copy]) {
  assert.doesNotMatch(source, /QUIT|Quit|onQuit|forfeit|Forfeit|LEAVE THE/);
  assert.doesNotMatch(source, /DAILY_PAUSE_BODY|\bbody:|\.body\b/);
}

// Every word on the card comes from dailyPauseCopy.ts.
assert.match(card, /from '\.\.\/ui\/dailyPauseCopy'/);
const textChildren = [...card.matchAll(/<Text style=\{[^}]*\}+>([\s\S]*?)<\/Text>/g)].map(m => m[1]);
assert.ok(textChildren.length >= 3, 'the card has its title, bubble and button labels');
for (const child of textChildren) {
  assert.match(child, /^\{(DAILY_PAUSE_[A-Z_]+|label)\}$/, `card text must come from the copy file: ${child}`);
}
assert.doesNotMatch(card, /(label|accessibilityLabel)="/);
for (const name of ['DAILY_PAUSE_KICKER', 'DAILY_PAUSE_POLLY_LINE', 'DAILY_PAUSE_CONTINUE', 'DAILY_PAUSE_HOME', 'DAILY_PAUSE_SETTINGS']) {
  assert.match(card, new RegExp(`\\{${name}\\}`), `${name} is shown`);
}
assert.match(card, /polly_quit_smug\.png/);
assert.match(card, /accessibilityViewIsModal/);
assert.match(card, /onAccessibilityEscape=\{onContinue\}/);
assert.match(card, /zIndex: 340/);

// The clock: the reveal interval is gated by the paused ref, and the elapsed
// read is frozen while paused.
const interval = daily.match(/const id = setInterval\(\(\) => \{[\s\S]*?\}, 250\);/)?.[0] ?? '';
assert.match(interval, /if \(pausedRef\.current\) return;/);
assert.match(daily, /paused: pausedRef\.current,/);

// Claims refuse while paused.
const claimStart = daily.match(/function handleClaimStart\([\s\S]*?\n  \}/)?.[0] ?? '';
assert.match(claimStart, /if \(pausedRef\.current\) return false;/);
const claim = daily.match(/function handleClaim\(\n[\s\S]*?\n  \}/)?.[0] ?? '';
assert.match(claim, /if \(pausedRef\.current\) return;/);

// The card's wiring: HOME through handleHome (pop: true), the card last.
assert.match(daily, /<DailyPauseCard\s+onContinue=\{handleContinue\}\s+onHome=\{handleHome\}\s+onSettings=\{handlePauseSettings\}/);
assert.match(daily, /function handleHome\(\) \{\n    navigation\.navigate\('Home', undefined, \{ pop: true \}\);/);
assert.match(daily, /navigation\.navigate\('Settings'\);/);
assert.match(daily, /canOpenDailyPause\(/);
assert.match(daily, /hardwareBackPress/);
assert.match(daily, /kind="pause"/);
assert.match(daily, /top: insets\.top \+ DAILY_HUD\.marginTop/);
const lastChild = daily.match(/\{paused && dailySession\?\.status === 'active' && \([\s\S]*?\)\}\s*<\/View>\s*\);\s*\}/);
assert.ok(lastChild, 'the pause card is the last child of the root View');

assert.match(packageJson.scripts.test, /dailyPause\.test\.ts/);
assert.match(packageJson.scripts.test, /dailyPauseFlow\.test\.mjs/);

console.log('daily pause flow static checks passed');
