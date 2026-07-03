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

## Tile Budget Is Not Yet Locked

The Arc profile selects and validates words. It does not yet define how many masks from a word's
full content pool appear in one round.

Before implementing mask subset selection, the manually tagged test set must establish:

- total visible tiles per phase;
- visible real meanings per phase;
- visible traps per phase;
- whether every selected real meaning needs a linked trap direction;
- how meaning families and trap styles are represented without repetition;
- whether a returning haunt keeps its original tile budget or uses the current panic budget;
- how the boss mystery tile sits outside the visible-tile budget.

Do not derive these budgets from the current database averages. The current data has not been
approved as the balancing source of truth.

`wordToTileTextRatio = 2.65` is a visual/UI sizing rule. It is not an Arc Generator selection or
content ratio.

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
