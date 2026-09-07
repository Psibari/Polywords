// Run with: npx.cmd -y tsx app/game/pollyBookLines.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
import { pickFreshLine } from './pollyVisitPolicy';
import {
  POLLY_BOOK_LINES,
  PollyBookLineId,
  BOOK_LINE_POOLS,
  BookLinePoolName,
  TODAY_ENTRIES,
  BookRivalryState,
  STRUCK_PAIRS,
  pickBookLine,
  BookLogRow,
  PRE_INSTALL_GENERAL,
  PRE_INSTALL_CRACKER,
} from './pollyBookLines';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const poolNames = Object.keys(BOOK_LINE_POOLS) as BookLinePoolName[];

// ── Every id in every pool exists in the lines object ───────────
{
  for (const name of poolNames) {
    const pool = BOOK_LINE_POOLS[name];
    ok(pool.length > 0, `${name}: pool is empty`);
    for (const id of pool) {
      ok(id in POLLY_BOOK_LINES, `${name}: id '${id}' is not in POLLY_BOOK_LINES`);
      const line = POLLY_BOOK_LINES[id];
      ok(typeof line === 'string' && line.length > 0, `${name}: id '${id}' has no text`);
    }
  }
}

// ── No id appears in two pools ──────────────────────────────────
{
  const seen = new Map<PollyBookLineId, BookLinePoolName>();
  for (const name of poolNames) {
    for (const id of BOOK_LINE_POOLS[name]) {
      const already = seen.get(id);
      if (already) {
        throw new Error(`id '${id}' appears in both ${already} and ${name}`);
      }
      seen.set(id, name);
    }
  }
}

// ── No id inside a single pool is repeated ──────────────────────
{
  for (const name of poolNames) {
    const pool = BOOK_LINE_POOLS[name];
    eq(new Set(pool).size, pool.length, `${name}: contains a duplicate id`);
  }
}

// ── Every line in the object belongs to exactly one pool ────────
// Guards against an id being added to POLLY_BOOK_LINES and then never wired
// into a pool, which is how a line silently stops being reachable.
{
  const pooled = new Set<string>();
  for (const name of poolNames) {
    for (const id of BOOK_LINE_POOLS[name]) pooled.add(id);
  }
  // Pre-install rows are deliberately outside BOOK_LINE_POOLS (they aren't a
  // day bucket, see pollyBookLines.ts), but still need to be accounted for
  // here or every id in them would look orphaned.
  for (const row of [...PRE_INSTALL_GENERAL, ...PRE_INSTALL_CRACKER]) {
    for (const id of row) pooled.add(id);
  }
  for (const id of Object.keys(POLLY_BOOK_LINES)) {
    ok(pooled.has(id), `id '${id}' is in POLLY_BOOK_LINES but in no pool`);
  }
}

// ── TODAY_ENTRIES: every state populated, every entry three lines ──
{
  const states: BookRivalryState[] = [
    'DISMISSIVE', 'AMUSED', 'WATCHFUL', 'RATTLED', 'CONCEDING',
  ];
  eq(Object.keys(TODAY_ENTRIES).length, states.length, 'TODAY_ENTRIES: state count');
  for (const state of states) {
    const entries = TODAY_ENTRIES[state];
    ok(Array.isArray(entries), `TODAY_ENTRIES.${state}: not an array`);
    ok(entries.length >= 1, `TODAY_ENTRIES.${state}: has no entries`);
    entries.forEach((entry, i) => {
      eq(entry.length, 3, `TODAY_ENTRIES.${state}[${i}]: line count`);
      entry.forEach((line, j) => {
        ok(
          typeof line === 'string' && line.trim().length > 0,
          `TODAY_ENTRIES.${state}[${i}][${j}]: empty line`,
        );
      });
    });
  }
}

// ── STRUCK_PAIRS: both halves present and different ─────────────
{
  ok(STRUCK_PAIRS.length > 0, 'STRUCK_PAIRS: empty');
  STRUCK_PAIRS.forEach((pair, i) => {
    ok(pair.old.trim().length > 0, `STRUCK_PAIRS[${i}].old: empty`);
    ok(pair.next.trim().length > 0, `STRUCK_PAIRS[${i}].next: empty`);
    ok(pair.old !== pair.next, `STRUCK_PAIRS[${i}]: old and next are identical`);
  });
}

