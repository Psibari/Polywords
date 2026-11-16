# POLYWORDS Current Context

Verified against `Psibari/Polywords`, branch `play-screen-overhaul`, on 2026-11-16. This file is the short current handoff, not a chronological work log. `CLAUDE.md` is the durable architecture map; `AGENTS.md` and focused specs control changes. Never infer the current state from an old date-stamped note when Git, the workbook or a device can answer it.

## Branch and verified baseline

- **Working branch:** `play-screen-overhaul`. `main` is not the working source and must not be merged without Pete's approval. `gh-pages` is the separate public website; do not merge it into the app. Older feature branches are not the current build.
- **Latest verified pre-docs content baseline:** commit `ea4cc16db4f26654e542c7d0384ab8a40d553759`. GitHub Actions **Quality Checks** run `43816234815` completed successfully on that exact SHA: dependency install, TypeScript check, full `npm test` and live Hunt `content:quality` all passed. This verifies CI, **not** a phone playtest or full human editorial audit. After new commits, check the new head's run.
- **Home:** outdoor night terrace is finished and Pete-approved. The old Home is DEV-only rollback. No redesign is pending.
- **App icon and splash:** artwork approved; native presentation needs a fresh-build check if changed. Do not regenerate approved icon assets.
- **Hunt:** UP/RIGHT swipe grammar, Boss/Haunt loop, pinned Boss, Master's Rematch, KING tally, first-run FINE onboarding and true pause/resume are implemented. Their protected behavior is in `AGENTS.md` and `CLAUDE.md`.
- **Daily:** five-round UP-only mode, six visible cards, one attempt/date; entry teaching, castle breach and clue-fit enforcement are implemented. No Daily rewrite is part of the current Hunt task.
- **Polly:** master pose set and Rig 2 face/crown animation are in use. Full-body articulation remains a separate, unapproved production change.

## Hunt recovery: closed, do not reopen by default

- **Live authority:** `assets/data/huntData.json` on `play-screen-overhaul`.
- **Editorial master:** `POLYWORDS_CANONICAL_RECOVERY_FINAL_CAPITAL_CONCENTRATION_2026-11-16.xlsx`, delivered separately from the GitHub repo. Verify access to this exact file before editing or claiming workbook/runtime agreement; do not silently fall back to a dated predecessor.
- **Final evidence:** `docs/HUNT_CONTENT_RECOVERY_FINAL_2026-11-16.md` and `docs/HUNT_CONTENT_HISTORICAL_DISPOSITIONS_2026-11-16.csv`. The earlier `docs/HUNT_CONTENT_RECOVERY_2026-11-16.md` is explicitly a superseded snapshot.
- Pete restored **CAPITAL `capital_r3` as a REAL** and **CONCENTRATION `concentration_t3` as a TRAP**, with original text, roles and IDs. The two editorial recovery conflicts are resolved. No other retired card was authorized for restoration.
- The November 15 approved rewrite sync was committed as `02e12ba0ea430abc3d1bbf25158af4a7731b1b66`. It updated BLADE, BLOCK, BLOW, BOLT, BOUND, BOWL, BRIEF, CAN, CHARACTER, CHIP, DATE, DUCK, JAM and WELL. Therefore the older “next word: BLADE” marker in the previous context is obsolete.
- Do not mistake a passing structural gate for a human fairness approval. Device rotation of the restored cards has not been verified in the recovery report.

## Active priority: resume the old-word editorial rewrite

1. **Establish the next uncompleted word from the current approved rewrite queue and recovered workbook.** Do not infer it from alphabetical order, old notes or the JSON's key order. The previously referenced `claude/POLYWORDS_OLD_WORDS_CHECK_SUMMARY_2026-11-14.md` is not present on this branch; obtain the actual approved queue before claiming a pickup word.
2. **Audit before drafting:** show every existing REAL/trap with stable IDs; inspect dictionary senses, historical missing meanings, previously retired/approved cards and the flagged fairness issues in `Claude outputs/HUNT_FAIRNESS_AUDIT_2026-11-11.md`. Distinguish KEEP / CUT / REWRITE / NEW / HELD, preserving Pete's locked wording and exceptions. No silent restoration or replacement.
3. **Get Pete's explicit editorial approval, then promote deliberately.** Show the complete final word card before applying a batch. Update the canonical workbook and live JSON consistently, keep persistence IDs stable, and verify the full affected package and tests. Never declare workbook parity without comparing the actual current workbook.

Current editorial rules: the trap must tempt the **headword itself**, not merely the surrounding topic; no trap may secretly be a valid meaning. Do not recycle a REAL's distinctive scene inside its traps. Strong unflagged cards stay unless Pete approves a change. Question openings are optional, not a quota. Follow `docs/CONTENT_WRITING_STANDARD.md` and Pete's `docs/CONTENT_WRITING_BIBLE.md`; report any conflict rather than guessing.

## Other open work, not the current task

- Before another release, confirm current TestFlight build, complete outstanding physical-phone regression checks (including restored-card rotation and pause/navigation where not yet device-verified), and test the final native audio/splash behavior. CI cannot substitute for this.
- Verify the Buggie font license and any unresolved sound-source licensing before shipping.
- Stranger-player tests and telemetry review follow the release-quality/device gate; do not infer player retention from simulated runs.

## Do not work on yet

No Home redesign, Polly full-body rig, Daily content expansion, new monetization, mass historical-card restoration, unrelated refactors, or reopening approved words. Preserve local stashes and uncommitted work. Use `npm run state` for current content counts rather than copying numbers into this file.
