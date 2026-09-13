// Stages new Hunt content from a "Tiles / Boss Words (Production)" editorial workbook
// into a reviewable JSON file — it never writes to assets/data/huntData.json directly.
// Usage: node tools/content/import-workbook.mjs <path-to-xlsx> [--out <dir>]
import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const workbookPath = process.argv[2];
if (!workbookPath) {
  console.error('Usage: node tools/content/import-workbook.mjs <path-to-xlsx> [--out <dir>]');
  process.exit(1);
}
const outFlagIndex = process.argv.indexOf('--out');
const outDir =
  outFlagIndex !== -1 ? process.argv[outFlagIndex + 1] : path.join(repoRoot, 'tools/content/import-staging');

const livePath = path.join(repoRoot, 'assets/data/huntData.json');
const liveData = JSON.parse(fs.readFileSync(livePath, 'utf8'));

const wb = XLSX.readFile(workbookPath, { cellStyles: true });
function sheetRows(name) {
  if (!wb.Sheets[name]) throw new Error(`Workbook is missing expected sheet: ${name}`);
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
}

function normalizePhrase(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

// Statuses that mean "this is the final, ship-ready wording."
const FINAL_STATUSES = new Set([
  'LOCKED',
  'DONE',
  'FIXED',
  'NEW',
  'REWRITTEN',
  'REWRITTEN + VERIFIED',
  'KEPT',
  'KEPT + VERIFIED',
  'REPLACED',
  'CARD COMPLETE',
]);
// Statuses that mean "this row/word was explicitly rejected — never import it."
const DROP_STATUSES = new Set(['CUT', 'CUT BY PETE', 'DEMOTED FROM BOSS BY PETE']);

// ---- Tiles sheet: word -> deduped REAL/TRAP maps (fill-down word column, skip BOSS-type rows) ----
// Boss-hidden content lives in "Boss Words (Production)" instead; Tiles' own BOSS rows are
// pre-consolidation leftovers for words that were later folded into that sheet.
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
    if (!tilesByWord.has(currentWord)) {
      tilesByWord.set(currentWord, { reals: new Map(), traps: new Map() });
    }
    const bucket = tilesByWord.get(currentWord)[type === 'REAL' ? 'reals' : 'traps'];
    // Map.set on a repeated normalized phrase keeps insertion order but overwrites the
    // value, so a later (re-audited) row for the same tile naturally wins.
    bucket.set(normalizePhrase(phrase), { phrase: String(phrase).trim(), status });
  }
}

// ---- Boss Words (Production) sheet: word -> REAL/TRAP + hidden PAIRS + demotion flag ----
// This sheet contains multiple non-contiguous historical blocks per word (draft pass, then a
// later "Consolidated from verified Tiles" pass) — same last-write-wins dedup handles it.
//
// FIXED 2026-09-12 (was stale against the current boss schema): the sheet's 7th column,
// "Hidden Pair ID" (e.g. "wake_h00" / "wake_h01" / "wake_h02"), groups a BOSS-HIDDEN row with
// its matching BOSS-HIDDEN-TRAP row into one of the THREE pairs a live boss word requires
// (runtimeHuntValidation.mjs: "boss words require exactly 3 hiddenPairs for the Route C
// gauntlet"). The previous version never read this column — it kept only the single latest
// BOSS-HIDDEN/BOSS-HIDDEN-TRAP row per word, silently discarding the other two pairs.
const bossByWord = new Map();
{
  let currentWord = '';
  for (const row of sheetRows('Boss Words (Production)').slice(1)) {
    if (!row.some((cell) => cell !== '')) continue;
    const [wordCol, type, phrase, , status, notes, hiddenPairId] = row;
    if (wordCol) currentWord = String(wordCol).trim();
    if (!currentWord) continue;
    if (!bossByWord.has(currentWord)) {
      bossByWord.set(currentWord, {
        reals: new Map(),
        traps: new Map(),
        // Keyed by the sheet's raw Hidden Pair ID (e.g. "wake_h01") so a BOSS-HIDDEN row and
        // its BOSS-HIDDEN-TRAP row land in the same pair regardless of row order.
        hiddenPairs: new Map(),
        demoted: false,
        demotedNote: '',
      });
    }
    const entry = bossByWord.get(currentWord);
    if (type === 'STATUS' && DROP_STATUSES.has(status)) {
      entry.demoted = true;
      entry.demotedNote = notes;
    }
    if (type === 'REAL' && phrase) entry.reals.set(normalizePhrase(phrase), { phrase: String(phrase).trim(), status });
    if (type === 'TRAP' && phrase) entry.traps.set(normalizePhrase(phrase), { phrase: String(phrase).trim(), status });
    if ((type === 'BOSS-HIDDEN' || type === 'BOSS-HIDDEN-TRAP') && phrase) {
      const pairId = String(hiddenPairId || '').trim();
      if (!pairId) continue; // ungrouped hidden row — surfaced via ungroupedHidden below
      if (!entry.hiddenPairs.has(pairId)) {
        entry.hiddenPairs.set(pairId, { real: null, realStatus: null, trap: null, trapStatus: null });
      }
      const pair = entry.hiddenPairs.get(pairId);
      if (type === 'BOSS-HIDDEN') {
        pair.real = String(phrase).trim();
        pair.realStatus = status;
      } else {
        pair.trap = String(phrase).trim();
        pair.trapStatus = status;
      }
    }
  }
}

