// Run with: npx.cmd -y tsx app/game/bookLineWidths.test.ts
// Plain assert script (repo has no jest; no node:assert — repo lacks @types/node).
// Throws on first failure; prints OK on success.
//
// This is a CHARACTER-COUNT approximation, not a width measurement. Buggie
// (the hand font) is proportional and is not available to the test runner,
// so character count is only a proxy for rendered width — the authoritative
// check is measuring against the real face at design time, the same way the
// two lines this guards against were caught. This test's job is to catch an
// obviously over-long line someone adds later, not to replace measuring.
//
// Ceilings are derived from measured worst cases, not guessed: "Nobody
// dared. Naturally." at 24 characters is the widest POLLY_BOOK_LINES entry
// confirmed to fit the 245pt column at 19pt, so log lines get a 26-character
// ceiling — some headroom past the tightest known-good line, not a
// character-per-point budget. TODAY_ENTRIES lines run larger (21pt) but
// individually shorter by design (Part 3 of docs/POLLY_POLYBOOK_LOG_LINES.md
// calls for roughly three short lines), so 24 characters is the ceiling
// there.
import { POLLY_BOOK_LINES, TODAY_ENTRIES } from './pollyBookLines';

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const LOG_LINE_CHAR_CEILING = 26;
const TODAY_ENTRY_CHAR_CEILING = 24;

// ── No line in POLLY_BOOK_LINES exceeds the log column's ceiling ──
// Covers every work-log pool, every word-row pool, and the pre-install rows
// in one pass — all of them render a POLLY_BOOK_LINES value as a single
// physical line in the log at 19pt (see WorkLogRowView in
// app/components/ui/PolybookSpread.tsx), so checking the object once is
// exhaustive.
{
  for (const [id, line] of Object.entries(POLLY_BOOK_LINES)) {
    ok(
      line.length <= LOG_LINE_CHAR_CEILING,
      `POLLY_BOOK_LINES.${id}: "${line}" is ${line.length} characters, over the ${LOG_LINE_CHAR_CEILING}-character log-line ceiling`,
    );
  }
}

// ── No line in TODAY_ENTRIES exceeds today's-entry ceiling ────────
{
  for (const state of Object.keys(TODAY_ENTRIES) as (keyof typeof TODAY_ENTRIES)[]) {
    TODAY_ENTRIES[state].forEach((entry, entryIndex) => {
      entry.forEach((line, lineIndex) => {
        ok(
          line.length <= TODAY_ENTRY_CHAR_CEILING,
          `TODAY_ENTRIES.${state}[${entryIndex}][${lineIndex}]: "${line}" is ${line.length} characters, over the ${TODAY_ENTRY_CHAR_CEILING}-character today's-entry ceiling`,
        );
      });
    });
  }
}

console.log('OK — bookLineWidths: all assertions passed');
