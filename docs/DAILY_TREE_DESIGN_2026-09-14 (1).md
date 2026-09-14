# THE DAILY CHALLENGE — POLLY'S TREE

**Date:** 14 September 2026
**Branch inspected:** `play-screen-overhaul` @ `897ee9f` (13 Sep 2026, 23:48Z)
**Status:** design and all layout questions ruled in conversation, against three
generated mockups. Nothing built. No code touched.

This supersedes the current Daily presentation — the quill scroll, the stone
card board, the HUD row. It is a **presentation change only**. Every number on
the screen already exists in the store. No new persisted field is required.

---

## 1. What was verified, and when

Counted and read from the live branch on 14 Sept 2026, not from any document.

**Branch health.** `play-screen-overhaul` is the live branch, last commit 13 Sept
23:48Z. `main` is stale since 25 June 2026. `DailyChallengeScreen.tsx` was
re-downloaded pinned to `897ee9f` and md5-matched against what this document
describes — identical.

**Mode shape**

| | |
| --- | --- |
| Rounds per session | 5 (`DAILY_ROUND_COUNT`) |
| Chances per session | 2 (`DAILY_CHANCES`) |
| Clues per word | 3, revealed progressively (`revealedClueCount: 1 \| 2 \| 3`) |
| Clue reveal triggers | a wrong claim, **and** a timer (`timedClueCount`) |
| Earlier clues | **persist on screen** — `ClueStage` calls them "memory clues"; they unmount at claim commit, not at the next reveal |
| Clue speed is the score | share grid renders 🟨 for a 1-clue solve, 🟪 for 2 |
| Claim input | **swipe up** — `DAILY_ACTION_RULE = 'SWIPE UP TO CLAIM'` |
| Mode rule line | `DAILY_CLUE_RULE = 'ONE REPRESENTS ALL'` |
| Wrong cards | go to `'disabled'` via `committedWrongClaims`, dead for the round |

**Content, counted from `dailyPool.ts`**

| | |
| --- | --- |
| Daily words | 60 |
| Clues | 180 |
| Clue length | median 29.5 chars, **max 51**, 37 clues (20.6%) over 34 |
| Longest clue | "THE OUTWARD ANGLE WHERE TWO SLOPING ROOF SIDES MEET" |
| Candidate words | 540 |
| Candidate length | median 5 chars, **max 13**, 12 words (2.2%) over 9 |
| Longest candidate | **ASSASSINATION** |

**What is already on screen today**

- `AmbientSkyBackground` with `DAILY_SKY_TUNING` — the Daily already has its own
  sky, explicitly distinct from Boss. **There is no dungeon background.** The
  dungeon read comes from the props: `QuillScrollPanel`'s stone chrome and
  `stoneTile.png` under the six cards.
- A `LinearGradient` overlay, and `dailyPressureVeil` in `PW.color.purple`.
- HUD row: `DAILY #n` + the rule, five round dots, two white life feathers
  (`feather-life-filled.png` / `feather-life-empty.png`) with a red
  `featherPulse` on loss.