// ── Pre-install rows: PRE_INSTALL_GENERAL / PRE_INSTALL_CRACKER ──
{
  const allRows: BookLogRow[] = [...PRE_INSTALL_GENERAL, ...PRE_INSTALL_CRACKER];

  // Every row is one or two entries, never zero or three, and every id it
  // references resolves to a non-empty string.
  for (const row of allRows) {
    ok(row.length === 1 || row.length === 2, `pre-install row: unexpected length ${row.length}`);
    for (const id of row) {
      ok(id in POLLY_BOOK_LINES, `pre-install row: id '${id}' is not in POLLY_BOOK_LINES`);
      const line = POLLY_BOOK_LINES[id];
      ok(typeof line === 'string' && line.length > 0, `pre-install row: id '${id}' has no text`);
    }
  }

  // The two pools share no ids.
  const generalIds = new Set<PollyBookLineId>();
  for (const row of PRE_INSTALL_GENERAL) for (const id of row) generalIds.add(id);
  for (const row of PRE_INSTALL_CRACKER) {
    for (const id of row) {
      ok(
        !generalIds.has(id),
        `pre-install row: id '${id}' appears in both PRE_INSTALL_GENERAL and PRE_INSTALL_CRACKER`,
      );
    }
  }

  // The cracker pool is non-empty — the guarantee later depends on it, and
  // an empty pool would fail silently at render.
  ok(PRE_INSTALL_CRACKER.length > 0, 'PRE_INSTALL_CRACKER: empty');

  // Neither pool is wired into day-bucket selection.
  ok(!('PRE_INSTALL_GENERAL' in BOOK_LINE_POOLS), 'PRE_INSTALL_GENERAL must not appear in BOOK_LINE_POOLS');
  ok(!('PRE_INSTALL_CRACKER' in BOOK_LINE_POOLS), 'PRE_INSTALL_CRACKER must not appear in BOOK_LINE_POOLS');
}

// ── pickFreshLine never returns a recent id while a fresh one exists ──
{
  for (const name of poolNames) {
    const pool = BOOK_LINE_POOLS[name];
    // Mark all but the last id as recent — exactly one fresh line remains,
    // so every roll must return that one.
    const recent = pool.slice(0, pool.length - 1);
    const expected = pool[pool.length - 1];
    for (const roll of [0, 0.25, 0.5, 0.75, 0.99, 1]) {
      eq(
        pickFreshLine([...pool], recent, roll),
        expected,
        `${name}: roll ${roll} with one fresh line left`,
      );
    }
    // A single recent id must never come back while others are fresh.
    for (const banned of pool) {
      for (const roll of [0, 0.33, 0.66, 0.99]) {
        const picked = pickFreshLine([...pool], [banned], roll);
        ok(
          picked !== banned,
          `${name}: roll ${roll} returned recent id '${banned}'`,
        );
      }
    }
  }
}

// ── pickBookLine returns the id and its matching text ───────────
{
  for (const name of poolNames) {
    const pool = BOOK_LINE_POOLS[name];
    for (const roll of [0, 0.5, 0.99]) {
      const { lineId, line } = pickBookLine([...pool], [], roll);
      ok(pool.includes(lineId), `${name}: pickBookLine returned an off-pool id`);
      eq(line, POLLY_BOOK_LINES[lineId], `${name}: pickBookLine text mismatch`);
    }
  }
}

// ── Exhausted pool still returns a line rather than throwing ────
// Every id recent: pickFreshLine falls back to the full pool by design.
{
  for (const name of poolNames) {
    const pool = BOOK_LINE_POOLS[name];
    const picked = pickFreshLine([...pool], [...pool], 0.5);
    ok(pool.includes(picked), `${name}: exhausted pool returned an off-pool id`);
  }
}

console.log('OK — pollyBookLines: all assertions passed');
