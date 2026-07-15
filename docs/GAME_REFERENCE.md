# POLYWORDS — Game Reference

Detailed reference offloaded from CLAUDE.md to keep the per-turn context lean.
**Read the relevant section here before working in that area.** The non-negotiable
locks still live in CLAUDE.md (Locked Decisions / Cut List / Design locks).

---

## The Game

POLYWORDS is a mobile word puzzle game about polysemous words. Polly is a trickster who
sets every trap — she never owned the words, she baits the player toward the wrong meaning
and wins when they fall for it. The player challenges her one word at a time. Every run is
a **HUNT**: 10 rounds, a designed difficulty arc, boss at Round 10. North star: *"Wait…
what? … Oh. Right."* — the Semantic Snap.

App shell: Home = arcade lobby, Play = arena, Word Vault = reclaimed-meaning archive,
Settings = player/account/preferences/about (Profile lives in Settings for MVP). Bottom nav
shows outside active gameplay only: Home / Play / Vault / Settings.

---

## Session Model: The Hunt

- 10 rounds; 5 feathers for the whole hunt.
- Round 10 / index 9 = POLLY'S WORD / `bossWord`.
- Returning Haunt slot = index 7 / Round 8; never replaces the Round 10 boss; stays
  `eventType: 'standard'` with `isHauntReturn: true`; never activates boss background/effects.
- Only boss words can become HAUNTED. Normal word failures never enter the ghost queue.

GPS arc (source of truth: `docs/GOLDEN_PACING_SYSTEM.md`): `2 Confidence + 2 Flow + 3 Tension + 2 Panic + 1 Boss`.

| Position | Phase | Difficulty |
| --- | --- | --- |
| 1–2 | Confidence | Easy |
| 3–4 | Flow | Medium |
| 5–7 | Tension | Medium-Hard |
| 8–9 | Panic | Hard |
| 10 | Boss | Maximum |

Generation: `generateHunt()` in `app/game/huntGenerator.ts`, samples `assets/data/huntData.json`.
Mastered words graduate to Vault and never return in standard Hunt. Ghost words get priority
placement at index 7. RUN IT BACK = fresh 10-round draw with ghost priority. Daily is separate.

---

## Boss Word: Polly's Word

Player-facing name **Polly's Word**; internal `bossWord` / `eventType: 'bossWord'` (do not
rename without a dedicated migration).

- Boss is Round 10 only. MASTERED and GHOST are boss-only. Non-boss words advance via
  `triggerWordExit()` / `completeWord()`.
- Boss mystery tile is randomly a real hidden meaning or a hidden trap; one shot.
- Round 10 uses the boss-only final chamber background. Dev-only `BOSS` shortcut jumps to the
  real index 9 step. Boss intro is clean/stable; duplicate text/shake/sweep/underline/
  shockwave clutter removed; long-word fit experiment reverted.
- Master Gate removed. On perfect boss visible clear: `Polly fires → heavy haptic → 600ms pause → mystery tile drops into active tile position`. No gate/door/lock.
- Outcomes: correct mystery = MASTERED; wrong mystery = HAUNTED (queued once); boss failure
  before the mystery tile also HAUNTED (queued once); repeated failure updates the existing
  ghost instead of duplicating.
- Haunt return: ghosted boss words return at index 7 / Round 8 as `eventType: 'standard'`
  (no boss presentation). Cleared = BANISHED / HAUNT BROKEN (removed from queue). Failed =
  STILL HAUNTED (retained, rotated). Ghost tile never reveals the missed phrase. Ghost
  `wordId` = word string, never stepIndex. Results copy calls ordinary misses "missed
  meanings"; haunt/rematch language reserved for real haunt results.

---

## Scoring

| Action | Points |
| --- | --- |
| Correct real UP | 100 × chainMultiplier |
| Correct rare real UP | 300 × chainMultiplier |
| Correct trap RIGHT | 50 × chainMultiplier |
| Boss correct real | 200 × chainMultiplier |
| Boss correct trap | 100 × chainMultiplier |
| Boss mystery correct | 600 × chainMultiplier |
| Wrong swipe | 0, feather lost, combo reset |

