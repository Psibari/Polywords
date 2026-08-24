// POLYWORDS content audit gate.
// Run with: npm run audit:content   (or: npx -y tsx scripts/auditContent.ts)
//
// Mechanically checks huntData.json and the Daily pool against the locked
// Content Writing Standard: trap/real counts, headword leaks,
// zero content-word repeats across a word's tiles, duplicate phrases, and
// boss hidden-pair presence. It does NOT judge fairness or human voice —
// that stays editorial. Exit code 1 if anything fails, so it can gate CI.

import rawHuntData from '../assets/data/huntData.json';
import { DAILY_POOL } from '../app/game/dailyPool';

type HuntMask = { id: string; phrase: string; isReal: boolean; isRare?: boolean };
type HuntWord = {
  difficulty: string;
  hiddenMeaning: string | null;
  hiddenTrap: string | null;
  gpsTag: string;
  wordType?: string;
  masks: HuntMask[];
};

const db = rawHuntData as unknown as Record<string, HuntWord>;

const GPS_TAGS = new Set(['confidence', 'flow', 'tension', 'panic', 'boss']);
const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const APPROVED_HEADWORD_LEAKS = new Map([
  ['FAST/fast_r04', 'WHAT YOU BREAK WHEN YOU BREAK FAST'],
]);

// Words that don't count as "content words" for the zero-repeat rule.
const STOPWORDS = new Set([
  'A', 'AN', 'THE', 'OF', 'AND', 'OR', 'TO', 'IN', 'ON', 'AT', 'FOR', 'WITH',
  'FROM', 'BY', 'IS', 'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING', 'IT', 'ITS',
  'THIS', 'THAT', 'THESE', 'THOSE', 'YOUR', 'YOU', 'MY', 'HIS', 'HER', 'THEIR',
  'OUR', 'ONE', 'TWO', 'THREE', 'AFTER', 'BEFORE', 'INTO', 'OVER', 'UNDER',
  'OUT', 'UP', 'DOWN', 'OFF', 'NO', 'NOT', 'ONLY', 'THAN', 'THEN', 'THEM',
  'THEY', 'THERE', 'HERE', 'WHAT', 'WHEN', 'WHERE', 'WHO', 'WHOSE', 'HOW',
  'ALL', 'EVERY', 'EACH', 'PER', 'AS', 'IF', 'BUT', 'SO', 'TOO', 'VERY',
  'STILL', 'JUST', 'ALSO', 'MORE', 'MOST', 'LESS', 'ANY', 'SOME', 'NONE',
  'BOTH', 'WITHOUT', 'WITHIN', 'BETWEEN', 'BEHIND', 'ABOVE', 'BELOW',
  'ACROSS', 'AROUND', 'AGAINST', 'DURING', 'ABOUT', 'LIKE', 'NEAR', 'WHILE',
  'GET', 'GETS', 'GOT', 'GO', 'GOES', 'WENT', 'GONE', 'COME', 'COMES', 'CAME',
  'DO', 'DOES', 'DID', 'DONE', 'MAKE', 'MAKES', 'MADE', 'KEEP', 'KEEPS',
  'KEPT', 'TAKE', 'TAKES', 'TOOK', 'TAKEN', 'HAS', 'HAVE', 'HAD', 'WILL',
  'WOULD', 'CAN', 'COULD', 'MAY', 'MIGHT', 'MUST', 'SHALL', 'SHOULD',
  'NEED', 'NEEDS', 'LET', 'LETS', 'SAY', 'SAYS', 'SAID', 'NEVER', 'ALWAYS',
]);

function tokens(phrase: string): string[] {
  return phrase.toUpperCase().split(/[^A-Z]+/).filter(t => t.length >= 3);
}

function contentTokens(phrase: string): string[] {
  return tokens(phrase).filter(t => !STOPWORDS.has(t));
}

// Fold simple plurals so SHELF/SHELFS and CLUE/CLUES collide.
function fold(token: string): string {
  return token.length > 3 && token.endsWith('S') ? token.slice(0, -1) : token;
}

function headwordForms(word: string): Set<string> {
  const w = word.toUpperCase();
  const forms = new Set([w, `${w}S`, `${w}ES`, `${w}ED`, `${w}ING`, `${w}D`]);
  if (w.endsWith('E')) {
    forms.add(`${w.slice(0, -1)}ING`);
    forms.add(`${w.slice(0, -1)}ED`);
  }
  return forms;
}

const findings: string[] = [];
const counts: Record<string, number> = {};

function flag(category: string, message: string): void {
  findings.push(`[${category}] ${message}`);
  counts[category] = (counts[category] ?? 0) + 1;
}

// ── Hunt data ─────────────────────────────────────────────────────

const phraseOwners = new Map<string, string>();

