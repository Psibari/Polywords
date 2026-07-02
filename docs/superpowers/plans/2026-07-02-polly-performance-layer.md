# Polly Performance Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, batch with checkpoints) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Polly a single living rig actor that idles, reacts (smug/laugh/shocked), and silently "talks" (beak flap while a bubble is up), starting with the Daily perch.

**Architecture:** Declarative choreography data (`pollyPerformances.ts`) → driver-based rig renderer + runner (`PollyRig.tsx`) → single actor entry point (`PollyActor.tsx`) → surgical swap inside `PollyDailyPerch.tsx` (keep bubble/slide/dismiss wiring, replace the static-image crossfade with the rig, add `speaking` + laugh SFX).

**Tech Stack:** React Native Animated API, `useNativeDriver: true` (transform/opacity only), expo-image, expo-audio via existing `playSfx()`.

## Global Constraints

- RN Animated only; `useNativeDriver: true` restricted to transform + opacity. Verbatim from CLAUDE.md.
- No Reanimated outside `SwipeMask.tsx`; do not import it here.
- No new dependencies; `babel.config.js` stays presets-only.
- No new art in v1 — use existing 13 rig parts; beak hinge = mouth.
- Reaction drivers rest at `0` and return to `0`; idle loops forever underneath.
- Laugh SFX keys (exist): `pollySqwawkShort` (squawk, wrong/lost chance), `pollySqwawkLaugh` ("HA HA", out of lives/loss).
- Verification per task: `npx.cmd tsc --noEmit` green, `git diff --check`, `git status --short`. Feel is validated on device (not in this session).
- Locked lines: smug = "Sharp as a butter knife." / laugh = "CAN'T BEAT THAT WITH A BAT." / shocked = "WON'T HAPPEN TOMORROW." (already in `pwDailyMaterials.ts`).

---

### Task 1: Choreography data + types (`pollyPerformances.ts`)

**Files:**
- Create: `app/animations/pollyPerformances.ts`

**Interfaces:**
- Produces:
  - `type PollyDriver` — union of driver names: `'bodyBob' | 'headTilt' | 'crownBob' | 'pupilGlance' | 'blink' | 'tailFlick' | 'wingTwitch' | 'headThrow' | 'beakOpen' | 'bodyShake' | 'wingSpread' | 'scalePop' | 'recoil'`
  - `type PerformanceName = 'idle' | 'smug' | 'laugh' | 'shocked'`
  - `type Keyframe = { to: number; dur: number; delay?: number; easing?: 'linear' | 'inOut' | 'out' }`
  - `type Track = { driver: PollyDriver; keys: Keyframe[]; loop?: boolean }`
  - `const IDLE_TRACKS: Track[]` — the always-on ambient set (port existing idle timings).
  - `const PERFORMANCES: Record<Exclude<PerformanceName,'idle'>, Track[]>` — one-shot reaction track sets.
  - `const TALK_TRACK: Track` — looping `beakOpen` flap for `speaking`.

- [ ] **Step 1: Create the file with types + data**

