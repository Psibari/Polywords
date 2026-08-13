# Stable Content Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every persistable visible mask and boss hidden pair a permanent ID shared by the canonical August 13 workbook and overlapping runtime data, then migrate Haunted and Mastered persistence to resolve current wording by ID without changing gameplay.

**Architecture:** The workbook owns editorial identity because it is ahead of runtime. Runtime receives matching IDs only for content already present in `huntData.json`. A focused `hiddenPairIdentity.ts` module owns lookup and legacy matching; store and Vault code consume it while keeping legacy text snapshots as fallback.

**Tech Stack:** TypeScript 5.9, React Native/Expo, Zustand, AsyncStorage, Node content validators, `@oai/artifact-tool` for workbook edits.

## Global Constraints

- Work directly on `play-screen-overhaul`; do not create a branch or pull request.
- The August 13 workbook is the canonical editorial source and must not be reduced to repo content.
- Preserve all existing valid visible mask IDs.
- Hidden pair IDs use `<lowercase-word>_hNN`; suffixes are permanent allocation labels, not list positions.
- Deleted IDs are never reused.
- Ambiguous mappings must be reported, never guessed.
- Legacy text remains a fallback during migration.
- Do not change boss eligibility, spawn slots, gauntlet selection, gauntlet outcomes, Mastered, Haunted, Returning Haunt, or Banished rules.
- Follow red-green-refactor for every production-code change.
- Preserve workbook formatting, tables, formulas, statuses, and locked wording.

---

### Task 1: Build the identity inventory and workbook mapping

**Files:**
- Create: `tools/content/build-content-identity-map.mjs`
- Create: `tools/content/contentIdentityMap.test.mjs`
- Create: `artifacts/content-identity-map.json`
- Create locally then replace the same Library item: `POLYWORDS_content_data_2026-08-13_CURE_DEAL_DECK_LOCKED.xlsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: canonical workbook sheets `Tiles` and `Boss Words (Production)`; `assets/data/huntData.json`.
- Produces: deterministic mapping entries `{id, word, kind, text, pairedText?, workbookLocation, runtimeLocation?}` and an exceptions array.
- Produces command: `npm run content:identity-map -- --workbook <xlsx> --runtime assets/data/huntData.json --output artifacts/content-identity-map.json`.

- [ ] **Step 1: Write the failing identity-map tests**

Create fixtures in the test itself and assert:

```js
const result = buildIdentityMap({ workbookRows, runtime });
assert.equal(result.entries.find(x => x.text === 'CURRENT REAL').id, 'bank_r0');
assert.equal(result.entries.find(x => x.pairedText === 'CURRENT TRAP').id, 'bank_h01');
assert.deepEqual(result.exceptions, []);
```

Add separate cases proving:

- existing runtime mask IDs are preserved;
- workbook-only content receives a new non-colliding ID;
- one hidden pair receives one pair ID;
- duplicate candidate matches create an exception;
- deleted suffixes are not compacted or reassigned;
- no workbook rows are removed when runtime lacks the word.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx tools/content/contentIdentityMap.test.mjs`

Expected: FAIL because `build-content-identity-map.mjs` does not exist.

- [ ] **Step 3: Implement the minimal deterministic mapper**

Export:

```js
export function buildIdentityMap({ workbookRows, runtime }) {
  return { entries, exceptions, retiredIds };
}
```

Matching rules, in order:

1. exact word + type + current tile text;
2. exact word + hidden REAL + paired hidden trap;
3. compatible existing runtime ID already attached to the same item;
4. otherwise allocate the next unused suffix for that word and kind.

Never auto-map when more than one candidate remains.

- [ ] **Step 4: Run the mapper tests and verify GREEN**

Run: `npx tsx tools/content/contentIdentityMap.test.mjs`

Expected: `contentIdentityMap tests passed`.

- [ ] **Step 5: Add workbook ID fields without changing authored content**

Use `@oai/artifact-tool` to add:

- `Content ID` to `Tiles`;
- `Hidden Pair ID` to `Boss Words (Production)`.

