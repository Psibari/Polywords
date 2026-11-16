# POLYWORDS | Hunt Content Recovery | 2026-11-16

**Source of playable truth:** `Psibari/Polywords`, branch `play-screen-overhaul`, `assets/data/huntData.json`.  
**Candidate editorial baseline:** `POLYWORDS_CANONICAL_2026-11-15_CHARACTER_CHIP_DUCK_LOCKED.xlsx`.  
**Corrected editorial master:** `POLYWORDS_CANONICAL_FULL_RECOVERY_2026-11-16.xlsx` (delivered with this report).  
**Scope:** Regular Hunt and Boss only; Daily Challenge entirely excluded.

## Executive result

The current game and the corrected workbook agree on **all 253 playable headwords**, **2,503 visible REAL/trap masks** (1,374 REAL and 1,129 trap) and **75 Boss hidden pairs**. Every active visible mask's ID, exact text, and REAL/trap flag match. Current game mask IDs are unique and belong to their respective headwords. There are **25 Boss-tagged words** and **228 ordinary words**.

The November 15 workbook was not missing the eight words Pete named (BLADE, BLOCK, BLOW, BOLT, BOUND, BOWL, BRIEF, CAN), and all eight already match the current runtime JSON. The meaningful structural problem was **COMPANY**, not a loss of all those words: three COMPANY traps were under JAM because of a blank Word-column fill-down after an appended JAM row; `company_t0` had been dropped from the workbook even though it remained in the game. This has now been repaired in the new workbook.

**No Hunt JSON content change was required by this full comparison**: the prior Nov 15 14-word content commit had already brought it up to date with the current workbook. The corrected workbook now catches up with the game for COMPANY. Two *historical editorial questions* remain (below); these do not prevent the 253-word current bank from functioning.

## Work performed and validation

1. Enumerated **160 historical XLSX paths**, representing **94 byte-distinct workbook snapshots**, from the accessible mounted project/Library copies. Recorded filenames, SHA-256 and worksheet inventories. No inaccessible local Windows Downloads/Desktop/OneDrive directories were claimed to be inspected.
2. Read the latest workbook's active Tiles, Boss Words (Production), Hidden Pair Registry, Change Log, Word Tracker and other editorial sheets. Parsed noncontiguous Word blocks; repaired bad forward-fill ownership instead of treating empty Word cells as independent records.
3. Compared **all 253 word packages** to the live `play-screen-overhaul` JSON by stable ID, exact phrase, role and Boss hidden pair, not merely by word presence or counts. Original comparison: **252/253 exact**, COMPANY differed by one missing workbook trap. After repairing COMPANY: **253/253 exact**.
4. Independently validated current JSON structural invariants: valid difficulty and GPS tags, at least one REAL and trap per word, unique mask IDs, correct word-owner ID prefixes and valid Boss hidden pairs. **Zero detected structural failures**.
5. Reopened the exported repaired XLSX and verified all 16 original worksheets remain. Except for the documented edits, original worksheet cell values are unchanged. The archive and decision sheets are added; historical materials stay out of active Tiles.
6. Traced actual code ingestion: `app/game/huntGenerator.ts` imports `assets/data/huntData.json`. It selects **up to five** visible masks per word encounter from the full per-word pool. Some approved cards rotate and will not appear in every encounter; being present/eligible does not prove a device has displayed them.
7. Added a **runtime owner-ID guard** to the generator and an accompanying regression assertion in `app/game/huntReachability.test.ts`, committed and read back from `play-screen-overhaul`. They will catch future errors such as a `company_t1` card being assigned to JAM in JSON.

## Precisely what was repaired in the new workbook

| Location | Change | Evidence |
| --- | --- | --- |
| `Tiles!A1202:A1204` | Explicitly label three locked `company_t1`, `company_t2`, `company_t3` rows **COMPANY**, not an inherited JAM | Their stable IDs, historic COMPANY workbooks and current game JSON agree |
| `Tiles!A2283:H2283` | Restore **COMPANY** trap `company_t0`: `THE PERSON RUNNING THE BUSINESS` | Exact original LOCKED card in 65 old snapshots and in current live JSON |
| `Word Tracker!D30` | Change JAM active trap count **4 → 3** | `jam_t2` is REVIEW, not active; game has three approved JAM traps |

Original workbook retained as a separate untouched file. **No existing LOCKED card text was rewritten.**

## Historical work recovered, but not indiscriminately reactivated

