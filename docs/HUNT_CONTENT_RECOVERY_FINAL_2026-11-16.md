# POLYWORDS Hunt Content Recovery | Final editorial closure, November 16, 2026

**Authoritative branch:** `Psibari/Polywords` / `play-screen-overhaul`  
**Live Hunt content:** `assets/data/huntData.json`  
**GitHub restoration commit:** `920635020794180663cd8546bf026525a7792f5c`  
**Reconciled workbook:** `POLYWORDS_CANONICAL_RECOVERY_FINAL_CAPITAL_CONCENTRATION_2026-11-16.xlsx`

## Final editorial decision

Pete explicitly authorized restoring two historically approved cards on November 16, 2026, without changing their original wording or classification.

| Headword | Original ID | Type | Exact approved card | Disposition |
| --- | --- | --- | --- | --- |
| CAPITAL | `capital_r3` | **REAL** | `HIGHEST FORM OF PUNISHMENT` | RESTORED, LOCKED, playable |
| CONCENTRATION | `concentration_t3` | **TRAP** | `STRAIGHT FROM THE ORANGE, NOTHING ADDED` | RESTORED, LOCKED, playable |

### Why did the cards disappear?

- `capital_r3` was previously LOCKED. The historical Change Log at row 61 explicitly recorded Pete's approval, including an independent meaning check. An October 6 repository-first workbook sync reduced CAPITAL from four REALs to three without an ID-specific editorial rejection. That was a source-sync omission, **not proof that Pete retired the REAL**.
- `concentration_t3` was historically LOCKED as a **TRAP**. It disappeared during prior workbook/runtime synchronization, with no explicit later decision to remove that ID found. The card describes fresh/pure juice, tempting the related concept of concentrated orange juice while not itself meaning CONCENTRATION. It should **not** be reclassified as a REAL. Importantly, `concentration_t8` (`A SHOT OF WHISKY, NEAT`) is a different trap: it was explicitly removed on November 3 because neat whisky can imply undiluted strength. That retirement still stands.

These cards were never missing from historical evidence; they were missing from the current active game/content bank. Their original IDs and wording are now restored.

## Verified production content after restoration

- **253 headwords**, unchanged.
- **2,505 playable visible cards**: **1,375 REALs** and **1,130 traps**.
- **75 Boss hidden pairs**, unchanged.
- **CAPITAL** now has **4 REALs + 3 traps**.
- **CONCENTRATION** now has **4 REALs + 7 traps**.
- Restored workbook contains **2,505 uniquely identified active cards** across Tiles and Boss production; all previous words other than CAPITAL and CONCENTRATION remain exact against the pre-restoration runtime baseline, and the two restored-card hashes match the new GitHub JSON.
- No other previously retired card was reactivated.

The Hunt generator samples **up to five visible cards per word encounter** from the larger per-word pool. A card's presence in the live JSON makes it eligible for rotation, not guaranteed to appear in a particular run. A live app/device playtest and repository TypeScript test run remain separate technical verification tasks; neither has been claimed as performed in this report.

## Changes and verification

1. Added both original cards with their original IDs/wording/roles to `assets/data/huntData.json` on `play-screen-overhaul` (commit `920635020794180663cd8546bf026525a7792f5c`). GitHub readback verified both records.
2. Appended both cards as **LOCKED** in the canonical workbook's Tiles sheet (`Tiles!A2284:H2285`) and updated Word Tracker counts.
3. Marked the historical archival decisions **RESTORED**, resolved both Editorial Decision Gate entries, updated the recovery summary/runtime reconciliation counts, and appended explicit approval evidence to Change Log. Historical sources remain preserved.
4. Reopened the exported workbook: 253 active headwords, 2,505 distinct playable IDs, no owner prefix mismatches; checked the restored CAPITAL / CONCENTRATION exact hashes against the live GitHub content. The 75 Boss hidden pairs were retained.

**Content recovery editorial gate: CLOSED (0 unresolved of the two identified conflicts).** Technical tests/device observation remain outstanding and should be run before a release signoff.

## Next actions

1. Run the repository's TypeScript typecheck and Hunt reachability regression tests against the new content commit.
2. Exercise seeded Hunt sessions to confirm restored cards enter the five-card selection pool; check that no retired card appears.
3. Treat this final workbook as the editorial master for subsequent work, with GitHub `play-screen-overhaul` as the live runtime authority. Do not automatically restore additional historical-only IDs.