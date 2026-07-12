# Daily Challenge Quill & Scroll Clue Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Daily Challenge's gold-vault clue panel with a parchment scroll that rolls open every round, with a fixed gold feather quill that lifts free and glows the instant you win round 5.

**Architecture:** One new self-contained SVG component (`QuillScrollPanel.tsx`, same `react-native-svg` technique as `HeroBook.tsx`) renders the scroll body + quill/inkwell emblem and exposes two `Animated.Value` props (`rollProgress`, `payoffProgress`) that the screen drives. `DailyChallengeScreen.tsx` swaps its inline `ClueVault` container for this component; the existing sequential clue-reveal logic is kept, just re-parented and recolored. The round-transition slide (`vaultX`) is replaced by a roll (`rollProgress`); a new `payoffProgress` value is only ever touched on the winning round-5 claim.

**Tech Stack:** React Native (Expo SDK), TypeScript strict, `react-native-svg` 15.12.1, RN `Animated` API (native driver), Zustand store (`useGameStore`) — unchanged by this plan.

## Global Constraints

- `useNativeDriver: true` → transform + opacity only; never mix drivers on one `Animated.Value` (CLAUDE.md).
- Sequence animation phases with `setTimeout`, not `.start()` callbacks (CLAUDE.md).
- Reanimated stays locked to `SwipeMask.tsx` only — this feature uses RN `Animated` exclusively.
- No new binary image assets — SVG + existing `pwMaterials.ts` tokens only (design spec).
- Dark aged parchment, never near-white cream (CLAUDE.md Play Screen Design Locks) — use `libraryMaterial.parchment` (`#9A8E7A`) / `parchmentDeep` (`#887868`), not a lighter invented tone.
- Max 2 gold focus elements per screen (CLAUDE.md) — the header label and the quill are the two; nothing else on this screen should compete in gold.
- After every task: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`.
- Device pass (Expo Go) required before any visual commit; tag `v0.working-YYYYMMDD` after device confirmation (CLAUDE.md).
- Spec source: `docs/superpowers/specs/2026-07-11-daily-challenge-quill-scroll-design.md`. Do not implement anything not described there.

---

### Task 1: Add scroll/quill material tokens

**Files:**
- Modify: `app/ui/pwDailyMaterials.ts`

**Interfaces:**
- Consumes: `heroBookMaterial`, `libraryMaterial` from `app/ui/pwMaterials.ts` (existing exports: `goldTrim`, `goldPinInner`, `hingeRail`, `parchment`, `parchmentDeep`, `woodShadow`).
- Produces: `dailyScrollMaterial` — `{ parchmentTop, parchmentBot, goldTrim, goldDeep, inkwellFill, clueInk, clueInkMemory, radius, rollCapWidth }`, consumed by Task 2 and Task 3.

This is purely additive — the existing `dailyClueVaultMaterial` block stays untouched until Task 5, so the tree keeps compiling at every step.

- [ ] **Step 1: Add the import and new token block**

At the top of `app/ui/pwDailyMaterials.ts` (currently line 1, no imports exist), add:

```ts
import { heroBookMaterial, libraryMaterial } from './pwMaterials';
```

Then, immediately after the existing `dailyClueVaultMaterial` block (after its closing `} as const;`, currently ending at line 77), add:

```ts
// Quill & scroll clue panel (spec: 2026-07-11-daily-challenge-quill-scroll-design).
// Every color traces to an existing pwMaterials token — no new hexes invented.
export const dailyScrollMaterial = {
  parchmentTop: libraryMaterial.parchment,      // #9A8E7A
  parchmentBot: libraryMaterial.parchmentDeep,  // #887868
  goldTrim: heroBookMaterial.goldTrim,          // #F5C842
  goldDeep: heroBookMaterial.goldPinInner,      // #C8920E
  inkwellFill: heroBookMaterial.hingeRail,      // #0F0D2A
  clueInk: libraryMaterial.woodShadow,          // #332A20
  clueInkMemory: 'rgba(51,42,32,0.62)',         // woodShadow, de-emphasized for already-revealed clues
  radius: 18,
  rollCapWidth: 24,
} as const;
```

- [ ] **Step 2: Verify it compiles**

Run: `npx.cmd tsc --noEmit`
Expected: no errors (this is an additive, unused-so-far export).

- [ ] **Step 3: Commit**

```bash
git add app/ui/pwDailyMaterials.ts
git commit -m "Add quill/scroll material tokens for Daily clue panel"
```

---

### Task 2: Build `QuillScrollPanel` component

**Files:**
- Create: `app/components/ui/QuillScrollPanel.tsx`

**Interfaces:**
- Consumes: `dailyScrollMaterial` (Task 1).
- Produces: `QuillScrollPanel` (default export), `QuillScrollPanelProps = { rollProgress: Animated.Value; payoffProgress: Animated.Value; children: React.ReactNode }`, forwards its ref to the root `View` (so `measureInWindow` keeps working when wired into the screen in Task 3).

This component is not yet used anywhere — it can't be device-verified in isolation (no Storybook in this repo), so this task is `tsc`-verified only; the first real visual check happens in Task 3 once it's wired into the screen.

- [ ] **Step 1: Write the component**

Create `app/components/ui/QuillScrollPanel.tsx`:

```tsx
import React, { forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { dailyScrollMaterial as M } from '../../ui/pwDailyMaterials';

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Native driver: transform + opacity only.
  rollProgress: Animated.Value;
  // 0 = at rest, 1 = feather fully lifted + glowing. Native driver: transform + opacity only.
  payoffProgress: Animated.Value;
  children: React.ReactNode;
};