```ts
// app/animations/pollyPerformances.ts
export type PollyDriver =
  | 'bodyBob' | 'headTilt' | 'crownBob' | 'pupilGlance' | 'blink'
  | 'tailFlick' | 'wingTwitch'
  | 'headThrow' | 'beakOpen' | 'bodyShake' | 'wingSpread'
  | 'scalePop' | 'recoil';

export type PerformanceName = 'idle' | 'smug' | 'laugh' | 'shocked';

export type Keyframe = {
  to: number;
  dur: number;
  delay?: number;
  easing?: 'linear' | 'inOut' | 'out';
};

export type Track = {
  driver: PollyDriver;
  keys: Keyframe[];
  loop?: boolean;
};

// Ambient life — loops forever underneath everything (ported from PollyRig idle).
export const IDLE_TRACKS: Track[] = [
  { driver: 'bodyBob', loop: true, keys: [
    { to: -1.25, dur: 1600, easing: 'inOut' }, { to: 0, dur: 1600, easing: 'inOut' } ] },
  { driver: 'headTilt', loop: true, keys: [
    { to: 1, dur: 1400, delay: 700, easing: 'inOut' }, { to: 0, dur: 1200, delay: 900, easing: 'inOut' },
    { to: -1, dur: 1400, delay: 1300, easing: 'inOut' }, { to: 0, dur: 1200, delay: 900, easing: 'inOut' } ] },
  { driver: 'crownBob', loop: true, keys: [
    { to: -1.75, dur: 1450, delay: 320, easing: 'inOut' }, { to: 0, dur: 1250, delay: 0, easing: 'inOut' },
    { to: 0, dur: 180 } ] },
  { driver: 'pupilGlance', loop: true, keys: [
    { to: 1.25, dur: 220, delay: 2600, easing: 'out' }, { to: 0, dur: 260, delay: 750, easing: 'out' },
    { to: 0, dur: 3600 } ] },
  { driver: 'blink', loop: true, keys: [
    { to: 1, dur: 55, delay: 3200 }, { to: 0, dur: 75, delay: 45 }, { to: 0, dur: 2100 } ] },
  { driver: 'tailFlick', loop: true, keys: [
    { to: 1, dur: 280, delay: 4300, easing: 'out' }, { to: -0.35, dur: 320, easing: 'inOut' },
    { to: 0, dur: 300, easing: 'inOut' }, { to: 0, dur: 2200 } ] },
  { driver: 'wingTwitch', loop: true, keys: [
    { to: 1, dur: 130, delay: 6200, easing: 'out' }, { to: 0, dur: 220, easing: 'inOut' },
    { to: 0, dur: 3100 } ] },
];

// One-shot reactions. Reaction drivers rest at 0 and return to 0.
export const PERFORMANCES: Record<Exclude<PerformanceName, 'idle'>, Track[]> = {
  smug: [
    { driver: 'headThrow', keys: [{ to: -0.4, dur: 180, easing: 'out' }, { to: 0, dur: 420, delay: 300, easing: 'inOut' }] },
    { driver: 'beakOpen',  keys: [{ to: 0.5, dur: 120 }, { to: 0, dur: 160, delay: 120 }] },
    { driver: 'wingSpread', keys: [{ to: 0.35, dur: 200, easing: 'out' }, { to: 0, dur: 380, delay: 200, easing: 'inOut' }] },
  ],
  laugh: [
    { driver: 'headThrow', keys: [{ to: 1, dur: 140, easing: 'out' }, { to: 0.5, dur: 160 }, { to: 1, dur: 150 }, { to: 0, dur: 360, delay: 120, easing: 'inOut' }] },
    { driver: 'beakOpen',  keys: [{ to: 1, dur: 90 }, { to: 0.2, dur: 90 }, { to: 1, dur: 90 }, { to: 0.2, dur: 90 }, { to: 1, dur: 90 }, { to: 0, dur: 150, delay: 120 }] },
    { driver: 'bodyShake', keys: [{ to: 1, dur: 70 }, { to: -1, dur: 70 }, { to: 1, dur: 70 }, { to: -0.6, dur: 70 }, { to: 0, dur: 120 }] },
    { driver: 'tailFlick', keys: [{ to: 1, dur: 160, easing: 'out' }, { to: 0, dur: 320, delay: 200, easing: 'inOut' }] },
    { driver: 'wingSpread', keys: [{ to: 0.7, dur: 150, easing: 'out' }, { to: 0, dur: 420, delay: 250, easing: 'inOut' }] },
  ],
  shocked: [
    { driver: 'recoil',   keys: [{ to: 1, dur: 90, easing: 'out' }, { to: 0, dur: 520, delay: 160, easing: 'inOut' }] },
    { driver: 'scalePop', keys: [{ to: 1, dur: 90, easing: 'out' }, { to: 0, dur: 300, delay: 80, easing: 'inOut' }] },
    { driver: 'blink',    keys: [{ to: 1, dur: 45 }, { to: 0, dur: 55, delay: 40 }, { to: 1, dur: 45, delay: 60 }, { to: 0, dur: 55, delay: 40 }] },
    { driver: 'beakOpen', keys: [{ to: 0.9, dur: 90, easing: 'out' }, { to: 0, dur: 260, delay: 140 }] },
  ],
};

// Silent talk loop — flaps the beak while a bubble is up (cosmetic delivery).
export const TALK_TRACK: Track = {
  driver: 'beakOpen', loop: true,
  keys: [{ to: 0.55, dur: 110, easing: 'inOut' }, { to: 0.05, dur: 130, easing: 'inOut' }, { to: 0.4, dur: 120, easing: 'inOut' }, { to: 0.05, dur: 150, easing: 'inOut' }],
};
```

