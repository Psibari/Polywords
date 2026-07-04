# POLYWORDS — CLAUDE.md

### Ground truth for Claude Code · Lean guardrails · Updated 2026-07-04

POLYWORDS: a mobile word-puzzle game about polysemous words. Polly (antagonist, Master of
Words) sets every trap; the player challenges her one word at a time. North star: the
Semantic Snap — *"Wait… what? … Oh. Right."*

**Detailed reference is offloaded — read the relevant doc before working in that area:**

| Area | Doc |
| --- | --- |
| Hunt / boss / scoring / feathers / content / vault / SFX / Polly-Hunt / MaskBoard learnings | `docs/GAME_REFERENCE.md` |
| GPS pacing | `docs/GOLDEN_PACING_SYSTEM.md` |
| Meaning / REAL mask / trap writing and approval | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily Challenge | `docs/DAILY_CHALLENGE_SPEC.md` |
| Polly dialogue | `docs/POLLY_DIALOGUE_BANK.md` |
| Patch workflow | `docs/WORKFLOW.md` |
| Recent Polly/play-screen specs | `docs/superpowers/specs\|plans/2026-07-*` |

---

## Active Branch

Branch `play-screen-overhaul` = source of truth. Latest device-confirmed tag:
`v0.working-20260702-polly`. `main` is stale/stable; do not merge to it or pull stale systems
from it during feature work without explicit approval.

**Current work (shipped):** Play-screen overhaul (HeroBook / HUD / deck / stage), Daily
Challenge overhaul into Polly's chamber, and Daily Polly on clean transparent pose images
(`assets/images/polly/poses/*.png`; bottom-left, faces right, branch rooted off-screen, fly-in
entrance, perched continuously, reaction pose-swaps + whole-image punch + laugh SFX). The
13-part `PollyRig` is shelved for future layered art. See `docs/GAME_REFERENCE.md` + memory.

---

## Tech Stack

```text
Runtime Expo SDK managed · TS strict · React Native · Zustand+immer
Animation React Native Animated API · SVG react-native-svg 15.12.1
Haptics Expo Haptics · Audio expo-audio · Nav Expo Router
Fonts Bungee Shade, BebasNeue-Regular, Barlow Condensed Bold, Lilita One
Dev Windows, VS Code, forward-slash paths, Expo Go via QR
```

### Animation rules (load-bearing)

- `useNativeDriver: true` → transform + opacity only.
- `useNativeDriver: false` → height, margin, backgroundColor only.
- Never mix drivers on the same `Animated.Value`.
- Use `setTimeout` between animation phases, not `.start()` callbacks.
- Reanimated is locked to `SwipeMask.tsx` only — do not import it anywhere else.
- `babel.config.js` frozen: presets only, no plugins.

---

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| Background | `#1A1830` | Every screen |
| Gold | `#F5C842` | Score, boss word, reward, mastery, trims |
| Purple | `#7B2D8B` | Trap shards, ghost border, Polly accent |
| Rose | `#9B2D6B` | Crystal shard gradient partner |
| Polly Green | `#4CAF50` | Polly, and brand/UI where she's clearly present |
| Deep Dark | `#0F0D2A` | Hero surfaces, tiles, Vault surfaces |
| Wrong Flash | `#CC2200` | Wrong-swipe flash only |
| White | `#FFFFFF` | UI text |

- Max 2 gold focus elements on screen. Wrong Flash red is never decoration and never text.
- (2026-07-04) "Polly Green is Polly only, never UI chrome" is repealed — it was an early-day
  callout, not a real constraint. She keeps her natural green everywhere, including brand marks
  (icon-mark) and in-game UI where it fits.

---

## Swipe Grammar

UP = real (claim/absorb into hero word). RIGHT = trap (reject / purple-rose shatter). Wrong UP
(claimed a trap) or Wrong RIGHT (rejected a real) = feather lost, tile exits, red flash.

Locked: UP=real, RIGHT=trap, swipe-only, no tap, no left swipe, wrong swipes permanent, no
snap-back/retry/wrong-tile-staying, no correctness hints before swipe release.

---

## Play Screen Design Locks

Token source: `app/ui/pwTheme.ts`, `pwMaterials.ts`, `pwEffects.ts`. Grammar: center =
active card/deck; up lane = claim toward HeroBook; right = reject lane; left = Polly
perch/heckle zone; direction cues are help only, never correctness feedback.

- HeroBook spine is TOP (hinge band), cover-family purple + gold tooling; pages open from
  BOTTOM to accept the tile; never add a left spine band.
- HeroBook cover is a rounded rectangle (corners match the tile card) — no parallelogram skew.
- Page block colors: dark aged parchment (~`#A8A090`), never near-white cream.
- HUD is a single flat strip (no pill chips): score left (42px), multiplier center (hidden at
  ×1.0), feathers right (18×34), gold fill bar below; bottom hairline
  `rgba(245,200,66,0.22)` 0.5px; score numeral letterSpacing 2.
