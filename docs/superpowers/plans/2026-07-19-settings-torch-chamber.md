# Settings Torch Chamber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Settings screen from a generic rounded-card list into an
authored torch-lit stone chamber, matching the material-world treatment every other
screen (Home, Vault, Daily) already has.

**Architecture:** A new `chamberMaterial` token set drives color; a new reusable
`TorchGlow` SVG component renders the flickering purple radial glow used in seven
background positions and two header accents; `SettingsScreen.tsx`'s flat background
is replaced with the commissioned `chamber-dark-mobile.png` art, and its section
cards are restyled from flat rectangles to carved-stone plaques. No store, logic, or
navigation changes anywhere.

**Tech Stack:** React Native, `react-native-svg` (RadialGradient/Circle — same
technique as `HeroBook.tsx`/`DailyRevealCurtain.tsx`), `expo-linear-gradient`,
`Animated` API (native driver, opacity only), existing `PW`/`pwMaterials` design
token system.

**Spec:** `docs/superpowers/specs/2026-07-19-settings-torch-chamber-design.md`

## Global Constraints

- Palette: every new color is `PW.color.*` or an existing `pwMaterials` value. No
  new hex literals. No orange, no green outside Polly's character art (there is
  none on this screen).
- Animation: `Animated.Value` opacity-only, `useNativeDriver: true`. Never mix
  drivers on one `Animated.Value`. Reduced motion (`useReducedMotionPreference()`
  from `app/hooks/usePollyAmbientMotion.ts`) freezes flicker to a static mid-opacity
  glow — never disables the glow outright.
- Scope: only `app/ui/pwMaterials.ts`, one new file `app/components/ui/TorchGlow.tsx`,
  and `app/screens/SettingsScreen.tsx` are touched. No changes to
  `useGameStore.ts`, `sfx.ts`, toggle behavior, navigation, or the Reset Progress
  confirmation flow.
- Verification: this project has no component-level test harness (its `.test.ts`
  files are pure game-logic units run via `tsx`, not RN component tests). Per
  `CLAUDE.md`'s own workflow, every task's check step is `npx tsc --noEmit`,
  `git diff --check`, and `git status --short` — not invented unit tests for JSX
  styling.
- Asset: `assets/images/settings/chamber-dark-mobile.png` already exists in the repo
  at 941×1672px (aspect ratio `941/1672` ≈ 0.5628). Torch anchor points below are
  measured from its actual pixels, not guessed.

---

## Task 1: `chamberMaterial` design tokens

**Files:**
- Modify: `app/ui/pwMaterials.ts` (append after the `stageMaterial` export at the
  end of the file)

**Interfaces:**
- Produces: `chamberMaterial.stoneShade` (rgba string), `chamberMaterial.plaqueFace`,
  `chamberMaterial.plaqueRim`, `chamberMaterial.plaqueRimStrong`,
  `chamberMaterial.torchGlow` (hex string, used as an SVG `stopColor`),
  `chamberMaterial.emberAccent` — all consumed by Tasks 2, 3, 5.

- [ ] **Step 1: Add the `chamberMaterial` export**

Append to the end of `app/ui/pwMaterials.ts` (after the closing `} as const;` of
`stageMaterial`):

```ts
// CHAMBER — Settings' torch-lit stone-corridor world (spec: 2026-07-19
// settings-torch-chamber). Purple flame, not orange — keeps gold reserved as the
// sparse focus-accent color (title text, toggle "on" state) instead of doubling as
// the ambient light source.
export const chamberMaterial = {
  stoneShade: 'rgba(6,4,22,0.55)',
  plaqueFace: PW.color.cardFace,
  plaqueRim: PW.color.cardRim,
  torchGlow: PW.color.lavender,
  emberAccent: PW.color.rose,
} as const;
```

Note: no `plaqueRimStrong`/pressed-state variant — `profileCard` and `card` are
plain `View`s, not `Pressable`s, so there's no pressed state to brighten. Only the
inner rows (`ToggleRow`, `PlaceholderRow`, etc.) are pressable, and they already
have their own `styles.pressed` opacity treatment, untouched by this plan.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors (the file only gained a new named export; nothing consumes
it yet).

- [ ] **Step 3: Verify diff and commit**

```bash
git diff --check
git status --short
git add app/ui/pwMaterials.ts
git commit -m "Add chamberMaterial design tokens for Settings torch chamber"
```

