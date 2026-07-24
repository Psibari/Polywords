# POLYWORDS — Boss Round Spec

**Owner:** Pete (sole authority) · **Lead:** Claude
**Branch:** `play-screen-overhaul` · **Written:** July 23 2026
**Status:** DESIGN LOCKED — implementation not started

This document settles the boss round end to end so it gets built once. Everything
here was decided with Pete on July 23 2026. Every code claim was verified against
live source on `play-screen-overhaul`, not against docs or memory.

Route C phases 1 and 2 (engine + gauntlet logic) are already shipped and tagged.
This spec covers **presentation only** — what the player sees. Nothing here
changes the mechanic.

---

## Part A — What governs

**Polly is an annoyance who thinks she's dangerous.** She is not a threat. She's
a cartoon trapper — Wile E. Coyote with a trap-field — and the comedy lives in
the gap between how menacing she thinks she is and how menacing she actually is.
The game is supposed to be fun.

Consequence for this spec: **every flourish on the boss round is Polly showing
off, not the game showing off.** The heavy haptics, the long entrance, the boss
music, the crown chip — that's her staging her own finale. Because the bombast
belongs to her, it can go bigger than feels reasonable. Overdoing it is the joke.
Dread is a genre error. Caper, not doom.

**The book is YOURS.** Decided July 23. It's your ledger — you fill it with
meanings you read correctly. This matches what the code already does: correct
tiles fly *into* it at `intakeY`, and mastery feeds the Vault, which is
explicitly your archive with no Polly presence. The `POLLY'S VAULT` label on the
hinge band is the odd one out and comes off.

**Fiction spine (unchanged, locked July 20):** you go on a RUN through Polly's
HUNT. She hunts you. She sets snares; she never owned or stole the words. Win
framing is always *cracked her trap*, never *recovered what she stole*.

---

## Part B — Why the boss round doesn't land today

All verified against live source. This is the diagnosis the spec answers.

**1. The boss round is differentiated by subtraction.** A boss word gets *less*
visual treatment than an ordinary word:

- Ordinary words render through `FoilWord` — a three-layer gold-foil stamp
  (debossed shadow +4px, catch-light −2.5px, gold fill with warm edge). Its own
  comment calls it "the trophy-word treatment."
- **The boss word renders as one flat `<Text>`.** No foil.
- The gold absorption overlay is guarded `!isBoss`.
- The red wrong-swipe flash is guarded `!isBoss`.
- `nearMastery` is `!isBoss && deckSize <= 2`.

So the climax is the cheapest text rendering in the game, and a wrong swipe on
the boss signals less than a wrong swipe in round 3.

**2. The kicker has never rendered.** `styles.container` sets
`overflow: 'hidden'`; `wordZone` has `marginTop: 4`; `kickerBoss` is absolutely
positioned at `top: -24`. It draws 20px above the container's top edge and is
clipped. The single most explicit "POLLY'S WORD · 2× SCORE" signal has never
been visible. The regular kicker at `top: -18` is clipped too.

**3. The gold absorption fill is invisible on every word in the game.**

```js
PW.color.gold          = '#F5C842'
foilMaterial.fill      = PW.color.gold   // FoilWord's top layer
styles.word.color      = '#F5C842'       // hero word base
absorption overlay     = '#F5C842'
```

The overlay fades an identical-coloured copy over a word that is already that
colour. `GOLD_STEPS_LOCAL` (0 / 0.25 / 0.55 / 0.80 / 1.0) is computed on every
correct swipe, animated over 400ms, and shows nothing. It has been dead the
whole time. The bug is the colour, not the `!isBoss` guard.

**4. The hidden tile is a list row, not a card.** `isSpecialSplit={true}` doesn't
restyle the card — it routes to a different component path in `SwipeMask`:

| | `styles.tile` | `styles.splitTile` |
|---|---|---|
| Bezel | gold→magenta `LinearGradient` | **skipped entirely** |
| Width | `cardWidth` (290 cap) | `'100%'` |
| Layout | column, centred | row, `paddingLeft: 16` |
| Radius | 20 | 14 |
| Shadow | `#9B2D6B`, r16, elev 10 | black, r4, elev 3 |
| Text | 27px, uppercase, centred | 16px, no transform, left |
| Inner face | `#1C1548` panel | none |

The double-bezel that makes a POLYWORDS tile look like a POLYWORDS tile is
skipped. The finale inherited a leftover path built for something else.

