// Full replacement build: wipes assets/data/huntData.json and rebuilds it from ONLY the
// new editorial workbook (Pete's 2026-08-06 call — the old 400-word test corpus is gone,
// this 150-word workbook is the new working list).
//
// gpsTag and difficulty do not exist anywhere in the workbook. gpsTag is load-bearing —
// huntGenerator.ts pools words by it and throws if a pool is empty — so this assigns a
// round-robin placeholder split across confidence/flow/tension/panic rather than leaving it
// null. difficulty is seeded from the workbook's Rewrite Queue "Diff" column where present,
// defaulting to 'medium' elsewhere. Both fall back to tools/content/pacing-overrides.json —
// a git-tracked, hand-reviewed editorial pass (word -> {gpsTag, difficulty}) that is NOT in
// the workbook — before falling back further to the round-robin/medium placeholder. This is
// what keeps that editorial work from being silently wiped out the next time this script
// runs against an updated workbook. Words absent from the overrides file are still flagged
// in the report as needing the real pass.
//
// Usage: node tools/content/build-hunt-data.mjs <path-to-xlsx>
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const workbookPath = process.argv[2];
if (!workbookPath) {
  console.error('Usage: node tools/content/build-hunt-data.mjs <path-to-xlsx>');
  process.exit(1);
}
const livePath = path.join(repoRoot, 'assets/data/huntData.json');
const reportDir = path.join(repoRoot, 'tools/content/import-staging');
const overridesPath = path.join(repoRoot, 'tools/content/pacing-overrides.json');
const pacingOverrides = fs.existsSync(overridesPath)
  ? JSON.parse(fs.readFileSync(overridesPath, 'utf8'))
  : {};

