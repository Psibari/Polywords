import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The Daily's HOME (Results) and NOT NOW (entry card) both go through
// handleHome. A plain navigate('Home') pushes a second Home over the Daily;
// { pop: true } returns to the existing one (React Navigation 7).
const daily = readFileSync(new URL('./DailyChallengeScreen.tsx', import.meta.url), 'utf8');
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

const handleHome = daily.match(/function handleHome\(\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
assert.ok(handleHome, 'handleHome exists in DailyChallengeScreen.tsx');
assert.match(handleHome, /navigation\.navigate\('Home', undefined, \{ pop: true \}\)/);
assert.doesNotMatch(daily, /navigation\.navigate\('Home'\)/);

assert.match(daily, /onPress=\{handleHome\}/);
assert.match(daily, /<ResultsOverlay onHome=\{handleHome\}/);

assert.match(packageJson.scripts.test, /dailyHomeNav\.test\.mjs/);

console.log('daily home navigation static checks passed');
