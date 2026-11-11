# POLYWORDS session 2026-11-10: Polybook tally, KING counter, KING plaque (delta prompts)

Paste each block into Claude Code as its own prompt. Surgical edits only. Nothing is claimed device-proven unless Pete saw it.
State at writing: HEAD da4ad05 on play-screen-overhaul, 5 commits ahead of origin (not pushed).

## Prompt 1: CLAUDE.md

Edit CLAUDE.md only. Write LF line endings. Before committing, compare `git diff --stat` with `git diff --stat --ignore-cr-at-eol`.

1. In "Polybook", after the "Vault route is Polly's book" bullet, add:
"- MASTERY page is a four-crown tally (2026-11-10, `ef44507`). Pete device-checked it on POLYWORDS DEV at normal and at max Text Size + Bold Text, with counts 0 and 123, and approved the look. Section id stays `"BEATEN"` (deep links use it); the ribbon label is MASTERY. 2x2, row by row: MASTERED, KING / BANISHED, HAUNTED; no paging. Crown art in `assets/images/results/`: `GoldenCrown.png`, `kingcrown.png` (Polly green, drawn by Pete, toned), `banishcrown.png`, `hauntcrown.png`. Pete ruled 2026-11-10 to keep `hauntcrown.png` on the tally even though the Results panel shows `Padlock.png` for haunted, so all four read as crowns. Counts: MASTERED = distinct `masteredWords`; KING = `progress.kingWins`; BANISHED = `pollyMemory.wordRivalries` entries with `banished` true; HAUNTED = distinct `wordId` in `ghosts` (active haunts only; a won Returning Haunt prunes the ghost and banishes the word). Pure code: `app/game/polybookTally.ts` (counts) and `app/ui/polybookTally.ts` (crown sizing by PAINTED width from measured bounding boxes, not file size; re-measure if the art changes). The crown width W is measured from the area under the heading, the MASTERY label and the rule, and the crowns shrink first at large Text Size. Count 48 pt Barlow Condensed Bold, label 18 pt. Polybook text still follows Text Size, but the tally text is capped at 1.6x (`maxFontSizeMultiplier`). On a very short page the label can drop to 17.9 pt (not seen on a device). DEV: a TALLY button on the page cycles all four counts REAL, 0, 1, 7, 48, 123 (display only, saved data untouched). The old per-word crown grid and its paging are gone; `polybook_crown.png` stays on disk, unreferenced."
2. Same section, add:
"- Tally known gaps (2026-11-10): BANISHED undercounts older saves. `wordRivalries` began 2026-10-03 (`4b636c1`) and nothing rebuilds it for older saves; banishes between 2026-09-04 and 2026-10-03 survive only in the journal log (`bookLog` `hauntBroken`, limited days) and earlier ones are recorded nowhere. A save from before the remove-on-win rule could hold a word in both `masteredWords` and `ghosts` and would count under both; real play cannot create that now. The tester's missing per-word crown (2026-11-09) is no longer visible on this page; its cause was never found."
3. In "Hunt Architecture", at the end of the MASTER'S REMATCH bullet add: "A rematch win is counted in `progress.kingWins` (Polybook KING tally) and nowhere else." Then add two bullets after it:
"- KING counter (2026-11-10, `40e1baa`): `kingWins` and `lastKingWinId` (both optional, like other late fields) in `PlayerProgress`. Incremented in the store at the moment the last hidden card is judged (`resolveMystery`, the `isMasteryRematch` win branch), the same moment and one-time guard as normal Boss mastery. `lastKingWinId` (run seed:round:WORD) is saved in the same write so a Hunt restored after the app was killed before its debounced save cannot count the same win twice. `loadProgress` sanitizes: missing, negative, fractional or non-number becomes 0. `resetProgressForDev` resets it; `resetDailyForDev` does not. Logic and tests: `app/game/kingWins.ts`. NOT yet device-proven."
"- DEV REMATCH button (2026-11-10, `da4ad05`, `__DEV__` only, after BOSS CRISIS): `applyDevMasteryRematch` (`app/game/devMasteryRematch.ts`) swaps the Hunt's Boss step for a real rematch step built by the generator's own `buildWordStep` (via `buildMasteryRematchStepForDev` in `huntGenerator.ts`), then runs the normal BOSS jump; judging, KING +1 on a win and no Haunt on a loss are the real code. Word: the first mastered word with hidden content that is not already in the Hunt and has no active Haunt, else this Hunt's own Boss word; with none usable it does nothing. States a normal Hunt cannot reach: a rematch while unbeaten Boss words remain; a rematch on a never-mastered word (a win still adds KING +1 and no crown); Polly's Word replaced and rounds skipped, as BOSS does. Finishing such a Hunt records it as a normal Hunt (quit from the pause menu to avoid that). NOT yet device-proven."
4. In "Result plaques", after the "Returning Haunt LOSS card" bullet, add:
"- KING plaque art refreshed 2026-11-10 (`54eb44e`): the crown is Polly green; same 1375x1144 size. The carved KING now ends about 54.5% down the plaque (rows 537 to 623 of 1144). `kingWord.top` is 56.5% (TEST VALUE): PlaqueText's ink starts about 6 pt (2.2%) below its box top at size 50 (Bebas Neue, line height 54), so the live word sits about 4.3% below the carved KING, the same gap the old art had. Longest word EXCHANGE: ink bottom about 72% of the frame; the gold panel ends about 80.6%. Pete checked it on POLYWORDS DEV 2026-11-10 and it looked good. A faint pale patch around the crown remains in the art (Pete: the best he could get it). The 6 pt figure comes from reading React Native's iOS text code, not from a device measurement."
5. In "Plaque sound files", append to the sentence about the injected ID3 / `caBX` blocks: "On 2026-11-10 `king-result-plaque.png` and `kingcrown.png` were committed (`54eb44e`, `ef44507`) WITH the `caBX` chunk the device tool added, although the source files had none; stripped in `6bf7c4c` (pixels identical). Before every PNG commit list its chunks (IHDR, optional sRGB/gAMA/pHYs, IDAT, IEND only). `GoldenCrown.png`, `banishcrown.png`, `hauntcrown.png` and `Padlock.png` still carry `caBX` from earlier commits; left alone."