const wb = XLSX.readFile(workbookPath, { cellStyles: true });
function sheetRows(name) {
  if (!wb.Sheets[name]) throw new Error(`Workbook is missing expected sheet: ${name}`);
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
}
function normalizePhrase(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

const FINAL_STATUSES = new Set([
  'LOCKED', 'DONE', 'FIXED', 'NEW', 'REWRITTEN', 'REWRITTEN + VERIFIED',
  'KEPT', 'KEPT + VERIFIED', 'REPLACED', 'CARD COMPLETE',
]);
const DROP_STATUSES = new Set(['CUT', 'CUT BY PETE', 'DEMOTED FROM BOSS BY PETE']);
const VALID_DIFFICULTY = new Set(['easy', 'medium', 'hard']);

// ---- Tiles sheet ----
const tilesByWord = new Map();
{
  let currentWord = '';
  for (const row of sheetRows('Tiles').slice(1)) {
    if (!row.some((cell) => cell !== '')) continue;
    const [wordCol, type, phrase, , , status] = row;
    if (wordCol) currentWord = String(wordCol).trim();
    if (!currentWord || type === 'BOSS' || status === 'CUT') continue;
    if (type !== 'REAL' && type !== 'TRAP') continue;
    if (!phrase) continue;
    if (!tilesByWord.has(currentWord)) tilesByWord.set(currentWord, { reals: new Map(), traps: new Map() });
    const bucket = tilesByWord.get(currentWord)[type === 'REAL' ? 'reals' : 'traps'];
    bucket.set(normalizePhrase(phrase), { phrase: String(phrase).trim(), status });
  }
}

// ---- Boss Words (Production) sheet ----
const bossByWord = new Map();
{
  let currentWord = '';
  for (const row of sheetRows('Boss Words (Production)').slice(1)) {
    if (!row.some((cell) => cell !== '')) continue;
    const [wordCol, type, phrase, , status, notes] = row;
    if (wordCol) currentWord = String(wordCol).trim();
    if (!currentWord) continue;
    if (!bossByWord.has(currentWord)) {
      bossByWord.set(currentWord, { reals: new Map(), traps: new Map(), hidden: null, hiddenTrap: null, demoted: false, demotedNote: '' });
    }
    const entry = bossByWord.get(currentWord);
    if (type === 'STATUS' && DROP_STATUSES.has(status)) {
      entry.demoted = true;
      entry.demotedNote = notes;
    }
    if (type === 'REAL' && phrase) entry.reals.set(normalizePhrase(phrase), { phrase: String(phrase).trim(), status });
    if (type === 'TRAP' && phrase) entry.traps.set(normalizePhrase(phrase), { phrase: String(phrase).trim(), status });
    if (type === 'BOSS-HIDDEN' && phrase) entry.hidden = { phrase: String(phrase).trim(), status };
    if (type === 'BOSS-HIDDEN-TRAP' && phrase) entry.hiddenTrap = { phrase: String(phrase).trim(), status };
  }
}

// ---- Rewrite Queue "Diff" column -> difficulty seed ----
const difficultyHints = new Map();
for (const row of sheetRows('Rewrite Queue').slice(1)) {
  if (!row.some((cell) => cell !== '')) continue;
  const [, word, diff] = row;
  const normalized = String(diff || '').trim().toLowerCase();
  if (word && VALID_DIFFICULTY.has(normalized)) difficultyHints.set(String(word).trim(), normalized);
}

const WORD_TYPE_NAMES = { 1: 'Single', 2: 'Double', 3: 'Triple', 4: 'Quadruple', 5: 'Quintuple', 6: 'Sextuple', 7: 'Septuple' };
const PACING_ROTATION = ['confidence', 'flow', 'tension', 'panic'];

// A pure function of the word itself, not a shared running counter — so one
// word's placeholder never shifts just because some other word gained or
// lost an override. A shared cursor looked fine until pacing-overrides.json
// started pulling words out of the rotation: every remaining placeholder
// word's phase silently reshuffled because its position in the now-shorter
// rotation sequence changed, even though nothing about that word was
// reviewed. Confirmed via a before/after diff (2026-08-08): 35 unreviewed
// words got a different (still equally meaningless) gpsTag placeholder
// purely from 91 other words being added to pacing-overrides.json.
function stableRotationIndex(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  return hash % PACING_ROTATION.length;
}

const allWords = new Set([...tilesByWord.keys(), ...bossByWord.keys()]);
const finalData = {};
const report = {
  readyBoss: [], notReadyBoss: [], bossIncomplete: [], demotedBoss: [],
  noMasks: [], difficultyDefaulted: [], gpsTagPlaceholder: [],
};

for (const word of [...allWords].sort()) {
  const bossEntry = bossByWord.get(word);
  const tileEntry = tilesByWord.get(word);

  let reals, traps, source;
  if (bossEntry && bossEntry.reals.size > 0) {
    reals = [...bossEntry.reals.values()];
    traps = [...bossEntry.traps.values()];
    source = 'boss-production';
  } else if (tileEntry) {
    reals = [...tileEntry.reals.values()];
    traps = [...tileEntry.traps.values()];
    source = 'tiles';
  } else {
    reals = []; traps = []; source = 'none';
  }

  if (reals.length === 0 && traps.length === 0) {
    report.noMasks.push(word);
    continue;
  }

  let hiddenMeaning = null, hiddenTrap = null, hiddenPairs = null, gpsTag, isBoss = false;

  if (bossEntry && bossEntry.demoted) {
    report.demotedBoss.push(word);
  } else if (bossEntry && bossEntry.hidden && bossEntry.hiddenTrap) {
    const ready = FINAL_STATUSES.has(bossEntry.hidden.status) && FINAL_STATUSES.has(bossEntry.hiddenTrap.status);
    if (ready) {
      hiddenMeaning = bossEntry.hidden.phrase;
      hiddenTrap = bossEntry.hiddenTrap.phrase;
      // Matches the live convention already used by the 19 existing boss words
      // (e.g. BOUND, CAST): pair 0 is real, slots 2-3 are explicit placeholders
      // pending the second/third hidden pair this word still owes per CLAUDE.md.
      hiddenPairs = [
        { real: hiddenMeaning, trap: hiddenTrap },
        { real: 'PLACEHOLDER TEST — meaning two', trap: 'PLACEHOLDER TEST — TRAP TWO' },
        { real: 'PLACEHOLDER TEST — meaning three', trap: 'PLACEHOLDER TEST — TRAP THREE' },
      ];
      gpsTag = 'boss';
      isBoss = true;
      report.readyBoss.push(word);
    } else {
      report.notReadyBoss.push(word);
    }
  } else if (bossEntry) {
    report.bossIncomplete.push(word);
  }

  const override = pacingOverrides[word];

  if (!isBoss) {
    if (override?.gpsTag) {
      gpsTag = override.gpsTag;
    } else {
      gpsTag = PACING_ROTATION[stableRotationIndex(word)];
      report.gpsTagPlaceholder.push({ word, gpsTag });
    }
  }

  let difficulty = difficultyHints.get(word) || override?.difficulty;
  if (!difficulty) {
    difficulty = 'medium';
    report.difficultyDefaulted.push(word);
  }

  const slug = word.toLowerCase();
  const masks = [
    ...reals.map((r, i) => ({ id: `${slug}_r${i}`, phrase: r.phrase, isReal: true })),
    ...traps.map((t, i) => ({ id: `${slug}_t${i}`, phrase: t.phrase, isReal: false })),
  ];

  finalData[word] = {
    difficulty,
    hiddenMeaning,
    hiddenTrap,
    ...(hiddenPairs ? { hiddenPairs } : {}),
    masks,
    gpsTag,
    wordType: WORD_TYPE_NAMES[reals.length] || `${reals.length}-MEANING`,
  };
}

fs.writeFileSync(livePath, JSON.stringify(finalData, null, 2) + '\n');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'build-report.json'), JSON.stringify(report, null, 2));

console.log('=== REPLACED assets/data/huntData.json ===');
console.log('Total words now live:', Object.keys(finalData).length);
console.log('Boss words:', report.readyBoss.length, report.readyBoss.join(', '));
console.log('Skipped (no usable masks):', report.noMasks.length, report.noMasks.join(', '));
console.log('Difficulty defaulted to medium (no workbook or override signal):', report.difficultyDefaulted.length);
console.log('gpsTag is a PLACEHOLDER round-robin split, not real pacing:', report.gpsTagPlaceholder.length, 'words');
console.log('Pacing overrides applied from tools/content/pacing-overrides.json:', Object.keys(pacingOverrides).length, 'words');
console.log('Report written to:', path.join(reportDir, 'build-report.json'));