- `headerVisible` is **default off** (Pete's A/B) — the `DAILY CHALLENGE` header
  block exists in code but does not appear on screen.

**Two corrections to earlier statements in this conversation**

1. **The pressure veil is not a clock.** It is
   `min(0.18, currentRoundIndex × 0.025 + (2 − chancesRemaining) × 0.045)` —
   driven by depth and lives lost, not by elapsed time.
2. **Polly's per-round feather tally already exists.** `QuillScrollPanel.tsx`
   line 20: *"Daily's day-progress feathers: 1–4 correct claims today shows that
   many white feathers; the 5th (`revealPerfect`) shows a single gold feather."*
   It is computed and drawn today — only on the end-of-session reveal panel.
   Promoting it to live play is a move, not a build.

---

## 2. The constraints this design is built on

**The plaques are touch targets and must never move.** Any layout that reflows
the answer grid mid-round produces a miss the player blames on the game. This
kills every version where the clue stack grows into the plaque area.

**Clue speed is the score.** Whatever displays the clue state is also displaying
the round's score. That is why the clue stack is the largest object on the
screen and why it must read at a glance.

**Stone is spoken for.** `chamberMaterial` is *"Settings' torch-lit
stone-corridor world."* Stone means Settings. Polly's tree may not be stone.

**Nothing new is persisted.** If a number is not already on the store, it does
not go on this screen. Everything below reads an existing field.

---

## 3. What the screen is

**Polly's tree at night.** She perches on a branch at the top. The clue hangs
from her branch on a rope. The six answers hang from three lower branches. The
player throws an answer up at her sign.

The frame is not a HUD over a background. It is one place, and every piece of
information is an object hanging in it.

---

## 4. The layout

Measured from the approved mockup (851 × 1848, aspect 2.17 = 9:19.5). All figures
are percentages of screen height so they survive a device change.

| Element | Band |
| --- | --- |
| Feather row | 2 – 5% |
| Polly and her branch | 7 – 21.5% |
| Clue plank 1 | **26.6 – 34.1%** |
| Hidden plank lips (the peek) | 34.3 – 36.2% |
| Open sky — the throw corridor | 36.2 – 58.1% |
| Plaque branch 1 | 58.1 – 59.1% |
| Plaque row 1 | 61.6 – 67.9% |
| Plaque branch 2 | 70.2 – 71.4% |
| Plaque row 2 | 73.8 – 80.1% |
| Plaque branch 3 | 82.1 – 83.2% |
| Plaque row 3 | 85.7 – 91.9% |

Plaque size: 352 px wide = **41.4% of screen width**; 116 px tall = **6.3% of
screen height ≈ 53 pt**, above the 44 pt touch minimum.

**The gap is a feature, not dead space.** At one clue it is 21.9%. At three it
closes to 3.6%. It is also the corridor the claimed plaque flies up through, and
it is the emptiest the screen ever looks. Ruled: leave the geometry alone. If it
needs help, bring the dark tree silhouettes higher and add vines at the **left
and right edges only** — never the centre, which is the flight path.

---

## 5. The clue planks

Three horizontal planks in a hanging chain. Plank 1 hangs from Polly's branch on
two black ropes meeting in a peak. Plank 2 hangs from plank 1 on two short
knotted cords; plank 3 from plank 2 the same way.

**Top-anchored. The stack grows downward.** Plank 1 never moves. Planks 2 and 3
are nested behind it and **drop out from behind** as clues arrive.

**Only the top lips of the hidden planks are visible** below plank 1 — a few
pixels each. That reads as a stack with more inside it. There are never blank
plank faces on screen; every visible plank carries a clue.

**Plank height fits two lines.** Sized against the median clue (~30 chars), with
type shrink-to-fit for the 20.6% that run longer, and a hard font floor. Verified
worst case: 51 characters.

**Material:** `libraryMaterial` wood — face `#6A5A48`, shadow side `#4A3E30`,
under-shadow `#332A20`. Weathered grey-brown, **not caramel**. A thin gold trim
line on the clue plank edge in `#F5C842`, carrying the existing
`dailyScrollMaterial.goldTrim` identity from the scroll to the plank. Ropes and
knots near-black — hardware, not a third material.

**The ink.** A clue does not appear; it is **written**. `inkProgress` is already
a live prop on the clue panel today.

---

## 6. The answer plaques

Six plaques, two per branch, three branches. Same wood, lighter and fresher than
the clue planks, each with a soft-gold hairline rim and a drop shadow so it reads
as grabbable rather than as more signage.

**Longest word is solved.** In the approved mockup, ASSASSINATION fills 80.7% of
the plaque width with 9.7% clear margin each side, on a plaque the same width as
the others — achieved by **shrinking the type, not widening the plaque**. No
plaque resize and no content trimming required.

**Entrance is already written.** `DailyAnswerCard` takes
`enterFromLeft={index % 2 === 0}` and staggered `CARD_ENTER_DELAYS`. As plaques
that is them swinging in from opposite ends of each branch on a stagger.

**The plaques do not sway.** Wind lives on Polly's branch, the leaves, and the
clue planks. Two pixels of idle motion maximum on a plaque, and zero in the
timer's final stretch.

**A disabled plaque stays readable.** Cracked and hanging crooked by one cord,
word greyed but legible. With only two chances in a session, knowing what you
already burned is worth keeping on screen.

---

## 7. Feathers, and what happened to lives

**The five white feathers replace the five HUD round dots.** One row along the
top. Empty outlines at the start; one fills per round taken. They do progress and
score in one element.

**They come off Polly.** The same impact that knocks the sign spinning knocks a
white feather loose from her; it drifts up into the next empty slot. One hit, two
consequences, and she takes visible damage five times a session.

**The gold feather is the five whites.** On a clean sweep they slide together and
fuse. `feather-gold-reward.png` stays the end art; it now has a five-step birth,
and a 4-of-5 day is four whites that did not make it.

**Lives are no longer feathers. Lives are the two ropes.** A wrong claim snaps
one — the plank stack lurches and hangs crooked from a single rope for the rest
of the session. The second snaps and the stack drops.

**Cost of that:** `feather-life-filled.png` and `feather-life-empty.png` stop
being used and `FeatherIcon` comes out. That is shipped art being retired, and it
is the only real loss in this design. Ruled: accept it. Two feather rows running
in opposite directions at the top of a phone screen is the version that confuses
people on day one.

---

## 8. Motion

### Round change — a correct claim

| Phase | Duration |
| --- | --- |
| Plaque unhooks and lifts | 120 ms |
| Flight up to the plank stack | ~460 ms (existing card-flight timing) |
| Impact — stack takes the hit, one hard overshoot frame; feather bursts off Polly on the same frame | — |
| Stack spins 360° as **one rigid body**; clue text swapped at the edge-on frame | ~450 ms |
| Feather drifts to its slot, arriving **before** the spin settles | ~500 ms |
| Settle wobble, damping out | ~200 ms |

**Hard ceiling 700 ms on impact-to-readable.** A tap during it snaps to the end.
Five rounds of a 1.4 s transition is seven seconds a session of watching a sign
spin — fine on day one, a tax on day forty.

**The stack comes back already carrying plank 1 of the new round.** It is never
empty. Planks 2 and 3 are behind it again.

**Planks never spin independently.** Cords would tangle and read as junk.

### A wrong claim — the stack does not move

The round has not ended, so nothing spins. The plaque hits the planks and **the
stack holds**. Dead thud. The plaque cracks and falls back to its branch, hanging
crooked by one cord, word greyed but readable. One rope snaps.

That is Polly's whole register, and it comes from the same animation doing
nothing.

### A new clue arriving

The next plank drops out from behind the one above it, jolts, and settles at its
fixed position. Nothing below it moves. The clue inks on.

### Haptics

- Clue reveal already fires `Haptics.impactAsync(Heavy)` in `ClueStage`. **Move
  it to the moment the stack settles face-out**, not to the start of the spin.
- Wrong claim keeps `Haptics.cueAsync('wrong')`.
- Feather landing in its slot: small pop.

### Reduce motion

`useReducedMotionPreference` is already wired in this file. Under it: no spin, no
flight. The feather fades into its slot and the clue cross-fades.

---

## 9. Polly

**Pete's requirement: she reacts to everything.** That is an expansion, and it
contradicts a flag that is in the code deliberately.

Today `dailyPollyBehavior` is `persistent: true, mostlySilent: true`, with four
reactions: `perched` (default), `happy` (first miss), `laughing` (loss),
`shocked` (win).

What this design gives her without touching that flag:

- She is **plucked every round** — a visible reaction beat five times a session
  that requires no new pose.
- She **writes the clues.** The ink is hers.
- The stack that spins is hanging off **her branch**, so the biggest motion on
  screen is physically attached to her.

Whether she gets a wider reaction set, and whether `mostlySilent` survives, is
**not decided here.** It is a tone call and it belongs with the showrunner. See
§12.

---

## 10. Every element, and where its number comes from

| On screen | Source | Exists? |
| --- | --- | --- |
| Five white feathers | `revealSolvedCount` — already fed to `QuillScrollPanel` as `revealFeatherCount` | **Yes.** Computed, drawn end-of-session only |
| Gold feather | `revealPerfect` / `feather-gold-reward.png` | Yes |
| Clue text on planks | `currentRound.word.clues` via `ClueStage` | Yes |
| How many planks are out | `revealedClueCount` (1–3) | Yes |
| Six plaque words | `currentRound.candidates` | Yes |
| Disabled plaque state | `cardStates` / `committedWrongClaims` | Yes |
| Rope state (lives) | `chancesRemaining` | Yes |
| Ink write-on | `inkProgress` | Yes |
| Pressure | `dailyPressure` | Yes |
| Polly's pose | `dailyLastClaimResult.pollyReaction` → `toPerchReaction` | Yes |

**Nothing on this screen requires a new persisted field.** That is the strongest
argument for building it: it is entirely presentation.

---

## 11. What this costs

**Art — the gate.** A full screen set: Polly's branch, three plaque branches,
three clue planks with rope and knots, six plaques, leaves, sky, moon. This is
the expensive part and it is not started. Three positioning mockups exist and are
approved for layout, **not for palette** — they run warm caramel and a brighter,
bluer sky than `#1A1830`.

**Code.**
- Replace the `QuillScrollPanel` usage with the plank stack rig.
- Reskin `DailyAnswerCard` as a hanging plaque; entrance logic already exists.
- HUD round dots become the five feather slots; `FeatherIcon` and the life-feather
  row come out.
- Rope state on the plank rig (two, one, none).
- The spin container — one rigid body, text swap at the edge-on frame.

**Data.** None.

**Separate cleanup, found while looking:** `stoneTile.png` loses its last
consumer when the card board goes. `libraryMaterial.wood` is currently attached
to `Bookcase.tsx`, which the Polybook work found is dead except one type import —
this design gives that material a live home.

---

## 12. Ruled

- **Polly's world, not a dungeon.** Night tree, her branch, hanging signs.
- **Wood, not stone.** `libraryMaterial` grey-brown `#6A5A48` family, gold trim,
  near-black rope. Stone is explicitly rejected: it is Settings' material, and a
  stone slab on a rope under a living branch puts the dungeon back.
- **The brick wall is dead.** It read as more dungeon than what it replaced.
- **Clue stack: three planks, top-anchored, growing down, nested behind, lips
  peeking.** The memory-clue behaviour in the code is unchanged.
- **Plank 1 never moves. The plaques never move.**
- **The gap stays.** It is the throw corridor and it closes as clues arrive.
- **Six plaques, 2 × 3, one per rope pair, longest word by type shrink.**
- **Five white feathers replace the round dots; they come off Polly; five fuse
  into gold.**
- **Lives become the two ropes. Life-feather art retired.**
- **A wrong claim does not spin the stack.**
- **700 ms ceiling on the round-change transition, tap to skip.**

---

## 13. What is not decided

1. **One continuous tree, or unconnected branches floating in sky?** Cheaper
   unconnected, and probably fine on a phone — but it changes every asset, so it
   is worth settling before art starts.
2. **`DAILY #n` and `ONE REPRESENTS ALL`.** Currently in the HUD row this design
   deletes. Carved into the clue plank's frame, or dropped. Note `ONE REPRESENTS
   ALL` is the central rule of the mode and currently appears nowhere else when
   `headerVisible` is off.
3. **`clueSpeedPrompt`** — `'FIRST-CLUE MARK'` / second / `'FINAL CLUE'` is a
   live text element with no home in this layout. Place it or cut it.
4. **Polly's reaction set.** Wider than four poses? Does `mostlySilent: true`
   survive? Tone call, belongs with the showrunner.
5. **The feather row's anchor.** It currently floats against sky. Hanging it off
   the branch that crops in at the top-left would tie it into the world.
6. **`headerVisible`** — the A/B is still open and this design assumes it stays
   off.

---

This document describes the screen, its materials, and its motion. **It does not
authorise a line of code.** The art is the gate.
