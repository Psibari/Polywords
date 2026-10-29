import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The Hunt Results HOME goes through GameScreen's handleHome. A plain
// navigate('Home') pushes a second Home over the finished Game; { pop: true }
// returns to the existing one (React Navigation 7). The run has left
// 'playing' by then, so the beforeRemove exit guard lets the pop through.
const game = readFileSync(new URL('./GameScreen.tsx', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

const handleHome = game.match(/function handleHome\(\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
assert.ok(handleHome, 'handleHome exists in GameScreen.tsx');
assert.match(handleHome, /navigation\.navigate\('Home', undefined, \{ pop: true \}\)/);
assert.doesNotMatch(game, /navigation\.navigate\('Home'\)/);

assert.match(game, /<ResultsScreen onRestart=\{handleRestart\} onHome=\{handleHome\} \/>/);
assert.match(game, /if \(game\.status !== 'playing' \|\| isHuntExitGuardBypassed\(\)\) return;/);

assert.match(packageJson.scripts.test, /huntResultsHomeNav\.test\.mjs/);

console.log('hunt results home navigation static checks passed');
