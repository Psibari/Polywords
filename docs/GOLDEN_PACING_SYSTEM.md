# POLYWORDS Golden Pacing System

## Purpose

The Golden Pacing System ensures every Hunt feels engaging regardless of which words are selected. It controls emotional rhythm, not just difficulty.

Target emotional cycle:

Recognition -> Doubt -> Discovery -> Confidence -> Tension -> Mastery

This is source-of-truth documentation for Hunt pacing, content selection, and future Hunt generation. It is not wired into the app yet.

## Core Principle

POLYWORDS is not a vocabulary quiz.

POLYWORDS is a semantic combat game:

- The word is the boss.
- The masks are Polly's defenses.
- Mastery is taking the word away from her.

## Semantic Snap Principle

The strongest emotional moment is not simply getting a correct answer. The strongest moment is reinterpreting a word and realizing it means something unexpected.

This moment is called a **Semantic Snap**.

POLYWORDS should optimize for Semantic Snap frequency.

Primary success metric: **Semantic Snap Rate**.

## Hidden Truth Rule

Before a swipe, all masks are equal.

The player must never know whether a mask is real, trap, rare, hidden-worthy, or important before commitment.

All ordinary masks must look, move, animate, and enter identically. Truth is revealed only after commitment.

## Five Emotional States

### 1. Confidence

- Player learns quickly.
- Player feels intelligent.
- Goal: "I understand this game."

### 2. Flow

- Player develops rhythm.
- Swipes become natural.
- Goal: "I'm getting good at this."

### 3. Tension

- Traps become sharper.
- Meaning pivots become stronger.
- Goal: "I need to pay attention."

### 4. Panic

- Feathers matter.
- Mistakes become expensive.
- Goal: "Don't lose this run."

### 5. Confrontation

- Polly deploys strongest defense.
- Player faces a difficult word.
- Goal: "I earned this."

## Standard Hunt Rhythm

- 2 Confidence Words
- 2 Flow Words
- 3 Tension Words
- 2 Panic Words
- 1 Boss Word

Total: 10 rounds. Boss always Round 10.

This rhythm is emotional architecture, not a hardcoded implementation yet.

## One Pivot Rule

Every word should contain at least one meaning that forces reinterpretation.

At least one meaning should cause:

"Wait..."

then:

"Right."

If a word cannot create a meaningful reinterpretation moment, it is a weak POLYWORDS candidate.

## Discovery Density Rule

A Hunt should avoid long stretches of obvious meanings.

A Hunt should contain:

- Several moderate discoveries.
- Multiple strong discoveries.
- At least one memorable discovery.

## Escalation Rule

Difficulty should rise through judgment complexity, not trickery.

Good escalation:

- More masks.
- Stronger pivots.
- Better traps.
- Greater pressure.

Bad escalation:

- Obscure trivia.
- Unfair meanings.
- Random associations.
- Dictionary abuse.

## Trap Rule

A trap should feel guilty, not random.

Close enough to hesitate. Wrong enough to reject.

## Hidden Meaning Rule

Hidden meanings are rewards.

They should feel surprising, rare, and fair. They should never feel like punishment or trivia abuse.

## Ghost Rule

Ghosts create unfinished business.

Ghosts are promises, not punishment.

Player feeling target:

"I want another shot."

not:

"The game cheated me."

## Mastery Rule

The player does not merely collect points.

The player collects words.

The Vault is more important than score.

A mastered word should feel rescued/reclaimed, not merely completed.

## Anti-Repetition Rule

No two Hunts should feel identical.

Variation should come from:

- Different meaning families.
- Different trap styles.
- Different pivots.
- Different hidden discoveries.
- Different haunt encounters.

## Snap Ladder Rule

A good word should usually ladder from recognition into surprise:

1. Obvious or familiar meaning.
2. Nearby second meaning.
3. Pivot meaning.
4. Hidden or rare meaning.

## Trap Style Rotation

Future content systems should rotate trap styles:

