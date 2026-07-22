# POLYWORDS — Hunt Economy: The Locked System

> **STATUS: DECIDED 2026-07-22 — NOT YET IMPLEMENTED.**
> This is a design-decision record. The live build (and `GAME_REFERENCE.md`,
> `GOLDEN_PACING_SYSTEM.md`, `HUNT_POLLY_REBUILD_PLAN.md`) still describe the *current*
> system until this ships. On implementation, fold this into those docs; then this record
> graduates to live canon and can be retired. Do not treat as live spec before then.

### One rebalance across arc + tiles + lives + scoring + boss. Modeled on live `huntData.json`, 60k runs/config.

## The targets (Pete, this session)
- Survive a run: **50–55%** for a decent human player (~90% avg accuracy)
- Master Polly's Word: **20–25%** (a trophy, not an expectation)
- Deaths cluster **late** — always "I almost had her," never a round-3 rug-pull

## The locked config
| Lever | Old | **New (locked)** |
|---|---|---|
| Tiles shown per word | all (~8.4 avg) | **5, flat** |
| Decisions per run | ~87 | **~53** |
| Starting lives | 5 | **6** |
| Score-milestone lives (3k/10k → +life) | on (regressive) | **removed** |
| Boss resolution | 1 mystery tile (coin flip) | **Route C: 3-tile hidden gauntlet** |
| Difficulty ramp source | undefined (tiles were random) | **trap sharpness / accuracy, per phase** |

## The result (decent player, 60k runs)
- **Survive 54%** · **Master 25%** · Almost (survived, boss haunted) 29% · Died 46%
- Deaths by phase: confidence **0%** · flow **0%** · tension **9%** · panic **35%** · boss **56%**
  → 100% of deaths in the back half. Textbook "go down swinging."

## Why this is one system (the circuit)
Arc sets trap sharpness → sharpness sets real per-tile accuracy (which **falls** across phases) →
accuracy × tile-count burns lives → lives are now flat (no score dependence) → boss difficulty
is a **content** property, not a code knob. Each piece constrains the next; none can be tuned alone.

### Assumed "decent player" accuracy (hypothesis — refine with real retention data)
confidence .96 · flow .93 · tension .90 · panic .86 · boss visible .84 · **boss hidden .72**
(weighted average ≈ 90% — the "decent human" we defined.)

## The content dependency (non-negotiable)
The 25% mastery target holds **only if boss hidden meanings are genuinely hard** — a decent
player should miss ~1 in 4 hidden tiles. That is a **writing spec** for the boss pipeline:
obscure, well-sourced, defensible hidden senses. Easy boss content → mastery creeps up and the
trophy cheapens. **Economy target = content difficulty target. Same system.**

## What changes in code (all small except Route C)
- `huntGenerator.ts` — cap visible masks per word to **5** (`.slice(0,5)` after shuffle;
  unshown masks resurface in other runs → more variety, zero wasted writing).
- `polyRunEngine.ts` — starting `lives: 5 → 6`; **remove** the 3k/10k `FEATHER_MILESTONES`
  life grants (keep feathers as score flavor if desired, but not as lives).
- `MaskBoard.tsx` / `SwipeMask.tsx` (**both warroom-gated**) — restore **Route C**: two→three
  hidden tiles as a gauntlet, UP the real, wrong = death/haunt, outcome-gated win/loss feedback,
  and the "final bout" visual treatment. Needs a warroom pass before either file is touched.
- Docs — rewrite `GAME_REFERENCE.md`, `GOLDEN_PACING_SYSTEM.md`, `HUNT_POLLY_REBUILD_PLAN.md`
  to this spec so game and canon finally agree.

## Honest caveats
- The player-accuracy numbers are a **starting hypothesis**, not a proven law. The *relationships*
  are robust; the exact %s get calibrated once real players generate data.
- "Flat 6 lives, no earned lives" removes the reward-hook of *earning* a life. If we want that
  feeling back without re-breaking the net, add a **need-based** comeback later (e.g., a clean
  word when low on lives) — never a cumulative-score gate.

## Open (Pete's call before build)
Confirm the locked config. Then sequence: docs first (cheap, locks canon), then generator +
engine (small), then the gated Route C build (warroom pass first). Each step tsc-clean +
device-tested + tagged, per standing rules.
