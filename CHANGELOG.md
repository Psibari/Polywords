# POLYWORDS Changelog

## 2026-06-25 - Daily Challenge quarantine

- Removed the stale Daily Challenge route and startup result load from the live app shell.
- Disabled the Home Daily card as a navigation entry point while keeping it visible as coming soon.
- Marked the existing coded Daily files as stale, unapproved scaffold; `docs/DAILY_CHALLENGE_SPEC.md` remains the only approved Daily source of truth.
- Added no Daily gameplay implementation.

## 2026-06-23 - play-screen-overhaul docs/context diet

- Added `docs/HERO_WORD_BOOK_SYSTEM.md` as the full approved Hero Word-Book interaction spec.
- Replaced duplicated full Hero Word-Book sections in `CLAUDE.md` and `CONTEXT.md` with short pointers.
- Established `CHANGELOG.md` as the home for patch history instead of bloating current-context docs.
- Recent related commits:
  - `bcf22a1` Restore solid hero word cover font.
  - `1b8bd3d` Document hero word-book interaction system.
  - `43d8a7c` Fix hero word font family.

## 2026-06-23 - docs/context diet pass 2

- Moved stale play-screen branch history out of active context docs.
- Replaced old safe-commit / shipped-patch blocks in `CLAUDE.md` and `CONTEXT.md` with compact current-state pointers.
- Replaced obsolete `.claude/WORKFLOW.md` content with a redirect to `docs/WORKFLOW.md`.
- Patch history now belongs in `CHANGELOG.md`.
- Current source docs:
  - `CLAUDE.md` = hard rules and doc map.
  - `CONTEXT.md` = current state and next patch only.
  - `docs/WORKFLOW.md` = canonical patch process.
  - `docs/HERO_WORD_BOOK_SYSTEM.md` = approved Hero Word-Book interaction spec.