---

## Task 2: `TorchGlow` reusable component

**Files:**
- Create: `app/components/ui/TorchGlow.tsx`

**Interfaces:**
- Consumes: `chamberMaterial.torchGlow` (Task 1), `useReducedMotionPreference()`
  from `app/hooks/usePollyAmbientMotion.ts` (existing).
- Produces: `TorchGlow({ size = 64 }: { size?: number })` — a `size`×`size` box
  containing a flickering purple radial glow filling that box. Caller is
  responsible for positioning it (wrap in an absolutely-positioned `View` of the
  same `size`) — `TorchGlow` itself has no position/left/top props. Consumed by
  Tasks 3 and 4.

- [ ] **Step 1: Write the component**

Create `app/components/ui/TorchGlow.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useReducedMotionPreference } from '../../hooks/usePollyAmbientMotion';
import { chamberMaterial } from '../../ui/pwMaterials';

type Props = {
  size?: number;
};

const FLICKER_MIN = 0.55;
const FLICKER_MAX = 1;
const FLICKER_MS = 1400;

// A soft purple radial glow, sized to fill its container. Caller positions it by
// wrapping in an absolutely-positioned View of the same `size` — this component
// only draws the glow itself. Flicker is opacity-only (native driver) and freezes
// to a static mid glow under reduced motion, same pattern as usePollyAmbientMotion.
export function TorchGlow({ size = 64 }: Props) {
  const reduceMotion = useReducedMotionPreference();
  const opacity = useRef(new Animated.Value(FLICKER_MAX)).current;

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.setValue((FLICKER_MIN + FLICKER_MAX) / 2);
      return;
    }
    opacity.setValue(FLICKER_MAX);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: FLICKER_MIN,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: FLICKER_MAX,
          duration: FLICKER_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(FLICKER_MAX);
    };
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size, opacity }]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="torchGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={chamberMaterial.torchGlow} stopOpacity={0.34} />
            <Stop offset="1" stopColor={chamberMaterial.torchGlow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill="url(#torchGlow)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Verify diff and commit**

```bash
git diff --check
git status --short
git add app/components/ui/TorchGlow.tsx
git commit -m "Add reusable TorchGlow flickering radial-glow component"
```

---

## Task 3: Chamber background in `SettingsScreen.tsx`

**Files:**
- Modify: `app/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `chamberMaterial` (Task 1), `TorchGlow` (Task 2),
  `assets/images/settings/chamber-dark-mobile.png` (existing asset).
- Produces: `CHAMBER_ASPECT_RATIO` and `TORCH_POSITIONS` module constants,
  `chamberWidth`/`chamberHeight` local state — used only within this file.

- [ ] **Step 1: Update imports**

In `app/screens/SettingsScreen.tsx`, replace lines 1-10:

```ts
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { PollyAnimationDevViewer } from '../components/PollyAnimationDevViewer';
import { FONTS } from '../constants/fonts';
import { getRankTier } from '../game/ranks';
import { useGameStore } from '../store/useGameStore';
import { stageMaterial } from '../ui/pwMaterials';
import { PW } from '../ui/pwTheme';
```

with:

```ts
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { PollyAnimationDevViewer } from '../components/PollyAnimationDevViewer';
import { TorchGlow } from '../components/ui/TorchGlow';
import { FONTS } from '../constants/fonts';
import { getRankTier } from '../game/ranks';
import { useGameStore } from '../store/useGameStore';
import { chamberMaterial } from '../ui/pwMaterials';
import { PW } from '../ui/pwTheme';
```

- [ ] **Step 2: Add chamber constants**

Immediately after the imports (before `type ToggleRowProps = {`), add:

```ts
const CHAMBER_ASPECT_RATIO = 941 / 1672;
const chamberImage = require('../../assets/images/settings/chamber-dark-mobile.png');

// Anchor points measured from the source art's actual pixels (brightness-cluster
// scan of the PNG), not eyeballed. Percentages of the chamber image's own
// width/height, top-left origin.
const TORCH_POSITIONS = [
  { leftPct: 0.110, topPct: 0.310, sizePct: 0.16 }, // foreground L
  { leftPct: 0.897, topPct: 0.309, sizePct: 0.16 }, // foreground R
  { leftPct: 0.293, topPct: 0.422, sizePct: 0.11 }, // mid L
  { leftPct: 0.700, topPct: 0.422, sizePct: 0.11 }, // mid R
  { leftPct: 0.365, topPct: 0.480, sizePct: 0.08 }, // far L
  { leftPct: 0.615, topPct: 0.479, sizePct: 0.08 }, // far R
  { leftPct: 0.447, topPct: 0.535, sizePct: 0.07 }, // altar candle
] as const;
```

