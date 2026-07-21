# POLYWORDS — Hunt / Polly Rebuild Plan

**Owner:** Pete (sole authority) · **Lead:** Claude
**Branch:** `play-screen-overhaul` — never merge to `main` without approval
**Status as of July 21 2026 — BUILD LEDGER:**
- Phase 1 (engine owns bossOutcome + new master rule): **SHIPPED** — tsc-clean, device-confirmed, tagged `v0.working-20260721-phase1`. Also fixed the loss-laugh echo / replay-lag (pollyVisitPolicy GAME_OVER_LAUGH.sfx → null).
- Phase 2 (Results/rank/Polly-memory read the outcome + locked verdicts): **CODE DONE, closing** — tsc-clean, all suites pass, device-confirmed behaviorally (all three verdicts fire correctly). One open item: the longer verdict lines clip behind the footer — layout fix in flight. Tag `v0.working-20260721-phase2` once the text seats right.
- Verdicts: **LOCKED** (see Part B). Remaining voice copy (haunt re-theme, run-language, wrong-swipe) still owed to the joint pass.
- Phase 3 onward: not started. Phase 3, feel pass, and Standalone H2 are warroom-gated (MaskBoard) — each gets a full warroom pass before any Claude Code brief.

Workflow (July 21): Claude is lead engineer. Claude hands Claude Code whole batched, self-checking briefs (edit → tsc → tests → fix → loop until green → report). Pete is the device tester at phase checkpoints only. This doc is the shared blueprint both Claude and Claude Code read.

This document is the single source of truth for the sequence. Nothing here is
implemented yet. It exists so the plan cannot be lost between sessions.

---

## Part A — The Fiction Spine (settled)

The game had two competing stories ("reclaim stolen meanings" vs "beat Polly")
and pointed the Hunt at no clear target. Settled fiction:

> **You go on a RUN through Polly's HUNT. She hunts YOU.**
> Polly is the hunter and trap-setter. She never owned the words and never stole
> them — she sets snares. You are prey running her trap-field, reading the real
> meanings to avoid her traps, racing to the boss: **Polly's Word**, the one she
> guards hardest. Crack it and you flip the hunt — you outhunt the hunter.

**Noun split (stop the two words fighting):**
- **Run** = the player's attempt / your side. "Start your run," "run it back," "she snared your run."
- **Hunt** = Polly's trap-field / her side. Keep this word — it carries the **Hunt <-> Haunt** wordplay that HAUNTED and Returning Haunt depend on. Do not rename it.

**Legality guardrail:** every win is framed as *cracking her trap / reaching the
real meaning*, never as *recovering what she stole*. She traps; she does not own.
This is why the word "reclaimed" is suspect — it smuggles ownership back in — and
is being rewritten in the joint pass below.

---

## Part B — The Verdicts and voice copy (written jointly with Pete)

**Verdicts: LOCKED.** The remaining copy (haunt re-theme, run-language, wrong-swipe) is
still written WITH Pete — candidates + honest read, Pete calls it. Claude does not
finalize the remaining copy solo.

The three run-end verdicts are LOCKED (written jointly with Pete, July 21 2026). They
map one-to-one onto the boss outcome the engine owns after Phase 1:

| Run ending | Outcome | Verdict (LOCKED) |
| --- | --- | --- |
| Cracked Polly's Word | mastered | **SLIPPED PAST POLLY'S TRAP** |
| Survived, boss not cracked | haunted | **ALMOST, BUT ALMOST DOESN'T COUNT.** |
| Died during the run | died | **GOT SNAPPED BY POLLY'S TRAP** |

Design notes on the set: the win and death lines are a deliberate mirror on the same
image — *slipped past* vs *got snapped by* Polly's trap (snapped/trap true rhyme). The
middle breaks the trap image on purpose and goes flat: you survived, you reached her
Word, you fell short, and *almost doesn't count*. No ownership language anywhere ("crack
her trap," never "reclaim what she stole"); the middle never claims you beat Polly
(beating Polly = cracking her Word = the win only).

**Full joint writing pass scope (all OPEN):**
1. The three verdicts above. — DONE (locked July 21 2026).
2. **Haunt re-theme** — HAUNTED / Returning Haunt / "Guess who's back" / "STILL HAUNTED"
   currently read as generic spooky, unattached to Polly. Reword so a failed word is
   *Polly's trap still set, waiting on your next run* — hers, not a free-floating ghost.
   Ripples to MaskBoard overlay strings, Results, and share text.