- Neighbor trap.
- Scene trap.
- Tool trap.
- Result trap.
- Phrase trap.
- Sound/confusion trap.
- Almost-synonym trap.

## Future Content Metadata

Do not implement this yet, but future word/content rows should support metadata such as:

- phase
- snapStrength
- trapSharpness
- hiddenFairness
- familiarity
- wordComplexity
- bossEligible
- tutorialEligible
- pollyTauntPotential
- recommendedPhase

Recommended phase meanings:

- `confidence`: high familiarity, low trap sharpness.
- `flow`: medium snap, fair traps.
- `tension`: stronger pivots, sharper traps.
- `panic`: high trap sharpness and higher pressure.
- `boss`: high snap, high reward, fair hidden meaning, strong Polly taunt potential.

## Practical Arc Generator Profile

The first Arc Generator implementation should be driven by manually authored word profiles,
not inferred from mask copy.

```ts
type ArcPhase =
  | 'confidence'
  | 'flow'
  | 'tension'
  | 'panic'
  | 'boss';

type Rating = 1 | 2 | 3 | 4 | 5;

type WordArcProfile = {
  word: string;
  realMeaningCount: number;
  trapCount: number;
  snapStrength: Rating;
  trapSharpness: Rating;
  hiddenFairness: Rating;
  familiarity: Rating;
  wordComplexity: Rating;
  bossEligible: boolean;
  tutorialEligible: boolean;
  pollyTauntPotential: Rating;
  recommendedPhase: ArcPhase;
};
```

`realMeaningCount` and `trapCount` describe the audited content pool for a word. The remaining
fields are human-authored editorial judgments. The generator must not guess these ratings from
phrase length, mask IDs, or other superficial properties.

## Practical Phase Eligibility

### Confidence

- `realMeaningCount`: 2–3
- `trapSharpness`: 1–2
- `familiarity`: 4–5
- `snapStrength`: 1–3

### Flow

- `realMeaningCount`: 2–4
- `trapSharpness`: 2–3
- `familiarity`: 3–5
- `snapStrength`: 2–3

### Tension

- `realMeaningCount`: 3–4
- `trapSharpness`: 3–4
- `familiarity`: 2–4
- `snapStrength`: 3–4

### Panic

- `realMeaningCount`: 3–5
- `trapSharpness`: 4–5
- `familiarity`: 2–4
- `snapStrength`: 3–5

### Boss

- `realMeaningCount`: 4+
- `trapSharpness`: 4–5
- `snapStrength`: 4–5
- `hiddenFairness`: 3–5
- `pollyTauntPotential`: 4–5
- `bossEligible`: true

`recommendedPhase` is the editorial placement recommendation. The numeric ranges are validation
guardrails, not permission for the generator to silently retag a word.

## Default Arc Generator Output

```ts
const DEFAULT_GPS_ARC = [
  'confidence',
  'confidence',
  'flow',
  'flow',
  'tension',
  'tension',
  'tension',
  'panic', // returning haunt slot if available
  'panic',
  'boss',
] as const;
```

Round 8 / index 7 is reserved for a returning haunt when one exists. Without a returning haunt,
that slot uses a normal panic-phase word. Round 10 / index 9 remains the boss.

## Initial Manual-Test Tile Budgets

Use the following values when building the first manually tagged test set and curated Hunt:

| Phase | Visible real masks | Visible traps | Visible total |
| --- | ---: | ---: | ---: |
| Confidence | 2 | 3 | 5 |
| Flow | 3 | 3 | 6 |
| Tension | 3 | 4 | 7 |
| Panic | 4 | 4 | 8 |
| Boss | 4 | 6 | 10 |

These counts apply per selected word and round, not per meaning. Each visible real mask must
represent one distinct selected meaning. Alternate real masks for those meanings remain in the
content bank for future replays; they do not increase the visible real count for the round.

For the initial curated test, a returning haunt in Round 8 uses the Panic budget. The boss
mystery tile sits outside the Boss visible total, so a boss round presents 10 ordinary visible
tiles before the separate mystery tile.

