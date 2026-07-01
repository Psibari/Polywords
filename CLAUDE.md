# POLYWORDS — CLAUDE.md

### Ground truth for Claude Code · Updated June 30, 2026

---

## The Game

POLYWORDS is a mobile word puzzle game about polysemous words. Polly is the Master of Words. She holds every word in her vault and set every trap. The player challenges her one word at a time to take the title.

Every run is a **HUNT**: 10 rounds, a designed difficulty arc, and a boss confrontation at Round 10.

North star: *"Wait… what? … Oh. Right."* — the Semantic Snap.

App shell: Home is the arcade lobby. Play is the arena. Word Vault is the player's reclaimed meaning archive. Settings holds player/account/preferences/about. Profile lives inside Settings for MVP. Bottom nav shows outside active gameplay only: Home / Play / Vault / Settings.

---

## Active Branch

Current work branch: `play-screen-overhaul`

Latest clean checkpoint:

* Commit: `c4a6c31`
* Tag: `v0.working-20260630b`
* Feel: Ghost Haunt Return Loop V1 with Results copy cleanup

Checkpoint commits:

* Ghost loop: `badc9f0` / `v0.working-20260630a`
* Copy cleanup: `c4a6c31` / `v0.working-20260630b`

Rules:

* `play-screen-overhaul` is active source of truth.
* `main` is stale/stable only until overhaul is merged.
* Do not merge to `main` during feature work.
* Do not pull stale systems from `main` unless explicitly approved.

---

## Tech Stack

```text
Runtime:    Expo SDK managed workflow
Language:   TypeScript strict
Framework:  React Native
State:      Zustand + immer
Animation:  React Native Animated API
SVG:        react-native-svg 15.12.1 for custom vector UI objects
Haptics:    Expo Haptics
Audio:      expo-audio
Navigation: Expo Router
Fonts:      Bungee Shade, BebasNeue-Regular, Barlow Condensed Bold, Lilita One
Dev:        Windows, VS Code, forward-slash paths, Expo Go via QR
```

### Animation rules

* `useNativeDriver: true` → transform and opacity only
* `useNativeDriver: false` → height, margin, backgroundColor only
* Never mix drivers on the same Animated.Value
* Use `setTimeout` between animation phases, not `.start()` callbacks
* Reanimated is locked to `SwipeMask.tsx` only
* Do not import Reanimated anywhere else
* `babel.config.js` frozen: presets only, no plugins

---

## Palette

| Token       | Hex       | Use                                      |
| ----------- | --------- | ---------------------------------------- |
| Background  | `#1A1830` | Every screen                             |
| Gold        | `#F5C842` | Score, boss word, reward, mastery, trims |
| Purple      | `#7B2D8B` | Trap shards, ghost border, Polly accent  |
| Rose        | `#9B2D6B` | Crystal shard gradient partner           |
| Polly Green | `#4CAF50` | Polly mascot only                        |
| Deep Dark   | `#0F0D2A` | Hero surfaces, tiles, Vault surfaces     |
| Wrong Flash | `#CC2200` | Wrong-swipe flash only                   |
| White       | `#FFFFFF` | UI text                                  |

Strict rules:

* Max 2 gold focus elements on screen.
* Polly Green is Polly only, never UI chrome.
* Wrong Flash red is never decoration and never text.

---

## Swipe Grammar

| Gesture     | Meaning         | Result                              |
| ----------- | --------------- | ----------------------------------- |
| UP          | Real meaning    | Claim / absorb into hero word       |
| RIGHT       | Trap            | Reject / purple-rose shatter        |
| Wrong UP    | Claimed a trap  | Feather lost, tile exits, red flash |
| Wrong RIGHT | Rejected a real | Feather lost, tile exits, red flash |

Locked:

* UP = real
* RIGHT = trap
* Swipe only
* No tap interaction
* No left swipe
* Wrong swipes are permanent
* No snap-back, retry, or wrong tile staying in deck
* No correctness hints before swipe release

---

## Session Model: The Hunt

Always:

* 10 rounds
* 5 feathers for the whole hunt
* Round 10 / index 9 = POLLY'S WORD / `bossWord`
* Returning Haunt slot = index 7 / Round 8
* Returning Haunt never replaces Round 10 boss
* Returning Haunt stays `eventType: 'standard'` with `isHauntReturn: true`
* Round 8 Haunt Return never activates the boss background or boss-only effects
* Only boss words can become HAUNTED
* Normal word failures never enter the ghost queue

GPS arc:

```text
2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss
```

