# POLYWORDS — Boss Round Spec

> **Flagged 2026-08-19 (doc reconciliation pass):** this spec's Part C presentation
> (ceremony/room treatment/gauntlet-card material) is NOT what got built — "Pick Your
> Trap" (see `CLAUDE.md` Hunt section) shipped instead. Status here needs Pete's explicit
> call: keep this as a record of an abandoned direction, or retire it. Left otherwise
> untouched by this pass.

**Owner:** Pete (sole authority) · **Lead:** Claude
**Branch:** `play-screen-overhaul` · **Written:** July 23 2026 · **Revised:** July 25 2026
**Status:** DESIGN LOCKED (rev. 2) — implementation not started

This document settles the boss round end to end so it gets built once. Parts A and
B were decided with Pete on July 23 2026 and are unchanged. Part C's ceremony (C6/C7),
room treatment (C1), and gauntlet-card material (C5) were revised with Pete on July 25
2026, arrived at fresh rather than by re-deriving the July 23 draft — see the "Revised
July 25" notes inline for what changed and why. Every code claim was verified against
live source on `play-screen-overhaul`, not against docs or memory.

Route C phases 1 and 2 (engine + gauntlet logic) are already shipped and tagged. Since
the July 23 draft, the presenter layer was also split: `useBoardMechanics` now holds all
game-state/timing logic, and the boss step renders through its own `BossBoard.tsx`
(currently a thin wrapper sharing MaskBoard's face code via an inert `isBossStage` flag).
This spec covers **presentation only** — what the player sees. Nothing here changes the
mechanic.

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

### C1. Her room — *revised July 25*

The boss round must not read as "the Daily Challenge with a different word." The
July 23 draft called for scrim-constant differences only; the July 25 pass goes
further: **the differentiation is an ambient register shift, not a palette swap,
and it should be alive rather than static.**

- **Gold and magenta stay untouched.** Those two colours already mean something
  precise — gold is "correct," magenta/pink is "wrong" or "haunted." The boss
  room must not compete with that vocabulary. Its identity lives entirely in the
  *ambient* layer: background, scrim, vignette — the space around the gameplay,
  never the gameplay's own feedback colours.
- **Warm/ember register, not a hue swap.** Push the ambient tone toward deep
  amber-rust bleeding into the game's existing indigo, rather than swapping to a
  colour the palette doesn't already use elsewhere. Reads as "the light changed
  because you're in her room," not as a reskin.
- **Hang it off the existing tension/heartbeat vignette system rather than a
  static scrim.** `HeartbeatVignette` already exists and is already driven by
  live tension state. The boss room's atmosphere should be a boss-specific
  register of that same system — a slow ember pulse at the edges — instead of a
  new, unrelated effect. No new art asset, no new effect system.
- **Optional flourish, not required for v1:** a very slow, near-imperceptible
  tightening of the vignette toward the edges over the course of the round —
  echoing "the trap is closing" without becoming a countdown-timer feeling. Cut
  this first if the ember pulse alone already reads as distinct.

Daily Challenge keeps its current values unchanged — this is boss-only.

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
ordinary words do not gain this. It is the differentiation, and it's the reason
C1 doesn't need to do more than set the room: the *word itself* is the visible
job of the round. Watching your own trophy assemble in real time, correct swipe
by correct swipe, is a stronger signal than any ambient dressing could be on its
own — the room says "you're somewhere different," the word says "something
different is happening."

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

### C5. The gauntlet cards — *revised July 25*

**The hidden tile is a card, and it must out-card the deck.** The July 23 draft
identified the bug (baseline fix below still holds) but left the actual material
undecided ("distinct bezel colours... undecided" — Part E). That's now resolved:

**Don't reskin it as a tile — skin it as a page pulled from her book.** Keep the
same card shape and gesture affordance every other tile in the round has used
(still swipe-up / swipe-right, same shape family) so nothing has to be relearned
at the highest-stakes moment. But the *material* moves toward the book itself —
warm leather / gold-leaf trim, more ornate than the deck's clean gold→magenta
gradient — so it visually reads as "this isn't a mask, this is the secret
itself, pulled out of the thing you've been filling all game." That's a stronger
answer than an arbitrary second colour pair, and it ties directly into C4: the
card looks like it belongs to the object it's emerging from.

Baseline fix is mostly deletion — drop `isSpecialSplit` from the gauntlet's
`SwipeMask` call and it becomes a real card for free: double bezel, 290 width
cap, centred 27px uppercase text, proper shadow, `#1C1548` inner face. The
uppercase transform also resolves the case mismatch between mask copy (stored
uppercase) and hidden meanings (stored sentence case) **with zero content churn**.

Then, on top of the book-material skin:

1. **Bigger than `TILE_H` (152).** It should be the single biggest, richest
   object that's appeared on screen all round — hierarchy alone sells "this
   matters more." (Unchanged from July 23.)
2. **One edge glow/shimmer, not a flat border.** It's supposed to be glowing
   hidden content; the edge should read as light, not as a stroke.
3. The open book behind it stands in for the four backing cards it doesn't
   have. (Unchanged from July 23.)

No particles, no second visual gimmick — book material, size, one glow detail.

Sequential arrival, one slot — three tiles at full card height will not stack on
one screen. The `N OF M` counter shipped in Route C phase 2 is a placeholder and
gets a real treatment here.

### C6. Master — *revised July 25*

**One decisive beat, not a five-step sequence.** The July 23 draft specified
absorb → close → drop → stamp → shelve at ~2.2s. On reflection that's still a
lot of choreographed motion for something the same player sees every run: win
sequences that read as great the first time read as a tax by the tenth. The
weight of this moment should come from C3 — watching the word light up over the
whole round — not from an elaborate outro trying to sell the payoff after the
fact. Spend the theater budget on the build-up; keep the payoff short.

1. Final correct tile is absorbed into the book as normal.
2. **One decisive snap-and-seal beat, ~400–600ms:** the book shuts firmly on the
   now-fully-lit word with a flash of gold light from the seams, implying the
   seal happened inside, without a separately-animated multi-step wax-stamp
   sequence. One hit of light, sound, and haptic. Done.
3. The book may continue toward the Vault after that as a fast, non-blocking
   motion (it can still be heading for the shelf while the next round loads) —
   but the player's attention isn't held for it. The moment is the snap, not the
   journey.

`MasterySeal`'s wax-press choreography (blob → stamp → squash → lift → label) is
more sequence than this beat wants; if used at all, it should be compressed hard
or reduced to a single frame of "sealed" rather than played out in full.

**This replaces** the existing twelve-phase sequence: word crash, cracks, gold
seed spawn, seed flight, landing bloom. One clean beat, not five objects doing
five things and not the five-step close/drop/stamp/shrink/shelve version drafted
July 23 either.

### C7. Haunt — *revised July 25*

The mirror. Same principle — one decisive beat, opposite shape and destination.

1. **The book shakes** — refuses the word, doesn't accept it.
2. **One decisive drain-and-thud beat, ~400–600ms:** the colour drains out of
   the book in a single fast beat, not a lingering fade. It goes ghosted — dead,
   in her grip. A dull thud, not a flash.
3. **It does not travel.** No Vault. It sits there drained, because the word
   never got banked. Then she gloats (C8).

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

**No stamp on the loss.** The asymmetry is the point: master *gains* a seal of
light, loss *drains* its colour out. One is addition, one is subtraction — and
now both happen in one beat apiece, so the asymmetry reads clean instead of
getting buried in two long, similar-length sequences.

Same duration as master (~400–600ms). Symmetric brevity is what makes the mirror
read as a mirror rather than as a win and a shrug.

**No particles on either ending.** Dead concepts: golden expanding ring (killed
twice), generic omnidirectional multicolour scatter, flat-rectangle radial shard
burst ("birthday cake confetti").

### C8. She reacts after, not during

The snap/drain is the mechanism. Her outrage or her gloating is the punchline a
beat later. That separation is where the comedy is — and it matters more now
that the beat itself is short: the joke needs somewhere to land once the
mechanism has already resolved.

`BINGO BANGO ZZZZINGO!` is **unassigned** as of July 23 — removed from the
mastery sequence, not retired. Pete may place it elsewhere. It previously fired
three staggered stingers at +2600ms in `triggerMastered` and was the only reason
the boss sequence ran 4300ms vs 3450ms for a normal word. With C6/C7 both now
targeting a single sub-second beat, there's no slot left in the ending itself for
a staggered three-stinger sequence — if Pete wants it, it belongs in the
post-beat reaction (C8), not the mechanism. `CLAUDE.md` still lists it under
never-change text and must be corrected.

---

## Part D — Implementation phases — *revised July 25*

Each phase ends `tsc --noEmit` exit 0, device test, `git tag`.

**Architecture note:** the July 23 draft targeted `MaskBoard.tsx` throughout,
because the boss step rendered through it. Since then, the boss step was forked
onto its own `BossBoard.tsx` (same `useBoardMechanics` hook, currently sharing
MaskBoard's face code via an inert `isBossStage` flag — see git history on
`play-screen-overhaul`). The divergence this spec calls for (C1's room, C5's
book-material cards, C6/C7's boss-only ceremony shape) is now large enough that
boss presentation should live as **BossBoard's own render body**, not as
`isBossStage` conditionals sprinkled through the shared presenter — that would
recreate the exact tangled-conditionals problem the fork was meant to avoid.
Practical effect: from Phase 1 on, work targets `BossBoard.tsx` directly, reusing
`useBoardMechanics` and copying/adapting the shared presenter's `perform.*`
wiring pattern rather than editing it in place. `MaskBoard.tsx` should not need
further boss-conditional changes after this point. BossBoard and MaskBoard are
both warroom-gated; the July 23 pass covers all of the below.

**Phase 1 — Restorations.** Un-clip kicker; red flash on boss; `nearMastery` on
boss. Pure restoration, no new design. `BossBoard.tsx`.

**Phase 2 — Sealed, then lit.** Boss word dark base → gold fill via existing
`goldTextOpacity`; `FoilWord` end state; remove the dead overlay from ordinary
words (`MaskBoard.tsx`, since that overlay is shared-presenter code that never
needs to exist on the boss path once BossBoard has its own body). `BossBoard.tsx`,
possibly `pwTheme.ts` for the unlit tone.

**Phase 3 — The gauntlet card.** Drop `isSpecialSplit` from the gauntlet call;
book-material skin (leather/gold-leaf trim); height above `TILE_H`; one edge-glow
detail; real `N OF M` treatment. `BossBoard.tsx`, `SwipeMask.tsx`.

**Phase 4 — The Vault opens.** Book holds open for the gauntlet; tiles emerge
from it. `BossBoard.tsx`, `HeroBook.tsx`.

**Phase 5 — Both endings.** Build the one-beat master (snap-and-seal) and the
one-beat haunt (drain-and-thud) described in C6/C7; remove BINGO/BANGO from the
mastery sequence. Smaller than the July 23 draft's five-step version, but still
do it last, once C3–C5 exist to give the beat something to pay off.
`BossBoard.tsx`.

**Phase 6 — Her room.** Ember/tension-driven ambient register from C1.
Standalone, can land any time — good candidate for Phase 1 alongside the
restorations, since both are additive and low-risk.

---

## Part E — Open items

- **Unlit tone for the boss word** — `goldDark` `#8F6F18` is the starting
  proposal; needs device tuning.
- **Exact ember palette for C1** — "deep amber-rust into the existing indigo" is
  the direction; specific values need device tuning against the tension-vignette
  system's existing colours.
- **`FoilWord` on the boss** — the end state of C3 implies it. Needs a check that
  the three-layer offsets scale correctly at 112px (the component derives them
  from `fontSize`, so it should, but it has only ever run at 96).
- **`POLLY'S VAULT` label removal** — three instances outstanding, already on
  Pete's priority list. Blocked on nothing now that the book is yours.
- **Her reaction copy** after each ending — belongs to the joint writing pass
  alongside haunt re-theme, run-language, and wrong-swipe copy. More load-bearing
  now that C8 explicitly needs somewhere for the joke to land post-beat.
- **`pwEffects.ts` unread** — deliberately. The direction is no particles, so its
  shard configs don't apply to this spec.
- **Book-material asset for the gauntlet card (C5)** — "leather/gold-leaf trim"
  is the direction; whether this needs new art or can be built from existing
  `libraryMaterial`/`HeroBook` tokens needs an implementation-time check.