Chain multiplier: starts 1.0, +0.5 every 3 consecutive correct, caps 3.0, resets on wrong.
Polly target: 15,000 pts.

Ranks: `D <8k · C 8k · B 11k · A 14k · S 18k · MASTER 22k`.

Locked result lines: score ≥ 15,000 → "YOU BEAT POLLY"; results header "POLLY HUNT COMPLETE";
zero feathers → "POLLY CLIPPED YOUR RUN."

Dead/removed: `revealHidden()`, `hiddenFound` in WordResult, `pollyTrigger 'hiddenReveal'`,
`addBonusScore(300)` in boss mastery.

---

## Feathers

- 5 per Hunt; wrong swipe plucks 1; 0 ends the run; milestones restore 1 at 8,000 / 16,000
  (max 1 reserve, lives can reach 6). Store/engine state still named `lives` (don't rename
  without migration).
- Gold Feather: earned on Daily win, expires midnight, used on Hunt game-over to restore 1
  life. Engine `applyGoldFeather()`; store `useGoldFeatherInHunt()`.

---

## Content Rules

Standard: *"meaning hidden, not meaning lost."* Tile goal: *Wait… what? → Oh. Right.*

- Mask, trap, REAL, tile length, tone, and giveaway-root rules are governed by
  `docs/CONTENT_WRITING_STANDARD.md`. Do not duplicate or override those rules here.
- Hidden tiles cut from the ordinary visible pipeline. An active round normally selects 1 real
  mask variant per chosen meaning and no more than 8 traps for the word.
- Future Arc Generator banks may hold 2+ alternate real masks and an expanded trap pool per
  meaning. The generator selects a fair phase-appropriate subset and prefers unseen or
  least-seen tiles only after correctness, phase fit, and fairness. Full rules:
  `docs/GOLDEN_PACING_SYSTEM.md`.
- Initial Arc Generator test budgets are per selected word and round: Confidence has 2 real +
  3 traps, Flow has 3 + 3, Tension has 3 + 4, Panic has 4 + 4, and Boss has 4 + 6. Each
  selected real represents a distinct meaning. The separate boss mystery tile is outside the
  Boss total. These values are for the manually tagged test set and curated Hunt, not production
  automation.
- Data: `assets/data/huntData.json` — 403 words, QA-clean, ALL CAPS normalized, loaded via
  `require()` at import.
- Content tool `tools/content/mask-rewriter` — local-only, never wire into the app.

---

## Word Vault