Preserve existing formatting by copying the adjacent header/body format into the new columns. Assign one hidden-pair ID to the BOSS-HIDDEN/BOSS-HIDDEN-TRAP pair. Record unresolved mappings in the JSON exception report rather than filling them speculatively.

- [ ] **Step 6: Verify the workbook**

Inspect the new ID columns and render both modified sheets. Verify:

- all existing rows remain;
- CURE, DEAL, and DECK remain present;
- locked wording and statuses are unchanged;
- IDs are visible and not clipped;
- table ranges include the new columns;
- no formula errors appear.

- [ ] **Step 7: Persist the workbook update**

Replace the same Library-backed August 13 workbook identity, preserving version history. Do not create a competing canonical copy.

- [ ] **Step 8: Add scripts and commit**

Add to `package.json`:

```json
"content:identity-map": "node tools/content/build-content-identity-map.mjs",
"test:content-identity": "node tools/content/contentIdentityMap.test.mjs"
```

Run the test, then commit:

```bash
git add package.json tools/content/build-content-identity-map.mjs tools/content/contentIdentityMap.test.mjs artifacts/content-identity-map.json
git commit -m "content: establish canonical content identities"
```

---

### Task 2: Add hidden-pair IDs and validation to runtime content

**Files:**
- Modify: `assets/data/huntData.json`
- Modify: `app/game/types.ts`
- Modify: `app/game/huntGenerator.ts`
- Modify: `app/game/huntDeterminism.test.ts`
- Modify: `tools/content/runtimeHuntValidation.mjs`
- Modify: `tools/content/runtimeHuntValidation.test.mjs`

**Interfaces:**
- Consumes: approved identity map from Task 1.
- Produces: `HiddenPair = {id: string; real: string; trap: string}`.
- Produces: generated `WordStep.hiddenPairs` retaining source IDs unchanged.

- [ ] **Step 1: Add failing validator tests**

Update boss fixtures to include IDs, then add isolated failures:

```js
delete bank.WORD96.hiddenPairs[0].id;
assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'missing hidden pair ID'));

bank.WORD97.hiddenPairs[0].id = bank.WORD96.hiddenPairs[0].id;
assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'duplicate content ID'));

bank.WORD96.hiddenPairs[0].id = 'other_h01';
assert.ok(hasMessage(validateRuntimeHuntData(bank).blockers, 'word prefix'));
```

- [ ] **Step 2: Run validator tests and verify RED**

Run: `node tools/content/runtimeHuntValidation.test.mjs`

Expected: FAIL because hidden-pair identity is not validated.

- [ ] **Step 3: Implement minimal validation**

Validate all mask and hidden-pair IDs in one global set. Require `^[a-z0-9-]+_[rth]\d+$`. Report missing, malformed, duplicate, and parent-word-prefix mismatches as blockers.

- [ ] **Step 4: Verify validator GREEN**

Run: `node tools/content/runtimeHuntValidation.test.mjs`

Expected: PASS.

- [ ] **Step 5: Add a failing Hunt propagation test**

In `huntDeterminism.test.ts`, assert every generated boss pair has an ID and equals the source pair ID for that word. Also deep-copy a fixture, reverse its hidden-pair order, and prove IDs remain attached to their original `real`/`trap` content.

- [ ] **Step 6: Run the Hunt test and verify RED**

Run: `npx tsx app/game/huntDeterminism.test.ts`

Expected: FAIL because `HiddenPair` and `hiddenPairsFor()` currently discard IDs.

- [ ] **Step 7: Add runtime IDs without changing content**

Update all overlapping `huntData.json` hidden pairs from:

```json
{"real":"...","trap":"..."}
```

to:

```json
{"id":"horn_h01","real":"...","trap":"..."}
```

Do not import workbook-only words in this task.

Update `HiddenPair`, `HuntWordData.hiddenPairs`, and `hiddenPairsFor()` to carry `id` unchanged. Remove no compatibility behavior for legacy singular hidden fields unless the existing validator already forbids them in shipped content.

- [ ] **Step 8: Verify propagation and determinism GREEN**