- [ ] **Step 2: Verify types compile**

Run: `npx.cmd tsc --noEmit`
Expected: PASS (no errors referencing pollyPerformances.ts)

- [ ] **Step 3: Commit**

```bash
git add app/animations/pollyPerformances.ts
git commit -m "Add Polly performance choreography data + driver types"
```

---

### Task 2: Rig renderer + runner (`PollyRig.tsx`)

**Files:**
- Modify: `app/components/PollyRig.tsx` (full rework of the animation section; keep parts/pivots/layout)

**Interfaces:**
- Consumes: `PollyDriver`, `PerformanceName`, `IDLE_TRACKS`, `PERFORMANCES`, `TALK_TRACK` from Task 1.
- Produces: `PollyRig` props `{ performance: PerformanceName; speaking?: boolean }`; still exports `POLLY_RIG_SIZE`, `POLLY_RIG_INNER_SCALE`.

- [ ] **Step 1: Rework PollyRig**

Replace the props, the `Animated.Value` set, the effect, and the part-style mapping. Keep `POLLY_RIG_LAYER_ORDER` render loop, `styles`, and all existing pivots; ADD pivots for new motions where needed (beakLower hinge, whole-rig recoil/scale).

```tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { Image } from 'expo-image';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import {
  POLLY_RIG_LAYER_ORDER, POLLY_RIG_PARTS, PollyRigPartName,
} from '../animations/pollyRigParts';
import {
  IDLE_TRACKS, PERFORMANCES, TALK_TRACK, PollyDriver, PerformanceName, Track,
} from '../animations/pollyPerformances';

type PollyRigProps = { performance: PerformanceName; speaking?: boolean };

export const POLLY_RIG_SIZE = 210;
export const POLLY_RIG_INNER_SCALE = 1.45;

const HEAD_PARTS = new Set<PollyRigPartName>(['head','bandana','brow','beakUpper','beakLower']);

const EASINGS = {
  linear: Easing.linear,
  inOut: Easing.inOut(Easing.quad),
  out: Easing.out(Easing.quad),
};

export function PollyRig({ performance, speaking = false }: PollyRigProps) {
  // one Animated.Value per driver
  const drivers = useRef<Record<PollyDriver, Animated.Value>>({
    bodyBob: new Animated.Value(0), headTilt: new Animated.Value(0), crownBob: new Animated.Value(0),
    pupilGlance: new Animated.Value(0), blink: new Animated.Value(0), tailFlick: new Animated.Value(0),
    wingTwitch: new Animated.Value(0), headThrow: new Animated.Value(0), beakOpen: new Animated.Value(0),
    bodyShake: new Animated.Value(0), wingSpread: new Animated.Value(0), scalePop: new Animated.Value(0),
    recoil: new Animated.Value(0),
  }).current;

  const trackToAnim = useMemo(() => (track: Track): Animated.CompositeAnimation => {
    const v = drivers[track.driver];
    const seq = track.keys.map((k) =>
      Animated.timing(v, {
        toValue: k.to, duration: k.dur, delay: k.delay ?? 0,
        easing: EASINGS[k.easing ?? 'inOut'], useNativeDriver: true,
      }),
    );
    const chain = Animated.sequence(seq);
    return track.loop ? Animated.loop(chain) : chain;
  }, [drivers]);

  // Ambient idle — always running.
  useEffect(() => {
    const anims = IDLE_TRACKS.map(trackToAnim);
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [trackToAnim]);

  // One-shot performances layered on top; return reaction drivers to 0.
  useEffect(() => {
    if (performance === 'idle') return;
    const anims = PERFORMANCES[performance].map(trackToAnim);
    anims.forEach((a) => a.start());
    return () => {
      anims.forEach((a) => a.stop());
      (['headThrow','bodyShake','wingSpread','scalePop','recoil'] as PollyDriver[])
        .forEach((d) => Animated.timing(drivers[d], { toValue: 0, duration: 140, useNativeDriver: true }).start());
    };
  }, [performance, trackToAnim, drivers]);

  // Talk loop — beak flap while speaking.
  useEffect(() => {
    if (!speaking) return;
    const anim = trackToAnim(TALK_TRACK);
    anim.start();
    return () => {
      anim.stop();
      Animated.timing(drivers.beakOpen, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    };
  }, [speaking, trackToAnim, drivers]);

  // Interpolations
  const headRotate = Animated.add(
    drivers.headTilt.interpolate({ inputRange: [-1, 1], outputRange: [-1.5, 1.5] }),
    drivers.headThrow.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }),
  ).interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] });
  const tailRotate = Animated.add(
    drivers.tailFlick.interpolate({ inputRange: [-1, 1], outputRange: [-1.25, 1.25] }),
    drivers.wingTwitch.interpolate({ inputRange: [0, 0], outputRange: [0, 0] }),
  ).interpolate({ inputRange: [-1.25, 1.25], outputRange: ['-1.25deg', '1.25deg'] });
  const beakLowerY = drivers.beakOpen.interpolate({ inputRange: [0, 1], outputRange: [0, POLLY_RIG_SIZE * 0.045] });
  const wingLeftRotate = Animated.add(
    drivers.wingTwitch.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }),
    drivers.wingSpread.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
  ).interpolate({ inputRange: [-11, 0], outputRange: ['-11deg', '0deg'] });
  const wingRightRotate = Animated.add(
    drivers.wingTwitch.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    drivers.wingSpread.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
  ).interpolate({ inputRange: [0, 11], outputRange: ['0deg', '11deg'] });
  const blinkScaleY = drivers.blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.06] });
  const bodyShakeX = drivers.bodyShake.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  const recoilY = drivers.recoil.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const rigScale = drivers.scalePop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  function animatedPartStyle(partName: PollyRigPartName): any {
    if (partName === 'crown') return { transform: [{ rotate: headRotate }, { translateY: drivers.crownBob }] };
    if (partName === 'eyeWhite') return { transform: [{ rotate: headRotate }, { scaleY: blinkScaleY }] };
    if (partName === 'pupil') return { transform: [{ rotate: headRotate }, { translateX: drivers.pupilGlance }, { scaleY: blinkScaleY }] };
    if (partName === 'beakLower') return { transform: [{ rotate: headRotate }, { translateY: beakLowerY }] };
    if (partName === 'tail') return { transform: [{ rotate: tailRotate }] };
    if (partName === 'wingLeft') return { transform: [{ rotate: wingLeftRotate }] };
    if (partName === 'wingRight') return { transform: [{ rotate: wingRightRotate }] };
    if (HEAD_PARTS.has(partName)) return { transform: [{ rotate: headRotate }] };
    return undefined;
  }

  function pivotStyle(partName: PollyRigPartName): ViewStyle | undefined {
    if (partName === 'head' || HEAD_PARTS.has(partName)) return styles.headPivot;
    if (partName === 'crown') return styles.crownPivot;
    if (partName === 'eyeWhite' || partName === 'pupil') return styles.eyePivot;
    if (partName === 'beakLower') return styles.beakPivot;
    if (partName === 'tail') return styles.tailPivot;
    if (partName === 'wingLeft') return styles.wingLeftPivot;
    if (partName === 'wingRight') return styles.wingRightPivot;
    return undefined;
  }

  return (
    <Animated.View pointerEvents="none" style={styles.container} testID={`polly-rig-${performance}`}>
      <Animated.View style={[styles.innerRig, {
        transform: [
          { translateX: bodyShakeX }, { translateY: Animated.add(drivers.bodyBob, recoilY) },
          { scale: Animated.multiply(rigScale, new Animated.Value(POLLY_RIG_INNER_SCALE)) },
        ],
      }]}>
        {POLLY_RIG_LAYER_ORDER.map((partName) => (
          <Animated.View key={partName} style={[styles.partLayer, pivotStyle(partName), animatedPartStyle(partName)]}>
            <Image source={POLLY_RIG_PARTS[partName]} style={styles.partImage} contentFit="contain" />
          </Animated.View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}
```