| Position | Phase      | Difficulty  |
| -------- | ---------- | ----------- |
| 1–2      | Confidence | Easy        |
| 3–4      | Flow       | Medium      |
| 5–7      | Tension    | Medium-Hard |
| 8–9      | Panic      | Hard        |
| 10       | Boss       | Maximum     |

Generation:

* `generateHunt()` in `app/game/huntGenerator.ts`
* Samples from `assets/data/huntData.json`
* Mastered words graduate to Vault and never return in standard Hunt
* Ghost words get priority placement at index 7
* RUN IT BACK = fresh 10-round draw with ghost priority
* Daily Challenge is separate curated/fixed mode

---

## Boss Word: Polly's Word

Player-facing name: **Polly's Word**

Internal names still use `bossWord` / `eventType: 'bossWord'`. Do not rename without a dedicated migration.

Boss rules:

* Boss is Round 10 only
* MASTERED is boss-only
* GHOST is boss-only
* Non-boss words advance via `triggerWordExit()` / `completeWord()`
* Boss mystery tile is randomly real hidden meaning or hidden trap
* Boss mystery is one shot

Current boss-round presentation:

* Round 10 uses the boss-only final chamber background.
* A dev-only `BOSS` shortcut jumps to the real index 9 `bossWord` step.
* Boss word intro is clean and stable before the first tile.
* Duplicate text, shake, sweep, underline, and shockwave/ring clutter are removed from the boss intro.
* The long-word fit experiment was reverted and is not active.

Master Gate is removed. On perfect boss visible clear:

```text
Polly fires → heavy haptic → 600ms pause → mystery tile drops into active tile position
```

No gate, no door split, no lock.

Boss outcomes:

* Correct mystery judgment = MASTERED
* Wrong mystery judgment = HAUNTED and queued once
* Boss failure before the mystery tile also becomes HAUNTED and queues once
* Repeated failure updates the existing ghost instead of duplicating it

Haunt return:

* Ghosted boss words return at index 7 / Round 8
* Return remains `eventType: 'standard'` and does not trigger boss presentation
* Cleared return = BANISHED / HAUNT BROKEN and removed from the queue
* Failed return = STILL HAUNTED, retained, and rotated in the queue
* Ghost tile never reveals missed phrase
* Ghost `wordId` = word string, never stepIndex
* Results copy describes ordinary misses as missed meanings; haunt/rematch language is reserved for real haunt results
* Daily Challenge remains separate

---

## Active Work: Hunt HeroBook V5

### Current state

* `react-native-svg@15.12.1` installed and committed.
* SVG HeroBook exists at `app/components/ui/HeroBook.tsx`.
* `MaskBoard.tsx` uses HeroBook and passes the animated hero word subtree as children.
* Current SVG direction is correct.
* Current issue: proportions still read too rectangular/banner-like.
* Next patch should touch only `app/components/ui/HeroBook.tsx`.

Do not pop stash:

```text
wip failed View-based Hunt hero book V5
```

That stash contains failed View-based book work. Do not pop, drop, clear, or reuse as active code.

### HeroBook V5 system

HeroBook must read as a full thick book, not a plaque.

Source geometry:

* Purple = full book cover
* Gold = trim, bevel, hero word glow, magic accents
* Off-white/parchment = pages only
* Right side = visible page side plane
* Bottom side = visible bottom page plane
* Full object = one connected book

Required read:

* Chunky purple-gold word-book
* Bigger/heavier than the active tile
* Full cover face, not a flat rectangle sign
* Longer left/right cover sides
* Visible layered pages under the cover
* Visible right page plane
* Top hinge/spine cue
* Opens from top using `rotateX`
* Correct tile slides in like a missing page returning
* Tile vanishes only after entering
* Cover snaps shut after absorption

Forbidden HeroBook looks:

* plaque
* flat rectangle
* signboard
* drawer
* tray
* shelf
* notebook
* file cabinet
* black bar
* giant cream slab
* solid page block
* View-rectangle book anatomy

HeroBook owns:

* SVG cover geometry
* page planes
* page lines
* gold trims
* spine/hinge visual
* intake seam
* book visual styling

MaskBoard owns:

* gameplay
* hero word content
* animation values/state
* tile intake paths
* scoring/lives/results flow

Next patch:

```text
Fix only app/components/ui/HeroBook.tsx.
Adjust SVG proportions so the book stops reading like a rectangle/banner.
Make cover sides longer, cover more book-like, pages connected, and full-book shape stronger.
Do not touch MaskBoard unless a compile error requires an import/type fix.
```

---

## Play Screen Visual System

Token source:

* `app/ui/pwTheme.ts`
* `app/ui/pwMaterials.ts`
* `app/ui/pwEffects.ts`

HeroBook:

