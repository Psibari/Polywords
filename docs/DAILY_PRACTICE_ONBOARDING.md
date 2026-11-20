# Daily Challenge one-time practice onboarding (implementation contract)

Status: design approved in principle by Pete, 2026-11-20. Work on feature branch `daily-practice-onboarding`. Do not merge without explicit approval.

## Locked requirements
- New players receive a separate one-time interactive practice puzzle before their first real Daily attempt.
- Practice is not one of the five real rounds. It must never spend a real Daily attempt, lives, reward, streak, Gold Feather, or change real Daily session state.
- Practice uses three sequential clues, six candidate words, exactly one target; it teaches UP to claim, waiting for additional clues, and the single answer shared by all three.
- Wrong practice choices are recoverable and free. Complete practice, then show the real Daily entry gate; only ACCEPT CHALLENGE starts the actual attempt.
- Persist practice completion. Existing players with prior Daily play must not be forced into onboarding.
- Returning entry card remains short with HOW TO PLAY available. Rules/help replay must not mutate Daily state.
- Preserve Daily's approved five-round/two-life mechanics, one-attempt-per-date contract, castle art, swipe grammar, and Gold Feather rules.

## Source-backed existing behavior
- `app/ui/dailyEntryCopy.ts` owns the long and short entry copy and explicitly notes the current entry is the only Daily teaching surface.
- `app/screens/DailyChallengeScreen.tsx` gates the entry on `dailyInitialized && !dailyResult && !dailySession`; the long rules are shown when `!dailyIntroSeen || rulesOpen`.
- `DAILY_INTRO_SEEN_KEY` is set on ACCEPT CHALLENGE, not on rendering or NOT NOW.
- The existing code loads the intro-seen flag before enabling the entry gate. Therefore a brief disappearance of the short card is **not yet explained** by the intro flag alone; trace the actual screen transitions and visibility before patching.
- Real Daily clues are revealed over time, with first immediate and subsequent clues at 4s/8s per current copy/engine comments; do not change those timings in production to serve practice.

## Acceptance tests
1. Fresh install: practice appears before the real Daily gate and cannot consume today's attempt.
2. Wrong practice selection: no life or real session state changes; player can continue.
3. Practice complete: real entry gate appears; NOT NOW leaves attempt untouched.
4. ACCEPT CHALLENGE starts exactly the existing real five-round Daily.
5. Restart mid-practice: behavior is deterministic and cannot skip into or corrupt real Daily.
6. Existing Daily player: skips mandatory practice, retains HOW TO PLAY access.
7. Reopening help or replaying practice does not alter an active or completed Daily.
8. Investigate reported returning-entry flash with a reproducible test; do not infer the cause from appearance alone.
9. Run TypeScript, tests, Daily-specific tests, and native iPhone first-run smoke test before merging.

## Editorial and UI decisions to review
- Choose one practice headword and three distinct fair clues with five distractors; validate no second defensible answer and no clue-grid wording leakage.
- Choose concise introductory copy and placement of guided prompts within the existing Daily visual system.
- Confirm whether a player can exit mid-practice and resume or restart on next entry; default should be safe restart without a spent attempt.
