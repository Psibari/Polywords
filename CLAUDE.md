# POLYWORDS - CLAUDE.md

Lean guardrails for Claude Code. Detailed behavior lives in focused docs; do not copy long
rules here.

## Read First

Authority order:

1. User request
2. `AGENTS.md`
3. Focused source doc for the area being changed
4. `CLAUDE.md`
5. `CONTEXT.md`

Focused docs:

| Area | Source |
| --- | --- |
| Hunt, scoring, Vault, SFX, Polly-Hunt | `docs/GAME_REFERENCE.md` |
| Hunt pacing / GPS | `docs/GOLDEN_PACING_SYSTEM.md` |
| Content philosophy | `docs/CONTENT_PHILOSOPHY.md` |
| REAL masks / traps / editorial rules | `docs/CONTENT_WRITING_STANDARD.md` |
| Daily Challenge | `docs/DAILY_CHALLENGE_SPEC.md` |
| Polly dialogue | `docs/POLLY_DIALOGUE_BANK.md` |
| Workflow | `docs/WORKFLOW.md` |

## Project

POLYWORDS is a mobile recognition game about polysemous words. Polly is the antagonist and
sets every trap. The player reclaims meanings one word at a time. North star: "Wait... what?
... Oh. Right."

App shell: Home / Play / Vault / Settings. Bottom nav is visible outside active gameplay only.
GameScreen stays nav-free.

Active branch: `play-screen-overhaul`. `main` is stale/stable; do not merge to it or pull
systems from it without explicit approval.

## Current Active Notes

- Play-screen overhaul is live on this branch: HeroBook, HUD strip, deck/stage shell, Polly
  Hunt visits, Daily Challenge, and Word Vault material pass.
- Word Vault uses `assets/images/vault/bookcase-dark-mobile.png` as a fixed-aspect archive
  cabinet. `Bookcase.tsx` maps mastered and haunted spines into measured shelf slots and adds
  another cabinet frame when rows overflow.
- Daily remains UP-only. Hunt `SwipeMask.tsx` remains untouched by Daily work.
- The 13-part Polly rig is shelved. Live Polly uses transparent pose images unless a future
  rig is assembled and approved in isolation.
- Polly's live character path is the transparent pose set plus `pollyCharacter.ts`, the
  versioned local `pollyMemory.ts`, `usePollyVisits`, and the shared ambient-motion/bubble
  components. Memory is bounded, deterministic, and source-authored; it never generates copy.
- Home and Results acknowledge prior Hunt outcomes, repeated Haunts sharpen Polly's pose,
  and Daily/Hunt/Results lines share one typed catalog. Reduced-motion disables ambient and
  spatial entrance motion. The old rig, flipbook, sprite, animator, and global time-budget
  files remain shelved/disconnected and must not be re-wired casually.
- Left-anchored Home/Hunt reactions use the authored right-facing smug pose; do not restore
  the left-facing `sprite6.png` on those surfaces.

## Tech

Expo SDK managed, TypeScript strict, React Native, Zustand + immer, Expo Router, Animated API,
`react-native-svg`, Expo Haptics, `expo-audio`.

Fonts: Bungee Shade, BebasNeue-Regular, Barlow Condensed Bold, Lilita One.

Music: `MusicEngine.ts` plays committed audio files. Runtime music synthesis is deleted and
must not return. Boss music keys off `eventType === 'bossWord'`, not step numbers. Expo Audio
mode is configured once through `audioSession.ts`; the round-complete player keeps that
session active, and Hunt music resumes its position across idle-static transitions.

Animation locks:

- `useNativeDriver: true`: transform and opacity only.
- `useNativeDriver: false`: layout/color values only.
- Do not mix drivers on the same `Animated.Value`.
- Reanimated is locked to `SwipeMask.tsx`.
- `babel.config.js` stays presets-only.

## Gameplay Locks

- UP = claim real meaning.
- RIGHT = reject trap.
- No left swipe.
- No tap-submit.
- No correctness hints before swipe release.
- Wrong swipes are permanent; no snap-back retry.
- Do not change scoring, swipe grammar, `SwipeMask`, or Hunt/Boss rules unless explicitly asked.
- Preserve the Hidden Truth Rule: ordinary masks cannot reveal real/trap/rare/important status
  before commitment.