Player-owned reclaimed-meaning archive (not Polly's cage). Sections: Mastered Words · Ghost
Words · Hidden Meanings · Ranks. `VaultScreen.tsx` reads persisted progress from `useGameStore`.
Use archive/collection language; no cage/prison language; no Polly presence.

---

## Feedback / SFX

Current SFX: `tile_swipe.mp3`, `press_hold_start.mp3`, `trap_shatter`, `trap_wrong`,
`mastered`, `haunted`, `ui_click`, `polly_call`. Polly laugh SFX: `pollySqwawkShort` (wrong),
`pollySqwawkLaugh` (out of lives). `gate_open.mp3` orphaned (Master Gate removed) — cleanup
candidate only.

Score-float behavior: correct REAL UP = compact gold `+points` badge; correct TRAP RIGHT =
compact rose `+points` badge; wrong swipes show no badge. Badge V2: `minWidth 64`, padding
`11×5`, radius `10`, dark `rgba(15,13,42,0.92)` backing, `1px` matching border, font `26`,
duration `940ms`, tight black text shadow. (Bug fixed: REAL badge used `left:0`+`right:0`,
stretching into a wide bar.)

Future: centralize shards/red-buzz/audio/intake/overlays into a Feedback Event System — do
not mix into HeroBook patches.

---

## Polly (Hunt behavior + legacy)

Polly is the antagonist, not a mascot. Every trap is her move; the boss word is hers to
defend; mastering a word means the player saw through her trap for good. Runtime webp
assets: `assets/images/polly/*.webp`. Component
`app/components/ui/PollySprite.tsx`; animator `app/hooks/usePollyAnimator.ts`; gameplay size
`POLLY_GAMEPLAY_SIZE = 210`. Dialogue source of truth: `docs/POLLY_DIALOGUE_BANK.md`.

Daily Polly is SHIPPED on pose images — see CLAUDE.md "Daily Polly" note. The 13-part
`PollyRig` is shelved for future layered art. Spec/plan: `docs/superpowers/{specs,plans}/2026-07-02-polly-*`.

Hunt behavior (live on transparent poses): fly-up entrances not pop-ins; mid-round fly in
from bottom-left, perch left, speak, exit left; one mid-round pop-in budget per word; end-of-
round always fires; right side reserved for the reject lane.

Hunt trigger map: trap rejected → `perchDismissive`; wrong swipe → `perchSmug` ("Thought
so."); haunt/run clipped → `perchLaughing`; masters word → `perchSulking`; beats Polly →
`flyAngry`; boss throw → `perchPointing`; perfect clear → `perchShocked`.

Legacy compat pose map (old webps): fly→`polly_fly_in`, neutral/smug→`polly_idle`,
dismissive/sulk→`polly_sulk`, laugh→`polly_laugh`, point→`polly_taunt_point`,
shocked/boss→`polly_boss_warning`.

Living-rival layer: `app/game/pollyCharacter.ts` is the typed authored-line catalog;
`app/game/pollyMemory.ts` stores a small versioned local rivalry memory; `usePollyVisits`
remains the Hunt visit director. Home and Results can acknowledge the previous outcome, and a
Haunt missed repeatedly changes Polly from a smug perch to a pointing challenge without adding
another line. Shared ambient motion is surface-specific, stops while inactive, and respects the
system reduced-motion preference. The shelved rig/flipbook/legacy animator are disconnected.

---

## HeroBook V5 (shipped)

SVG book `app/components/ui/HeroBook.tsx`; `MaskBoard.tsx` passes the hero-word subtree as
children. Reads as a full bound book: rounded purple cover with gold trim, matching purple
spine (top hinge) with gold tooling, wrapped rounded page base, opens from top via `rotateX`.
HeroBook owns cover/spine/page SVG geometry, gold trims, intake seam, book styling; MaskBoard
owns gameplay, hero-word content, animation, tile intake, scoring. Never: plaque, flat banner,
signboard, black bar, View-rectangle anatomy. Do NOT pop stash `wip failed View-based Hunt hero book V5`.

---

## Daily Challenge status

Separate from standard Hunt. Spec: `docs/DAILY_CHALLENGE_SPEC.md`. Committed: DailyAnswerCard
control system; daily result reward visuals; daily entrance animations; Hunt Gold Feather
revive quarantined; Hunt wrong-swipe result tracking; play-screen visual pass (boss-chamber
backdrop + tamed 3-stop overlay, HUD strip with feather-PNG chances, 6 cards on a candidate
board with gold→rose frames); Polly on transparent pose images (see CLAUDE.md).

---

## Key Learnings — Architecture

- StreakDisplay shows `chainMultiplier` (×1.5 format), not raw streak; hides at 1.0.
- Progress is a gold fill bar (Animated width), not dots; `useNativeDriver: false` for width.
- `onNearTarget` on SwipeMask fires at closed > 0.45 → `triggerBookOpen()` in MaskBoard (book
  opens when the tile arrives, not on swipe).
- `intakeY = wordScreenY + 73` for `coverHeight 162`.
- `gridWrap paddingTop` drops the tile onto the arena floor (grounded, clear of Polly's
  bottom-left lane). Current: 180.
- Hero word = gold-foil stamp, three Text layers rendered by the shared `FoilWord` component
  (`app/components/ui/FoilWord.tsx`); MaskBoard passes `styles.word` as baseStyle: dark deboss
  +4px below, warm `#FFF7D6` catch-light rim −2.5px above, gold fill with tight 1px amber
  edge (radius 2). Never a wide zero-offset glow — radius 8 hazed the glyphs.
- Hunt Polly visit layer lives in GameScreen's `GameContent`, NOT MaskBoard — the board
  remounts per word (`key={stepIndex}`) and kills any visit arc mounted inside it.
  MaskBoard takes `firePollyEvent` as a prop. gameOver laugh SFX plays from ResultsScreen.

---

*POLYWORDS Game Reference · offloaded from CLAUDE.md 2026-07-02*