Keep the existing `styles` block; ADD a `beakPivot` (hinge near the beak joint):

```tsx
  beakPivot: {
    transformOrigin: [ (POLLY_RIG_SIZE * 250) / 512, (POLLY_RIG_SIZE * 235) / 512, 0 ],
  },
```

- [ ] **Step 2: Verify compile**

Run: `npx.cmd tsc --noEmit`
Expected: PASS. If `Animated.add(...).interpolate` typing complains, wrap operands so each is an `Animated.AnimatedInterpolation<number>` (they are) — no `as any` on transforms.

- [ ] **Step 3: Commit**

```bash
git add app/components/PollyRig.tsx
git commit -m "Rework PollyRig into driver-based renderer + performance runner"
```

---

### Task 3: Actor entry point (`PollyActor.tsx`)

**Files:**
- Modify: `app/components/PollyActor.tsx`

**Interfaces:**
- Consumes: `PollyRig`, `PerformanceName`.
- Produces: `PollyActor` props `{ performance: PerformanceName; speaking?: boolean; renderer?: 'flipbook' | 'rig' }` (default `renderer='rig'`).

- [ ] **Step 1: Route to the rig by performance**

Replace the rig branch to pass `performance`/`speaking`; keep flipbook branch behind the existing `renderer` prop for the not-yet-migrated Hunt path. Map the legacy `PollyAnimationState` flipbook only when `renderer==='flipbook'`.

