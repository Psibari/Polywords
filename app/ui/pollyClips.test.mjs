import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const registryUrl = new URL('./pollyClips.ts', import.meta.url);
assert.equal(existsSync(registryUrl), true, 'Polly clip registry must exist');
const source = readFileSync(registryUrl, 'utf8');

const expectedFiles = [
  'polly_clip_idle_blink_hq.webp',
  'polly_clip_idle_blink_lite.webp',
  'polly_clip_laugh.webp',
  'polly_clip_rattled.webp',
  'polly_clip_bored.webp',
  'polly_clip_smug_lookaway.webp',
];
const clipDir = new URL('../../assets/images/polly/clips/', import.meta.url);
for (const file of expectedFiles) {
  assert.ok(source.includes(`polly/clips/${file}`), `registry must include ${file}`);
  assert.equal(existsSync(new URL(file, clipDir)), true, `${file} must exist on disk`);
  assert.ok(statSync(new URL(file, clipDir)).size > 10_000, `${file} must not be empty`);
}

// The architecture doc forbids shipping text-to-video output as the Polly source,
// so the experiment must stay quarantined: only the clip lab files may import it.
const allowed = new Set([
  'app/ui/pollyClips.ts',
  'app/ui/pollyClips.test.mjs',
  'app/components/PollyClipPlayer.tsx',
  'app/components/PollyClipLabViewer.tsx',
]);
const root = new URL('../../', import.meta.url).pathname;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}
for (const file of walk(join(root, 'app'))) {
  const rel = file.slice(root.length);
  if (allowed.has(rel)) continue;
  const text = readFileSync(file, 'utf8');
  assert.ok(
    !/pollyClips|PollyClipPlayer|PollyClipLabViewer/.test(text) || rel === 'app/screens/SettingsScreen.tsx',
    `${rel} must not use the experimental Polly clips`,
  );
}
const settings = readFileSync(join(root, 'app/screens/SettingsScreen.tsx'), 'utf8');
const labUses = settings.split('PollyClipLabViewer').length - 1;
assert.ok(labUses >= 2, 'Settings must host the clip lab');
assert.ok(/__DEV__[\s\S]*PollyClipLabViewer/.test(settings), 'clip lab must sit inside a __DEV__ block');

assert.ok(source.includes('Do not use unconstrained text-to-video'), 'registry must carry the architecture warning');
console.log('Polly clip lab contract passed');
