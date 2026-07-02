# POLYWORDS — Polly Performance Layer (Living Rig) Design

### Date: 2026-07-02 · Status: Approved for planning

---

## Problem

Polly is the antagonist — she should feel alive, cracking comments and laughing at
the player intermittently. Today she is delivered three different ways, and the one
the player actually sees is the weakest:

- `PollyDailyPerch` (used in Daily now): crossfades between **static** `.webp` poses +
  a speech bubble. Reads as pasted-on sprites.
- `PollyActor` flipbook path: static pose per state (Hunt, currently hidden).
- `PollyRig`: a real **13-part layered puppet** with convincing idle micro-animation
  (breath, blink, glance, tail/wing) — but it only supports `state: 'idle'`.

The living version exists but does not react, talk, or drive the on-screen Polly.
This spec defines a **Polly Performance Layer** that makes the rig the single, living
Polly across the game, starting with the Daily perch.

## Approach decision

**Chosen: code-driven rig puppet.** Animate the existing 13 rig parts with RN Animated
transforms (the same technique the idle rig already uses), event-driven.

Why:
- The expensive 80% is done (parts cut, idle proven to read as alive).
- Turns "animate Polly" from an art problem into a **code** problem — deterministic,
  tunable, no drawing frames.
- Fits the project's locked animation rules exactly: RN Animated only,
  `useNativeDriver: true` on transform/opacity, no Reanimated outside `SwipeMask`,
  no new dependencies, no babel changes.

Alternatives rejected:
- **Frame-by-frame sprite art** — heavy, ongoing solo art burden; larger bundle.
  Art is exactly where production is currently stuck.
- **Rive / Lottie** — best motion quality, but a new native dependency + a new tool to
  learn and produce in, stepping outside the minimal RN-Animated setup. Possible future
  upgrade, not now.

## Architecture

Separate **what she does** (choreography, as data) from **how she's drawn** (renderer)
from **when it fires** (game triggers). Three focused files:

1. **`app/animations/pollyPerformances.ts` — choreography as declarative data.**
   Each performance is a list of *tracks*: `{ driver, keys: [{ to, dur, easing?, delay? }], loop? }`.
   `idle` is the always-on ambient set. Reactions are one-shot track sets. This is where
   feel is tuned, without touching component code. Example shape:
   ```ts
   laugh: [
     { driver: 'headThrow', keys: [{ to: 1, dur: 140 }, { to: 0, dur: 380 }] },
     { driver: 'beakOpen',  keys: [/* flap x3 */] },
     { driver: 'bodyShake', keys: [/* rapid */] },
     { driver: 'tailFlare', keys: [{ to: 1, dur: 160 }, { to: 0, dur: 300 }] },
   ]
   ```

2. **`app/components/PollyRig.tsx` — dumb renderer + small runner.**
   Owns one `Animated.Value` per **driver**, maps drivers → part transform styles (as it
   does today), and runs choreography: idle tracks loop forever; when the `performance`
   prop changes, play that performance's tracks on top, then return to idle.

3. **`app/components/PollyActor.tsx` — the single entry point.**
   `<PollyActor performance="laugh" speaking={true} />`. Positions/anchors the rig and
   routes to it. The legacy static-webp path is retired over time.

### Driver model + layering

Drivers are `Animated.Value`s the rig maps to part transforms.

- **Ambient (exist):** `bodyBob`, `headTilt`, `crownBob`, `pupilGlance`, `blinkScaleY`,
  `tailFlick`, `wingTwitch`.
- **Reaction (new):** `headThrow` (laugh head-back rotate), `beakOpen` (mouth hinge on
  `beakLower`, optional `beakUpper` lift), `bodyShake` (rapid small translateX),
  `wingSpread` (bigger wing rotate for taunt/laugh), `scalePop` + `recoil` (shocked),
  `sulkDroop` (optional).
- **Whole-rig (for future entrances):** `rigTranslateX/Y`, `rigRotate`, `rigScale`.

**Layering rule (core):** reaction drivers rest at `0` (no visual effect) and animate up
then back to `0`, while idle keeps running underneath. So (a) she is never a frozen statue
between beats, and (b) reactions compose with breathing/blinking instead of fighting them.
A new performance **interrupts** the current one: snap active reaction drivers back to `0`,
then play the new tracks.