```tsx
type PollyActorProps = {
  performance: PerformanceName;
  speaking?: boolean;
  renderer?: 'flipbook' | 'rig';
  flipbookState?: PollyAnimationState; // only used by legacy flipbook
};

export function PollyActor({ performance, speaking = false, renderer = 'rig', flipbookState = 'idle' }: PollyActorProps) {
  return (
    <View pointerEvents="none" style={[styles.overlay, renderer === 'rig' ? styles.rigOverlay : styles.flipbookOverlay]}>
      {renderer === 'rig'
        ? <PollyRig performance={performance} speaking={speaking} />
        : (<Image key={flipbookState} source={POLLY_ANIMATIONS[flipbookState]} style={styles.polly} contentFit="contain" autoplay recyclingKey={flipbookState} />)}
    </View>
  );
}
```

Update the `GameScreen.tsx` rig-test call site (`<PollyActor state="idle" renderer="rig" />`) to `<PollyActor performance="idle" renderer="rig" />` and the device-test overlay to pass `flipbookState`. (Both behind `SHOW_POLLY_*` flags = false, so no runtime change.)

- [ ] **Step 2: Verify compile**

Run: `npx.cmd tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/components/PollyActor.tsx app/screens/GameScreen.tsx
git commit -m "PollyActor: performance/speaking props, default to living rig"
```

---

### Task 4: Daily perch integration (`PollyDailyPerch.tsx`)

**Files:**
- Modify: `app/components/PollyDailyPerch.tsx`

**Interfaces:**
- Consumes: `PollyActor` (rig), `PerformanceName`, `playSfx`.
- Produces: same component contract `{ reaction: DailyPollyReaction | null; show?: boolean }`.

- [ ] **Step 1: Replace static crossfade with the rig; drive performance + speaking + SFX**

