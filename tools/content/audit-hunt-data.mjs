import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const dataPath = path.join(repoRoot, 'assets/data/huntData.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const blockers = [];
const warnings = [];
const ids = new Map();
const phrases = new Map();
const wordTypes = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Quadruple',
  5: 'Quintuple',
  6: 'Sextuple',
  7: 'Septuple',
};
const approvedHeadwordLeaks = new Map([
  ['FAST/fast_r04', 'WHAT YOU BREAK WHEN YOU BREAK FAST'],
]);
const britishOnlyWarnings = [
  /\bCOLOUR\b/,
  /\bFAVOUR\b/,
  /\bCENTRE\b/,
  /\bTHEATRE\b/,
  /\bTRAVELLING\b/,
  /\bGREY\b/,
  /\bLORRY\b/,
  /\bFLAT\b.*\bAPARTMENT\b/,
  /\bENGLISH FOOTBALL\b/,
  /\bLUGGAGE\b.*\bBACK\b/,
];

function normalize(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const [word, entry] of Object.entries(data)) {
  const reals = entry.masks.filter((mask) => mask.isReal);
  const traps = entry.masks.filter((mask) => !mask.isReal);
  const expectedWordType = wordTypes[reals.length] || `${reals.length}-MEANING`;

  if (entry.wordType !== expectedWordType) {
    blockers.push(`${word}: wordType is ${entry.wordType}; expected ${expectedWordType}`);
  }
  if (reals.length < 2) warnings.push(`${word}: fewer than two visible REAL meanings`);
  if (traps.length < 3) warnings.push(`${word}: fewer than three traps`);

  for (const mask of entry.masks) {
    const prefix = `${word}/${mask.id || 'missing-id'}`;
    const phrase = String(mask.phrase || '').trim();
    const normalized = normalize(phrase);
    if (!mask.id) blockers.push(`${word}: mask ID is missing`);
    else if (ids.has(mask.id)) blockers.push(`${prefix}: duplicate ID also used by ${ids.get(mask.id)}`);
    else ids.set(mask.id, word);

    if (!phrase) blockers.push(`${prefix}: phrase is empty`);
    if (phrase !== phrase.toUpperCase()) blockers.push(`${prefix}: phrase must be uppercase`);
    if (phrases.has(normalized)) {
      blockers.push(`${prefix}: duplicate phrase also used by ${phrases.get(normalized)}`);
    } else {
      phrases.set(normalized, prefix);
    }

    const headwordPattern = new RegExp(
      `(?:^|[^A-Z])${word}(?:S|ES|ED|ING)?(?:$|[^A-Z])`,
    );
    const approvedLeak = approvedHeadwordLeaks.get(prefix) === phrase;
    if (!approvedLeak && headwordPattern.test(phrase)) {
      blockers.push(`${prefix}: phrase leaks the headword`);
    }

    if (britishOnlyWarnings.some((pattern) => pattern.test(phrase))) {
      warnings.push(`${prefix}: possible non-American wording: ${phrase}`);
    }
  }
}

const report = {
  file: dataPath,
  words: Object.keys(data).length,
  tiles: ids.size,
  blockers,
  warnings,
};

console.log(JSON.stringify(report, null, 2));
if (blockers.length) process.exitCode = 1;