**5. No screen in the game has its own room.** Two background images total:
`boss-round-bg.png` and `home-hero-bg.png`. The boss round and the Daily
Challenge use **the same asset with the same two-stop scrim**
(`rgba(15,13,42,0.46)` → `rgba(15,13,42,0.18)`). Normal Hunt rounds use the Home
screen's background.

**6. `MasterySeal` is the right component in the wrong place.** It's a wax-seal
press — blob springs in, stamp drops and squashes it, lifts, label reveals with a
shine sweep. Variants `master` (amber wax) and `banished` (magenta wax) both
exist. It has been aimed at the hero word instead of at a book cover.

---

## Part C — The boss round, beat by beat

### C1. Her room

The boss scrim must differ from the Daily's. Her chamber runs hotter and more
purple so the round reads as *her* room on load. Scrim constants only — no new
art asset required. Daily keeps the current values.

### C2. Entrance

Existing entrance survives: 1200ms hold, three heavy haptics, board shake, slower
deck deal-in (`cardDelay` 1200 vs 520), boss music, book already in position
rather than sliding in. This is her staging her finale and it works.

**Fix:** un-clip the kicker so "POLLY'S WORD · 2× SCORE" actually appears. Move
both kicker elements out of `wordZone` and make them direct children of the root
container, `top: 0`, above the book in z-order. Do not change `container`'s
overflow or `wordZone`'s metrics — the book and tile stack must not shift.

### C3. Her Word: sealed, then lit

**The boss word arrives dark and lights as you claim meanings.** Boss only —
ordinary words do not gain this. It is the differentiation.

- Base: unlit metal. `PW.color.goldDark` (`#8F6F18`) exists unused and is the
  starting point; final tone to be tuned on device.
- Each correct real meaning advances the existing `goldTextOpacity` through
  `GOLD_STEPS_LOCAL` toward full gold `#F5C842`.
- End state is the full `FoilWord` three-layer stamp — the trophy treatment the
  boss is currently denied.
- Typeface and size unchanged: `FONTS.bossWord` at 112px.

This adds no new system. It makes an existing wired-up one visible for the first
time (see Part B3). The dead overlay comes **off** ordinary words rather than
being repaired — nobody has ever seen it, so nothing is lost.

**Why this is the first domino:** it gives the visible round a job. Today the
five visible tiles on a boss are mechanically identical to round 3. Under this
they become the act of prying her Word open, and the player can watch it happen.
That makes the deck emptying mean something, which makes the book opening a
payoff rather than a transition.

**Also restore:** red wrong-swipe flash on boss, and `nearMastery` on boss. Both
need `isBoss && styles.wordBoss` in their style arrays so the overlays align to
112px — the haunt tint overlay already does exactly this and is the pattern to
copy. Misalignment at 96 vs 112 is the likely reason they were switched off.

### C4. Deck empties, the Vault opens

Her Word is now fully lit. That is the cue.

**The book opens and stays open**, and the hidden tiles come out of it.
`HeroBook` already animates via `bookOpenAnim` / `bookIntakeGlowAnim` — currently
a 120ms flick on card touch. For the gauntlet it holds open.

This ties the object language together and is bespoke to the book/vault fantasy.
No particles.

### C5. The gauntlet cards

**The hidden tile is a card, and it must out-card the deck.**

Baseline fix is mostly deletion — drop `isSpecialSplit` from the gauntlet's
`SwipeMask` call and it becomes a real card for free: double bezel, 290 width
cap, centred 27px uppercase text, proper shadow, `#1C1548` inner face. The
uppercase transform also resolves the case mismatch between mask copy (stored
uppercase) and hidden meanings (stored sentence case) **with zero content churn**.

Then it must exceed the deck. Three levers:

1. Its own bezel colours, distinct from the standard gold→magenta.
2. Height above `TILE_H` (152).
3. The open book behind it, standing in for the four backing cards it doesn't
   have.

Sequential arrival, one slot — three tiles at full card height will not stack on
one screen. The `N OF M` counter shipped in Route C phase 2 is a placeholder and
gets a real treatment here.

### C6. Master

Absorb → close → drop → stamp → shelve.

1. Final correct tile is absorbed into the book as normal.
2. **The book closes on the word.**
3. **The book drops to centre screen** and becomes the hero object.
4. **`MasterySeal` presses onto the cover** — `variant: 'master'`, wax blob,
   stamp drop, squash, lift, label reveal. Coordinate change only; the component
   already does this.
5. **The book shrinks and slides into the Vault**, arriving at spine size so it
   reads as slotting onto the shelf. `libraryMaterial.spineLeather` and the hero
   book's cover purples are already the same material, so the shrink lands on
   something real.

