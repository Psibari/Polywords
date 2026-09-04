#!/usr/bin/env node
// Prints live content counts read straight from the repo.
//
// Docs must never carry a number this script can print: written-down counts rot
// the day content ships. Validation is NOT this script's job — `audit-hunt-data.mjs`
// and `validate-runtime-hunt.mjs` own pass/fail and thresholds. This is counts only.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...parts) => join(repoRoot, ...parts);
const read = (...parts) => readFileSync(at(...parts), 'utf8');

const hunt = JSON.parse(read('assets', 'data', 'huntData.json'));
const words = Object.entries(hunt);

const bossWords = words.filter(([, w]) => Array.isArray(w.hiddenPairs) && w.hiddenPairs.length > 0);
const hiddenPairs = bossWords.reduce((n, [, w]) => n + w.hiddenPairs.length, 0);

let realMasks = 0;
let trapMasks = 0;
const gpsTags = new Map();
for (const [, w] of words) {
  for (const mask of w.masks ?? []) {
    if (mask.isReal) realMasks += 1;
    else trapMasks += 1;
  }
  const tag = w.gpsTag ?? '(none)';
  gpsTags.set(tag, (gpsTags.get(tag) ?? 0) + 1);
}

// dailyPool.ts and pollyCharacter.ts are TypeScript, so they are read as text
// rather than imported. Both are hand-authored literals with stable shapes.
const dailyEntries = (read('app', 'game', 'dailyPool.ts').match(/^ {4}word:\s*["'`]/gm) ?? []).length;

const pollySrc = read('app', 'game', 'pollyCharacter.ts');
const pollyStart = pollySrc.indexOf('POLLY_LINES = {');
const pollyBody = pollySrc.slice(pollyStart, pollySrc.indexOf('} as const;', pollyStart));
const pollyLines = (pollyBody.match(/^ {2}[A-Za-z0-9_]+\s*:/gm) ?? []).length;

// The two rotating Hunt line pools. Every other moment holds a single fixed line.
const policySrc = read('app', 'game', 'pollyVisitPolicy.ts');
const poolSize = (name) => {
  const start = policySrc.indexOf(`const ${name}`);
  if (start === -1) return '(not found)';
  const body = policySrc.slice(start, policySrc.indexOf('];', start));
  return (body.match(/'[A-Za-z0-9_]+'/g) ?? []).length;
};

// huntData.json is alphabetised, so its last key says nothing about what was
// worked on most recently. The last commit that touched it is the real marker.
let pickup = '(no git history for assets/data/huntData.json)';
try {
  const out = execFileSync(
    'git',
    ['log', '-1', '--format=%h|%ad|%s', '--date=short', '--', 'assets/data/huntData.json'],
    { cwd: repoRoot, encoding: 'utf8' },
  ).trim();
  if (out) {
    const [sha, date, ...rest] = out.split('|');
    pickup = `${sha}  ${date}  ${rest.join('|').split('\n')[0]}`;
  }
} catch (err) {
  pickup = `(git unavailable: ${err.message.split('\n')[0]})`;
}

const today = new Date().toISOString().slice(0, 10);
const row = (label, value) => `  ${label.padEnd(24)} ${value}`;

const gpsRows = [...gpsTags.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([tag, count]) => row(`  ${tag}`, count));

console.log(`POLYWORDS content state  —  ${today}`);
console.log('');
console.log('Hunt (assets/data/huntData.json)');
console.log(row('words', words.length));
console.log(row('boss words', bossWords.length));
console.log(row('hidden pairs', hiddenPairs));
console.log(row('visible REAL masks', realMasks));
console.log(row('traps', trapMasks));
console.log(row('gpsTag pools', ''));
for (const line of gpsRows) console.log(line);
console.log('');
console.log('Daily (app/game/dailyPool.ts)');
console.log(row('pool entries', dailyEntries));
console.log('');
console.log('Polly (app/game/pollyCharacter.ts, app/game/pollyVisitPolicy.ts)');
console.log(row('authored lines', pollyLines));
console.log(row('WRONG_HECKLE_LINES', poolSize('WRONG_HECKLE_LINES')));
console.log(row('STREAK_LINES', poolSize('STREAK_LINES')));
console.log('');
console.log('Content pickup (last commit touching huntData.json)');
console.log(`  ${pickup}`);
