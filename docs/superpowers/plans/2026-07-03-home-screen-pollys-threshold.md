# Home Screen — Polly's Threshold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Home screen as Polly's threshold — full-bleed temple stage, foil POLYWORDS wordmark, live perched Polly with one greeting, ENTER THE HUNT dare, CARD-material Daily/Vault doors, no BottomNav.

**Architecture:** New token/copy file `pwHomeMaterials.ts` feeds a new whole-image perch component `PollyHomePerch.tsx` (thin sibling of the shipped `PollyDailyPerch`) and a rebuilt `HomeScreen.tsx`. All hexes come from `pwTheme`/`pwMaterials`/`pwHomeMaterials`; the background PNG stays, the logo PNG is dropped from use.

**Tech Stack:** Expo RN + TS strict, RN `Animated` (native driver, transform/opacity only), `react-native-svg`, `expo-linear-gradient`, existing `FoilWord` + `POLLY_POSES`.

**Spec:** `docs/superpowers/specs/2026-07-03-home-screen-pollys-threshold-design.md`

## Global Constraints

- Palette locks: gold `#F5C842`, purple `#7B2D8B`, Polly Green is Polly-only; max 2 gold focus elements (here: wordmark + ENTER THE HUNT).
- Legibility clause: no text under 14px; sizes land as tokens, never inline numbers.
- "Challenge" is reserved vocabulary for Daily Challenge; the main button is `ENTER THE HUNT`.
- RN `Animated` only; `useNativeDriver: true` → transform + opacity only; `setTimeout` between phases; Reanimated stays in SwipeMask.
- No new binary assets. `MaskBoard.tsx` / `SwipeMask.tsx` untouched. BottomNav untouched (Home just stops rendering it).
- Verify per patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- **Device screenshot required before the visual commit (Task 3).** Tasks 1–2 add unused files and may commit on tsc alone.
- Windows dev: use `npx.cmd`.

---

### Task 1: Home tokens + copy (`pwHomeMaterials.ts`) and dialogue bank entry