3. **Run-language lines** — "run it back" and the run/hunt vocabulary, made consistent
   with the noun split.
4. **Wrong-swipe copy** — "Not a meaning," "Wrong call," "Actually a meaning" should
   sound like Polly's snare closing, not a spreadsheet error. (The *feel* of the
   wrong-swipe is separate — see Phase 6.)

**Rank stays a separate axis.** D–MASTER remains purely score-based skill
measurement. Rank **S** is no longer labeled "Better than Polly" — that label is
what let *score* impersonate *beating Polly*.

---

## Part C — Confirmed defects this plan fixes

All verified against `play-screen-overhaul`, not memory.

1. **No per-run boss outcome exists.** Result is smeared across MaskBoard refs,
   engine-bypassing synthetic masks, imperative store calls, and Results guessing
   from score. Root cause of 2–4. (CRITICAL)
2. **"Beat Polly" is decided by `score >= 15000`** (Results verdict, rank S,
   Polly-memory) — none read the boss. Fail the boss, still told you beat Polly. (CRITICAL)
3. **Dying on the boss never haunts the word.** `queueFailedBoss` only fires on the
   deck-empty completion path; death bypasses it. (HIGH)
4. **Wrong mystery is invisible to the engine.** Mystery tiles are synthetic masks
   absent from `step.masks`; `submitSwipeUp/Down` no-op: no feather cost, nothing in
   `wordResults`. (HIGH)
5. **`hasHidden` vs `hasBossContent` mismatch.** Generator accepts a boss on
   `hiddenMeaning || hiddenTrap`; MaskBoard gates the mystery on `hiddenMeaning` only.
   A hiddenTrap-only boss becomes unmasterable even on a perfect run. (HIGH)
6. **Dead 12-round arc.** `session.ts` SESSION (boss index 11) contradicts canon and
   is never used live (`generateHunt`, boss index 9, is live). `createGame()` still
   defaults to it. (MEDIUM)
7. **Docs drift.** GAME_REFERENCE rank thresholds (8k/11k/14k/18k/22k) do not match
   live `ranks.ts` (3k/6k/10k/15k/19.5k). GAME_REFERENCE already documents the *new*
   boss rule with no perfect-clear gate — the code's `perfect &&` gate is drift from
   canon, not intent. (MEDIUM)
8. **Dead scoring tier.** "Rare REAL 300×chain" advertised, but the data model has no
   `isRare` field, so it never fires. (MEDIUM)
9. **Minor.** Chain multiplier duplicated in MaskBoard and engine; locked verdict
   strings not yet confirmed against `pwResultsMaterials.ts`.

**New boss rule (from Pete, July 20):** survive the visible boss tiles → mystery
unlocks → correct mystery = MASTERED, regardless of visible mistakes. Wrong mystery
or death = HAUNTED. Perfect visible round is a bonus mark only, never a gate. Two
master states: **MASTERED** (survived + cracked hidden) and **MASTERED — FLAWLESS**
(same, plus a clean visible round). The plain non-flawless master must be a full,
first-class master — this is the default path, not a lesser one.

---

## Part C2 — Additional items raised by Pete (July 20 brain-dump)

Captured so none are lost. Each is slotted into the sequence below.

- **Non-flawless master must be an explicit full master.** → written into Phase 1.
- **In-run HUD shows no round position.** Score/streak/feathers + a progress bar, but
  no "Round 4 of 10." On a run *to the boss*, you can't see how close you are. →
  Standalone Fix H1.
- **Book open/close timing on the Hunt is out of sync.** Correct swipe sometimes opens
  the book at the right moment, sometimes not. Book-open fires from the tile's travel
  (`onNearTarget`) while absorption/completion run on separate timers — two clocks that
  drift. → Standalone Fix H2 (gated: MaskBoard + SwipeMask).
- **Haunt language re-theme, wrong-swipe copy.** → joint writing pass (Part B).
- **Wrong-swipe FEEL** (snare closing, Polly's voice). → Phase 6.
- **Mastery celebration redesign.** The current radial shard burst reads as "birthday
  cake confetti." → Parked feel item. Dead concepts: golden expanding ring (killed
  twice), generic omnidirectional multicolor particle scatter. Go bespoke to the
  book/vault/cracked-word fantasy.
