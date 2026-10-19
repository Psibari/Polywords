# POLYWORDS Product Findings

## 2026-10-19 — Returning-word card selection

**Status:** Product finding / follow-up design item. Not an implementation instruction by itself.

The current Hunt generator already controls the Hunt arc, word selection, difficulty adaptation, word recency, Returning Haunts, mastered-word returns, and MASTER'S REMATCH. It caps each word at five visible masks and guarantees a REAL/trap mix.

Player progress also persists discovered visible REAL mask IDs (`realMaskIdsFound`), but that history is currently used for discovery/accounting such as Polybook "new REALs this run" and is not passed into `generateHunt()` to influence which five visible masks are selected for a returning word.

**Finding:** There is a legitimate future opportunity to make the existing five-card selection player-history-aware without adding a new progression system or visible mechanic.

**Approved product direction from discussion:** For a returning word, preserve a mix of recognition and discovery rather than using only repeats or only unseen material. Prefer some familiar material plus some unseen material, with a soft novelty bias rather than a rigid fixed ratio. Preserve all existing Hunt arc, fairness, REAL/trap, Haunt, mastery, and seeded-generation rules.

**Important distinction:** Haunted-word hidden content remains the exact unresolved hidden pair that beat the player. This finding applies to visible mask selection and must not weaken the existing revenge/memory behavior of Returning Haunts.

**Why it matters:** Repeated encounters should naturally produce the POLYWORDS realization: the player already uses these ordinary words in many different ways and knows the meanings, but rarely notices how many meanings live under the same word.