These are initial playtest values, not production balancing guarantees. Validate the emotional
curve, round duration, trap fairness, and replay quality with the manually tagged set before
automating mask subset selection. Do not derive replacement budgets from current database
averages; the current data has not been approved as the balancing source of truth.

`wordToTileTextRatio = 2.65` is a visual/UI sizing rule. It is not an Arc Generator selection or
content ratio.

## Future Meaning and Tile Banks

Arc Generator content should be organized as a reusable bank:

```text
word
└── meaning
    ├── realMasks[]
    └── traps[]
```

Each meaning is one genuine semantic direction. Its `realMasks[]` are alternate masked
expressions of that same truth, not additional meanings. Its `traps[]` are fair false options
linked to that meaning direction.

### Real Mask Bank Rules

- Each meaning should support at least 2 real masks where content quality permits.
- Alternate real masks exist to make replays feel fresh without changing the underlying truth.
- A generated round should normally select no more than 1 real mask from the same meaning.
- Multiple real masks for one meaning must never be counted as multiple meanings in
  `realMeaningCount`.
- A hidden meaning must remain outside the visible real-mask selection for that round.
- If a second real mask is weaker, vaguer, or less fair than the first, do not bank it merely
  to satisfy the preferred count.

### Trap Bank Rules

- Each meaning should support an expanded pool of traps across different trap styles.
- Traps should be linked to the meaning direction they bait.
- The content bank may contain more traps than one round will display.
- A generated round selects only a phase-appropriate trap subset.
- Do not select duplicate trap directions merely to fill a tile budget.
- Every chosen trap must remain close enough to tempt and wrong enough to reject.

### Phase-Appropriate Subset Selection

The generator should select a subset from the full meaning and tile banks rather than replaying
every stored tile or always choosing the same tiles.

Selection must respect, in order:

1. truth correctness and Hidden Truth Rule safety;
2. phase eligibility and the active tile budget;
3. required meaning-family and trap-style coverage;
4. fairness and post-reveal clarity;
5. replay freshness.

Freshness is a tie-breaker after correctness, phase fit, and fairness. The generator must never
choose a worse, vaguer, misleading, or unfair tile merely because it has been shown less often.

### Replay Tile Cycling

When multiple equally valid tiles are eligible, replay selection should:

1. prefer never-shown tiles;
2. then prefer least-seen tiles;
3. then prefer tiles not shown in the most recent Hunt;
4. randomize only among otherwise equal candidates.

Stable word, meaning, and tile IDs are required so usage can be tracked without treating
rewritten copy as a new semantic direction.

### Future Tile Metadata

Static editorial metadata should support:

- `difficulty`;
- `snapStrength`;
- `trapSharpness`;
- `familiarity`;
- `hiddenFairness`;
- `phaseFit`;
- meaning-family identity;
- trap style and baited meaning;
- stable tile identity.

Dynamic per-player usage tracking should support:

- times shown;
- last shown time;
- last Hunt shown;
- times judged correctly or incorrectly.

Editorial quality ratings belong in content data. Player-specific usage history belongs in
runtime persistence and must not be written back into the shared content bank.

These are future Arc Generator rules. Do not implement the bank schema, usage persistence, or
automated cycling until the manually tagged test set and curated Hunt have been approved.

## Boss Word Definition

A Boss Word should ideally have:

- At least 4 real meanings, or enough strong meanings to support a full confrontation.
- At least 1 strong Semantic Snap.
- At least 1 rare but fair hidden meaning.
- Traps that are close but not cheap.
- Strong Polly taunt potential.
- Good visual/animation payoff.

## Implementation Warning

Do not hardcode the full Golden Pacing System until a small manually tagged test set exists.

Future order:

1. Add docs.
2. Define metadata schema.
3. Manually tag 20–30 test words.
4. Build one curated 10-round Hunt.
5. Playtest the curve.
6. Only then automate Hunt generation.