- **Polly "more alive" (animation).** Big can of worms (`usePollyAnimator`, poses). →
  Parked, its own later animation pass.

---

## Part D — The Sequential Build Plan

Ordering rule: the game must be playable and internally consistent at every checkpoint.
Each phase ends with `tsc --noEmit` exit 0, a device test of the paths it touched, and a
`git tag v0.working-YYYYMMDD-<phase>` before the next phase begins. No phase starts until
the previous is tagged known-good.

MaskBoard.tsx and SwipeMask.tsx are warroom-gated: any phase that touches them gets a full
War Room pass (diagnosis → ripple map → fix → wow audit → defer) **before** a Claude Code
prompt is written. GitHub MCP is read-only; all writes are Claude Code prompts Pete runs.

### Phase 0 — Lock the fiction in canon (docs only, zero gameplay risk)
- **Goal:** Write Part A (the settled spine + noun split + legality) into
  `docs/GAME_REFERENCE.md` and the Polly dialogue direction. Mark the old strings as
  superseded. Verdict/haunt/wrong-swipe *strings* are left as placeholders pending the
  joint writing pass — the spine lands now, the wording lands after we write it.
- **Touches:** docs only. No code.
- **Why first:** fiction must be settled before any surface reads from it. Safe.
- **Exit:** docs updated, committed, tagged.

### Joint Writing Pass (with Pete) — feeds Phase 0 strings and Phase 2
- The copy in Part B. Done as a sit-down, not solo. Can happen any time before Phase 2
  needs the strings; slots between phases at Pete's call.

### Phase 1 — Engine owns `bossOutcome` + the new boss rule (the spine)
- **Goal:** Add an explicit per-run boss outcome to `GameState`
  (`'pending' | 'mastered' | 'masteredFlawless' | 'haunted'`). Engine sets it: correct
  mystery → mastered (flawless variant if the visible round was clean); wrong mystery or
  boss death → haunted. Persist mastery/haunt off that one field, atomically. Implement
  the new rule: drop the `perfect &&` gate — any survival unlocks the mystery; correct
  mystery masters regardless of visible mistakes (**the non-flawless master is a full
  master**). Route the mystery tile through the engine instead of synthetic masks so a
  wrong mystery costs a feather and lands in `wordResults`. Queue the haunt on boss death.
- **Touches:** `polyRunEngine.ts`, `useGameStore.ts`, **`MaskBoard.tsx` (gated)**.
- **Fixes:** defects 1, 3, 4; implements the new rule + both master states.
- **Why here:** everything downstream needs a real outcome to read. Load-bearing.
- **Requires:** full War Room pass before the prompt (gated file).
- **Exit:** tsc 0; device-test all boss endings (master / master-flawless / haunt / die)
  plus a Returning Haunt clear and fail, across restart chains; tag.

### Phase 2 — Surfaces read the outcome + verdict wiring
- **Goal:** Results verdict, rank labeling, and Polly-memory all derive from
  `bossOutcome`, not score. Wire in the verdict strings (from the joint pass). Decouple
  rank from "beat Polly" language. Make banner, share text, and Polly's reaction agree.
- **Touches:** `ResultsScreen.tsx`, `pwResultsMaterials.ts`, `ranks.ts` (label only),
  `useGameStore.ts` (`recordRunComplete`), `pollyMemory.ts`.
- **Fixes:** defect 2.
- **Depends on:** Phase 1 (outcome field) + joint writing pass (strings) + Phase 0.
- **Exit:** tsc 0; device-test every results screen against all outcomes, confirm banner
  + share + Polly agree; tag.

### Phase 3 — Arc integrity
- **Goal:** Remove/quarantine the dead `session.ts` SESSION + `buildRunSession` after a
  reference check; make `createGame` require steps so the 12-round CAST arc can't surface.
  Fix `hasHidden` vs `hasBossContent` so a hiddenTrap-only boss can't become unmasterable.
- **Touches:** `session.ts`, `polyRunEngine.ts`, **`MaskBoard.tsx` (gated)**, maybe tests.
- **Fixes:** defects 5, 6.
- **Requires:** War Room pass (gated). Reference check before deleting SESSION.
- **Exit:** tsc 0; device-test a full run start-to-boss; tag.

