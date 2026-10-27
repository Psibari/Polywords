import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const game = readFileSync(new URL('./GameScreen.tsx', import.meta.url), 'utf8');
const pauseMenu = readFileSync(new URL('../components/HuntPauseMenu.tsx', import.meta.url), 'utf8');
const exitConfirm = readFileSync(new URL('../components/PollyExitConfirm.tsx', import.meta.url), 'utf8');
const homeButton = readFileSync(new URL('../components/HomeButton.tsx', import.meta.url), 'utf8');
const settings = readFileSync(new URL('./SettingsScreen.tsx', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

assert.match(game, /const \[pauseVisible, setPauseVisible\] = useState\(false\)/);
assert.match(game, /onPress=\{handlePause\}/);
assert.match(game, /<HuntPauseMenu/);
assert.match(game, /hasResumableGame: true/);
assert.match(game, /flushActiveGamePersistence\(\)/);
assert.match(game, /game\.status !== 'playing' \|\| pauseVisible \|\| exitConfirmVisible/);
assert.match(game, /isHuntExitGuardBypassed\(\)/);
assert.match(game, /withHuntExitGuardBypass/);

const pauseButtonBlock = game.match(/accessibilityLabel="Pause the Hunt"[\s\S]{0,320}/)?.[0] ?? '';
assert.doesNotMatch(pauseButtonBlock, /navigation\.goBack/);

for (const label of ['HUNT PAUSED', 'RESUME HUNT', 'HOME', 'SETTINGS', 'QUIT HUNT']) {
  assert.match(pauseMenu, new RegExp(label));
}

assert.match(exitConfirm, /polly_quit_smug\.png/);
assert.equal((exitConfirm.match(/See you later,/g) ?? []).length, 1);
assert.doesNotMatch(exitConfirm, /POLLY_LINES|pollyLine/);
assert.match(exitConfirm, /accessibilityViewIsModal/);
assert.match(homeButton, /withHuntExitGuardBypass/);

const pauseHomeHandler =
  game.match(/const handlePauseHome[\s\S]*?\}, \[navigation, preserveActiveHunt\]\);/)?.[0] ?? '';
assert.doesNotMatch(pauseHomeHandler, /setPauseVisible\(false\)/);

assert.match(
  game,
  /navigation\.navigate\('Settings', \{ preserveHunt: true \}\)/,
);

assert.match(
  settings,
  /preserveHunt=\{route\?\.params\?\.preserveHunt === true\}/,
);

assert.doesNotMatch(homeButton, /navigation\.getState/);
assert.match(homeButton, /preserveHunt/);

assert.match(packageJson.scripts.test, /huntPauseNavigation\.test\.ts/);
assert.match(packageJson.scripts.test, /huntPauseFlow\.test\.mjs/);

console.log('hunt pause flow static checks passed');