Locked decisions:

- Standard Hunt has 10 rounds. Round 10 / index 9 is Polly's Word / `bossWord`.
- Returning Haunt slot is Round 8 / index 7 and never replaces the boss.
- Only boss words can become HAUNTED.
- Mastered words graduate permanently. RUN IT BACK is a fresh draw with ghost priority.
- Master Gate is removed. Do not revive gate UI or logic.
- Boss player-facing name is Polly's Word; internal `bossWord` flags stay as-is.
- Boss mastery uses `submitBossMastery()`, not bonus-score shortcuts.
- Never-change text: `Thought so.` and `BINGO BANGO ZZZZINGO!`.

## Visual Locks

Palette:

- Background `#1A1830`
- Deep dark `#0F0D2A`
- Gold `#F5C842`
- Purple `#7B2D8B`
- Rose `#9B2D6B`
- Polly Green `#4CAF50`
- Wrong Flash `#CC2200`
- White `#FFFFFF`

Rules:

- No pink/magenta.
- No orange UI.
- No green UI outside Polly character art.
- No red except wrong flash.
- Gold max 2 visible focus elements where practical.
- Crystal shards are polygons, never rectangles.
- Trophy words use the shared foil treatment.

Play screen:

- Screen hierarchy: hero word, active mask tile, HeroBook/Vault target, HUD, Polly pop-in.
- HeroBook spine is top hinge; pages open from bottom.
- HeroBook label: `POLLY'S VAULT`.
- Tile width stays synced between `SwipeMask` and `MaskBoard`.
- Direction cues are instructional only, never correctness feedback.

Vault:

- Player-owned reclaimed-meaning archive, not Polly's cage/lair.
- Use archive/collection language.
- No Polly presence on the Vault screen.

## Polly

- Polly is an opponent, not a friendly mascot.
- She is a polysemous word thief: mimic, hoarder, taunting language burglar.
- She should not sound warmly supportive.
- Keep dialogue in the smug word-thief voice and check `docs/POLLY_DIALOGUE_BANK.md`.
- `BINGO BANGO ZZZZINGO!` is system text, never Polly dialogue.

## Content

`docs/CONTENT_WRITING_STANDARD.md` is the source of truth for REAL masks, traps, tile length,
tone, roots, approval, and audit gates. Do not duplicate those rules here or in nearby docs.

Content tool: `tools/content/mask-rewriter/`

- Local/editorial only, not gameplay.
- Uses `.env`; never commit `.env`.
- Never commit generated CSVs or `dist`.
- `assets/data/huntData.v2.json` is dormant editorial data; do not wire it into gameplay
  until approved.

## Workflow

- One surgical patch at a time.
- Preserve unrelated user changes.
- After code patches: `npx.cmd tsc --noEmit`, `git diff --check`, `git status --short`.
- For docs-only patches: at minimum run `git diff --check` and `git status --short`.
- Commit/push only when explicitly asked.
- Do not pop/drop/clear stashes unless instructed by name.
- Preserve stashes named `wip hud material pass needs feather asset`,
  `wip haunt loop type scaffolding`, and `wip intake sliver not approved - needs SwipeMask handoff`.

## Key Files

```text
app/screens/GameScreen.tsx
app/screens/HomeScreen.tsx
app/screens/VaultScreen.tsx
app/screens/DailyChallengeScreen.tsx
app/components/MaskBoard.tsx
app/components/SwipeMask.tsx
app/components/ui/HeroBook.tsx
app/components/ui/Bookcase.tsx
app/components/ui/BookSpine.tsx
app/components/PollyHuntVisit.tsx
app/components/PollyDailyPerch.tsx
app/ui/pwTheme.ts
app/ui/pwMaterials.ts
app/ui/pwEffects.ts
app/game/huntGenerator.ts
app/game/polyRunEngine.ts
app/game/types.ts
app/store/useGameStore.ts
app/audio/MusicEngine.ts
app/audio/sfx.ts
assets/data/huntData.json
assets/data/huntData.v2.json
assets/images/vault/bookcase-dark-mobile.png
assets/images/polly/poses/*.png
tools/content/mask-rewriter/
```

Last trimmed: 2026-07-12.