- "POLLY'S VAULT" label lives on the hinge band, always visible, slides in with the book.
- Swipe cues fade permanently at `stepIndex >= 3`.
- Background overlay: 3-stop LinearGradient `rgba(6,4,22,0.93) → rgba(9,6,26,0.55)@0.5 → rgba(7,5,23,0.82)`. Never flat overlay.
- Tile width: SwipeMask `cardWidth = screenWidth-80 max 290`; MaskBoard `backingCardWidth = containerWidth-80 max 290` — keep in sync.
- Deck (in MaskBoard): receding purple faces, warm gold→rose rims, gold peeking edge; offset 9, ~1.3° fan.

---

## Cut List (permanent)

left swipe · tap interactions · snap-back wrong swipes · two-tile hidden gate split · Master
Gate · ghost/mastery for non-boss words · Reanimated outside SwipeMask · rectangle/square
particles · red text/decor · >2 gold focus elements · hiddenEmoji /
hiddenTrapEmoji · `revealHidden()` · `hiddenFound` in WordResult · `pollyTrigger hiddenReveal`
· HIDDEN tile type · sprite-sheet Polly · visual tells before swipe · dashed borders ·
pink/magenta.

---

## Locked Decisions

- Standard Hunt = 10 rounds; Round 10 = Polly's Word / boss word; Returning Haunt = Round 8 /
  index 7; default GPS arc = 2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss.
- UP = real; RIGHT = trap; wrong swipe permanent; no left swipe; no tap; no correctness hints
  before release.
- Mastered words graduate permanently. RUN IT BACK = fresh draw with ghost priority.
- Master Gate removed. MASTERED and GHOST are boss-only. Boss mystery tile is randomly real or
  trap. Non-boss words advance with no overlay. Ghost `wordId` = word string. Ghost tile never
  reveals the missed phrase. `wrongSwipeOccurred.current` resets on every new word.
- Crystal shards are polygons, purple/rose, never rectangles. Diagonal MASTER stamp over the
  crashed word.
- Never-change lines: "Thought so." / "BINGO BANGO ZZZZINGO!" (ZZZZINGO is system text, never
  Polly dialogue).
- Boss mastery uses `submitBossMastery()`, never `addBonusScore()`. Boss player-facing name =
  Polly's Word; internal `bossWord` flags stay as-is. Live Content Engine is post-launch only.

---

## Claude Code Workflow

Full: `docs/WORKFLOW.md`. Hard rules:

- One prompt, one concern. Surgical patches only. Read the relevant file fully before editing;
  confirm exact paths first.
- `MaskBoard.tsx` and `SwipeMask.tsx` are warroom-gated. Visual work uses the approved UI
  system/tokens before code. Never build HeroBook anatomy from RN `View` rectangles.
- Do not pop/drop/clear stashes unless instructed by name. Preserve: `wip haunt loop type
  scaffolding`, `wip failed View-based Hunt hero book V5`.
- After every patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- Device screenshot required before visual commits. Tag known-good after device confirmation:
  `git tag v0.working-YYYYMMDD`.

---

## Key Files

```text
app/components/MaskBoard.tsx           Main game board, warroom-gated
app/components/SwipeMask.tsx           Tile + swipe physics, frozen Reanimated area
app/components/ui/HeroBook.tsx         SVG HeroBook V5
app/components/PollyDailyPerch.tsx     Daily Polly (pose images) — SHIPPED
app/components/PollyActor.tsx          Polly renderer/route  ·  PollyRig.tsx  13-part rig (shelved)
app/animations/pollyPerformances.ts    Rig choreography  ·  pollyRigParts.ts  rig parts
app/hooks/usePollyAnimator.ts          Polly fly-up arc system
app/ui/pwTheme.ts · pwMaterials.ts · pwEffects.ts   Visual tokens / materials / FX
app/ui/heroBookMotion.ts               Legacy helper, do not expand without approval
app/game/huntGenerator.ts              GPS sampling, ghost priority
app/game/polyRunEngine.ts · types.ts · app/store/useGameStore.ts   Engine / types / store
app/screens/GameScreen.tsx             Play HUD + background
app/screens/HomeScreen.tsx · VaultScreen.tsx · ResultsScreen.tsx · DailyChallengeScreen.tsx
app/game/dailyChallengeEngine.ts · dailyPool.ts   Daily builder / pool
assets/data/huntData.json              403-word tile database
assets/images/polly/poses/*.png        Daily Polly poses (transparent)  ·  polly/*.webp legacy
assets/sfx/                            Game SFX
tools/content/mask-rewriter            Local-only content tool
assets/data/huntData.v2.json           Dormant approved V2 meaning bank (not gameplay-wired)
```

---

*POLYWORDS CLAUDE.md · Pete DiBari · 2026-07-04 · detail in docs/GAME_REFERENCE.md*