Run:

```bash
npx tsx app/game/huntDeterminism.test.ts
node tools/content/runtimeHuntValidation.test.mjs
npm run content:preflight -- --input assets/data/huntData.json
```

Expected: all pass; fixed-seed word and mask ordering remains unchanged.

- [ ] **Step 9: Commit**

```bash
git add assets/data/huntData.json app/game/types.ts app/game/huntGenerator.ts app/game/huntDeterminism.test.ts tools/content/runtimeHuntValidation.mjs tools/content/runtimeHuntValidation.test.mjs
git commit -m "content: add stable IDs to hidden pairs"
```

---

### Task 3: Add ID resolution and safe legacy migration

**Files:**
- Create: `app/game/hiddenPairIdentity.ts`
- Create: `app/game/hiddenPairIdentity.test.ts`
- Modify: `app/game/types.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `findHiddenPairById(word: string, pairId: string): HiddenPair | null`
  - `matchLegacyHiddenPair(word: string, real: string, trap: string): HiddenPair | null`
  - `resolveGhostPair(ghost: GhostMeaning): {pair: HiddenPair | null; real: string; trap: string}`
  - `resolveMasteredPairs(record: MasteredWordRecord): Array<{id?: string; real: string}>`
- Consumes: current `huntData.json` and legacy text snapshots.

- [ ] **Step 1: Write failing resolution tests**

Prove:

- ID lookup returns current rewritten wording;
- reversing source order does not alter resolution;
- unknown ID returns legacy text and never uses array position;
- an ID-less exact legacy pair matches one current pair;
- zero and multiple legacy matches remain unresolved;
- mastered ID arrays resolve in saved order;
- migration helpers are idempotent.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx app/game/hiddenPairIdentity.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Keep lookup and migration pure—no AsyncStorage writes inside the identity module. Normalize only the parent word key; do not normalize or fuzz-match authored sentences.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx app/game/hiddenPairIdentity.test.ts`

Expected: `hiddenPairIdentity tests passed`.

- [ ] **Step 5: Enroll the test and commit**

Add `tsx app/game/hiddenPairIdentity.test.ts` to the main `test` command.

```bash
git add app/game/hiddenPairIdentity.ts app/game/hiddenPairIdentity.test.ts app/game/types.ts package.json
git commit -m "feat: resolve hidden content by stable ID"
```

---

### Task 4: Persist Haunted and Mastered references by ID

**Files:**
- Modify: `app/store/useGameStore.ts`
- Modify: `app/game/types.ts`
- Create: `app/game/hiddenProgressPersistence.test.ts`
- Modify: `package.json`

**Interfaces:**
- `GhostMeaning.hiddenPairId?: string`
- `MasteredWordRecord.hiddenPairIds?: string[]`
- `GameStore.resolveMystery(..., failedPair?: HiddenPair, pairIndex?: number)`
- `recordMastery(..., hiddenPairsFound: HiddenPair[], ...)`

- [ ] **Step 1: Write failing persistence tests**

Extract or expose pure record builders used by the store and prove:

- a failed boss writes `hiddenPairId` plus legacy real/trap snapshots;
- a mastered boss writes all `hiddenPairIds` plus legacy real snapshots;
- updating an existing ghost preserves its stable ID unless a newly resolved explicit ID replaces an absent legacy value;
- ID-less legacy records load unchanged;
- current Mastered, Haunted, and rematch guards remain unchanged.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx app/game/hiddenProgressPersistence.test.ts`

Expected: FAIL because persistence builders and fields do not exist.

- [ ] **Step 3: Implement minimal write-path changes**

Change the gauntlet failure payload from `{real, trap}` to `HiddenPair`. Continue passing `pairIndex` to the engine because changing engine identity is outside this patch. Store stable IDs alongside fallback snapshots.

For mastery, pass the complete `step.hiddenPairs` array and derive both:

```ts
hiddenPairIds = hiddenPairsFound.map(pair => pair.id);
hiddenMeaningsFound = hiddenPairsFound.map(pair => pair.real);
```

Keep the existing `isMasteryRematch`, ghost pruning, and outcome branches byte-for-byte equivalent where possible.

- [ ] **Step 4: Verify GREEN and regression tests**

Run:

```bash
npx tsx app/game/hiddenProgressPersistence.test.ts
npx tsx app/game/returningHauntResolution.test.ts
npx tsx app/game/polyRunEngine.test.ts
```

Expected: all pass.

- [ ] **Step 5: Enroll the test and commit**

Add the new test to `npm test`, then:

```bash
git add app/store/useGameStore.ts app/game/types.ts app/game/hiddenProgressPersistence.test.ts package.json
git commit -m "feat: persist hidden progress by stable ID"
```

---

### Task 5: Resolve current wording in the Vault without redesigning it

**Files:**
- Modify: `app/screens/VaultScreen.tsx`
- Create: `app/game/vaultHiddenContent.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes `resolveGhostPair()` and `resolveMasteredPairs()`.
- Produces the same current Vault fields, but sourced from current runtime wording when IDs resolve.