* SVG/vector book in `app/components/ui/HeroBook.tsx`
* Replaces old View-based hero plaque/book anatomy
* Must follow HeroBook V5 above

Tile card:

* `SwipeMask.tsx`
* Landscape playing card
* Swipe physics frozen
* Reanimated allowed here only
* Press-hold rim and swipe logic stay local to SwipeMask

Deck stack:

* Rendered in `MaskBoard.tsx`
* Uses tokenized deck/card material
* Active card owns attention

Locked play-screen grammar:

* Center = active card/deck gameplay
* Up lane = claim toward HeroBook
* Right side = reject lane
* Left side = Polly perch/heckle zone
* Direction cues are help only, never correctness feedback

Design locks:

* HeroBook spine is TOP (hinge band). Pages open from BOTTOM to accept tile. Never add left spine band.
* HeroBook cover is flat rectangle geometry — no parallelogram skew. Tile and book share same geometry language.
* Page block colors: dark aged parchment (#A8A090 range). Never near-white cream.
* HUD is a single flat strip (no pill chips). Score left, multiplier center (hidden at ×1.0), feathers right, gold fill bar below.
* "POLLY'S VAULT" label lives on the hinge band — always visible, slides in with book.
* Swipe cues fade permanently at stepIndex >= 3.
* Two-zone background overlay: LinearGradient rgba(6,4,22,0.90) top → rgba(8,5,24,0.36) bottom. Never flat overlay.
* Tile width: SwipeMask cardWidth = screenWidth-80 max 290. backingCardWidth in MaskBoard = containerWidth-80 max 290. Always keep in sync.
* HUD bottom hairline: borderBottomColor rgba(245,200,66,0.22), borderBottomWidth 0.5.
* Score numeral letterSpacing: 2.
* Polly Rig device sizing uses one shared 210px outer canvas with a 1.45 inner scale to compensate for transparent source padding, placed at left 4px / bottom 16px. Both `SHOW_POLLY_DEVICE_TEST` and `SHOW_POLLY_RIG_TEST` are false, so Polly remains hidden on GameScreen; legacy MaskBoard Polly visuals remain disabled.

---

## Feedback / SFX

Current SFX:

* `tile_swipe.mp3`
* `press_hold_start.mp3`
* `trap_shatter`
* `trap_wrong`
* `mastered`
* `haunted`
* `ui_click`
* `polly_call`

`gate_open.mp3` is orphaned because Master Gate was removed. Cleanup candidate only.

Recent completed feel patches:

* Reliable SFX playback and correct-claim vault-lock sound
* Wrong-swipe error haptic in the trinity path
* Multiplier pulse on chain increase
* Score floats fixed as compact readable badge stamps

Score-float behavior:

* Correct REAL UP shows a compact readable gold `+points` badge.
* Correct TRAP RIGHT shows a compact readable rose `+points` badge.
* Wrong swipes show no score badge.
* Badge V2 values: `minWidth: 64`, padding `11 × 5`, radius `10`, dark `rgba(15,13,42,0.92)` backing, `1px` matching border, font size `26`, duration `940ms`, and a tight black text shadow.
* Fixed cause: the REAL badge used `left: 0` plus `right: 0`, stretching its background into a wide bar.

Future system need:

* Shards, red buzz, audio, intake, and overlays should eventually be centralized into a Feedback Event System.
* Do not mix that work into HeroBook patches.

---

## Polly

Polly is the antagonist, not a mascot. Every trap is her move. The boss word is hers. When a word is mastered, it leaves Polly's vault.

Sprites:

* Canonical runtime assets: `assets/images/polly/*.webp`
* Component: `app/components/ui/PollySprite.tsx`
* Animator: `app/hooks/usePollyAnimator.ts`
* Gameplay size: `POLLY_GAMEPLAY_SIZE = 210`

Temporary compatibility pose map:

* Flying poses â†’ `polly_fly_in.webp`
* Neutral/smug poses â†’ `polly_idle.webp`
* Dismissive/sulking poses â†’ `polly_sulk.webp`
* Laughing poses â†’ `polly_laugh.webp`
* Pointing poses â†’ `polly_taunt_point.webp`
* Shocked/boss poses â†’ `polly_boss_warning.webp`

Behavior:

* Fly-up entrances, not pop-ins
* Mid-round: fly in from bottom-left, perch left, speak, exit left
* End-round: same
* Right side is reserved for reject lane
* One mid-round pop-in budget per word
* End-of-round always fires

Trigger map:

* Trap correctly rejected → `perchDismissive`
* Wrong swipe → `perchSmug`, "Thought so."
* Haunt/run clipped → `perchLaughing`
* Player masters word → `perchSulking`
* Player beats Polly → `flyAngry`
* Boss throw → `perchPointing`
* Perfect clear → `perchShocked`

Locked lines:

* "Thought so."
* "BINGO BANGO ZZZZINGO!"
* "BBBLAAAAHHAHAHA!"
* "YOU BEAT POLLY"
* "POLLY HUNT COMPLETE"
* "POLLY CLIPPED YOUR RUN."

`docs/POLLY_DIALOGUE_BANK.md` is dialogue source of truth.

---

## Word Vault

Player-owned reclaimed meaning archive. Not Polly's cage.

Sections:

* Mastered Words
* Ghost Words
* Hidden Meanings
* Ranks

`VaultScreen.tsx` reads real persisted progress from `useGameStore`.

Use archive/collection language. No cage/prison language. No Polly presence.

---

## Scoring

| Action               | Points                       |
| -------------------- | ---------------------------- |
| Correct real UP      | 100 × chainMultiplier        |
| Correct rare real UP | 300 × chainMultiplier        |
| Correct trap RIGHT   | 50 × chainMultiplier         |
| Boss correct real    | 200 × chainMultiplier        |
| Boss correct trap    | 100 × chainMultiplier        |
| Boss mystery correct | 600 × chainMultiplier        |
| Wrong swipe          | 0, feather lost, combo reset |

Chain multiplier:

* Starts 1.0
* +0.5 every 3 consecutive correct
* Caps 3.0
* Resets on wrong

Polly target: 15,000 pts

Ranks:

```text
D < 8k
C 8k
B 11k
A 14k
S 18k
MASTER 22k
```

Feather milestones:

* 8,000 restores 1 feather
* 16,000 restores 1 feather
* max 1 reserve
* lives can reach 6

Locked result lines:

* Score ≥ 15,000: "YOU BEAT POLLY"
* Results header: "POLLY HUNT COMPLETE"
* Zero feathers: "POLLY CLIPPED YOUR RUN."

Dead/removed:

* `revealHidden()`
* `hiddenFound` in WordResult
* `pollyTrigger 'hiddenReveal'`
* `addBonusScore(300)` in boss mastery

---

## Feathers

* 5 feathers per Hunt
* Wrong swipe plucks 1
* 0 feathers ends run
* Milestones restore 1 at 8,000 / 16,000
* Store/engine state still named `lives`; do not rename without migration

Gold Feather:

* Earned on Daily win
* Expires midnight
* Used on Hunt game-over to restore 1 life
* Engine: `applyGoldFeather()`
* Store: `useGoldFeatherInHunt()`

---

## Daily Challenge

Daily Challenge is separate from standard Hunt.

Current daily status:

* DailyAnswerCard control system committed
* Daily result reward visuals fixed
* Daily entrance animations restored
* Hunt Gold Feather revive quarantined
* Hunt wrong-swipe result tracking fixed

Do not touch Daily files during Hunt HeroBook work.

Daily source docs:

* `docs/DAILY_CHALLENGE_SPEC.md`

---

## Content Rules

Content standard:

```text
meaning hidden, not meaning lost
```

Tile goal:

```text
Wait… what? → Oh. Right.
```

Rules:

* Scene-language, never dictionary voice
* Register parity across real/trap tiles
* 5–6 words acceptable
* Hidden tiles cut from pipeline entirely
* 1 real per meaning
* 2–3 traps per meaning
* hard cap 8 traps per word
* No headword or derived forms in any tile
* No trap-to-trap duplicate words
* Trap sharing vocabulary with real is allowed
* No trap may share a meaning direction with another trap on same word

Data:

* `assets/data/huntData.json`
* 403 words
* QA-clean
* ALL CAPS normalized
* Loaded via `require()` at import

Content tool:

* `tools/content/mask-rewriter`
* Local-only
* Never wire into app

---

## Cut List

Permanent cuts:

* left swipe
* tap interactions
* snap-back wrong swipes
* two-tile hidden gate split
* Master Gate
* ghost/mastery for non-boss words
* Reanimated outside SwipeMask
* rectangle/square particles
* red text/decor
* Polly Green UI chrome
* > 2 gold focus elements
* hiddenEmoji / hiddenTrapEmoji
* revealHidden()
* hiddenFound in WordResult
* pollyTrigger hiddenReveal
* HIDDEN tile type
* sprite-sheet Polly
* visual tells before swipe
* dashed borders
* pink/magenta

---

## Locked Decisions

* Standard Hunt = 10 rounds
* Round 10 = Polly's Word / boss word
* Returning Haunt slot = Round 8 / index 7
* Default GPS arc = 2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss
* UP = real
* RIGHT = trap
* Wrong swipe is permanent
* No left swipe
* No tap interaction
* No correctness hints before swipe release
* Mastered words graduate permanently
* RUN IT BACK = fresh draw with ghost priority
* Master Gate removed
* MASTERED and GHOST are boss-only
* Boss mystery tile is randomly real or trap
* Non-boss words advance with no overlay
* Ghost wordId = word string
* `wrongSwipeOccurred.current` resets on every new word
* Crystal shards are polygon, purple/rose, never rectangles
* Diagonal MASTER stamp over crashed word
* Ghost tile never reveals missed phrase
* "Thought so." never changes
* "BINGO BANGO ZZZZINGO!" never changes
* ZZZZINGO is game/system text, never Polly dialogue
* Boss mastery uses `submitBossMastery()`, never `addBonusScore()`
* Boss player-facing name = Polly's Word
* Internal `bossWord` flags stay as-is for now
* Live Content Engine is post-launch only

---

## Claude Code Workflow

Use `docs/WORKFLOW.md`.

Hard rules:

* One prompt, one concern
* Surgical patches only
* Read relevant file fully before editing
* Confirm exact paths before patching
* `MaskBoard.tsx` and `SwipeMask.tsx` are warroom-gated
* Visual work must use approved UI system/map before code
* Codex does not invent style
* Do not build HeroBook anatomy from React Native `View` rectangles
* Do not pop/drop/clear stashes unless explicitly instructed by name
* Preserve stash: `wip haunt loop type scaffolding`
* Preserve stash: `wip failed View-based Hunt hero book V5`

After every patch:

```text
npx.cmd tsc --noEmit
git diff --check
git status --short
```

Device screenshot required before visual commits.

Known-good states may be tagged after device confirmation:

```text
git tag v0.working-YYYYMMDD
```

---

## Key Files

```text
app/components/MaskBoard.tsx              Main game board, warroom-gated
app/components/SwipeMask.tsx              Tile + swipe physics, frozen Reanimated area
app/components/ui/HeroBook.tsx            SVG HeroBook V5 visual system
app/components/ui/PollySprite.tsx         Polly compatibility pose component
app/components/PollyActor.tsx             Polly renderer shell and rig route
app/components/PollyRig.tsx               Layered idle rig scaffold
app/components/PollyDailyPerch.tsx        Daily Polly perch
app/hooks/usePollyAnimator.ts             Polly fly-up arc system

app/animations/pollyRigParts.ts           Rig part requires and stack order

app/ui/pwTheme.ts                         Visual tokens
app/ui/pwMaterials.ts                     Material recipes
app/ui/pwEffects.ts                       FX helpers
app/ui/heroBookMotion.ts                  Legacy/partial helper, do not expand without approval

app/game/huntGenerator.ts                 GPS arc sampling, ghost priority
app/game/polyRunEngine.ts                 Game state engine
app/game/types.ts                         TypeScript types
app/store/useGameStore.ts                 Zustand store

app/screens/GameScreen.tsx                Play HUD + background
app/screens/HomeScreen.tsx                Arcade lobby
app/screens/VaultScreen.tsx               Player archive + ranks
app/screens/ResultsScreen.tsx             End-of-run results
app/screens/DailyChallengeScreen.tsx      Daily Challenge

app/game/dailyChallengeEngine.ts          Daily session builder
app/game/dailyPool.ts                     Daily word pool

assets/data/huntData.json                 403-word tile database
assets/images/polly/*.webp                 Canonical Polly runtime poses
assets/sfx/                               Game SFX

docs/WORKFLOW.md                          Patch workflow source of truth
docs/GOLDEN_PACING_SYSTEM.md              GPS source of truth
docs/DAILY_CHALLENGE_SPEC.md              Daily spec
docs/POLLY_DIALOGUE_BANK.md               Polly dialogue source of truth

tools/content/mask-rewriter               Local-only content tool
```

---

## Key Learnings — Architecture

* StreakDisplay shows chainMultiplier (×1.5 format), not raw streak count. Hides at 1.0.
* Progress is a gold fill bar (Animated width), not dots. useNativeDriver: false for width animation.
* onNearTarget callback on SwipeMask fires at closed > 0.45, triggers triggerBookOpen() in MaskBoard. Book opens when tile arrives, not on swipe.
* intakeY = wordScreenY + 73 for coverHeight 162.
* gridWrap paddingTop must account for book overflow: (bookHeight - wordZoneHeight) + desired visual gap. Current: (210-172) + 50 = 88.

---

*POLYWORDS CLAUDE.md · Pete DiBari · June 30, 2026*