Remove `IDLE_POSES`, `TRIGGER_POSE`, the A/B `poseA/poseB/opacityA/opacityB` crossfade, and `crossfadeTo`/`startIdleCycle`/`stopIdleCycle`. Keep: `slideY` show/hide, the bubble + `bubbleOpacity`, `getLine`, the 2500ms auto-dismiss. Add reaction→performance map, `speaking` state, and fire the laugh SFX once when a reaction begins.

```tsx
import { playSfx } from '../audio/sfx';
import { PollyActor } from './PollyActor';
import { PerformanceName } from '../animations/pollyPerformances';

const REACTION_TO_PERFORMANCE: Record<Exclude<DailyPollyReaction,'perched'>, PerformanceName> = {
  happy: 'smug', laughing: 'laugh', shocked: 'shocked',
};

// inside component:
const [performance, setPerformance] = useState<PerformanceName>('idle');
const [speaking, setSpeaking] = useState(false);

useEffect(() => {
  const isSpeaking = reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked';
  if (!isSpeaking) {
    setPerformance('idle'); setSpeaking(false);
    Animated.timing(bubbleOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    return;
  }
  setPerformance(REACTION_TO_PERFORMANCE[reaction as 'happy'|'laughing'|'shocked']);
  setSpeaking(true);
  if (reaction === 'laughing') playSfx('pollySqwawkLaugh');
  else playSfx('pollySqwawkShort'); // happy + shocked jab
  Animated.timing(bubbleOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  bubbleTimerRef.current = setTimeout(() => {
    Animated.timing(bubbleOpacity, { toValue: 0, duration: 220, useNativeDriver: true })
      .start(() => { setPerformance('idle'); setSpeaking(false); });
  }, 2500);
}, [reaction]); // eslint-disable-line react-hooks/exhaustive-deps
```

Replace the `pollyWrap` two-`Animated.Image` block with:

```tsx
<View style={styles.pollyWrap}>
  <PollyActor performance={performance} speaking={speaking} renderer="rig" />
</View>
```

Keep `styles.pollyWrap` sized for the rig (width/height 220 is fine; rig is 210 + inner scale). Remove now-unused `pollyImage`/`pollyImageB` styles and the `ImageSourcePropType`/`POLLY_ANIMATIONS` imports if unused.

- [ ] **Step 2: Verify compile + lint-clean unused imports**

Run: `npx.cmd tsc --noEmit`
Expected: PASS, no "declared but never used" from leftover pose code.

- [ ] **Step 3: Commit**

```bash
git add app/components/PollyDailyPerch.tsx
git commit -m "Daily perch: swap static crossfade for living rig + laugh SFX"
```

---

### Task 5: Device handoff notes (no code)

- [ ] **Step 1: Confirm full build is green**

Run: `npx.cmd tsc --noEmit && git status --short`
Expected: PASS, clean tree (all committed).

- [ ] **Step 2: Leave device-tuning notes** (in the final chat message, not a file):
  - Load Daily, trigger a wrong claim (smug + squawk), lose both chances (laugh + HA-HA), and win (shocked). Watch beak flap while bubbles are up.
  - Tuning knobs all live in `app/animations/pollyPerformances.ts` (timings/amounts) and the pivots in `PollyRig.tsx` (`beakPivot`, `headPivot`, etc.). No other files needed for feel.

---

## Self-Review

- **Spec coverage:** choreography data (T1), driver rig + runner + layering + talk (T2), single actor (T3), Daily swap + reaction map + SFX + kept bubble/slide/dismiss (T4), testing/handoff (T5). Fly-in/out + Hunt explicitly deferred per spec. ✓
- **Placeholders:** none — all steps carry real code. ✓
- **Type consistency:** `PollyDriver`/`PerformanceName`/`Track`/`Keyframe` defined in T1 and consumed unchanged in T2–T4; `PollyActor` prop `performance` consistent T3↔T4. ✓
- **Risk:** `Animated.add().interpolate()` composition is the main compile-risk spot (T2 Step 2 note). Reaction driver reset-to-0 lives in the performance effect cleanup.

---

*Polly Performance Layer plan · POLYWORDS · 2026-07-02*