The earliest broad scan reported 284 old LOCKED IDs absent from the November 15 Tiles sheet. That figure was a **candidate screen, not a loss count**. A deeper deduplicated scan of both Tiles and Boss production found **301 distinct historical IDs** no longer used by the current workbook, with **304 historical wording variants**. Every exact historical line was retained in the workbook's `Historical Card Archive` and compared with the current card bank and editorial Change Log. The disposition index is also saved separately as CSV.

**302 of the 304 historical variants received a source-backed disposition** by comparing exact current text, records explicitly marked Pete-approved CUT/retirement/rewording, the October 6 repository-first sync records, and known Boss-to-regular placements. Examples:

- Four DRAFT traps, including `WHAT OPENS IN THE FIREPLACE TO LET THE SMOKE ESCAPE`, were approved in August but explicitly **cut by Pete on November 12** for fairness; **not lost**, do not restore.
- HAMPER's gift-basket REAL was approved in September, then explicitly **cut by Pete on November 12** for British-only recognition. Do not restore.
- HEAD's redneck trap was approved in September, then explicitly **cut by Pete on November 12** for tone. Do not restore.
- Older IDs often represent cards whose text survives under a newer ID, or whose meaning survives through a later approved rewrite. IDs and text are retained in the archive for traceability, not doubled into gameplay.

### Only two specific editorial conflicts remain

1. **CAPITAL `capital_r3` (REAL)**: `HIGHEST FORM OF PUNISHMENT`. July 10 Change Log says Pete confirmed it should stay. It was present in older workbook versions but is not in the current three-REAL CAPITAL card. An October 6 repo-first sync reduced CAPITAL from four to three REALs without an explicit editorial decision about this exact sense. **Decision needed:** restore this fourth meaning with the original ID, or deliberately retire it.
2. **CONCENTRATION `concentration_t3` (TRAP)**: `STRAIGHT FROM THE ORANGE, NOTHING ADDED`. It was LOCKED in older workbooks but absent from the current six-trap pool, without an ID-specific later removal found. Its juice scene may overlap the current concentrated-beverage REAL. **Decision needed:** restore the original trap or explicitly retire it.

Both are preserved in `Editorial Decision Gate`, not inserted into playable Tiles or GitHub until Pete decides. This avoids overriding later editorial approval without evidence. If these two are intentionally retired, the current game and workbook are fully synchronized as playable content, with their history preserved.

## What gameplay availability means

- **253 words in the JSON** = eligible pool when progression/mastery conditions permit, not 253 words shown in a single run.
- **2,503 masks in JSON** = available content pool; the generator picks at most **five visible masks per word encounter**. Other masks can rotate on later encounters; they are not deleted.
- **75 hidden Boss pairs** = present and matched to the workbook. Their appearance depends on Boss encounter logic and successful progression.
- Existing `app/game/huntReachability.test.ts` contains seeded ordinary-word reachability coverage, and the new owner-ID check is committed. **No device playtest or TypeScript test run was performed in this investigation**, so do not report physical observation or a passing test suite.

## GitHub changes and proof of state

- Prior full-data promotion: `02e12ba0ea430abc3d1bbf25158af4a7731b1b66` (14 rewritten words).
- New prevention guard: `c66b5e252891a01568f669c2eff098218c17612b` (generator validates mask owner prefix).
- New regression test: `d7b65b1539b24ee7d3164159eeecadd93cedac89` (test asserts owner prefix).
- Readback confirmed: `huntData.json` blob `86c7dd2b7ce86bbec97ce2548f77ca99e4fb4087` and both guard/test changes on `play-screen-overhaul`.

## Pending action and acceptance gate

**Highest-value next step:** Pete decides only the CAPITAL REAL and CONCENTRATION trap cases, both preserved verbatim in the repaired workbook.

Then: (1) mark those two either LOCKED and explicitly promote with stable IDs, or RETIRED with provenance; (2) if promoted, patch JSON on `play-screen-overhaul` and re-run full 253-word comparison; (3) run `npx tsc --noEmit` and Hunt reachability regression tests in the actual repository or CI and verify cards in a build.

**Do not work on** rewriting completed words, restoring historically CUT traps, or Daily Challenge during this content recovery.

**Acceptance:** 253-word content inventory plus any approved new cards remains identical across authoritative workbook and runtime; all old ID variants are either current, superseded, intentionally retired, or explicitly held with Pete's ruling; visible and Boss masks pass validation, reachability tests and gameplay checks. Current workbook/runtime **data equivalence** is verified; editorial signoff on two old items and execution of the real app tests are still outstanding.