Target duration ~2.2s, down from the current 4.3s. The current sequence runs long
enough that you feel it on the third replay.

**This replaces** the existing twelve-phase sequence: word crash, cracks, gold
seed spawn, seed flight, landing bloom. Five objects doing five things become one
object doing one thing — and it's the object the whole game is already about.

### C7. Haunt

The mirror. Same choreography, opposite destination.

1. **The book shakes** — refuses the word, doesn't accept it.
2. **The book drops to centre screen**, same position as master.
3. **The colour drains out of it.** It goes ghosted — dead, in her grip.
4. **It does not travel.** No Vault. It sits there drained, because the word never
   got banked. Then she gloats.

Ghost palette already exists in `libraryMaterial` and is the treatment haunted
spines wear on the Vault shelf:

```js
ghostLeather: 'rgba(42,28,92,0.45)',  // coverPurpleTop, faded — her grip
ghostTint:    'rgba(123,45,139,0.35)',
ghostTitle:   'rgba(185,138,222,0.75)',
hauntedLabel: 'rgba(185,138,222,0.6)',
```

So the drain isn't a new look — it's **the word previewing exactly how it will
sit in your Vault**, greyed out and hers.

**No stamp on the loss.** The asymmetry is the point: master *presses something
onto* the book, loss *drains something out of* it. One gains a seal, the other
loses its colour. (`MasterySeal`'s `banished` variant stays available if Pete
later wants a stamp here.)

Same duration as master (~2.2s). Symmetric timing is what makes the mirror read
as a mirror rather than as a win and a shrug.

**No particles on either ending.** Dead concepts: golden expanding ring (killed
twice), generic omnidirectional multicolour scatter, flat-rectangle radial shard
burst ("birthday cake confetti").

### C8. She reacts after, not during

The snap/drain is the mechanism. Her outrage or her gloating is the punchline a
beat later. That separation is where the comedy is.

`BINGO BANGO ZZZZINGO!` is **unassigned** as of July 23 — removed from the
mastery sequence, not retired. Pete may place it elsewhere. It previously fired
three staggered stingers at +2600ms in `triggerMastered` and was the only reason
the boss sequence ran 4300ms vs 3450ms for a normal word; removing it frees 850ms
for the new choreography. `CLAUDE.md` still lists it under never-change text and
must be corrected.

---

## Part D — Implementation phases

Each phase ends `tsc --noEmit` exit 0, device test, `git tag`. MaskBoard and
SwipeMask are warroom-gated; the July 23 pass covers all of the below.

**Phase 1 — Restorations.** Un-clip kicker; red flash on boss; `nearMastery` on
boss. Pure restoration, no new design. `MaskBoard.tsx`.

**Phase 2 — Sealed, then lit.** Boss word dark base → gold fill via existing
`goldTextOpacity`; `FoilWord` end state; remove the dead overlay from ordinary
words. `MaskBoard.tsx`, possibly `pwTheme.ts` for the unlit tone.

**Phase 3 — The gauntlet card.** Drop `isSpecialSplit` from the gauntlet call;
distinct bezel; height above `TILE_H`; real `N OF M` treatment.
`MaskBoard.tsx`, `SwipeMask.tsx`.

**Phase 4 — The Vault opens.** Book holds open for the gauntlet; tiles emerge
from it. `MaskBoard.tsx`, `HeroBook.tsx`.

**Phase 5 — Both endings.** Rewrite `triggerMastered` to close/drop/stamp/shrink;
build the haunt mirror as drop/drain/hold; reposition `MasterySeal` to the cover;
remove BINGO/BANGO. Largest single rewrite in the plan — do it last, once
everything it depends on exists.

**Phase 6 — Her room.** Boss scrim divergence from Daily. Standalone, can land
any time.

---

## Part E — Open items

- **Unlit tone for the boss word** — `goldDark` `#8F6F18` is the starting
  proposal; needs device tuning.
- **Gauntlet card bezel colours** — must be distinct from the deck's
  gold→magenta. Undecided.
- **`FoilWord` on the boss** — the end state of C3 implies it. Needs a check that
  the three-layer offsets scale correctly at 112px (the component derives them
  from `fontSize`, so it should, but it has only ever run at 96).
- **`POLLY'S VAULT` label removal** — three instances outstanding, already on
  Pete's priority list. Blocked on nothing now that the book is yours.
- **Her reaction copy** after each ending — belongs to the joint writing pass
  alongside haunt re-theme, run-language, and wrong-swipe copy.
- **`pwEffects.ts` unread** — deliberately. The direction is no particles, so its
  shard configs don't apply to this spec.
