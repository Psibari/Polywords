// Purely additive workbook merge: adds words that are new to assets/data/huntData.json
// without ever modifying, reordering, or deleting an existing word. Written 2026-08-15 as
// the replacement for build-hunt-data.mjs's full-rebuild path, which is destructive against
// content that now carries stable ids (mask ids and hiddenPairs ids from the 2026-08-13
// identity migration) — see the guard at the top of build-hunt-data.mjs for the full list of
// what that script would have broken.
//
// Mask ids are taken verbatim from the workbook's own `Content ID` column, never
// regenerated positionally — the workbook's ids have already been verified byte-identical
// to the live corpus's existing mask ids everywhere both exist, so they are an authoritative
// source, not a guess.
//
// hiddenPairs are never touched, added, or inferred here. This tool has no concept of boss
// content at all — every word it adds gets hiddenMeaning: null, hiddenTrap: null, no
// hiddenPairs key. Promoting a word to boss status is a separate, hand-authored task.
//
// Usage: node tools/content/merge-workbook-additions.mjs <path-to-xlsx> [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const workbookPath = args.find(a => !a.startsWith('--'));

if (!workbookPath) {
  console.error('Usage: node tools/content/merge-workbook-additions.mjs <path-to-xlsx> [--dry-run]');
  process.exit(1);
}

const livePath = path.join(repoRoot, 'assets/data/huntData.json');
const overridesPath = path.join(repoRoot, 'tools/content/pacing-overrides.json');
const reportDir = path.join(repoRoot, 'tools/content/import-staging');
const reportPath = path.join(reportDir, 'merge-report.json');

const liveData = JSON.parse(fs.readFileSync(livePath, 'utf8'));
const pacingOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));

const wb = XLSX.readFile(workbookPath, { cellStyles: true });
if (!wb.Sheets['Tiles']) {
  console.error('Workbook is missing expected sheet: Tiles');
  process.exit(1);
}

const CUT_STATUSES = new Set(['CUT', 'CUT BY PETE']);
const WORD_TYPE_NAMES = { 1: 'Single', 2: 'Double', 3: 'Triple', 4: 'Quadruple', 5: 'Quintuple', 6: 'Sextuple', 7: 'Septuple' };

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

// ---- Read Tiles sheet, forward-filling the sparse Word column ----
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Tiles'], { header: 1, defval: '' }).slice(1);
const droppedCutRows = [];
const rowsByWord = new Map(); // word -> { reals: [{phrase, contentId}], traps: [...] }

{
  let currentWord = '';
  for (const row of rows) {
    if (!row.some(cell => cell !== '')) continue;
    const [wordCol, type, tile, , , status, , contentId] = row;
    if (wordCol) currentWord = String(wordCol).trim();
    if (!currentWord) continue;
    if (type !== 'REAL' && type !== 'TRAP') continue;

    if (CUT_STATUSES.has(String(status || '').trim().toUpperCase())) {
      droppedCutRows.push({ word: currentWord, type, phrase: String(tile).trim() });
      continue;
    }

    if (!rowsByWord.has(currentWord)) rowsByWord.set(currentWord, { reals: [], traps: [] });
    const bucket = rowsByWord.get(currentWord)[type === 'REAL' ? 'reals' : 'traps'];
    bucket.push({ phrase: String(tile).trim(), contentId: String(contentId || '').trim() });
  }
}

// ---- Split into already-live vs genuinely new ----
const alreadyLive = [];
const newWords = [];
for (const word of [...rowsByWord.keys()].sort()) {
  if (Object.prototype.hasOwnProperty.call(liveData, word)) {
    alreadyLive.push(word);
  } else {
    newWords.push(word);
  }
}

// ---- Collect every mask id currently live, to catch collisions ----
const liveMaskIds = new Set();
for (const word of Object.keys(liveData)) {
  for (const mask of liveData[word].masks) liveMaskIds.add(mask.id);
}

// ---- Build the new words, hard-failing on any integrity problem ----
const incomingIds = new Set();
const added = {};
const addedSummary = [];

for (const word of newWords) {
  const entry = rowsByWord.get(word);

  for (const tile of [...entry.reals, ...entry.traps]) {
    if (!tile.contentId) {
      fail(`Tile with empty/missing Content ID for word "${word}": "${tile.phrase}"`);
    }
    if (liveMaskIds.has(tile.contentId)) {
      fail(`Mask id "${tile.contentId}" (word "${word}") already exists in huntData.json.`);
    }
    if (incomingIds.has(tile.contentId)) {
      fail(`Duplicate mask id "${tile.contentId}" within the incoming workbook set (word "${word}").`);
    }
    incomingIds.add(tile.contentId);
  }

  if (entry.reals.length === 0) fail(`Word "${word}" has 0 REALs.`);
  if (entry.traps.length === 0) fail(`Word "${word}" has 0 traps.`);

  const override = pacingOverrides[word];
  if (!override || !override.gpsTag || !override.difficulty) {
    fail(
      `Word "${word}" has no entry in tools/content/pacing-overrides.json. ` +
      `Refusing to fall back to a placeholder gpsTag/difficulty — add a real, ` +
      `hand-reviewed entry for "${word}" before running this again.`
    );
  }

  const masks = [
    ...entry.reals.map(r => ({ id: r.contentId, phrase: r.phrase, isReal: true })),
    ...entry.traps.map(t => ({ id: t.contentId, phrase: t.phrase, isReal: false })),
  ];

  added[word] = {
    difficulty: override.difficulty,
    hiddenMeaning: null,
    hiddenTrap: null,
    masks,
    gpsTag: override.gpsTag,
    wordType: WORD_TYPE_NAMES[entry.reals.length] || `${entry.reals.length}-MEANING`,
  };

  addedSummary.push({ word, reals: entry.reals.length, traps: entry.traps.length, gpsTag: override.gpsTag, difficulty: override.difficulty });
}

// ---- Report ----
const report = {
  addedCount: addedSummary.length,
  added: addedSummary,
  alreadyLive,
  droppedCutRows,
};

fs.mkdirSync(reportDir, { recursive: true });
if (!dryRun) fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

console.log(dryRun ? '=== DRY RUN — nothing written ===' : '=== merge-workbook-additions.mjs ===');
console.log('Words added:', addedSummary.length, addedSummary.map(a => a.word).join(', '));
console.log('Already live (skipped):', alreadyLive.length);
console.log('CUT rows dropped:', droppedCutRows.length, droppedCutRows.map(r => `${r.word}/${r.type}`).join(', '));
console.log('Report:', dryRun ? '(not written — dry run)' : reportPath);

if (dryRun) {
  console.log('\n' + JSON.stringify(report, null, 2));
  process.exit(0);
}

// ---- Merge and write, sorted alphabetically by key ----
const merged = { ...liveData, ...added };
const sortedKeys = Object.keys(merged).sort();
const out = {};
for (const key of sortedKeys) out[key] = merged[key];

fs.writeFileSync(livePath, JSON.stringify(out, null, 2) + '\n');
console.log('\nassets/data/huntData.json updated. Total words now live:', sortedKeys.length);