## Behavior vocabulary (Daily v1)

- **idle** — ambient set, always running.
- **talk** — beak hinge opens/closes (~200ms cycle) + tiny head bob, **looping while
  `speaking` is true**. Silent, cosmetic (see Audio). This is the "spoken at you" feel.
- **smug** (first miss / lost chance — line *"Sharp as a butter knife."*) — head tilt +
  brow drop + a single beak "hmph", then talks the line.
- **laugh** (loss / out of lives — line *"CAN'T BEAT THAT WITH A BAT."*) — head throws
  back, beak flaps, body shake, tail flare. The big beat.
- **shocked** (win — line *"WON'T HAPPEN TOMORROW."*) — fast recoil + scale pop + rapid
  blink, then annoyed talk.

### Talking is a separate axis, not a pose

A `speaking` boolean drives the beak-flap loop independently of `performance`, so any
performance can talk. Bubble visible ⇒ `speaking` true; bubble gone ⇒ beak rests. Comments
are text-only, so this is silent — the mouth-moves-with-the-textbox convention. It sells
delivery without any voiced audio.

## Audio

Comments are silent text bubbles. The only audio is two existing laugh SFX, fired
**together with the rig beat** so sound and motion land as one punch:

- **Wrong / lost a chance** → `playSfx('pollySqwawkShort')` (quick squawk) + `smug`.
- **Out of lives / loss** → `playSfx('pollySqwawkLaugh')` ("HA HA") + `laugh`.

Escalation jab → full laugh. No audio tied to the silent `talk` flap.

## Daily integration (surgical)

`PollyDailyPerch` already owns the good bones: slide up/down, `reaction` prop, speech
bubble, 2500ms auto-dismiss. Keep all of it. Only change:

- Replace the A/B **static-image crossfade** with `<PollyActor performance={…} speaking={bubbleVisible} />`.
- Map existing reactions → performances: `happy → smug`, `laughing → laugh`,
  `shocked → shocked`, none → `idle`.
- Fire the laugh SFX on the reaction (per Audio) — confirm no double-fire with any
  existing call sites.
- Anchor to the existing bottom-right perch slot, sized to the rig
  (`POLLY_RIG_SIZE` 210 + inner scale) so she lands where she does now.
- Keep the perch slide-up as her arrival for v1.

## Scope / YAGNI (v1 = Daily only)

- Performances: `idle`, `talk`, `smug`, `laugh`, `shocked`. (Defer `taunt`, `sulk`,
  `flyIn`/`flyOut`.)
- **No new art.** Use the split beak hinge for the mouth. Add a dedicated "open beak"
  part later *only if* the hinge reads weak on device.
- Full fly-in/out arcs deferred to the Hunt pass.
- Do not touch `SwipeMask.tsx` or the Reanimated boundary.

## Testing

The choreography **runner / state machine** is unit-testable, separated from rendering:
- Correct tracks scheduled per performance.
- Interrupt cancels the current performance cleanly and starts the new one.
- Returns to `idle` after a one-shot performance completes.
- `talk` loop starts/stops with `speaking`.
- Each laugh SFX fires once per beat (no double-fire).

Actual feel is validated by device video (existing screenshot/video loop). Run
`npx.cmd tsc --noEmit`, `git diff --check`, `git status --short` after each patch.

## Reuse in Hunt (future, separate pass)

Same `PollyActor`, plus `flyIn`/`flyOut` whole-rig arcs (reuse the `usePollyAnimator`
arc concept) and the Hunt trigger map (`perchSmug`, `perchLaughing`, `perchShocked`, …)
→ these same performances, with the same two SFX on wrong / out-of-lives.

## Risks

- Flat cut-out parts can look papery if motion is overdone — mitigate with layered small
  secondary motions and snappy beats (idle already avoids this).
- Beak hinge may not read as a wide laughing mouth — fallback is one optional "open beak"
  part variant.
- Pivot/`transformOrigin` tuning per new driver is fiddly — expect device iteration.

---

*Polly Performance Layer design · POLYWORDS · 2026-07-02*
