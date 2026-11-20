# POLYWORDS Product Findings

## 2026-10-19 — Returning-word card selection

**Status:** Product finding / follow-up design item. Not an implementation instruction by itself.

The current Hunt generator already controls the Hunt arc, word selection, difficulty adaptation, word recency, Returning Haunts, mastered-word returns, and MASTER'S REMATCH. It caps each word at five visible masks and guarantees a REAL/trap mix.

Player progress also persists discovered visible REAL mask IDs (`realMaskIdsFound`), but that history is currently used for discovery/accounting such as Polybook "new REALs this run" and is not passed into `generateHunt()` to influence which five visible masks are selected for a returning word.

**Finding:** There is a legitimate future opportunity to make the existing five-card selection player-history-aware without adding a new progression system or visible mechanic.

**Approved product direction from discussion:** For a returning word, preserve a mix of recognition and discovery rather than using only repeats or only unseen material. Prefer some familiar material plus some unseen material, with a soft novelty bias rather than a rigid fixed ratio. Preserve all existing Hunt arc, fairness, REAL/trap, Haunt, mastery, and seeded-generation rules.

**Important distinction:** Haunted-word hidden content remains the exact unresolved hidden pair that beat the player. This finding applies to visible mask selection and must not weaken the existing revenge/memory behavior of Returning Haunts.

**Why it matters:** Repeated encounters should naturally produce the POLYWORDS realization: the player already uses these ordinary words in many different ways and knows the meanings, but rarely notices how many meanings live under the same word.

## 2026-11-19 — Hunt rotation, content gate and Group D closure

**Status:** Group D audit re-edit completed per Pete's explicit confirmation. Hunt CI maintenance closed at commit `67fb414f` (successful Quality Checks run `44648860014`). No editorial copy was changed to clear the gate.

**Verified generator behavior:** Within a Hunt, word selection is unique. Recency is a soft preference, so no-repeat behavior across *every* consecutive Hunt is not a hard guarantee. A regression test exercises 60 consecutive full Hunts; early-loss/restart behavior requires separate coverage. Boss pinning and Returning Haunt behavior should remain protected.

**Next highest-value work:** Verify early-loss/restart rotation and pinned Boss behavior with deterministic tests, then perform release-oriented phone checks and current-workbook parity review. **Acceptance:** no duplicates within a Hunt; documented and tested recency behavior after early losses; unchanged Boss/Haunt rules; green TypeScript/tests/content gate; any device or workbook gaps reported rather than assumed closed.

**Not yet:** Home redesign, full-body Polly animation, unrelated gameplay systems, or bulk content rewrites. Group D's completion is an editorial milestone, not a blanket certification of every historical card or a device-tested release.
