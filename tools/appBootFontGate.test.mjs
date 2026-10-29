import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A font that fails to load must not stop the boot. useFonts never reports
// loaded after an error, so App.tsx treats an error as "fonts finished" for
// both the boot effect and the render gate.
const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

assert.match(app, /const \[fontsLoaded, fontError\] = useFonts\(/, 'App.tsx must read the useFonts error');
assert.match(app, /const fontsDone = fontsLoaded \|\| fontError != null;/, 'a font error must count as fonts finished');
assert.match(app, /if \(!fontsDone\) return;/, 'the boot effect must wait on fontsDone');
assert.match(app, /\}, \[fontsDone\]\);/, 'the boot effect must re-run on fontsDone');
assert.match(app, /if \(!fontsDone \|\| !bootChecksDone\) \{/, 'the render gate must use fontsDone');
assert.doesNotMatch(app, /if \(!fontsLoaded\)/, 'nothing may gate on fontsLoaded alone');
assert.match(app, /\.finally\(\(\) => setBootChecksDone\(true\)\)/, 'the boot gate must still open when a load fails');

assert.match(packageJson.scripts.test, /appBootFontGate\.test\.mjs/);

console.log('app boot font gate static checks passed');
