# POLYWORDS Game Design Audit & Implementation Roadmap

> Audit date: September 2026
> Frameworks: MDA, Csikszentmihalyi Flow, Bartle's Player Types, Self-Determination Theory

---

## Table of Contents

1. [MDA Framework Analysis](#i-mda-framework-analysis)
2. [Flow Channel Analysis](#ii-flow-channel-analysis)
3. [Self-Determination Theory](#iii-self-determination-theory)
4. [Reward Systems Audit](#iv-reward-systems-audit)
5. [Bartle's Player Type Fit](#v-bartles-player-type-fit)
6. [What the Game Is Doing Right](#vi-what-the-game-is-doing-right-top-5)
7. [Weak Areas Deep Dive](#vii-weak-areas-deep-dive)
8. [Implementation Roadmap](#viii-implementation-roadmap)
9. [Quick Wins](#ix-quick-wins-this-week)

---

## I. MDA Framework Analysis

### Mechanics (Rules)

**What the game has:**
- Binary swipe grammar (UP = claim REAL, RIGHT = reject trap) — clean, locked, learnable in one round
- 10-round arcs with GPS pacing phases: Confidence → Flow → Tension → Panic → Boss
- Chain multiplier (0.5× increments every 3 correct, caps at 3×) that resets on error
- 6 feathers (lives) with flat drops, no regressive score-to-life economy
- Mercy system for early players (graduated, not a cliff)
- Boss gauntlet: hidden mystery tiles, player chooses which card to open
- Returning Haunts: revenge matches against words that previously beat you
- Deterministic seeded RNG for shuffles, truth plans, and content selection
- Adaptive difficulty: recent struggles make future draws gentler, clean streaks make them sharper

**Assessment:**
The mechanics are **exceptionally well-designed**. The swipe grammar is the game's masterstroke — two gestures, two meanings, no ambiguity. The GPS arc system (Confidence → Panic → Boss) is a purposeful emotional rollercoaster, not random difficulty. The chain multiplier creates meaningful risk/reward without being punitive. The mercy system is one of the most thoughtful difficulty-scaling implementations: it tapers based on run count, avoids a binary cliff, and uses Polly's personality rather than a cold system message.

**One issue:** `isRare` REALs are defined in the type system but carry a comment saying "no live content currently carries isRare, tier unreachable." A 300-point base for rare REALs is designed into the scoring but never fires. This is dead content — either activate it or remove the path.

### Dynamics (Emergent Behavior)

**What emerges:**
- **Tension curve:** The 2→2→3→2→1 GPS arc creates a natural "breathing" rhythm — confidence builds, tension peaks, then the Boss is a single decisive beat, not a wall
- **Risk escalation:** Chain multiplier makes later tiles worth more, so a wrong swipe in round 8 hurts more than round 2 — exactly right for a recognition game
- **Haunt psychology:** Returning Haunts at round 5 (not late) mean the player faces their ghost mid-arc when they're warmed up but not exhausted — peak readiness for a revenge match
- **Gauntlet pick-order strategy:** The player chooses which mystery tile to open first, creating a genuine decision: pick the one you're most confident about to build momentum, or save it?
- **Polly's emotional arc:** She smugly heckles early, gets rattled at streak 10, sulks when you master, laughs when you fail — she has a complete emotional lifecycle that tracks the player's performance

**Assessment:**
The dynamics are **rich and intentional**. The game doesn't just have rules — it has *emergent drama*. Polly's rattled streak reaction is particularly brilliant: it turns a player's winning streak into a story moment. The Haunt system creates genuine narrative across sessions ("this word beat me before, now I'm back").

### Aesthetics (Experience)

**What the player feels:**
- **Recognition:** "Wait… Oh. Right." — the game's stated goal, and it delivers
- **Tension:** Escalating tile difficulty + lives pressure + chain at risk = genuine stakes
- **Rivalry:** Polly is an *opponent*, not a mascot — she sets traps, she smugly gloats, she sulks when you win
- **Mastery:** Ranked outcomes (D through MASTER), boss mastery sequences, the gold slam
- **Revenge:** Returning Haunts create personal narratives ("that word got me last time")

**Assessment:**
The aesthetic target is **clear and largely achieved**. The "recognition, not vocabulary" philosophy is rare in word games and gives Polywords a genuine identity. Polly as a trickster opponent (not a thief, per the explicit ruling) creates a unique emotional register — smug but not cruel, theatrical but not cartoonish.

---

## II. Flow Channel Analysis

```
     Anxiety
         ↑
  Hard   │         ████ ← Boss/Haunt (peak)
         │       ██████   ← Tension/Panic
Skill    │     ████████   ← Flow
Level    │   ██████████   ← Confidence
  Easy   │ ████████████
         └──────────────────→
           Low    Challenge    High
```

### What keeps the player in flow:

1. **GPS arc is a flow-channel ride, not a flat line.** Confidence builds skill recognition, Flow sustains it, Tension tests it, Panic pushes the edge, Boss is the summit. Textbook Csikszentmihalyi.

2. **Adaptive difficulty.** `recentHuntPerformance` tracking (struggle/steady/clean) makes the *next* run slightly easier or harder. Soft dynamic difficulty adjustment — doesn't change mid-run, only between runs, avoiding the "rubber band" feel.

3. **Fledgling runs.** First three runs are 8 rounds instead of 10, with easier word selection (`easyFirst` sorting). Legitimate onboarding ramp that respects developing skill.

4. **Cadence tuning.** `computeCadenceMs` varies the gap between tiles based on phase, combo, and boss status. Confidence rounds get +60ms (more breathing room), Panic rounds get -40ms (tighter). Invisible pacing that matches heart rate to emotional arc.

### Where flow can break:

1. **Boss gauntlet guessing.** Three mystery tiles with a 50/50 face-up choice each = 12.5% chance of all three correct by guessing. The tactical card-pick decision needs to feel meaningful, not random.

2. **Late-game word pool exhaustion.** Fallback chain in `huntGenerator.ts` is comprehensive, but a heavily-mastered player could see words from confidence pools appearing in panic slots. Content authoring pipeline is the real bottleneck.

3. **Daily Challenge clue timing.** Clues appear at 4s and 8s *or after wrong claims*. Gap between "instant solve" and "stuck" is wide.

---

## III. Self-Determination Theory

### Autonomy (Choice & Control)

**Strong:**
- Gauntlet pick-order is genuine player agency
- Daily Challenge: UP-only with deliberate press-hold-commit creates physical investment
- The game *never* auto-resolves player decisions — every swipe is intentional

**Weak:**
- Hunt tile order within a word is shuffled but not player-chosen
- No ability to skip, revisit, or choose difficulty mid-run
- Daily has no hints system beyond timed clue progression

### Competence (Mastery & Skill Demonstration)

**Strong:**
- Rank system (D→C→B→A→S→MASTER) provides clear skill benchmarks
- Chain multiplier rewards consistency, not just correctness
- `bossFlawless` tracking recognizes perfect boss clears
- Polybook work log creates a longitudinal mastery record
- Hidden pair discovery ("GOT PAST ME") is a genuine skill demonstration

**Weak:**
- Score is "displayed nowhere" in Hunt — the game deliberately hides its own skill metric
- Rank history exists in data but presentation layer doesn't surface "first time reaching A rank"
- No per-word mastery indicators visible during play

### Relatedness (Connection)

**Strong:**
- Polly as a rival creates *parasocial* relatedness — she's not a friend, she's an opponent
- Ghost/Haunt system creates personal narrative ("this word remembers me")
- The Polybook is Polly's diary about *your* plays — she's watching, recording, commenting
- Daily Challenge creates shared-difficulty community moments (same puzzle, same day)

**Weak:**
- No multiplayer, leaderboards, or social sharing visible in the codebase
- Daily share text exists but social loop isn't prominent
- The Vault is Polly-free (by design) — no Polly commentary on your archive

---

## IV. Reward Systems Audit

### Intrinsic Rewards (What makes it *feel* good)

| Reward | Present? | Quality |
|--------|----------|---------|
| Recognition ("Wait… Oh. Right.") | ✅ | **Core identity** — this IS the reward |
| Skill mastery | ✅ | Chain multiplier + rank progression |
| Curiosity fulfillment | ✅ | Hidden pairs, ghost meanings, lore |
| Completion satisfaction | ✅ | Boss mastery sequence, gold slam |
| Narrative closure | ✅ | Haunt banishment, Polly's reactions |
| Near-miss drama | ✅ | Wrong swipe feedback, "STILL HAUNTED" |

### Extrinsic Rewards (What keeps you coming back)

| Reward | Present? | Quality |
|--------|----------|---------|
| Score | ⚠️ | Calculated but **hidden** — deliberate but unusual |
| Rank | ✅ | D→MASTER, first-reach dates tracked |
| Feather milestones | ⚠️ | Fire for FX but **no longer grant lives** — pure celebration |
| Gold Feather | ✅ | Daily reward, one-shot revive |
| Vault/archive | ✅ | Mastered words accumulate |
| Streak tracking | ✅ | Personal best, longest streak, daily streak |
| Polly's book log | ✅ | Longitudinal record of your rivalry |

### Reward Scheduling

**What's working:**
- Fixed-ratio: Chain multiplier every 3 correct (predictable, motivating)
- Milestone: Rank thresholds, feather milestones (3000, 10000)
- Variable: Polly's reactions, hidden pair discoveries, Haunt outcomes
- Session arc: Boss mastery is the "big win" at the end of every run

**What's concerning:**
- **Score is hidden.** Game calculates points, tracks ranks, records milestones, but Hunt HUD shows "live status and Results shows an outcome label, not a number or rank." Extrinsic reward loop broken at display layer.
- **Feather milestones are decorative.** They fire but don't grant lives anymore. Phantom reward — signals achievement but delivers nothing tangible.
- **No visible combo counter.** Chain multiplier tracked internally but not surfaced during Hunt.

---

## V. Bartle's Player Type Fit

### Achievers 🎯 — MODERATE
Rank system and mastery tracking exist, but score is hidden and there's no visible leaderboard or achievement system. Vault provides a collection meta-game, but Achievers need *visible, quantified* progress. Polybook work log is a hidden achievement system the player can't fully see.

### Explorers 🔍 — STRONG
Hidden pairs, lore entries, ghost meanings, slang eras, semantic evolution events — genuine discovery layers. "Hidden until swiped correctly" means exploration is *rewarded with content*, not just points.

### Socializers 💬 — WEAK
Single-player experience. Daily Challenge creates temporal synchronicity (everyone plays the same puzzle), but no way to compare, share, or interact. Share text in Daily results suggests social intent but isn't prominent.

### Killers ⚔️ — STRONG (against AI)
Polly is a genuine rival. Smug, sets traps, gloats, sulks. Creates a competitive dynamic against an opponent with personality. Rare and valuable — most word games have no antagonist.

---

## VI. What the Game Is Doing Right (Top 5)

1. **The swipe grammar is genius.** Two gestures, two meanings, no ambiguity. Atomic unit, perfect.

2. **Polly as a rival, not a mascot.** Emotional range (smug → rattled → sulking → laughing), tracks history, reacts in real-time. A *character*, not a UI element.

3. **The GPS arc is a genuine emotional design system.** Confidence → Flow → Tension → Panic → Boss is a narrative arc with deliberate pacing. Returning Haunt at round 5 is a masterstroke of mid-arc tension.

4. **Recognition over vocabulary.** "Wait… Oh. Right." is fundamentally different from "I learned a new word." Makes the game about *insight*, not *study*. Unique selling point, deeply embedded.

5. **The mercy system is humane.** Graduated tapering, Polly personality framing, no binary cliff. Respects dignity while providing help. Gold Feather from Daily creating cross-mode reward loop is elegant.

---

## VII. Weak Areas Deep Dive

### WEAK #1: The Extrinsic Reward Loop Is Hidden

**The problem:** The game calculates score, chain multiplier, rank, and milestones — but shows the player almost none of it during play.

#### What exists but is invisible

| System | Where it lives | What the player sees |
|--------|---------------|---------------------|
| Score | `polyRunEngine.ts` — calculated on every correct swipe | Nothing. HUD redesigned to hide it. |
| Chain multiplier | `chainMultiplierForStreak()` — 1.0→1.5→2.0→2.5→3.0 | HUD label: STEADY / READING / GETTING PAST (words, not numbers) |
| Rank tier | `ranks.ts` — D/C/B/A/S/MASTER | Only at Results screen, after the run ends |
| Feather milestones | `FEATHER_MILESTONES = [3000, 10000]` | A flash celebration, **but no longer grants lives** |
| Combo count | `game.bestCombo` tracked internally | Shown at Results as "best chain N" — too late |

#### The design intent (from `HUD_STATUS_SYSTEM.md`)

> "The score was just a number going up. It did not tell the player how they were actually doing."
> "Polly is the opponent, not a spreadsheet."

This was a **deliberate design decision** — replacing numbers with emotional labels. The question is whether it went too far.

#### What to implement

**A. Surface the chain multiplier as a visual intensity, not a number**

The HUD already has rung segments (1/2/3 lit based on streak tier). But the *multiplier value* — the thing that actually changes your score — is invisible. You don't need to show "2.5×" as text. Instead:

- Add a subtle glow behind the HUD status label that scales with the multiplier. At 1.0×: no glow. At 1.5×: faint lavender. At 2.0+: gold-tinged. This tells the player "you're building something" without showing a number.
- **Location:** `app/game/huntControl.ts` — `resolveLiveHuntControl` already computes `readTier`. Add the multiplier value to the returned state.
- **Render in:** `app/screens/GameScreen.tsx` TopBar — the status label already has a glow animation on tier change. Extend it to pulse with multiplier intensity.

**B. Make feather milestones meaningful again — or remove them**

Right now `FEATHER_MILESTONES = [3000, 10000]` fires `featherMilestone` in the store, which triggers a visual celebration, but the "economy lock" comment says milestones no longer grant lives. This creates a **phantom reward** — the system signals achievement but delivers nothing.

Two options:
1. **Restore milestone lives** — but only the first time hitting each threshold per run, not repeatable.
2. **Remove the milestone system entirely** — replace it with a rank-up notification at Results.

**Recommendation:** Option 2. The rank system already exists and is meaningful. Milestones are redundant with ranks and the phantom celebration erodes trust.

**C. Show rank progress at Results, not just the tier letter**

Currently `ResultsScreen.tsx` shows a verdict ("MASTERED", "HAUNTED", etc.) and a ledger, but no rank. The rank data is computed in `ranks.ts` and stored in `rankHistory`, but Results doesn't render it.

- Add a rank tier badge below the verdict. Show the letter (A, S, MASTER) with its description.
- If the player reached a new rank tier, show "NEW RANK" with the date.
- **Location:** `app/screens/ResultsScreen.tsx`, below the `perfectLine`.

---

### WEAK #2: Boss Gauntlet Lacks Strategic Signal

**The problem:** The gauntlet is the game's most dramatic moment, but the player may not understand *why* they're picking a card or what the odds are.

#### What exists

- 3 mystery tiles, each with a seeded truth plan (`createSeededTruthPlan`)
- The face (REAL or trap) is an independent coin flip per tile
- Player picks which tile to open first, then judges it
- Shelf label says "CHOOSE A SEAL" and shows "N/3 correct"
- Three distinct brick sprites with three crown marker colors

#### What's missing

- **No indication of what "right" looks like before picking.** Strategic question — "which card should I pick first?" — has no signal.
- **No post-hoc breakdown.** After gauntlet resolves, player sees "MASTERED" or "HAUNTED" but doesn't learn which cards were which. Pick-order decision has no feedback loop.

#### What to implement

**A. Pre-reveal one tile's identity (the anchor)**

Before the player picks, show one tile as already opened with its face revealed (always a REAL, never a trap). This:
- Teaches the player what a gauntlet tile looks like when opened
- Creates a strategic anchor: "I know one is REAL, so the other two have 50/50 odds"
- Makes the pick-order decision meaningful

**Implementation:**
- In `app/hooks/useBoardMechanics.ts`, `triggerFinalTilesDrop`: mark the first tile as pre-revealed (always `isReal: true`)
- In `app/components/BossGauntletSpines.tsx`: render the first slot as already open with its phrase visible
- Shelf label changes from "CHOOSE A SEAL" to "CHOOSE THE NEXT SEAL"

**B. Post-gauntlet "what was behind each seal" reveal**

After MASTERED or HAUNTED resolves, briefly show what each sealed card actually was. This:
- Creates a learning loop: "I picked the right one first — good instinct"
- Builds narrative: "Two traps and one real — I got lucky"
- Rewards exploration: "I opened the hardest one first and survived"

**Implementation:**
- After `gatePhase` reaches `'mastered'` or `'wrongFail'`, animate each remaining sealed card to briefly show its face (2-3 seconds), then fade
- In `app/components/BossGauntletSpines.tsx`: add a `revealAll` prop that opens all sealed slots with a staggered animation

---

### WEAK #3: Daily Challenge Engagement Gap

**The problem:** Daily is a well-designed mode (5 rounds, 2 chances, timed clues) but the reward for completing it is a Gold Feather that expires if not used in Hunt. For players who primarily play Daily, the Feather is worthless.

#### What exists

- `DailySession` with 5 rounds, 2 chances, timed clue reveals
- Gold Feather earned on win, expires end-of-day
- Share text exists in `DailyResult` but is basic
- Polly reacts to lost chances and win/loss
- Daily streak tracking (`dailyStreak.ts`)

#### What's missing

- **No Daily-specific intrinsic reward loop.** Hunt has Polly rivalry, Haunts, Boss mastery. Daily has... a feather.
- **No "day rank" or speed comparison.** Timed clue reveals create natural performance tiers but aren't surfaced as comparison.
- **Share text is generic.** Doesn't show clue speed, the most interesting Daily metric.

#### What to implement

**A. Clue Speed Badge at Daily Results**

After completing Daily, show a badge based on how many clues each round needed:
- **All rounds solved with Clue 1:** "LIGHTNING" — gold badge
- **Most rounds solved with Clue 1-2:** "SHARP" — white badge
- **Used Clue 3 on multiple rounds:** no badge

Creates a Daily-specific skill axis that Hunt doesn't have.

**B. Enhanced Share Text**

Current share text: basic grid.
New share text should include clue speed:
```
POLYWORDS DAILY #47
⚡⚡⚡⚡⚡ 5/5 Lightning
```

**C. Polly's Daily Commentary**

Polly already reacts to win/loss, but reactions are generic. Add clue-speed dimension:
- Lightning solve: "Too fast. I need better clues."
- Barely survived: "Close. The feathers were generous today."

---

### WEAK #4: Content Pipeline Is the Binding Constraint

**The problem:** The game's long-term retention depends entirely on content volume. The 197-word corpus is the ceiling.

#### What exists

- `huntData.json` with ~197 words
- Each word has GPS tags (confidence/flow/tension/panic/boss), difficulty, hidden pairs
- Content writing standards in `CONTENT_WRITING_STANDARD.md`
- Authoring workbook in `localworkbooks/POLYWORDS_HAUNT_TILES.xlsx`
- Adaptive difficulty recycles mastered words back into tension/panic pools

#### What's breaking

- Fallback chain in `huntGenerator.ts` has 4 tiers of pool fallback because pools run out
- Mastered words return as `isMasteredReturn` — game is already recycling content
- Veteran player will exhaust boss pool, then panic pool, then see confidence words in tension slots
- **The game cannot sustain engagement without more content.**

#### What to implement (non-code, process)

**A. Content Pipeline Metrics**

Add to `npm run state` (which already prints pool sizes):
- Words by GPS tag: confidence N / flow N / tension N / panic N / boss N
- Words with hidden pairs (boss-capable): N
- Words without hidden pairs: N (these can never be Boss)
- Estimated runs-to-exhaustion at current mastery rate

Gives the content team a dashboard for prioritization.

**B. Content Generation Tooling**

The `tools/content/` directory exists but the `mask-rewriter` is deprecated. Priority:
1. Tool that takes a word + meanings and generates trap candidates following `TrapType` categories
2. Tool that validates hidden pairs for fairness (semantic distance between REAL and trap)
3. Tool that simulates 1000 runs against the current corpus and reports exhaustion curves

**C. Content Volume Targets**

Based on the GPS arc (2 confidence + 2 flow + 3 tension + 2 panic + 1 boss = 10 per run):
- **Minimum viable:** 200 words (current) — ~20 runs before recycling
- **Healthy:** 400 words — ~40 runs, mastery returns keep it fresh
- **Aspirational:** 600+ words — game never feels recycled

---

### WEAK #5: Missing "First Time" Milestone Celebrations

**The problem:** The game tracks first-reach dates for every rank tier but doesn't celebrate them.

#### What exists

- `computeRankHistoryUpdates` in `app/game/ranks.ts` — tracks first date reaching each tier
- `rankHistory` stored in `PlayerProgress`
- `getRankTier(score)` — resolves current tier from score
- `getRankProgress(score, tier)` — computes progress within a tier

#### What's missing

- No "NEW RANK" overlay at Results when a tier is first reached
- No Polly reaction to rank-up
- No persistent indicator in Vault or Home showing rank history

#### What to implement

**A. Rank-Up Celebration at Results**

After the verdict stamps in, if `computeRankHistoryUpdates` returns new tiers:
- Show a brief "NEW RANK: A" overlay with the tier's description ("Polly noticed.")
- Add a subtle gold pulse behind the verdict
- Fire a haptic (success type)

**Location:** `app/screens/ResultsScreen.tsx`, after `recordFinalRunIfNeeded`.

**B. Polly Reacts to Rank-Up**

Add a new Polly visit type: `rankUp`. When the player reaches a new rank:
- D→C: no reaction (too early)
- C→B: "Getting sharper." (matching the tier description)
- B→A: smug nod (she's noticing)
- A→S: "Razor sharp." (grudging respect)
- S→MASTER: "The title is yours." (sulking — she lost)

**Location:** `app/game/pollyVisitPolicy.ts` — add `rankUp` event, wire from ResultsScreen.

**C. Vault Shows Rank History**

In `app/screens/VaultScreen.tsx`, add a small "RANK HISTORY" section:
```
D: Day 1
C: Day 3
B: Day 8
A: Day 15
S: —
MASTER: —
```

Gives Achievers a long-term progression axis beyond "words mastered."

---

## VIII. Implementation Roadmap

### Priority Matrix

| Weak Area | Impact | Effort | Priority |
|-----------|--------|--------|----------|
| #1: Chain multiplier visibility | HIGH | LOW (glow intensity change) | **Do this week** |
| #5: First-time rank celebration | HIGH | LOW (overlay + Polly line) | **Do this week** |
| #4: Content pipeline metrics | HIGH | LOW (npm run state extension) | **Do this week** |
| #3: Daily clue speed badge | MEDIUM | LOW (badge + share text) | **Next week** |
| #2: Gauntlet pre-reveal anchor | MEDIUM | MEDIUM (SpineSlot + mechanics) | **Next sprint** |
| #2: Post-gauntlet reveal | MEDIUM | MEDIUM (animation + timing) | **Sprint after** |
| #1: Remove phantom milestones | LOW | LOW (store cleanup) | **Whenever** |

### Week 1: Surface What Exists

| Task | Files | Est. |
|------|-------|------|
| Chain multiplier glow on HUD status label | `huntControl.ts`, `GameScreen.tsx` | 2-3h |
| Rank-up overlay at Results | `ResultsScreen.tsx`, `ranks.ts` | 2-3h |
| Content pool metrics in `npm run state` | `scripts/` | 1-2h |
| Remove phantom feather milestones (or restore lives) | `polyRunEngine.ts`, `useGameStore.ts` | 1h |

### Week 2: Daily Engagement

| Task | Files | Est. |
|------|-------|------|
| Clue speed badge at Daily Results | `DailyChallengeScreen.tsx` | 2-3h |
| Enhanced share text with clue speed | `dailyChallengeEngine.ts` | 1-2h |
| Polly clue-speed reactions | `pollyCharacter.ts`, `DailyChallengeScreen.tsx` | 2h |

### Sprint 2: Gauntlet Clarity

| Task | Files | Est. |
|------|-------|------|
| Pre-reveal anchor tile in gauntlet | `useBoardMechanics.ts`, `BossGauntletSpines.tsx` | 4-6h |
| Post-gauntlet reveal-all animation | `BossGauntletSpines.tsx` | 3-4h |
| Gauntlet strategic hint text | `BossGauntletSpines.tsx` | 1h |

### Ongoing: Content Pipeline

| Task | Files | Est. |
|------|-------|------|
| Exhaustion simulation tool | `tools/content/` | 4h |
| Trap candidate generator | `tools/content/` | 6-8h |
| Content volume targets doc | `docs/` | 1h |

---

## IX. Quick Wins (This Week)

None of these require new systems, new assets, or new content. They surface data the game already computes.

1. **Chain multiplier glow** — 1 file change in `huntControl.ts` + `GameScreen.tsx`
2. **Rank-up overlay at Results** — 1 file change in `ResultsScreen.tsx`
3. **Content pool metrics in `npm run state`** — script addition, no UI change
4. **Daily clue speed badge** — 1 file change in `DailyChallengeScreen.tsx`

---

## Summary Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Core loop quality | **9/10** | Swipe grammar is perfect; recognition reward is genuine |
| Flow management | **8/10** | GPS arc is excellent; late-game content scarcity is the risk |
| Player psychology | **8/10** | Polly rivalry is brilliant; achiever needs are under-served |
| Reward systems | **6/10** | Intrinsic is strong; extrinsic is largely hidden or decorative |
| Balance | **8/10** | Chain multiplier, mercy, and adaptive difficulty are well-tuned |
| Content depth | **7/10** | Deep design (hidden pairs, Haunts, lore); volume is the bottleneck |
| Social/retention | **5/10** | Single-player only; Daily is the only recurring hook |
| **Overall** | **7.6/10** | Genuinely well-designed game with a clear identity and one significant gap (extrinsic reward visibility) |