**Files:**
- Create: `app/ui/pwHomeMaterials.ts`
- Modify: `docs/POLLY_DIALOGUE_BANK.md` (append a Home Greetings section, matching the doc's existing formatting)

**Interfaces:**
- Produces: named exports `HOME_TAGLINE: string`, `HOME_GREETING_LINES: readonly string[]`, `homeType` (font-size tokens), `homeDare`, `homeDoor`, `homePerch` (const objects). Consumed by Tasks 2–3.

- [ ] **Step 1: Write the file**

```ts
// app/ui/pwHomeMaterials.ts
import { PW } from './pwTheme';
import { heroBookMaterial, libraryMaterial } from './pwMaterials';

// ── Copy ──
export const HOME_TAGLINE = 'Polly stole the meanings. Take them back.';

// Polly speech: mixed case, never uppercase. One line per app open, rotating.
export const HOME_GREETING_LINES = [
  'Back again?',
  'Miss me?',
  'Still missing a few meanings, aren’t you.',
  'Come to lose some feathers?',
  'The words asked about you. I lied.',
  'Take your time. They’re mine either way.',
] as const;

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const homeType = {
  wordmark: 68,          // width-driven via adjustsFontSizeToFit
  wordmarkTracking: 3,
  tagline: 18,
  dareLabel: 32,
  doorEyebrow: 14,
  doorTitle: 21,
  doorCopy: 15,
  greeting: 16,
  settingsLink: 14,
} as const;

// ── ENTER THE HUNT — gold dare in BOOK vocabulary ──
export const homeDare = {
  faceGradient: [PW.color.foilLight, PW.color.gold, PW.color.amber] as const,
  faceLocations: [0, 0.52, 1] as const,
  rim: PW.color.goldSoft,
  bottomEdge: PW.color.amber,
  label: PW.color.surfaceDeep,
  labelHighlight: 'rgba(255,255,255,0.38)',
  minHeight: 84,
} as const;

// ── Doors (CARD material trims) ──
export const homeDoor = {
  dailyTrim: PW.color.cardRim,               // gold at hairline strength only
  vaultTrim: heroBookMaterial.coverPurpleTop, // purple leather
  title: PW.color.white,
  copy: PW.color.softWhite,
  eyebrow: PW.color.mutedWhite,
  minHeight: 150,
} as const;

// ── Polly's stone ledge + perch geometry ──
export const homePerch = {
  ledgeTop: libraryMaterial.wood,        // warm stone family (Warmth clause)
  ledgeFace: libraryMaterial.woodDark,
  ledgeShadow: libraryMaterial.woodShadow,
  bottomOffset: 310,   // clears dare + doors + settings stack
  pollySize: 240,
  bubbleFace: '#1A1055',                 // matches Daily bubble material
  bubbleRim: 'rgba(245,200,66,0.55)',
  bubbleText: PW.color.foilLight,
} as const;
```

- [ ] **Step 2: Append to `docs/POLLY_DIALOGUE_BANK.md`** — a `## Home greetings (threshold, one per app open)` section listing the six lines above verbatim, with a note: "Rotating; delivered once per app session after fly-in; silent after."

- [ ] **Step 3: Verify**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/ui/pwHomeMaterials.ts docs/POLLY_DIALOGUE_BANK.md
git commit -m "Add Home threshold tokens, copy, and greeting lines"
```

---

### Task 2: `PollyHomePerch.tsx`

**Files:**
- Create: `app/components/PollyHomePerch.tsx`

**Interfaces:**
- Consumes: `POLLY_POSES` from `app/ui/pollyPoses` (keys `idle`, `fly`), `HOME_GREETING_LINES`, `homePerch`, `homeType` from Task 1, `FONTS` from `app/constants/fonts`.
- Produces: `export default function PollyHomePerch(): JSX.Element` — no props; absolutely positioned (left edge, `bottom: homePerch.bottomOffset`), `pointerEvents: 'none'`. Task 3 renders it as a direct child of the ImageBackground, after the SafeAreaView.

Behavior (from spec): fly-in once per app session (module-level flag — NOT state, NOT persisted), pose swap to idle at 650ms, spring settle, offset-period breathe/sway loops forever, one greeting bubble (fade in ~900ms after mount, hold ~4s, fade out), **no SFX**, no reactions. On later mounts in the same session: already perched, idle, no bubble.

- [ ] **Step 1: Write the component**

```tsx
// app/components/PollyHomePerch.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { FONTS } from '../constants/fonts';
import { POLLY_POSES } from '../ui/pollyPoses';
import { HOME_GREETING_LINES, homePerch, homeType } from '../ui/pwHomeMaterials';

// Once per app session: fly-in + one greeting. Navigating away re-mounts
// Home, but Polly is already at her post — no re-entrance, no re-greeting.
let enteredThisSession = false;
let greetingCursor = Math.floor(Math.random() * HOME_GREETING_LINES.length);

export default function PollyHomePerch() {
  const isEntrance = !enteredThisSession;
  const [pose, setPose] = useState<ImageSourcePropType>(
    isEntrance ? POLLY_POSES.fly : POLLY_POSES.idle,
  );
  const [line] = useState(
    () => HOME_GREETING_LINES[greetingCursor % HOME_GREETING_LINES.length],
  );

  const slideY = useRef(new Animated.Value(isEntrance ? 300 : 0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const breatheY = useRef(new Animated.Value(0)).current;
  const breatheX = useRef(new Animated.Value(0)).current;

  // Entrance + one greeting (setTimeout between phases, per animation rules).
  useEffect(() => {
    if (!isEntrance) return;
    enteredThisSession = true;
    greetingCursor += 1;

    Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    const poseT = setTimeout(() => setPose(POLLY_POSES.idle), 650);
    const showT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, 900);
    const hideT = setTimeout(() => {
      Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    }, 4900);
    return () => {
      clearTimeout(poseT);
      clearTimeout(showT);
      clearTimeout(hideT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same breath + sway recipe as the Daily perch: offset periods = organic.
  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheY, { toValue: -6, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breatheY, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheX, { toValue: 3, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breatheX, { toValue: -3, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    bob.start();
    sway.start();
    return () => {
      bob.stop();
      sway.stop();
    };
  }, [breatheY, breatheX]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      {/* Stone ledge — rooted off the left edge, warm stone family */}
      <Svg width={210} height={36} style={styles.ledge}>
        <Rect x={0} y={0} width={206} height={12} rx={5} fill={homePerch.ledgeTop} />
        <Rect x={0} y={11} width={198} height={16} rx={4} fill={homePerch.ledgeFace} />
        <Rect x={0} y={26} width={188} height={8} rx={3} fill={homePerch.ledgeShadow} />
      </Svg>

      {/* Polly — whole-image motion only */}
      <Animated.View
        style={[
          styles.pollyWrap,
          { transform: [{ translateX: breatheX }, { translateY: breatheY }] },
        ]}
      >
        <Image source={pose} style={styles.pollyImage} resizeMode="contain" />
      </Animated.View>

      {/* Greeting bubble — to her right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line}</Text>
        </View>
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    bottom: homePerch.bottomOffset,
    width: 300,
    height: homePerch.pollySize + 40,
    pointerEvents: 'none',
  },
  ledge: {
    position: 'absolute',
    left: -28,
    bottom: 0,
  },
  pollyWrap: {
    position: 'absolute',
    left: -56,
    bottom: 18,
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  pollyImage: {
    width: homePerch.pollySize,
    height: homePerch.pollySize,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 172,
    bottom: 150,
  },
  bubble: {
    backgroundColor: homePerch.bubbleFace,
    borderWidth: 1.5,
    borderColor: homePerch.bubbleRim,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 190,
  },
  bubbleText: {
    fontFamily: FONTS.brand,
    fontSize: homeType.greeting,
    lineHeight: 22,
    color: homePerch.bubbleText,
    flexWrap: 'wrap',
  },
  tailBorder: {
    position: 'absolute',
    left: -9,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: homePerch.bubbleRim,
  },
  tailFill: {
    position: 'absolute',
    left: -7,
    bottom: 10,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 9,
    borderRightColor: homePerch.bubbleFace,
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit`
Expected: no errors. (Component is not yet rendered anywhere — that's fine.)

- [ ] **Step 3: Commit**

```bash
git add app/components/PollyHomePerch.tsx
git commit -m "Add PollyHomePerch: threshold watcher with one greeting"
```

---

### Task 3: Rebuild `HomeScreen.tsx` (visual — device gate before commit)

**Files:**
- Modify: `app/screens/HomeScreen.tsx` (full rewrite of the component body + styles)

**Interfaces:**
- Consumes: `stageMaterial`, `cardMaterial` from `pwMaterials`; `PW` from `pwTheme`; `FoilWord` from `app/components/ui/FoilWord` (`word`, `baseStyle`, `fontSize` props); `PollyHomePerch` (Task 2); Task 1 exports; `DAILY_TITLE`, `DAILY_PROMISE` from `pwDailyMaterials`; `FONTS`; `useGameStore(s => s.startGame)`.
- Produces: same route contract as today — default export `HomeScreen({ navigation })`, navigates to `Game` / `Daily` / `Vault` / `Settings`. `BottomNav` no longer imported here (all other screens keep it).

Cut in this rewrite: `BottomNav`, logo PNG usage, copy plate, `WORDS HAVE MEANING...SSSSS`, floating "Polly" text, locked Continue Run card, dot mode icons, both bespoke gradient overlays (replaced by the single `stageMaterial` vignette), `pollyY` bob (the perch owns Polly motion now).

- [ ] **Step 1: Rewrite the screen**

```tsx
// app/screens/HomeScreen.tsx
import React, { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PollyHomePerch from '../components/PollyHomePerch';
import { FoilWord } from '../components/ui/FoilWord';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';
import { cardMaterial, stageMaterial } from '../ui/pwMaterials';
import { DAILY_PROMISE, DAILY_TITLE } from '../ui/pwDailyMaterials';
import {
  HOME_TAGLINE,
  homeDare,
  homeDoor,
  homeType,
} from '../ui/pwHomeMaterials';
import { PW } from '../ui/pwTheme';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const darePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(darePulse, { toValue: 1, duration: 950, useNativeDriver: true }),
        Animated.timing(darePulse, { toValue: 0, duration: 950, useNativeDriver: true }),
      ]),
    ).start();
  }, [darePulse]);

  const dareScale = darePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] });

  function handleHunt() {
    startGame();
    navigation.navigate('Game');
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('../../assets/home/home-hero-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          pointerEvents="none"
          colors={[...stageMaterial.vignette]}
          locations={[...stageMaterial.vignetteLocations]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Title block — baseline foil wordmark (bespoke logotype: own session) */}
            <View style={styles.titleBlock}>
              <View style={styles.wordmarkBox}>
                <FoilWord
                  word="POLYWORDS"
                  fontSize={homeType.wordmark}
                  baseStyle={styles.wordmark}
                />
              </View>
              <Text style={styles.tagline}>{HOME_TAGLINE}</Text>
            </View>

            {/* Open plaza — Polly's room to breathe */}
            <View style={styles.plaza} />

            {/* The dare */}
            <Animated.View style={[styles.dareWrap, { transform: [{ scale: dareScale }] }]}>
              <Pressable
                onPress={handleHunt}
                style={({ pressed }) => [styles.dareShell, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={[...homeDare.faceGradient]}
                  locations={[...homeDare.faceLocations]}
                  style={styles.dareFace}
                >
                  <View style={styles.dareBottomEdge} />
                  <Text style={styles.dareLabel}>ENTER THE HUNT</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* The doors */}
            <View style={styles.doorRow}>
              <Pressable
                onPress={() => navigation.navigate('Daily')}
                style={({ pressed }) => [
                  cardMaterial.base,
                  styles.door,
                  styles.dailyDoor,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doorEyebrow}>DAILY CHALLENGE</Text>
                <Text style={styles.doorTitle}>{DAILY_TITLE}</Text>
                <Text style={styles.doorCopy}>{DAILY_PROMISE}</Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Vault')}
                style={({ pressed }) => [
                  cardMaterial.base,
                  styles.door,
                  styles.vaultDoor,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doorEyebrow}>PLAYER ARCHIVE</Text>
                <Text style={styles.doorTitle}>WORD VAULT</Text>
                <Text style={styles.doorCopy}>Reclaimed meanings.</Text>
              </Pressable>
            </View>

            {/* Quiet settings — low opacity, never tiny */}
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              style={({ pressed }) => [styles.settingsLinkWrap, pressed && styles.pressed]}
            >
              <Text style={styles.settingsLink}>SETTINGS</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <PollyHomePerch />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  titleBlock: {
    alignItems: 'center',
  },
  wordmarkBox: {
    width: '100%',
    height: homeType.wordmark + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: FONTS.wordDisplay,
    fontSize: homeType.wordmark,
    letterSpacing: homeType.wordmarkTracking,
    textAlign: 'center',
    width: '100%',
  },
  tagline: {
    marginTop: 6,
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: homeType.tagline,
    lineHeight: homeType.tagline + 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  plaza: {
    flex: 1,
  },
  dareWrap: {
    marginHorizontal: 8,
    ...PW.shadow.glowGold,
  },
  dareShell: {
    borderRadius: PW.radius.card,
    borderWidth: 2,
    borderColor: homeDare.rim,
    overflow: 'hidden',
  },
  dareFace: {
    minHeight: homeDare.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dareBottomEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: homeDare.bottomEdge,
  },
  dareLabel: {
    color: homeDare.label,
    fontFamily: FONTS.hud,
    fontSize: homeType.dareLabel,
    letterSpacing: 3,
    textShadowColor: homeDare.labelHighlight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  doorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  door: {
    flex: 1,
    minHeight: homeDoor.minHeight,
    justifyContent: 'space-between',
  },
  dailyDoor: {
    borderColor: homeDoor.dailyTrim,
  },
  vaultDoor: {
    borderColor: homeDoor.vaultTrim,
  },
  doorEyebrow: {
    color: homeDoor.eyebrow,
    fontFamily: FONTS.label,
    fontSize: homeType.doorEyebrow,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  doorTitle: {
    color: homeDoor.title,
    fontFamily: FONTS.hud,
    fontSize: homeType.doorTitle,
    letterSpacing: 1,
    marginTop: 12,
  },
  doorCopy: {
    color: homeDoor.copy,
    fontFamily: FONTS.tileCopy,
    fontSize: homeType.doorCopy,
    lineHeight: homeType.doorCopy + 5,
    marginTop: 8,
  },
  settingsLinkWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingsLink: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    fontSize: homeType.settingsLink,
    letterSpacing: 1.6,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
```

- [ ] **Step 2: Verify types + hygiene**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: no errors; only `app/screens/HomeScreen.tsx` (+ Tasks 1–2 files if uncommitted) modified.

- [ ] **Step 3: Confirm no stray references** — grep the repo for `home-hero` (only HomeScreen should use it) and confirm `polywords-logo.png` and `BottomNav` are no longer referenced by HomeScreen (BottomNav must still be referenced by other screens — do NOT delete the component or the logo asset).

Run: `grep -rn "BottomNav" app/screens/HomeScreen.tsx`
Expected: no matches.

- [ ] **Step 4: DEVICE GATE — do not commit yet.** Hand to Pete for an Expo Go pass (checklist in Task 4). Only after device confirmation:

```bash
git add app/screens/HomeScreen.tsx
git commit -m "Rebuild Home as Polly's threshold (device-confirmed)"
git tag v0.working-YYYYMMDD-home
```

---

### Task 4: Device verification checklist (Expo Go, before the Task 3 commit)

- [ ] Cold open: Polly flies in from below, settles on the ledge at mid-left, swaps to idle, breathes/sways continuously.
- [ ] One greeting bubble appears ~1s after settle, holds ~4s, fades; she stays silent after. No SFX on Home.
- [ ] Home → Vault → Home: Polly already perched, no re-entrance, no second greeting.
- [ ] ENTER THE HUNT starts a run (Game screen); Daily and Vault doors navigate; SETTINGS link navigates.
- [ ] Wordmark foil reads (deboss below, catch-light above, gold fill); tagline legible over the art.
- [ ] Legibility: nothing looks under 14px; door titles/copy comfortably readable at arm's length.
- [ ] Gold budget: only wordmark + dare read as gold focus; Daily door trim stays hairline.
- [ ] Small screen: wordmark scales down (adjustsFontSizeToFit), Polly clear of title above and dare below, no overlap with the doors.
- [ ] Screenshot captured → then Task 3 Step 4 commit + tag.

---

## Self-review notes

- Spec coverage: stage/vignette (T3), title block + cuts (T3), Polly behavior incl. session flag and no-SFX (T2), dare rename (T3), doors on `cardMaterial` (T3), settings link (T3), legibility tokens (T1), dialogue bank (T1), device gate + tag (T3/T4). Logotype, state-aware dialogue, Continue Run: out of scope per spec.
- No TDD tasks: this is pure RN visual work with no pure helpers; project convention is tsc + device gate (per CLAUDE.md), matching the Vault/Daily conversions.
- Type consistency: `homeType`/`homeDare`/`homeDoor`/`homePerch` names match across Tasks 1–3; `FoilWord` props match its real signature (`word`, `baseStyle`, `fontSize`).