const WORD_TYPE_NAMES = { 1: 'Single', 2: 'Double', 3: 'Triple', 4: 'Quadruple', 5: 'Quintuple', 6: 'Sextuple', 7: 'Septuple' };

const allWords = new Set([...tilesByWord.keys(), ...bossByWord.keys()]);
const staged = {};
const report = {
  readyBoss: [],
  notReadyBoss: [],
  bossIncomplete: [],
  demotedBoss: [],
  newHeadwords: [],
  replacesLiveWord: [],
  noMasks: [],
  gpsTagNeeded: [],
  difficultyNeeded: [],
};

// Matches runtimeHuntValidation.mjs's own wordPrefix derivation exactly, so every ID this
// script emits is guaranteed to pass that validator's prefix check rather than merely
// echoing whatever casing/spacing the sheet's Hidden Pair ID column happened to use.
function hiddenPairWordPrefix(word) {
  return word.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

for (const word of [...allWords].sort()) {
  const bossEntry = bossByWord.get(word);
  const tileEntry = tilesByWord.get(word);

  let reals;
  let traps;
  let source;
  if (bossEntry && bossEntry.reals.size > 0) {
    reals = [...bossEntry.reals.values()];
    traps = [...bossEntry.traps.values()];
    source = 'boss-production';
  } else if (tileEntry) {
    reals = [...tileEntry.reals.values()];
    traps = [...tileEntry.traps.values()];
    source = 'tiles';
  } else {
    reals = [];
    traps = [];
    source = 'none';
  }

  if (reals.length === 0 && traps.length === 0) {
    report.noMasks.push(word);
    continue;
  }

  // hiddenMeaning/hiddenTrap are the legacy single-pair fields — runtimeHuntValidation.mjs
  // requires them null/absent whenever hiddenPairs (the current, 3-pair format) is used.
  let hiddenPairs = null;
  let gpsTag = null;
  let isBoss = false;

  if (bossEntry && bossEntry.demoted) {
    report.demotedBoss.push({ word, note: bossEntry.demotedNote });
  } else if (bossEntry && bossEntry.hiddenPairs.size > 0) {
    const wordPrefix = hiddenPairWordPrefix(word);
    const sortedPairIds = [...bossEntry.hiddenPairs.keys()].sort();
    const complete = [];
    const incomplete = [];
    for (const rawId of sortedPairIds) {
      const pair = bossEntry.hiddenPairs.get(rawId);
      const suffixMatch = rawId.match(/_h(\d+)\s*$/i);
      const ready =
        Boolean(pair.real) && Boolean(pair.trap) &&
        FINAL_STATUSES.has(pair.realStatus) && FINAL_STATUSES.has(pair.trapStatus) &&
        Boolean(suffixMatch);
      if (ready) {
        complete.push({ id: `${wordPrefix}_h${suffixMatch[1]}`, real: pair.real, trap: pair.trap });
      } else {
        incomplete.push({
          rawId, hasReal: Boolean(pair.real), hasTrap: Boolean(pair.trap),
          realStatus: pair.realStatus, trapStatus: pair.trapStatus,
        });
      }
    }
    if (complete.length === 3 && incomplete.length === 0) {
      hiddenPairs = complete;
      gpsTag = 'boss';
      isBoss = true;
      report.readyBoss.push(word);
    } else {
      report.notReadyBoss.push({ word, completePairs: complete.length, incomplete });
    }
  } else if (bossEntry) {
    report.bossIncomplete.push(word);
  }

  const slug = word.toLowerCase();
  const masks = [
    ...reals.map((r, i) => ({ id: `${slug}_r${i}`, phrase: r.phrase, isReal: true })),
    ...traps.map((t, i) => ({ id: `${slug}_t${i}`, phrase: t.phrase, isReal: false })),
  ];

  staged[word] = {
    difficulty: null, // NOT in the workbook — needs an editorial pass before this can ship
    hiddenMeaning: null,
    hiddenTrap: null,
    hiddenPairs, // exactly 3 {id, real, trap} objects when isBoss, else null
    masks,
    gpsTag, // null for every non-boss word — needs GOLDEN_PACING_SYSTEM assignment
    wordType: WORD_TYPE_NAMES[reals.length] || `${reals.length}-MEANING`,
    _importSource: source,
  };

  if (!isBoss) report.gpsTagNeeded.push(word);
  report.difficultyNeeded.push(word);

  if (liveData[word]) report.replacesLiveWord.push(word);
  else report.newHeadwords.push(word);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'staged-hunt-content.json'), JSON.stringify(staged, null, 2));