const VIEW_W = 300;
const VIEW_H = 190;
const CAP_W = M.rollCapWidth;

const INKWELL_PATH =
  'M5,96 Q5,88 16,88 Q27,88 27,96 L26,106 Q26,112 16,112 Q6,112 6,106 Z';
const FEATHER_SHAFT_PATH = 'M17,94 C22,78 30,52 44,8';
const FEATHER_VANE_PATH =
  'M44,6 C33,14 20,26 15,44 C10,60 12,74 18,88 C20,90 23,90 25,87 C30,72 34,58 40,42 C46,30 52,18 44,6 Z';
const FEATHER_BARBS = [
  'M28,20 L18,28',
  'M31,28 L19,37',
  'M32,37 L18,47',
  'M31,47 L17,57',
  'M29,57 L17,67',
  'M26,67 L18,76',
  'M22,76 L18,83',
];

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel({ rollProgress, payoffProgress, children }, ref) {
    const rollScaleX = rollProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 1],
    });
    const rollOpacity = rollProgress.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0, 0, 1],
    });
    const quillLift = payoffProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -30],
    });
    const glowOpacity = payoffProgress.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 1, 0.7],
    });

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        <Animated.View
          style={[
            styles.scrollBody,
            { opacity: rollOpacity, transform: [{ scaleX: rollScaleX }] },
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGrad id="parchmentFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={M.parchmentTop} />
                <Stop offset="1" stopColor={M.parchmentBot} />
              </SvgGrad>
              <SvgGrad id="rollCapL" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={M.parchmentBot} />
                <Stop offset="1" stopColor={M.parchmentTop} />
              </SvgGrad>
              <SvgGrad id="rollCapR" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={M.parchmentTop} />
                <Stop offset="1" stopColor={M.parchmentBot} />
              </SvgGrad>
            </Defs>
            <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} rx={M.radius} fill="url(#parchmentFill)" />
            <Rect x={0} y={0} width={CAP_W} height={VIEW_H} rx={CAP_W / 2} fill="url(#rollCapL)" />
            <Rect x={VIEW_W - CAP_W} y={0} width={CAP_W} height={VIEW_H} rx={CAP_W / 2} fill="url(#rollCapR)" />
            <Rect
              x={0} y={0} width={VIEW_W} height={VIEW_H} rx={M.radius}
              fill="none" stroke={M.goldTrim} strokeOpacity={0.5} strokeWidth={1.5}
            />
          </Svg>

          <View pointerEvents="none" style={styles.content}>
            {children}
          </View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity }]}>
          <Svg width="100%" height="100%" viewBox="0 0 80 80">
            <Defs>
              <RadialGradient id="payoffGlow" cx="50%" cy="50%" r="55%">
                <Stop offset="0" stopColor={M.goldTrim} stopOpacity={0.9} />
                <Stop offset="1" stopColor={M.goldTrim} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={80} height={80} fill="url(#payoffGlow)" />
          </Svg>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.quillWrap, { transform: [{ translateY: quillLift }] }]}
        >
          <Svg width={56} height={104} viewBox="0 0 64 118">
            <Defs>
              <SvgGrad id="quillGold" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={M.goldTrim} />
                <Stop offset="1" stopColor={M.goldDeep} />
              </SvgGrad>
            </Defs>
            <Path d={INKWELL_PATH} fill={M.inkwellFill} />
            <Ellipse cx={16} cy={96} rx={10.5} ry={3.4} fill={M.inkwellFill} />
            <Ellipse
              cx={16} cy={95.5} rx={10.5} ry={3}
              fill="none" stroke={M.goldTrim} strokeOpacity={0.6} strokeWidth={0.6}
            />
            <Path d={FEATHER_SHAFT_PATH} fill="none" stroke={M.goldDeep} strokeWidth={2} strokeLinecap="round" />
            <Path d={FEATHER_VANE_PATH} fill="url(#quillGold)" stroke={M.goldDeep} strokeWidth={0.6} />
            {FEATHER_BARBS.map((d, i) => (
              <Path key={i} d={d} stroke={M.goldDeep} strokeOpacity={0.55} strokeWidth={0.7} strokeLinecap="round" />
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  },
);

export default QuillScrollPanel;

const styles = StyleSheet.create({
  root: {
    height: VIEW_H,
    marginHorizontal: 20,
    marginTop: 8,
    overflow: 'visible',
  },
  scrollBody: {
    flex: 1,
    borderRadius: M.radius,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  content: {
    position: 'absolute',
    left: 18,
    right: 60,
    top: 14,
    bottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -6,
    width: 80,
    height: 80,
  },
  quillWrap: {
    position: 'absolute',
    top: -22,
    right: 4,
    width: 56,
    height: 104,
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/ui/QuillScrollPanel.tsx
git commit -m "Add QuillScrollPanel: SVG scroll + quill emblem for Daily Challenge"
```

---

### Task 3: Wire `QuillScrollPanel` into `DailyChallengeScreen.tsx`

**Files:**
- Modify: `app/screens/DailyChallengeScreen.tsx`

**Interfaces:**
- Consumes: `QuillScrollPanel`, `QuillScrollPanelProps` (Task 2); `dailyScrollMaterial` (Task 1).
- Produces: screen now owns `rollProgress: Animated.Value` and `payoffProgress: Animated.Value` (the latter inert until Task 4 gives it a trigger) — both referenced by name in Task 4.

This task: replaces the inline `ClueVault` (header + boxed clue panel) with `ClueStage` (just the animated clue text, no box) rendered as `QuillScrollPanel`'s children; replaces `vaultX` slide with `rollProgress` roll; declares `payoffProgress` (unused-but-wired-through, Task 4 drives it); removes the now-dead `SCREEN_WIDTH`/`Dimensions` import. It deliberately does **not** touch `handleCorrectExitComplete`'s payoff trigger or `dailyClueVaultMaterial` cleanup — those are Tasks 4 and 5.

- [ ] **Step 1: Update imports**

In `app/screens/DailyChallengeScreen.tsx`, the current import block (lines 1–51) has:

```ts
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Remove `Dimensions` (no longer used once `SCREEN_WIDTH` is removed in Step 3):

```ts
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Then change the `pwDailyMaterials` import (currently):

```ts
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_CLUE_TITLE,
  DAILY_CLUE_RULE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyClueVaultMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
```

to add `dailyScrollMaterial` alongside the existing `dailyClueVaultMaterial` (still used elsewhere until Task 5):

```ts
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_CLUE_TITLE,
  DAILY_CLUE_RULE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyClueVaultMaterial,
  dailyScrollMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
```

Then add the new component import right after the `DailyAnswerCard` import:

```ts
import DailyAnswerCard, {
  DailyAnswerCardState,
} from '../components/DailyAnswerCard';
import QuillScrollPanel from '../components/ui/QuillScrollPanel';
import PollyDailyPerch from '../components/PollyDailyPerch';
```

- [ ] **Step 2: Replace `ClueVault` with `ClueStage`**

Replace the entire `ClueVault` function (currently lines 129–224, from `function ClueVault({` through its closing `}`) with:

```tsx
// -----------------------------------------
// ClueStage — sequential clue-reveal text, rendered onto QuillScrollPanel
// -----------------------------------------
function ClueStage({
  clues,
  revealedCount,
}: {
  clues: [string, string, string];
  revealedCount: 1 | 2 | 3;
}) {
  const clue1Progress = useRef(new Animated.Value(0)).current;
  const clue2Progress = useRef(new Animated.Value(0)).current;
  const clue3Progress = useRef(new Animated.Value(0)).current;
  const clueProgresses = [clue1Progress, clue2Progress, clue3Progress];
  const activeIndex = revealedCount - 1;
  const clueKey = clues.join('|');

  useEffect(() => {
    clueProgresses.forEach((progress, index) => {
      progress.stopAnimation();

      if (index < activeIndex) {
        progress.setValue(2);
        return;
      }

      if (index > activeIndex) {
        progress.setValue(0);
        return;
      }

      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedCount, clueKey]);

  return (
    <>
      {clues.map((clue, index) => {
        if (index > activeIndex) return null;
        const progress = clueProgresses[index];
        const opacity = progress.interpolate({
          inputRange: [0, 0.22, 1, 2],
          outputRange: [0, 1, 1, 0.9],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.22, 1, 2],
          outputRange: [0.98, 1.025, 1, 0.98],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.22, 2],
          outputRange: [8, 0, 0],
        });

        return (
          <Animated.Text
            key={`${clue}-${index}`}
            style={[
              styles.clueText,
              index < activeIndex && styles.clueTextMemory,
              {
                opacity,
                transform: [{ translateY }, { scale }],
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.58}
          >
            {clue.toUpperCase()}
          </Animated.Text>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Replace `vaultX` with `rollProgress`, add `payoffProgress`, drop `SCREEN_WIDTH`**

Remove this line (currently line 53):

```ts
const SCREEN_WIDTH = Dimensions.get('window').width;
```

In the main component, find:

```ts
  const vaultX        = useRef(new Animated.Value(0)).current;
  const [pollyVisible, setPollyVisible] = useState(true);
```

Replace with:

```ts
  const rollProgress   = useRef(new Animated.Value(0)).current;
  const payoffProgress = useRef(new Animated.Value(0)).current;
  const [pollyVisible, setPollyVisible] = useState(true);
```

In the "ROUND CHANGE" `useEffect`, find:

```ts
    setIntakeWord('');
    intakeScale.setValue(1);
    intakeGlow.setValue(0);
    intakeWordOpacity.setValue(0);
```

Replace with:

```ts
    setIntakeWord('');
    intakeScale.setValue(1);
    intakeGlow.setValue(0);
    intakeWordOpacity.setValue(0);
    payoffProgress.setValue(0);
```

Then, further down in the same effect, find:

```ts
    vaultX.stopAnimation();
    vaultX.setValue(SCREEN_WIDTH);
    Animated.spring(vaultX, {
      toValue: 0,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
    const measureTimer = setTimeout(measureClueTarget, 420);
    return () => clearTimeout(measureTimer);
```

Replace with:

```ts
    rollProgress.stopAnimation();
    rollProgress.setValue(0);
    Animated.timing(rollProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const measureTimer = setTimeout(measureClueTarget, 420);
    return () => clearTimeout(measureTimer);
```

In `handleCorrectExitComplete`, find the slide-out block:

```ts
    setTimeout(() => {
      Animated.timing(vaultX, {
        toValue: -SCREEN_WIDTH,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }, 430);
```

Replace with a roll-close (Task 4 will make this conditional on the final round — for now, always close, matching today's always-slide behavior):

```ts
    setTimeout(() => {
      Animated.timing(rollProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 430);
```

- [ ] **Step 4: Replace the render tree**

Find this block (currently inside the `!isComplete && dailySession &&` fragment):

```tsx
          <Animated.View style={{ transform: [{ translateX: vaultX }] }}>
            <Animated.View
              ref={clueVaultRef}
              collapsable={false}
              onLayout={measureClueTarget}
              style={{ transform: [{ scale: intakeScale }] }}
            >
              {currentRound && (
                <ClueVault
                  clues={currentRound.word.clues}
                  revealedCount={revealedCount}
                />
              )}
              <Animated.View
                pointerEvents="none"
                style={[styles.intakeGlow, { opacity: intakeGlow }]}
              />
              <Animated.Text
                pointerEvents="none"
                style={[
                  styles.intakeWord,
                  { opacity: intakeWordOpacity },
                ]}
              >
                {intakeWord}
              </Animated.Text>
            </Animated.View>
            <Text style={styles.actionLabel}>{DAILY_ACTION_RULE}</Text>
          </Animated.View>
```

Replace with:

```tsx
          <View style={styles.clueHeaderRow}>
            <Text style={styles.clueHeaderLabel}>{DAILY_CLUE_TITLE}</Text>
            <Text style={styles.clueHeaderRule}>{DAILY_CLUE_RULE}</Text>
          </View>

          <Animated.View
            onLayout={measureClueTarget}
            style={{ transform: [{ scale: intakeScale }] }}
          >
            <QuillScrollPanel
              ref={clueVaultRef}
              rollProgress={rollProgress}
              payoffProgress={payoffProgress}
            >
              {currentRound && (
                <ClueStage
                  clues={currentRound.word.clues}
                  revealedCount={revealedCount}
                />
              )}
            </QuillScrollPanel>
            <Animated.View
              pointerEvents="none"
              style={[styles.intakeGlow, { opacity: intakeGlow }]}
            />
            <Animated.Text
              pointerEvents="none"
              style={[styles.intakeWord, { opacity: intakeWordOpacity }]}
            >
              {intakeWord}
            </Animated.Text>
          </Animated.View>
          <Text style={styles.actionLabel}>{DAILY_ACTION_RULE}</Text>
```

- [ ] **Step 5: Recolor and relocate the clue/header styles, drop the old `cv` stylesheet**

In the `intakeGlow`/`intakeWord` styles (in the `styles` `StyleSheet.create` block), find:

```ts
  intakeGlow: {
    position: 'absolute',
    left: 64,
    right: 24,
    top: 42,
    bottom: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: dailyClueVaultMaterial.goldTrimColor,
    backgroundColor: 'rgba(245,200,66,0.16)',
    shadowColor: dailyClueVaultMaterial.goldTrimColor,
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 8,
  },
  intakeWord: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: '46%',
    color: dailyClueVaultMaterial.goldTrimColor,
    fontFamily: FONTS.wordDisplay,
    fontSize: 26,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(245,200,66,0.58)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
```

Replace the two `dailyClueVaultMaterial.goldTrimColor` references with `dailyScrollMaterial.goldTrim` (keep everything else the same):

```ts
  intakeGlow: {
    position: 'absolute',
    left: 64,
    right: 24,
    top: 42,
    bottom: 18,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: dailyScrollMaterial.goldTrim,
    backgroundColor: 'rgba(245,200,66,0.16)',
    shadowColor: dailyScrollMaterial.goldTrim,
    shadowOpacity: 0.75,
    shadowRadius: 18,
    elevation: 8,
  },
  intakeWord: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: '46%',
    color: dailyScrollMaterial.goldTrim,
    fontFamily: FONTS.wordDisplay,
    fontSize: 26,
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(245,200,66,0.58)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
```

Immediately after `devResetText` (the last entry in the main `styles` object, right before its closing `});`), add the new clue/header styles:

```ts
  clueHeaderRow: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  clueHeaderLabel: {
    color: dailyScrollMaterial.goldTrim,
    fontFamily: FONTS.label,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  clueHeaderRule: {
    color: 'rgba(255,247,214,0.55)',
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 2.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  clueText: {
    color: dailyScrollMaterial.clueInk,
    fontFamily: FONTS.wordDisplay,
    fontSize: 27,
    lineHeight: 33,
    letterSpacing: 0.6,
    textAlign: 'center',
    width: '100%',
  },
  clueTextMemory: {
    color: dailyScrollMaterial.clueInkMemory,
    fontSize: 23,
    lineHeight: 28,
  },
```

Finally, delete the entire old `cv` `StyleSheet.create({...})` block at the bottom of the file (the one starting `const cv = StyleSheet.create({` through its closing `});`, currently lines 879–980) — everything it held now lives in the styles above or inside `QuillScrollPanel.tsx`.

- [ ] **Step 6: Verify it compiles**

Run: `npx.cmd tsc --noEmit`
Expected: no errors. If `dailyClueVaultMaterial` shows an "unused import" lint (not a `tsc` error — TS doesn't fail on unused named imports by default), that's expected and resolved in Task 5.

- [ ] **Step 7: Device pass**

Run the app in Expo Go, open Daily Challenge, and confirm:
- The scroll fills the same footprint the old card did, rolls open on load.
- Clue 1 is visible immediately; clues 2/3 fade in on schedule, matching today's timing.
- The gold quill sits fixed in the top-right corner throughout.
- A correct claim still flies the tile in and shows the gold intake word/glow.
- Round advance rolls the scroll closed then back open with the new clue.

- [ ] **Step 8: Commit**

```bash
git add app/screens/DailyChallengeScreen.tsx
git commit -m "Wire QuillScrollPanel into Daily Challenge, replace slide with roll"
```

---

### Task 4: Wire the win-payoff ceremony

**Files:**
- Modify: `app/screens/DailyChallengeScreen.tsx`

**Interfaces:**
- Consumes: `rollProgress`, `payoffProgress` (Task 3), `DAILY_ROUND_COUNT` (already imported from `../game/dailyChallengeEngine`), `dailySession.currentRoundIndex` (existing store field).
- Produces: no new exports — this is the behavioral finish on top of Task 3's wiring.

- [ ] **Step 1: Detect the final round and branch the transition**

In `handleCorrectExitComplete`, find the roll-close block added in Task 3:

```ts
    setTimeout(() => {
      Animated.timing(rollProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 430);

    setTimeout(() => {
      claimDailyAnswer(candidate);
    }, 720);
```

Replace both `setTimeout` calls with:

```ts
    const isFinalRound =
      dailySession?.currentRoundIndex === DAILY_ROUND_COUNT - 1;

    if (isFinalRound) {
      Animated.timing(payoffProgress, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      setTimeout(() => {
        Animated.timing(rollProgress, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 430);
    }

    setTimeout(() => {
      claimDailyAnswer(candidate);
    }, isFinalRound ? 1100 : 720);
```

This means: on any non-final round, behavior is identical to Task 3 (roll closes at 430ms, next round's data loads at 720ms, the "ROUND CHANGE" effect then rolls it back open). On the final round, the roll is left alone (nothing to reveal next), the feather lifts and glows immediately, and `claimDailyAnswer` — which flips `dailyResult` and mounts `ResultsOverlay` over everything — is delayed to 1100ms so the lift+glow has time to read first.

A wrong claim (`handleClaim`'s wrong branch, unchanged) never touches `payoffProgress` at all — losing a Chance, including the second one that ends the session, leaves the quill exactly as it always looked. This is intentional per the design spec: no ceremony is built for the loss case.

- [ ] **Step 2: Verify it compiles**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Device pass**

Using the `DEV - RESET DAILY` button to replay quickly, confirm:
- Solving rounds 1–4 correctly still rolls-closed-then-open as in Task 3's pass, and the quill never moves.
- Solving round 5 correctly: the roll does **not** close, the feather visibly lifts out of the inkwell with a gold glow, and the screen holds on that for a beat before cutting to the win results overlay.
- Losing the second Chance (on any round, including round 5): the quill does nothing unusual, the screen cuts straight to the loss results overlay.

- [ ] **Step 4: Commit**

```bash
git add app/screens/DailyChallengeScreen.tsx
git commit -m "Trigger quill payoff ceremony on Daily Challenge win"
```

---

### Task 5: Remove dead vault-card tokens, final verification

**Files:**
- Modify: `app/ui/pwDailyMaterials.ts`
- Modify: `app/screens/DailyChallengeScreen.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new — this is cleanup + the final gate.

- [ ] **Step 1: Confirm `dailyClueVaultMaterial` has no remaining references**

Run: `grep -rn "dailyClueVaultMaterial" app/`
Expected: only the export line in `app/ui/pwDailyMaterials.ts` itself — no usages left in `DailyChallengeScreen.tsx` (Task 3 moved every reference to `dailyScrollMaterial`).

- [ ] **Step 2: Delete the dead token block**

In `app/ui/pwDailyMaterials.ts`, delete the entire `dailyClueVaultMaterial` block (from `export const dailyClueVaultMaterial = {` through its closing `} as const;`).

- [ ] **Step 3: Remove the now-unused import in the screen**

In `app/screens/DailyChallengeScreen.tsx`, find:

```ts
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_CLUE_TITLE,
  DAILY_CLUE_RULE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyClueVaultMaterial,
  dailyScrollMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
```

Remove the `dailyClueVaultMaterial,` line:

```ts
import {
  DAILY_WIN_TITLE,
  DAILY_WIN_REWARD,
  DAILY_LOSS_TITLE,
  DAILY_CLUE_TITLE,
  DAILY_CLUE_RULE,
  DAILY_ACTION_RULE,
  dailyBackdrop,
  dailyScrollMaterial,
  DailyPollyReaction as PerchReaction,
  getStreakMilestoneRewardLabel,
} from '../ui/pwDailyMaterials';
```

- [ ] **Step 4: Full verification pass**

Run, in order:

```bash
npx.cmd tsc --noEmit
git diff --check
git status --short
```

Expected: `tsc` reports no errors, `git diff --check` reports no whitespace errors, `git status --short` shows only the two files this task touched plus whatever is already staged from Tasks 1–4 if not yet committed.

- [ ] **Step 5: Final device-verification checklist**

Repeat the full Daily Challenge session once, start to finish, on-device (Expo Go), confirming every item from the design spec's Testing & verification section:

- Clue reveal on parchment reads clearly for all 3 clues (large enough at a glance).
- Quick roll between rounds (~400ms total), no stray flash or squished-text artifact mid-roll.
- Round-5 win: feather lift + glow plays, then cuts to results.
- A loss round: confirm no stray animation fires on the quill.

Tag once confirmed:

```bash
git tag v0.working-$(date +%Y%m%d)
```

- [ ] **Step 6: Commit**

```bash
git add app/ui/pwDailyMaterials.ts app/screens/DailyChallengeScreen.tsx
git commit -m "Remove superseded dailyClueVaultMaterial tokens"
```
