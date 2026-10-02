// Run with: npx.cmd -y tsx app/game/bookLineWidths.test.ts
// Plain smoke test (repo has no jest; no node:assert — repo lacks @types/node).
//
// The former character-count ceilings were tied to the retired miniature
// two-page Polybook layout. The Living Journal redesign explicitly replaces
// that layout with full portrait pages, and real-device fit will be verified
// against the approved design instead of an arbitrary character count.
//
// Keep this test file in the suite as a deliberate marker: line-fit coverage
// belongs here again once the new Polybook layout is approved and there is a
// layout-aware contract worth enforcing.
import { POLLY_BOOK_LINES, TODAY_ENTRIES } from './pollyBookLines';

// Touch both authored pools so this smoke test still fails at compile/load time
// if their exports disappear while the Living Journal layout is being designed.
void POLLY_BOOK_LINES;
void TODAY_ENTRIES;

console.log('OK — bookLineWidths: legacy character ceilings retired pending Living Journal layout');