for (const [word, entry] of Object.entries(db)) {
  if (!GPS_TAGS.has(entry.gpsTag)) flag('structure', `${word}: invalid gpsTag "${entry.gpsTag}"`);
  if (!DIFFICULTIES.has(entry.difficulty)) flag('structure', `${word}: invalid difficulty "${entry.difficulty}"`);

  const reals = entry.masks.filter(m => m.isReal);
  const traps = entry.masks.filter(m => !m.isReal);
  if (reals.length < 2) flag('structure', `${word}: only ${reals.length} REAL masks (need 2+)`);
  if (traps.length < 3) flag('structure', `${word}: only ${traps.length} traps (need 3+)`);

  if (entry.gpsTag === 'boss') {
    if (!entry.hiddenMeaning) flag('structure', `${word}: boss word missing hiddenMeaning`);
    if (!entry.hiddenTrap) flag('structure', `${word}: boss word missing hiddenTrap`);
  }

  const ids = new Set<string>();
  for (const mask of entry.masks) {
    if (ids.has(mask.id)) flag('structure', `${word}: duplicate mask id "${mask.id}"`);
    ids.add(mask.id);
  }

  // Every player-visible tile for this word, hidden pair included.
  const tiles: { id?: string; label: string; phrase: string }[] = entry.masks.map(m => ({
    id: m.id,
    label: m.isReal ? 'REAL' : 'TRAP',
    phrase: m.phrase,
  }));
  if (entry.hiddenMeaning) tiles.push({ label: 'HIDDEN-REAL', phrase: entry.hiddenMeaning });
  if (entry.hiddenTrap) tiles.push({ label: 'HIDDEN-TRAP', phrase: entry.hiddenTrap });

  const forms = headwordForms(word);
  const tokenOwners = new Map<string, string>();

  for (const tile of tiles) {
    for (const token of tokens(tile.phrase)) {
      const leakKey = tile.id ? `${word}/${tile.id}` : null;
      const approvedLeak =
        leakKey !== null && APPROVED_HEADWORD_LEAKS.get(leakKey) === tile.phrase;
      if (!approvedLeak && forms.has(token)) {
        flag('headword-leak', `${word}: ${tile.label} "${tile.phrase}" contains "${token}"`);
      }
    }

    for (const token of contentTokens(tile.phrase)) {
      const key = fold(token);
      const owner = tokenOwners.get(key);
      if (owner && owner !== tile.phrase) {
        flag('word-repeat', `${word}: "${key}" appears in both "${owner}" and "${tile.phrase}"`);
      } else {
        tokenOwners.set(key, tile.phrase);
      }
    }

    const phraseKey = tile.phrase.toUpperCase();
    const phraseOwner = phraseOwners.get(phraseKey);
    if (phraseOwner && phraseOwner !== word) {
      flag('duplicate-phrase', `"${tile.phrase}" appears in both ${phraseOwner} and ${word}`);
    } else {
      phraseOwners.set(phraseKey, word);
    }
  }
}

// ── Daily pool ────────────────────────────────────────────────────

const dailyWords = new Set<string>();
if (DAILY_POOL.length !== 43) {
  flag('structure', `daily: expected 43 approved words, found ${DAILY_POOL.length}`);
}
for (const entry of DAILY_POOL) {
  const tag = `daily:${entry.word}`;
  if (dailyWords.has(entry.word)) flag('structure', `${tag}: duplicate word`);
  dailyWords.add(entry.word);

  if (entry.meanings.length !== 3) flag('structure', `${tag}: needs exactly 3 clues`);
  if (entry.candidates.length !== 9) flag('structure', `${tag}: needs exactly 9 candidates`);
  if (new Set(entry.candidates).size !== entry.candidates.length) {
    flag('structure', `${tag}: candidates not unique`);
  }
  if (entry.candidates.filter(c => c === entry.word).length !== 1) {
    flag('structure', `${tag}: answer must appear exactly once in candidates`);
  }
  if (![1, 2, 3].includes(entry.tier)) flag('structure', `${tag}: invalid tier ${entry.tier}`);

  const answer = entry.word.toUpperCase();
  for (const clue of entry.meanings) {
    if (clue.toUpperCase().includes(answer)) {
      flag('headword-leak', `${tag}: clue "${clue}" contains the answer`);
    }
  }
  for (const candidate of entry.candidates) {
    if (candidate !== entry.word && candidate.toUpperCase().includes(answer)) {
      flag('headword-leak', `${tag}: candidate "${candidate}" contains the answer`);
    }
  }
}
if (!dailyWords.has('STAGE')) flag('structure', 'daily: STAGE is required');
if (dailyWords.has('SENTENCE')) flag('structure', 'daily: SENTENCE must be excluded');

// ── Report ────────────────────────────────────────────────────────

const huntWords = Object.keys(db).length;
console.log(`Audited ${huntWords} hunt words + ${DAILY_POOL.length} daily words.\n`);

if (findings.length === 0) {
  console.log('CLEAN — every mechanical gate passed.');
  process.exit(0);
}

for (const finding of findings.sort()) console.log(finding);
console.log('\nFindings by category:');
for (const [category, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${category}: ${count}`);
}
console.log(`\nTOTAL: ${findings.length} findings.`);
process.exit(1);
