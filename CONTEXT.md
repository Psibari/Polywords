# POLYWORDS Current Context

Short current handoff, not a work log. `CLAUDE.md` is the durable architecture map; `AGENTS.md` and the focused specs control changes. Card-by-card history of the old-words rewrite (Groups A, B, D, FLY) is in Git history and the workbook's Change Log, not here. Never infer the current state from an old dated note when Git, the workbook or a device can answer it.

## Where things stand (2026-11-20)

- **Branch:** `play-screen-overhaul`. `main` is not the working source; `gh-pages` is the separate public site. Never merge either without Pete's approval.
- **Last local check (Claude, 2026-11-20, on `e6ed6a7`):** `tsc --noEmit`, full `npm test` and `content:preflight` all pass, 0 blockers. GitHub CI on the latest head still needs checking after each push.
- **Landed 19-20 Nov:**
  - Hunt is 8 rounds with 6 feathers for every run (Pete's call from friend-tester feedback). Haunt round 4, Boss round 8.
  - Boss audit done: 24 Boss words, BATTERY promoted, FORK `fork_r2` removed (FORK now Septuple). ENGAGED was dropped as a Boss earlier.
  - Old-words rewrite finished: Groups A, B and D, plus FLY.
  - ROW `row_t6` and HANDLE `handle_r4` replaced (both Pete-approved).
  - Daily onboarding is now two steps: invitation, then a four-step HOW TO PLAY card on first entry only. The practice puzzle was rejected and removed.
- **Canonical workbook** `docs/content/POLYWORDS_CANONICAL_HUNT.xlsx` was committed (`e6ed6a7`). Parity with live `assets/data/huntData.json` was verified by Claude on 2026-11-20:
  - Every live card matches by ID, word, REAL/trap role and exact phrase.
  - All 72 hidden pairs match the Hidden Pair Registry.
  - Every word's REAL/trap counts match the Word Tracker.
  - The workbook's 18 extra Tiles rows are all marked RETIRED, CUT or REMOVED.
  - `wordType` is not in the Word Tracker, so it was not compared.

## Hunt word variety: full variety built (Pete's choice, 2026-11-20)

Friend testers kept seeing the same words. The causes were a 30-word memory, quit Hunts recording nothing, and rounds 1-2 limited to the 50 easy words. Pete chose full variety:

- **What changed:** every word met is remembered (`app/game/huntRecency.ts`), quits included. Unplayed words are dealt before any replay, and replays come oldest first.
- **Simulation result:** a player dying in rounds 2-5 over 40 Hunts went from 56% repeats to 0. Every ordinary word is met before any repeats.
- **Accepted cost:** for that player, rounds 1-2 move to medium words around Hunts 11-20, and some hard words appear after about Hunt 40.
- **Unchanged:** Haunts, pinned Boss, mastered-return timing (rounds 5-7) and the Boss rules.
- **Phone-checked:** Pete tested it on POLYWORDS DEV on 2026-11-21. Words no longer come back, quits included.

## Next task

Word-by-word Hunt audit, one headword at a time. The rules are in `docs/CONTENT_WRITING_BIBLE.md` (November 20 section) and `docs/CONTENT_WRITING_STANDARD.md`. Pete's standing rulings for it:

- **Approval:** a card is approved only when Pete says so in his own words ("lock it", "perfect", "yes", or a long message ruling on several cards). An assistant's "Locked" label is not approval.
- **Before drafting:** show every existing card for the word, all REALs and traps with IDs.
- **Before applying:** show the final in/out list and apply only after Pete's final OK. Apply and update the workbook in batches, then re-check parity.
- **What to flag:** only a repeated scene or memory snap, crossover/contamination between cards, a sound-alike, or an unfair or secretly true trap. Do not flag a shared meaning, angle, handle or answer; more good cards is better because the generator rotates them.
- **Across different words:** flag only a card written exactly the same. Prefer a fresh angle when a memory is already used on several words.
- **Traps:** every trap must make the player think the headword itself. A trap is not cut just for sitting near a REAL, only for being written by mirroring one. Judge fairness by how people actually talk, not by a dictionary stretch.
- **Style:** cards are memory snaps, not dictionary lines (traps too). Vary the form; questions are optional. Rewrite old cards that read fragmented as natural full sentences. A short card that nails the word stays.
- **Never cut good writing** just because another card covers the same meaning. Drop a meaning only if nobody uses it anymore.

## Other open items

- **Unapproved Change Log edits (found 2026-11-18).** In the workbook's Change Log, 151 rows marked `Verified = N/A` show no Pete approval. They touch 44 words, and 71 of those rewritten cards are still live. Show Pete each original beside its replacement. He has other data mix-ups to raise when ready.
- **All caps.** Should Hunt cards stay all caps? Mixed case would allow stressing a word. Look at it after the audit.
- **Before release:**
  - Phone regression pass on the current build (restored-card rotation, pause/navigation, audio, splash).
  - Any open sound-source licence checks. The Buggie font is cleared: `assets/fonts/Buggie-LICENSE.txt` says Public Domain and links its FontSpace source.
  - Stranger playtest: kit and plan in `docs/STRANGER_PLAYTEST_PLAN.md`.

## Do not work on yet

No Home redesign, Polly full-body rig, Daily content expansion, new monetization, mass historical-card restoration or unrelated refactors. Preserve local stashes and uncommitted work. Use `npm run state` for content counts.