- [ ] **Step 3: Add chamber width state**

Inside `export default function SettingsScreen({ navigation }: Props) {`, right
after the existing `const [showPollyAnimations, setShowPollyAnimations] = useState(false);`
line, add:

```ts
  const [chamberWidth, setChamberWidth] = useState(0);
  const chamberHeight = chamberWidth / CHAMBER_ASPECT_RATIO;
```

- [ ] **Step 4: Replace the background JSX**

Replace:

```tsx
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.ambientWash} />
      <LinearGradient
        colors={[...stageMaterial.vignette]}
        locations={[...stageMaterial.vignetteLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
```

with:

```tsx
    <SafeAreaView style={styles.screen}>
      <View
        style={styles.chamberFrame}
        onLayout={e => setChamberWidth(e.nativeEvent.layout.width)}
      >
        <ImageBackground source={chamberImage} resizeMode="cover" style={StyleSheet.absoluteFillObject}>
          <View pointerEvents="none" style={styles.stoneShade} />
          {chamberWidth > 0 && TORCH_POSITIONS.map((t, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={[
                styles.torchAnchor,
                {
                  left: t.leftPct * chamberWidth - (t.sizePct * chamberWidth) / 2,
                  top: t.topPct * chamberHeight - (t.sizePct * chamberWidth) / 2,
                  width: t.sizePct * chamberWidth,
                  height: t.sizePct * chamberWidth,
                },
              ]}
            >
              <TorchGlow size={t.sizePct * chamberWidth} />
            </View>
          ))}
          <LinearGradient
            colors={['transparent', PW.color.bgDeep]}
            pointerEvents="none"
            style={styles.chamberFade}
          />
        </ImageBackground>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
```

- [ ] **Step 5: Replace the `ambientWash` style with chamber styles**

In the `StyleSheet.create({...})` block, replace:

```ts
  ambientWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: stageMaterial.purpleAmbient,
  },
```

with:

```ts
  chamberFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    aspectRatio: CHAMBER_ASPECT_RATIO,
    overflow: 'hidden',
  },
  stoneShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: chamberMaterial.stoneShade,
  },
  chamberFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  torchAnchor: {
    position: 'absolute',
  },
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`stageMaterial` is no longer imported or referenced anywhere
in this file — confirm no leftover reference by re-reading the diff.)

- [ ] **Step 7: Verify diff and commit**

```bash
git diff --check
git status --short
git add app/screens/SettingsScreen.tsx
git commit -m "Replace Settings flat background with torch-chamber art and glow"
```

---

## Task 4: Header torch accents

**Files:**
- Modify: `app/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `TorchGlow` (Task 2, already imported in Task 3).

- [ ] **Step 1: Replace the header glow JSX**

Replace:

```tsx
        <View style={styles.header}>
          <View style={styles.headerGlow} />
          <Text style={styles.kicker}>UTILITY</Text>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>Tune the hunt.</Text>
        </View>
```

with:

```tsx
        <View style={styles.header}>
          <View pointerEvents="none" style={styles.headerGlowLeft}>
            <TorchGlow size={72} />
          </View>
          <View pointerEvents="none" style={styles.headerGlowRight}>
            <TorchGlow size={72} />
          </View>
          <Text style={styles.kicker}>UTILITY</Text>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle}>Tune the hunt.</Text>
        </View>
```

- [ ] **Step 2: Replace the `headerGlow` style**

Replace:

```ts
  headerGlow: {
    position: 'absolute',
    right: -44,
    top: -58,
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 16,
    borderColor: PW.color.goldGlow,
  },
```

with:

```ts
  headerGlowLeft: {
    position: 'absolute',
    left: -20,
    top: 18,
    width: 72,
    height: 72,
  },
  headerGlowRight: {
    position: 'absolute',
    right: -20,
    top: 18,
    width: 72,
    height: 72,
  },
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify diff and commit**

```bash
git diff --check
git status --short
git add app/screens/SettingsScreen.tsx
git commit -m "Replace Settings header ring with flanking torch-glow accents"
```

---

## Task 5: Stone-plaque card restyle

**Files:**
- Modify: `app/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `chamberMaterial.plaqueFace`, `chamberMaterial.plaqueRim`,
  `chamberMaterial.plaqueRimStrong`, `chamberMaterial.emberAccent` (Task 1).

- [ ] **Step 1: Add the plaque top-highlight style**

In the `StyleSheet.create({...})` block, add a new entry (anywhere alongside the
other style keys, e.g. directly after `chamberFade`):

```ts
  plaqueHighlight: {
    position: 'absolute',
    top: 6,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: PW.color.cardInner,
    opacity: 0.5,
  },
```

- [ ] **Step 2: Restyle `profileCard`, `card`, and `warningCard`**

Replace:

```ts
  profileCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: PW.color.overlayHeavy,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    padding: 18,
  },
```

with:

```ts
  profileCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: chamberMaterial.plaqueFace,
    borderWidth: 1.5,
    borderColor: chamberMaterial.plaqueRim,
    padding: 18,
    overflow: 'hidden',
    ...PW.shadow.panel,
  },
```

Replace:

```ts
  card: {
    borderRadius: 18,
    backgroundColor: PW.color.overlayHeavy,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    overflow: 'hidden',
  },
  warningCard: {
    borderColor: PW.color.rose,
  },
```

with:

```ts
  card: {
    borderRadius: 18,
    backgroundColor: chamberMaterial.plaqueFace,
    borderWidth: 1.5,
    borderColor: chamberMaterial.plaqueRim,
    overflow: 'hidden',
    ...PW.shadow.panel,
  },
  warningCard: {
    borderColor: chamberMaterial.emberAccent,
  },
```

- [ ] **Step 3: Add the highlight line to the profile card**

Replace:

```tsx
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
```

with:

```tsx
        <View style={styles.profileCard}>
          <View pointerEvents="none" style={styles.plaqueHighlight} />
          <View style={styles.profileTop}>
```

- [ ] **Step 4: Add the highlight line to each `card` section**

There are five `<View style={styles.card}>` (or `warningCard`-combined) occurrences.
For each, add the highlight as the first child, immediately after the opening tag.

Game section — replace:

```tsx
          <View style={styles.card}>
            <ToggleRow
              label="Sound"
```

with:

```tsx
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <ToggleRow
              label="Sound"
```

Account section — replace:

```tsx
          <View style={styles.card}>
            <PlaceholderRow label="Profile" note="Lives in Settings for MVP" accent="gold" />
```

with:

```tsx
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <PlaceholderRow label="Profile" note="Lives in Settings for MVP" accent="gold" />
```

About section — replace:

```tsx
          <View style={styles.card}>
            <PlaceholderRow label="Credits" />
```

with:

```tsx
          <View style={styles.card}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <PlaceholderRow label="Credits" />
```

Development section (dev-only) — replace:

```tsx
            <View style={styles.card}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPollyAnimations(true)}
```

with:

```tsx
            <View style={styles.card}>
              <View pointerEvents="none" style={styles.plaqueHighlight} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPollyAnimations(true)}
```

Danger / Reset section — replace:

```tsx
          <View style={[styles.card, styles.warningCard]}>
            <Pressable
              onPress={handleResetProgress}
```

with:

```tsx
          <View style={[styles.card, styles.warningCard]}>
            <View pointerEvents="none" style={styles.plaqueHighlight} />
            <Pressable
              onPress={handleResetProgress}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Verify diff and commit**

```bash
git diff --check
git status --short
git add app/screens/SettingsScreen.tsx
git commit -m "Restyle Settings cards as carved stone plaques"
```

---

## Done Criteria

- All 5 tasks committed.
- `npx tsc --noEmit` clean on the final state.
- Visual check on-device/simulator (not automatable in this repo): chamber art
  fills the top of the screen behind the header and profile card, 7 purple glows
  flicker gently at the measured torch positions, header has two flanking glow
  accents in place of the old gold ring, and all five section-style cards
  (`Game`/`Account`/`About`/`Development`/`Danger`) read as carved stone plaques
  with a thin top bevel highlight. Danger section's border reads rose/ember, not
  the old flat red-adjacent tone.