### Phase 4 — Scoring model cleanup
- **Goal:** Resolve the dead rare tier (remove the doc claim now, leave code dormant,
  revisit `isRare` during the content pass). Reconcile GAME_REFERENCE rank numbers + boss
  rule to live code. De-dupe the chain multiplier (engine is the single source; MaskBoard
  reads it).
- **Touches:** `docs/GAME_REFERENCE.md`, `MaskBoard.tsx` (gated, small), engine.
- **Fixes:** defects 7, 8, 9 (partial).
- **Exit:** tsc 0; tag.

### Phase 5 — Verify / polish
- **Goal:** Confirm verdict strings match `pwResultsMaterials.ts`; read the unopened edges
  (`VaultScreen.tsx`, `types.ts`, tests); resolve the phase-vs-scoring design question
  (should harder arc phases pay more, or is chain the only amplifier?).
- **Exit:** tsc 0; tag a clean known-good checkpoint.

### Phase 6 — Make the player feel hunted (feel pass, deliberately last)
- **Goal:** Make "she's hunting you" *felt* every round. Primary beat: reframe the
  wrong-swipe moment as a snare closing in Polly's voice, not a neutral error. Secondary:
  rising pressure as she closes in through rounds 8–10.
- **Touches:** feel-engine direction → MaskBoard/FXLayer/sfx/Polly (gated).
- **Why last:** decorating the hunt before the spine is coherent polishes a contradiction.
  Its own dedicated War Room pass.

### Standalone fixes (order-flexible — slot where convenient)
- **H1 — HUD round position.** Show "Round N of 10" / rounds-to-boss in the in-run HUD.
  Touches `GameScreen.tsx` TopBar. Not gated, low risk. Can land any time.
- **H2 — Book open/close timing sync.** Resync the book-open trigger with swipe
  resolution so it fires reliably. Touches **MaskBoard + SwipeMask (both gated)** — needs
  a War Room pass. Independent of the boss spine.

### Parked — feel/design work, after the spine (not in this systems sequence)
- Mastery celebration redesign (bespoke; no ring, no confetti scatter).
- Polly "more alive" — animation pass (`usePollyAnimator`, poses).

---

## Part E — Design decisions and recommended defaults

Claude leads; these are the calls unless Pete redirects.

1. **Master states (Phase 1):** two states — **MASTERED** (survived + cracked hidden,
   the default full master) and **MASTERED — FLAWLESS** (same plus a clean visible round,
   an extra seal + share glyph + Vault mark). Non-flawless is a full master, never lesser.
   *Locked per Pete July 20.*
2. **"Beat Polly" meaning (Phase 2):** boss outcome decides beating Polly; rank D–MASTER
   stays a separate score axis with no "beat Polly" language. *Assumed.*
3. **Rare tier (Phase 4):** remove the doc claim now; leave code dormant; revisit `isRare`
   during the content pass. *Assumed remove-for-now.*
4. **Boss death → haunt (Phase 1):** dying on the boss haunts the word so it returns as a
   Returning Haunt. *Decided.*

---

## Part F — Guardrails honored throughout

- Never merge to `main` without approval.
- `tsc --noEmit` exit 0 + device test + `git tag` after every phase; no phase starts
  before the previous is tagged.
- MaskBoard.tsx / SwipeMask.tsx are warroom-gated — full War Room pass before any prompt
  touching them (Phases 1, 3, 4, 6, and Standalone H2).
- GitHub MCP is read-only; all writes are Claude Code prompts Pete runs locally.
- Content corpus (`huntData.json`) is being rewritten separately and is out of scope.
  Findings that depend on word data are flagged to re-verify against the new JSON during
  the content pass, not judged now.
- Preserve the named stashes; do not pop, index, drop, or clear them.

---

## Part G — Immediate next action

The joint writing pass (Part B) is Pete-and-Claude, done when Pete's ready. It does not
block Phase 1.

Claude proceeds to the **Phase 1 War Room pass** — the boss-outcome spine — since it is
the load-bearing systems work and is fully unblocked by the open copy. That pass produces
the full diagnosis → ripple map → fix → wow audit → defer for the gated MaskBoard/engine
change, for Pete's review, before any Claude Code prompt. If Pete would rather do the joint
writing pass first, say so and Claude switches.