## Prompt 2: CONTEXT.md

Edit CONTEXT.md only (LF on disk; keep LF).
1. Put this at the very start of the first "Updated ..." line: "Updated 2026-11-10 (Polybook MASTERY tally, KING counter, KING plaque art; see the 2026-11-10 entry at the end). "
2. Append:

## 2026-11-10: Polybook tally, KING counter, KING plaque

- **Done on `play-screen-overhaul`, NOT pushed (5 ahead of origin at `da4ad05`):** `54eb44e` KING plaque art + `kingWord.top` 56.5% (TEST VALUE); `ef44507` MASTERY four-crown tally + `kingcrown.png`; `40e1baa` KING counter (`kingWins`, `lastKingWinId`); `6bf7c4c` strip `caBX` from the two new PNGs; `da4ad05` DEV REMATCH button.
- **Device-checked by Pete (POLYWORDS DEV, 2026-11-10):** the KING plaque with EXCHANGE and the tally at normal and at max Text Size + Bold with counts 0 and 123 both "look good"; he accepted the crowns shrinking at max text so everything fits.
- **NOT device-proven:** the KING counter and the REMATCH button. Test: press DEV REMATCH, win it: KING 0 to 1 once, still 1 after closing and reopening the app; then lose a rematch in a new Hunt: KING stays, no Haunt created.
- **Pete's decisions:** tally over the 9-slot grid; Haunted = active haunts only; KING crown is Polly green; the tally keeps `hauntcrown.png` (not the Results padlock); nothing in POLYWORDS is locked except the swipe and the premise.
- **Open:**
  - (a) Push the five commits (Pete pushes himself).
  - (b) BANISHED undercounts saves older than 2026-10-03 (detail in CLAUDE.md "Polybook"). Accept, or rebuild from the journal log for the 2026-09-04 to 2026-10-03 window? Pete has not decided.
  - (c) Tally label can be 17.9 pt on a very short page (under the 18 floor); JOURNAL and MASTERY ribbon labels fill their ribbons edge to edge at max Text Size (old styles, untouched).
  - (d) The design hook lists 31 colour findings in `PolybookSpread.tsx` (old styles; the tally adds no colour). Not silenced; silencing records a colour as approved, needs Pete's OK.
  - (e) Four older PNGs still carry `caBX` (`GoldenCrown`, `banishcrown`, `hauntcrown`, `Padlock`); an optional lossless strip as its own commit.
  - (f) Carry-over from the 2026-11-09 list, per Pete 2026-11-10: TestFlight builds 19 and 20 failed, build 21 went through and is on his phone only, testers are on build 18; Polly's visits are too quick to read her bubble (check whether the perch clock starts at flight start or at landing); Polly sleep seam on Home; 8 vs 10 rounds (hunts 1 to 3 are already 8; Pete does not want to give more lives; undecided); whether to bring in stranger testers (undecided); the tester's missing crown (the tally's MASTERED count now shows whether her mastery was saved; needs her screenshot); tall-phone ledge check; CLAUDE.md trim.
- **Hazard, line endings:** `types.ts` was CRLF on disk and was converted to LF (the commit diff is 7 lines). CONTEXT.md and CLAUDE.md are LF on disk; `docs/POLYBOOK.md` is CRLF on disk (LF in the index). Compare `git diff --stat` with `git diff --stat --ignore-cr-at-eol` before committing.

## Prompt 3: docs/POLYBOOK.md

Edit docs/POLYBOOK.md only. Append, changing no existing line (compare `git diff --stat` with `git diff --stat --ignore-cr-at-eol` before committing; the file is CRLF on disk, LF in the index):

## 2026-11-10 MASTERY becomes a tally

- Pete changed MASTERY: the per-word crown pages are replaced by one crown per outcome with a count under it, 2x2: MASTERED, KING / BANISHED, HAUNTED. No paging. This supersedes the "MASTERY is device-approved and locked" line of 2026-10-03 (Pete 2026-11-10: only the swipe and the premise are permanently locked). TODAY and JOURNAL are untouched.
- Counts: MASTERED = distinct mastered words; KING = Master's Rematch wins (`progress.kingWins`); BANISHED = banished words in Polly's word-rivalry memory; HAUNTED = active haunts only (a won Returning Haunt turns a haunt into a banish, so Haunted falls and Banished rises).
- Art: the Master, Banished and Haunted crowns as the game uses them; KING is Polly green. Implementation, sizing and known gaps are in CLAUDE.md "Polybook".
- Still open from 2026-10-03: what accumulating crowns reveal or unlock. The tally does not answer it.
