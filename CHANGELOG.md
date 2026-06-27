# POLYWORDS Changelog

## 2026-06-27 - Daily round entrance restoration

- Restored the Clue Vault slide-in from the right on every Daily round.
- Restored staggered answer-card entrances from the left and right columns.
- Kept DailyAnswerCard free X/Y drag, snap-back, and UP-only claim behavior unchanged.

## 2026-06-27 - Daily result reward visual fix

- Kept Daily result Polly visible on win and loss with a compact, scroll-safe result card.
- Restored a stable in-flow Gold Feather image and preserved the approved reward label.
- Changed no Daily gameplay, reward logic, Gold Feather storage, or Hunt files.

## 2026-06-27 - Daily answer-card control foundation

- Added `DailyAnswerCard` as the owner of Daily tile press/grip and gesture control.
- Added free X/Y drag, snap-back below threshold, and UP-only claim behavior.
- Removed raw candidate gesture code from `DailyChallengeScreen`.
- Made no `SwipeMask`, Hunt gameplay, Daily engine/store, navigation, or Gold Feather changes.

## 2026-06-27 - Hunt Gold Feather consumption quarantine

- Quarantined the Hunt Gold Feather revive/spend prompt.
- Preserved Daily Gold Feather reward/storage.
- Made no MaskBoard, SwipeMask, Hunt scoring, or Daily screen changes.

## 2026-06-25 - Daily navigation activation

- Re-enabled Polly's Daily Challenge route and Home card entry for device sanity testing.
- Connected the existing Daily engine, store, and screen through navigation.
- Changed no Daily gameplay, store, screen, or Hunt logic.

## 2026-06-25 - Daily screen shell

- Replaced the stale Daily screen with the real Daily Challenge screen shell.
- Added a six-card, two-column, UP-only claim board with press-and-hold grip.
- Added the timed Clue Vault, persistent Polly reaction states, and explicit win/loss overlay.
- Kept Daily quarantined from navigation and made no Hunt changes.

## 2026-06-25 - Daily store/session foundation

- Added Daily store/session state backed by the real Daily engine.
- Enforced one Daily attempt per day when the session starts.
- Persisted Daily attempt markers and explicit win/loss result state.
- Added no Daily UI, navigation, Hunt changes, or Gold Feather inventory/spend.

## 2026-06-25 - Daily engine foundation

- Replaced the stale Daily data and engine foundation with the locked UP-only model.
- Added deterministic 5-round sessions with 2 shared Chances, 3 clues, and exactly 6 candidates per round.
- Replaced graded/HAUNTED outcomes with explicit Daily win/loss results and Gold Feather eligibility.
- Added no Daily UI, navigation, store persistence, reward spending, or Hunt changes.

## 2026-06-25 - Daily UI materials foundation

- Added `app/ui/pwDailyMaterials.ts` as the Daily UI materials foundation.
- Locked subtle Daily backdrop veil, center-glow, and future scanline tokens.
- Locked gold-rim dark-purple word relic card and Clue Vault tokens.
- Locked approved Daily copy and Polly reaction constants.
- Added no Daily gameplay implementation.

## 2026-06-25 - Daily Challenge design lock

- Locked the updated Polly's Daily Challenge layout and control spec.
- Defined Daily as UP-only with Polly perched for the full challenge.
- Approved gold-rim dark-purple word relic cards as the Daily answer-tile direction.
- Replaced graded Daily outcomes with explicit win/loss and Gold Feather language.
- Added no Daily implementation.

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