fs.writeFileSync(path.join(outDir, 'import-report.json'), JSON.stringify(report, null, 2));

console.log('=== IMPORT SUMMARY ===');
console.log('Total staged words:', Object.keys(staged).length);
console.log('\nBoss-ready (' + report.readyBoss.length + '):', report.readyBoss.join(', '));
console.log('\nBoss NOT ready — fewer than 3 complete, final-status hidden pairs (' + report.notReadyBoss.length + '):');
for (const b of report.notReadyBoss) {
  console.log(`  - ${b.word}: ${b.completePairs}/3 pairs complete`);
  for (const inc of b.incomplete) {
    console.log(`      ${inc.rawId}: real=${inc.hasReal ? inc.realStatus : 'MISSING'} trap=${inc.hasTrap ? inc.trapStatus : 'MISSING'}`);
  }
}
console.log('\nBoss candidate, hidden pair never authored (' + report.bossIncomplete.length + '):', report.bossIncomplete.join(', '));
console.log('\nDemoted from boss by Pete — imported as regular word only (' + report.demotedBoss.length + '):');
for (const d of report.demotedBoss) console.log(`  - ${d.word}: ${d.note}`);
console.log('\nWould REPLACE an existing live huntData.json entry (' + report.replacesLiveWord.length + ')');
console.log('Brand-new headwords, not in live data at all (' + report.newHeadwords.length + '):', report.newHeadwords.join(', '));
console.log('\nSkipped — zero usable masks (' + report.noMasks.length + '):', report.noMasks.join(', '));
console.log('\nEvery staged word needs difficulty assigned (' + report.difficultyNeeded.length + ')');
console.log('Every non-boss staged word needs gpsTag assigned (' + report.gpsTagNeeded.length + ')');
console.log('\nWrote:', path.join(outDir, 'staged-hunt-content.json'));
console.log('Wrote:', path.join(outDir, 'import-report.json'));