- [ ] **Step 1: Write failing Vault-data tests**

Test the pure resolver output used by the screen:

- mastered records with IDs display current REAL wording;
- ghosts with IDs display current REAL/trap wording;
- old records display saved fallback wording;
- unknown IDs do not reveal unrelated pairs;
- array reordering has no effect.

- [ ] **Step 2: Run and verify RED**

Run: `npx tsx app/game/vaultHiddenContent.test.ts`

Expected: FAIL because Vault currently reads persisted sentence arrays directly.

- [ ] **Step 3: Replace direct text reads with resolvers**

Replace:

```ts
selectedMastered.hiddenMeaningsFound
selectedGhost.hiddenMeaningReal
selectedGhost.hiddenMeaningTrap
```

with outputs from the identity resolver. Do not alter card copy, hierarchy, visibility, or the separate design problem that the haunted card reveals its answer.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx app/game/vaultHiddenContent.test.ts`

Expected: PASS.

- [ ] **Step 5: Enroll test and commit**

```bash
git add app/screens/VaultScreen.tsx app/game/vaultHiddenContent.test.ts package.json
git commit -m "fix: resolve Vault hidden content by ID"
```

---

### Task 6: Full verification and branch delivery

**Files:**
- Modify only if verification exposes a defect inside this plan's scope.
- Update: `artifacts/content-identity-map.json` only if the verified mapping changes.

**Interfaces:**
- Consumes all prior tasks.
- Produces a verified `play-screen-overhaul` branch and a replaced canonical workbook.

- [ ] **Step 1: Run the complete verification suite**

```bash
npm run typecheck
npm test
npm run content:preflight -- --input assets/data/huntData.json
node tools/content/validate-runtime-hunt.mjs --input assets/data/huntData.json --json
git diff --check
```

Expected:

- TypeScript exit 0.
- Every test exits 0.
- Content preflight has 0 structural blockers.
- Stable-ID mapping has 0 unresolved exceptions for overlapping runtime content.
- `git diff --check` exits 0.

- [ ] **Step 2: Run behavior-preservation checks**

Using fixed fixtures/seeds, compare before/after:

- selected Hunt words;
- visible mask selection and ordering;
- boss word and slot;
- Returning Haunt slot;
- gauntlet pair REAL/trap text and order;
- Mastered/Haunted/Banished outcomes.

Only additive ID fields may differ.

- [ ] **Step 3: Verify workbook and repo agreement**

For every overlapping visible mask and hidden pair, assert workbook ID equals runtime ID. Confirm workbook-only CURE, DEAL, DECK and all other newer content remain intact.

- [ ] **Step 4: Inspect branch scope**

Run `git status --short` and `git diff --stat`. Confirm no unrelated files, assets, gameplay rules, or content wording changed.

- [ ] **Step 5: Final commit if required and push directly**

```bash
git add <only verified in-scope files>
git commit -m "test: verify stable content identity migration"
git push origin play-screen-overhaul
```

Do not open a pull request. Report exact commit SHAs, commands, outcomes, workbook version, and any unresolved exceptions.
