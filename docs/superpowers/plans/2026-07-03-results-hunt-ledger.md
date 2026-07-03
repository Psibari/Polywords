# Results — The Hunt Ledger — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ResultsScreen as one continuous Hunt Ledger scene — hold screen and duplicate banners deleted, material-language retheme, palette purge, and Polly's outcome-matched gloat visit.

**Architecture:** New `pwResultsMaterials.ts` holds type/color tokens, verdict copy, and the moved `deriveResultsPollyLine`. New `PollyResultsPerch.tsx` (thin sibling of the Home perch, fresh per mount, outcome-driven pose). `ResultsScreen.tsx` is rebuilt in place with a transparent background so GameScreen's stage shows through; its mount point and props are unchanged. Presentation only — engine/store untouched.

**Tech Stack:** Expo RN + TS strict, RN `Animated` (native driver, transforms/opacity, `setTimeout` between phases), existing `FoilWord`, `POLLY_POSES`, `homeDare`/`homePerch` tokens reused for the dare button and speech bubble.

**Spec:** `docs/superpowers/specs/2026-07-03-results-hunt-ledger-design.md`

## Global Constraints

- Locked copy: `RUN IT BACK`, `Thought so.` (system text). Verdicts: `YOU BEAT POLLY` (score ≥ 15000) / `POLLY HUNT COMPLETE` / `POLLY CLIPPED YOUR RUN.`
- Palette: no inline off-system hexes; `#FFD700`, `#7B2FBE`, `rgba(139,92,246,…)`, `rgba(123,47,190,…)`, `#1A1040` are all removed; **no Polly Green (`#4CAF50`) on any UI text**. Max 2 gold focus elements: verdict foil + RUN IT BACK.
- Legibility clause: no text under 14px; sizes live as tokens.
- RN `Animated` only, `useNativeDriver: true` → transforms + opacity only; `setTimeout` between phases; no Reanimated.
- No SFX changes (the gameOver laugh on mount stays exactly as-is). No engine/store/scoring changes; `computeRank`/`computeGrade` thresholds and text unchanged (colors only).
- GameScreen untouched: ResultsScreen keeps `({ onRestart, onHome })` props and its `isDone` mount point.
- Verify per patch: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short`. **Device screenshot before the visual commit (Task 3).** Windows: `npx.cmd`.

---

### Task 1: Results tokens + copy + Polly line (`pwResultsMaterials.ts`), dialogue bank note

**Files:**
- Create: `app/ui/pwResultsMaterials.ts`
- Modify: `docs/POLLY_DIALOGUE_BANK.md` (note under "Result Screen Polly Seeds")

**Interfaces:**
- Consumes: `PW` (`pwTheme`), `heroBookMaterial`, `libraryMaterial` (`pwMaterials`), `WordResult` type (`app/game/polyRunEngine`).
- Produces (used by Tasks 2–3): `RESULTS_VERDICT_BEAT/COMPLETE/LOSS`, `RESULTS_SUB_BEAT/LOSS` (strings); `deriveResultsPollyLine(wordResults: WordResult[], isComplete: boolean): string | null`; const objects `resultsType`, `resultsLedger`, `resultsCard`, `resultsVerdictColor`.

- [ ] **Step 1: Write the file**

```ts
// app/ui/pwResultsMaterials.ts
import { PW } from './pwTheme';
import { heroBookMaterial, libraryMaterial } from './pwMaterials';
import { WordResult } from '../game/polyRunEngine';

// ── Verdict copy (verdict appears exactly once, top of the ledger) ──
export const RESULTS_VERDICT_BEAT = 'YOU BEAT POLLY';
export const RESULTS_VERDICT_COMPLETE = 'POLLY HUNT COMPLETE';
export const RESULTS_VERDICT_LOSS = 'POLLY CLIPPED YOUR RUN.';
export const RESULTS_SUB_BEAT = 'Thought so.'; // never-change line, system text
export const RESULTS_SUB_LOSS = 'Out of feathers.';

// Polly's one bubble line on the ledger. All lines are bank-sourced
// (docs/POLLY_DIALOGUE_BANK.md, Result Screen Polly Seeds).
export function deriveResultsPollyLine(
  wordResults: WordResult[],
  isComplete: boolean,
): string | null {
  if (!isComplete) return 'My traps remember you.';
  const allPerfect =
    wordResults.length > 0 && wordResults.every(r => r.wrongSwipes === 0);
  if (allPerfect) return 'You emptied my little vault.';
  const bossCleared = wordResults.some(r => r.isBossWord && r.wrongSwipes === 0);
  if (bossCleared) return 'Fine. Keep the word.';
  const hasMissed = wordResults.some(r => r.missedMaskIds.length > 0);
  if (hasMissed) return 'Some meanings got past you.';
  return null;
}

// ── Type scale (legibility clause: floor 14, tune on device) ──
export const resultsType = {
  verdict: 46,
  verdictSub: 16,
  gradeSub: 15,
  rankLabel: 14,
  rankLetter: 30,
  scoreLine: 17,
  perfectLine: 15,
  bestLine: 15,
  ledgerWord: 18,
  ledgerResult: 15,
  cardHeader: 15,
  cardWord: 24,
  cardCopy: 15,
  homeLink: 14,
} as const;

// ── Ledger panel: BOOK leather frame around dark parchment ──
export const resultsLedger = {
  panelFace: heroBookMaterial.coverPurple,
  panelRim: heroBookMaterial.goldHairline,
  parchmentTop: heroBookMaterial.pagesCreamTop,
  parchment: heroBookMaterial.pagesCream,
  rule: heroBookMaterial.pagesLine,
  ink: '#33291A',                 // ledger ink on parchment
  inkSoft: 'rgba(51,41,26,0.72)',
  mark: PW.color.amber,           // Boss ✓ / Perfect ✓ — ink-gold on parchment
} as const;

// ── Callout cards (CARD material trims) ──
export const resultsCard = {
  rimGold: PW.color.cardRim,
  rimTrap: 'rgba(155,45,107,0.55)', // rose — trap identity
  ghostFace: libraryMaterial.ghostTint,
  ghostRim: libraryMaterial.ghostFeatherEdge,
  ghostTitle: libraryMaterial.ghostTitle,
} as const;

// ── Verdict-block colors (no green, no raw gold beyond the foil) ──
export const resultsVerdictColor = {
  gradeClean: PW.color.foilLight,
  gradeClose: PW.color.white,
  gradeMissed: PW.color.lavender,
  gradeRattled: PW.color.white,
  rankTop: PW.color.amber,     // MASTER / S
  rankMid: PW.color.white,     // A / B / C
  rankLow: PW.color.mutedWhite, // D
  newBest: PW.color.amber,
  prevBest: PW.color.faintWhite,
} as const;
```

- [ ] **Step 2: Dialogue bank note** — in `docs/POLLY_DIALOGUE_BANK.md`, under the `## Result Screen Polly Seeds` list, append:

```markdown
Notes:
Live on the Hunt Ledger (ResultsScreen bubble): lost run → "My traps remember you." · perfect run → "You emptied my little vault." · boss cleared → "Fine. Keep the word." · meanings missed → "Some meanings got past you." Ordinary clean-ish completes get no line (she watches, silent).
```

- [ ] **Step 3: Verify**

Run: `npx.cmd tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/ui/pwResultsMaterials.ts docs/POLLY_DIALOGUE_BANK.md
git commit -m "Add Results ledger tokens, verdict copy, and Polly line derivation"
```

---

### Task 2: `PollyResultsPerch.tsx`

**Files:**
- Create: `app/components/PollyResultsPerch.tsx`

**Interfaces:**
- Consumes: `POLLY_POSES` (`app/ui/pollyPoses`; keys `fly`, `laugh`, `shocked`, `idle`), `homePerch` + `homeType` (`app/ui/pwHomeMaterials`) for bubble material/greeting size, `FONTS`.
- Produces: `export default function PollyResultsPerch({ outcome, line }: { outcome: 'loss' | 'beat' | 'complete'; line: string | null }): JSX.Element` — absolutely positioned bottom-left (Daily perch geometry), `pointerEvents: 'none'`, fresh entrance on every mount, no SFX (the loss laugh already plays from ResultsScreen).

Behavior: waits 600ms (verdict lands first), springs in with the fly pose, swaps to the outcome pose at +650ms, shows the bubble at +900ms only if `line` is non-null, hides it at +4900ms, breathe/sway loops forever.

- [ ] **Step 1: Write the component**

```tsx
// app/components/PollyResultsPerch.tsx
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
import { FONTS } from '../constants/fonts';
import { POLLY_POSES } from '../ui/pollyPoses';
import { homePerch, homeType } from '../ui/pwHomeMaterials';

type Outcome = 'loss' | 'beat' | 'complete';

type Props = {
  outcome: Outcome;
  line: string | null;
};

const OUTCOME_POSE: Record<Outcome, ImageSourcePropType> = {
  loss: POLLY_POSES.laugh,     // her win — synced with the laugh SFX Results plays
  beat: POLLY_POSES.shocked,   // her sulk
  complete: POLLY_POSES.idle,  // the watcher
};

const ENTRANCE_DELAY_MS = 600; // the verdict stamps first

export default function PollyResultsPerch({ outcome, line }: Props) {
  const [pose, setPose] = useState<ImageSourcePropType>(POLLY_POSES.fly);

  const slideY = useRef(new Animated.Value(300)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const breatheY = useRef(new Animated.Value(0)).current;
  const breatheX = useRef(new Animated.Value(0)).current;

  // Entrance + one line, fresh on every mount (setTimeout between phases).
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      Animated.spring(slideY, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }).start();
    }, ENTRANCE_DELAY_MS));
    timers.push(setTimeout(() => setPose(OUTCOME_POSE[outcome]), ENTRANCE_DELAY_MS + 650));
    if (line) {
      timers.push(setTimeout(() => {
        Animated.timing(bubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      }, ENTRANCE_DELAY_MS + 900));
      timers.push(setTimeout(() => {
        Animated.timing(bubbleOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start();
      }, ENTRANCE_DELAY_MS + 4900));
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same breath + sway recipe as the Daily/Home perches.
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
      <Animated.View
        style={[
          styles.pollyWrap,
          { transform: [{ translateX: breatheX }, { translateY: breatheY }] },
        ]}
      >
        <Image source={pose} style={styles.pollyImage} resizeMode="contain" />
      </Animated.View>

      {/* Bubble — to her right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{line ?? ''}</Text>
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
    right: 0,
    bottom: 0,
    height: 220,
    pointerEvents: 'none',
  },
  pollyWrap: {
    position: 'absolute',
    left: -74,
    bottom: -26,
    width: 300,
    height: 300,
  },
  pollyImage: {
    width: 300,
    height: 300,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 162,
    bottom: 158,
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
Expected: no errors (component not yet rendered anywhere).

- [ ] **Step 3: Commit**

```bash
git add app/components/PollyResultsPerch.tsx
git commit -m "Add PollyResultsPerch: outcome-matched gloat visit"
```

---

### Task 3: Rebuild `ResultsScreen.tsx` (visual — device gate before commit)

**Files:**
- Modify: `app/screens/ResultsScreen.tsx` (full rewrite)

**Interfaces:**
- Consumes: Task 1 + Task 2 exports; `homeDare` + `homeType` (`pwHomeMaterials`) for the RUN IT BACK dare; `FoilWord` (`app/components/ui/FoilWord`); `PW`; `FONTS`; existing store reads (`game`, `ghostRevenge`, `recordRunComplete`, `progress`), `playSfx`, `WordResult`, `Mask`/`SessionStep` helpers.
- Produces: same contract — default export `ResultsScreen({ onRestart, onHome })`, rendered by GameScreen when `isDone`.

Deleted in this rewrite: the hold-screen branch (`showResults`/`HOLD_DURATION`/`ph` styles), the beat-Polly banner, the floating gold `pollyLine` text (now Polly's bubble), the per-row `🔒`, card emojis, and every off-system hex. The opaque `#1A1040` background goes transparent so GameScreen's stage shows through.

- [ ] **Step 1: Rewrite the screen**

```tsx
// app/screens/ResultsScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import { WordResult } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { Mask, SessionStep } from '../game/types';
import { playSfx } from '../audio/sfx';
import { FoilWord } from '../components/ui/FoilWord';
import PollyResultsPerch from '../components/PollyResultsPerch';
import { PW } from '../ui/pwTheme';
import { homeDare, homeType } from '../ui/pwHomeMaterials';
import {
  RESULTS_SUB_BEAT,
  RESULTS_SUB_LOSS,
  RESULTS_VERDICT_BEAT,
  RESULTS_VERDICT_COMPLETE,
  RESULTS_VERDICT_LOSS,
  deriveResultsPollyLine,
  resultsCard,
  resultsLedger,
  resultsType,
  resultsVerdictColor,
} from '../ui/pwResultsMaterials';

// ─── HELPERS ─────────────────────────────────────────────────

function findMaskById(maskId: string, session: SessionStep[]): Mask | undefined {
  for (const step of session) {
    if (step.kind !== 'word') continue;
    const found = step.masks.find(m => m.id === maskId);
    if (found) return found;
  }
  return undefined;
}

function findWordForMaskId(maskId: string, session: SessionStep[]): string {
  for (const step of session) {
    if (step.kind !== 'word') continue;
    if (step.masks.some(m => m.id === maskId)) return step.word;
  }
  return '';
}

// ─── GRADE / RANK (thresholds and text unchanged; colors tokenized) ──

function computeGrade(
  lives: number,
  wordResults: WordResult[],
): { text: string; color: string } {
  if (lives === 0) return { text: 'RATTLED.', color: resultsVerdictColor.gradeRattled };
  const ghostCount = wordResults.filter(r => r.missedMaskIds.length > 0).length;
  if (ghostCount === 0) return { text: 'CLEAN RUN', color: resultsVerdictColor.gradeClean };
  if (ghostCount <= 2) return { text: 'CLOSE.', color: resultsVerdictColor.gradeClose };
  return { text: 'MEANINGS MISSED.', color: resultsVerdictColor.gradeMissed };
}

function computeRank(score: number): { letter: string; color: string } {
  if (score >= 22000) return { letter: 'MASTER', color: resultsVerdictColor.rankTop };
  if (score >= 18000) return { letter: 'S', color: resultsVerdictColor.rankTop };
  if (score >= 14000) return { letter: 'A', color: resultsVerdictColor.rankMid };
  if (score >= 11000) return { letter: 'B', color: resultsVerdictColor.rankMid };
  if (score >= 8000) return { letter: 'C', color: resultsVerdictColor.rankMid };
  return { letter: 'D', color: resultsVerdictColor.rankLow };
}

// ─── LEDGER ROW ──────────────────────────────────────────────

function LedgerRow({ result }: { result: WordResult }) {
  const allFound = result.correctUp === result.totalRealMasks && result.wrongSwipes === 0;

  let resultText: string;
  let resultColor: string;
  if (result.isBossWord && allFound) {
    resultText = 'Boss ✓';
    resultColor = resultsLedger.mark;
  } else if (allFound) {
    resultText = 'Perfect ✓';
    resultColor = resultsLedger.mark;
  } else {
    resultText = `${result.correctUp}/${result.totalRealMasks}`;
    resultColor = resultsLedger.ink;
  }

  return (
    <View style={lr.row}>
      <Text style={lr.word}>{result.word.toUpperCase()}</Text>
      <Text style={[lr.result, { color: resultColor }]}>{resultText}</Text>
    </View>
  );
}

const lr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: resultsLedger.rule,
  },
  word: {
    color: resultsLedger.ink,
    fontSize: resultsType.ledgerWord,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
  },
  result: {
    fontSize: resultsType.ledgerResult,
    fontFamily: FONTS.hud,
  },
});

// ─── CALLOUT CARDS ───────────────────────────────────────────

function GhostSetCard({ firstMissedMaskId }: { firstMissedMaskId: string }) {
  const session = useGameStore(s => s.game.session);
  const word = findWordForMaskId(firstMissedMaskId, session);
  if (!word) return null;

  return (
    <View style={[cc.card, cc.ghost]}>
      <Text style={[cc.header, { color: resultsCard.ghostTitle }]}>Meaning missed</Text>
      <Text style={[cc.word, { color: resultsCard.ghostTitle }]}>{word.toUpperCase()}</Text>
      <Text style={cc.copy}>You left this one behind.</Text>
    </View>
  );
}

function TrapCard({ maskId }: { maskId: string }) {
  const session = useGameStore(s => s.game.session);
  const mask = findMaskById(maskId, session);
  const word = findWordForMaskId(maskId, session);
  if (!mask) return null;

  return (
    <View style={[cc.card, cc.trap]}>
      <Text style={[cc.header, { color: PW.color.lavender }]}>The trap that got you</Text>
      <Text style={cc.phrase}>{mask.phrase}</Text>
      <Text style={cc.copy}>Not a meaning of {word.toUpperCase()}. Just nearby.</Text>
    </View>
  );
}

const cc = StyleSheet.create({
  card: {
    backgroundColor: PW.color.cardFace,
    borderWidth: 1.5,
    borderRadius: PW.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  ghost: {
    backgroundColor: resultsCard.ghostFace,
    borderColor: resultsCard.ghostRim,
  },
  trap: {
    borderColor: resultsCard.rimTrap,
  },
  cleared: {
    borderColor: resultsCard.rimGold,
  },
  header: {
    fontSize: resultsType.cardHeader,
    fontFamily: FONTS.hud,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  word: {
    fontSize: resultsType.cardWord,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  phrase: {
    color: PW.color.softWhite,
    fontSize: resultsType.cardCopy + 1,
    fontFamily: FONTS.tileCopy,
    marginBottom: 4,
  },
  copy: {
    color: PW.color.mutedWhite,
    fontSize: resultsType.cardCopy,
    fontFamily: FONTS.tileCopy,
    lineHeight: resultsType.cardCopy + 5,
  },
});

// ─── RUN IT BACK (Home dare treatment, native scale pulse) ──

function RunItBackButton({ onPress }: { onPress: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 950, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] });

  return (
    <Animated.View style={[btn.wrap, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [btn.shell, pressed && btn.pressed]}>
        <LinearGradient
          colors={[...homeDare.faceGradient]}
          locations={[...homeDare.faceLocations]}
          style={btn.face}
        >
          <View style={btn.bottomEdge} />
          <Text style={btn.label}>RUN IT BACK</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const btn = StyleSheet.create({
  wrap: {
    ...PW.shadow.glowGold,
  },
  shell: {
    borderRadius: PW.radius.card,
    borderWidth: 2,
    borderColor: homeDare.rim,
    overflow: 'hidden',
  },
  face: {
    minHeight: homeDare.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: homeDare.bottomEdge,
  },
  label: {
    color: homeDare.label,
    fontFamily: FONTS.hud,
    fontSize: homeType.dareLabel - 2,
    letterSpacing: 3,
    textShadowColor: homeDare.labelHighlight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pressed: {
    opacity: 0.84,
  },
});

// ─── RESULTS SCREEN — THE HUNT LEDGER ────────────────────────

type Props = {
  onRestart: () => void;
  onHome: () => void;
};

export default function ResultsScreen({ onRestart, onHome }: Props) {
  const game = useGameStore(s => s.game);
  const ghostRevenge = useGameStore(s => s.ghostRevenge);
  const recordRunComplete = useGameStore(s => s.recordRunComplete);
  const progress = useGameStore(s => s.progress);
  const { wordResults, score, bestCombo, status, lives } = game;
  const isComplete = status === 'complete';

  const [prevBest] = useState(() => progress.personalBest);
  const isNewBest = score > prevBest && score > 0;
  const beatPolly = isComplete && score >= 15000;
  const outcome: 'loss' | 'beat' | 'complete' =
    !isComplete ? 'loss' : beatPolly ? 'beat' : 'complete';
  const rank = computeRank(score);
  const grade = computeGrade(lives, wordResults);

  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordRunComplete(score);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Polly gloats over a lost run — the on-board laugh can't render because
  // the board unmounts to Results the instant the run ends.
  useEffect(() => {
    if (status === 'gameOver') playSfx('pollySqwawkLaugh');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ceremony: verdict stamps in immediately; details reveal ~700ms later.
  const verdictScale = useRef(new Animated.Value(0.8)).current;
  const verdictY = useRef(new Animated.Value(20)).current;
  const detailOpacity = useRef(new Animated.Value(0)).current;
  const detailY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(verdictScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.spring(verdictY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(detailOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(detailY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // derived data
  const wordOnlyResults = wordResults.filter(r => r.roundKind === 'word');
  const allMissedMaskIds = wordResults.flatMap(r => r.missedMaskIds);
  const allWrongMaskIds = wordResults.flatMap(r => r.wrongMaskIds);
  const firstWrongMaskId = allWrongMaskIds[0] ?? null;
  const pollyLine = deriveResultsPollyLine(wordResults, isComplete);

  const verdictText = !isComplete
    ? RESULTS_VERDICT_LOSS
    : beatPolly
    ? RESULTS_VERDICT_BEAT
    : RESULTS_VERDICT_COMPLETE;
  const verdictSub = !isComplete ? RESULTS_SUB_LOSS : beatPolly ? RESULTS_SUB_BEAT : null;

  const perfectCount = wordOnlyResults.filter(
    r => r.correctUp === r.totalRealMasks && r.wrongSwipes === 0,
  ).length;

  return (
    <View style={rs.container}>
      <ScrollView
        style={rs.scroll}
        contentContainerStyle={rs.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── VERDICT — the ceremony, appears exactly once ── */}
        <Animated.View
          style={[rs.verdictBlock, { transform: [{ scale: verdictScale }, { translateY: verdictY }] }]}
        >
          <View style={rs.verdictBox}>
            <FoilWord
              word={verdictText}
              fontSize={resultsType.verdict}
              baseStyle={rs.verdict}
            />
          </View>
          {verdictSub && <Text style={rs.verdictSub}>{verdictSub}</Text>}
          <Text style={[rs.gradeSub, { color: grade.color }]}>{grade.text}</Text>

          <View style={rs.rankRow}>
            <Text style={rs.rankLabel}>RANK</Text>
            <Text style={[rs.rankLetter, { color: rank.color }]}>{rank.letter}</Text>
          </View>

          <Text style={rs.scoreLine}>
            {score.toLocaleString()} pts  ·  ×{bestCombo} best combo
          </Text>
          <Text style={rs.perfectLine}>
            {perfectCount}/{wordOnlyResults.length} perfect
          </Text>
          {isNewBest ? (
            <Text style={rs.newBest}>NEW BEST</Text>
          ) : (
            <Text style={rs.prevBest}>
              Best: {prevBest > 0 ? prevBest.toLocaleString() : '—'}
            </Text>
          )}
        </Animated.View>

        {/* ── DETAILS — reveal beneath the verdict ── */}
        <Animated.View style={{ opacity: detailOpacity, transform: [{ translateY: detailY }] }}>
          {/* Ledger */}
          {wordOnlyResults.length > 0 && (
            <View style={rs.ledgerPanel}>
              <LinearGradient
                colors={[resultsLedger.parchmentTop, resultsLedger.parchment]}
                style={rs.parchment}
              >
                {wordOnlyResults.map((r, i) => (
                  <LedgerRow key={`${r.wordId ?? r.word}-${i}`} result={r} />
                ))}
              </LinearGradient>
            </View>
          )}

          {/* Ghost revenge */}
          {ghostRevenge?.result === 'correct' && (
            <View style={[cc.card, cc.cleared]}>
              <Text style={[cc.header, { color: PW.color.goldSoft }]}>Haunt broken</Text>
              <View style={rs.foilWordBox}>
                <FoilWord
                  word={ghostRevenge.word.toUpperCase()}
                  fontSize={resultsType.cardWord}
                  baseStyle={rs.foilCardWord}
                />
              </View>
              <Text style={cc.copy}>Rematch won.</Text>
            </View>
          )}
          {ghostRevenge?.result === 'wrong' && (
            <View style={[cc.card, cc.ghost]}>
              <Text style={[cc.header, { color: resultsCard.ghostTitle }]}>Still haunting you</Text>
              <Text style={[cc.word, { color: resultsCard.ghostTitle }]}>
                {ghostRevenge.word.toUpperCase()}
              </Text>
              <Text style={cc.copy}>Missed me?</Text>
            </View>
          )}

          {/* Meaning missed */}
          {allMissedMaskIds.length > 0 && (
            <GhostSetCard firstMissedMaskId={allMissedMaskIds[0]} />
          )}

          {/* Trap that got you */}
          {firstWrongMaskId && <TrapCard maskId={firstWrongMaskId} />}

          {/* Buttons */}
          <RunItBackButton onPress={onRestart} />
          <Pressable onPress={onHome} style={rs.homeLink}>
            <Text style={rs.homeLinkText}>HOME</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <PollyResultsPerch outcome={outcome} line={pollyLine} />
    </View>
  );
}

const rs = StyleSheet.create({
  container: {
    flex: 1, // transparent — GameScreen's stage shows through
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 200, // clears Polly at full scroll
  },
  verdictBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  verdictBox: {
    width: '100%',
    height: resultsType.verdict + 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdict: {
    fontFamily: FONTS.wordDisplay,
    fontSize: resultsType.verdict,
    letterSpacing: 2,
    textAlign: 'center',
    width: '100%',
  },
  verdictSub: {
    color: PW.color.softWhite,
    fontSize: resultsType.verdictSub,
    fontFamily: FONTS.label,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  gradeSub: {
    fontFamily: FONTS.label,
    fontSize: resultsType.gradeSub,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 6,
    opacity: 0.8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  rankLabel: {
    color: PW.color.mutedWhite,
    fontSize: resultsType.rankLabel,
    fontFamily: FONTS.hud,
    letterSpacing: 2,
  },
  rankLetter: {
    fontSize: resultsType.rankLetter,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
  },
  scoreLine: {
    color: PW.color.softWhite,
    fontSize: resultsType.scoreLine,
    fontFamily: FONTS.hud,
  },
  perfectLine: {
    color: PW.color.foilLight,
    fontSize: resultsType.perfectLine,
    fontFamily: FONTS.hud,
    marginTop: 4,
    opacity: 0.85,
  },
  newBest: {
    color: resultsVerdictColor.newBest,
    fontSize: resultsType.bestLine,
    fontFamily: FONTS.hud,
    letterSpacing: 2,
    marginTop: 6,
  },
  prevBest: {
    color: resultsVerdictColor.prevBest,
    fontSize: resultsType.bestLine,
    fontFamily: FONTS.hud,
    marginTop: 4,
  },
  ledgerPanel: {
    backgroundColor: resultsLedger.panelFace,
    borderWidth: 1.5,
    borderColor: resultsLedger.panelRim,
    borderRadius: PW.radius.lg,
    padding: 6,
    marginBottom: 16,
  },
  parchment: {
    borderRadius: PW.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  foilWordBox: {
    height: resultsType.cardWord + 10,
    justifyContent: 'center',
    marginBottom: 4,
  },
  foilCardWord: {
    fontFamily: FONTS.wordDisplay,
    fontSize: resultsType.cardWord,
    letterSpacing: 1.5,
    textAlign: 'left',
  },
  homeLink: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  homeLinkText: {
    color: PW.color.mutedWhite,
    fontSize: resultsType.homeLink,
    fontFamily: FONTS.hud,
    letterSpacing: 2,
  },
});
```

- [ ] **Step 2: Verify types + hygiene**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: no errors; only `app/screens/ResultsScreen.tsx` modified (+ earlier tasks if uncommitted).

- [ ] **Step 3: Purge check** — confirm no off-system hexes or green UI remain:

Run: `grep -nE "FFD700|7B2FBE|139,92,246|123,47,190|1A1040|4CAF50" app/screens/ResultsScreen.tsx`
Expected: no matches.

- [ ] **Step 4: DEVICE GATE — do not commit yet.** Hand to Pete for the Expo Go pass (Task 4). After confirmation:

```bash
git add app/screens/ResultsScreen.tsx
git commit -m "Rebuild Results as the Hunt Ledger (device-confirmed)"
git tag v0.working-YYYYMMDD-results
```

---

### Task 4: Device verification checklist (Expo Go, before the Task 3 commit)

- [ ] **Loss run:** verdict `POLLY CLIPPED YOUR RUN.` + `Out of feathers.` stamps in over the stage (no blank hold screen); Polly flies in laughing, visually synced with the laugh SFX; bubble `My traps remember you.`
- [ ] **Beat-Polly run (≥15,000):** foil `YOU BEAT POLLY` once (no banner, no repeat), `Thought so.`, Polly shocked sulk, bubble `Fine. Keep the word.`
- [ ] **Ordinary complete:** `POLLY HUNT COMPLETE`, Polly idle watcher; bubble only if her line derives (missed meanings → `Some meanings got past you.`).
- [ ] Ledger: rows on parchment with ruled lines, no 🔒, Boss/Perfect marks in amber; ghost/trap/revenge cards themed and emoji-free when present.
- [ ] RUN IT BACK (gold dare, pulsing) restarts; HOME navigates; both clear Polly at full scroll.
- [ ] No green UI text anywhere; nothing under 14px; only verdict + RUN IT BACK read as gold.
- [ ] Details reveal ~0.7s after the verdict — one continuous scene, no screen swap.
- [ ] Screenshot captured → Task 3 Step 4 commit + tag.

---

## Self-review notes

- Spec coverage: one-scene ceremony (T3 verdict/detail timing), transparent stage (T3 container), ledger parchment + amber marks + 🔒 cut (T3 LedgerRow), ghost/trap/revenge retheme + emoji cut (T3 cards), palette purge incl. green (T1 tokens + T3 Step 3 grep), legibility tokens (T1), RUN IT BACK dare + native pulse (T3), HOME link (T3), Polly visit + line derivation + bank note (T1/T2), device gate + tag (T3/T4).
- No TDD tasks: pure RN visual work, no new pure logic beyond `deriveResultsPollyLine` (a direct move of existing shipped logic with one added branch, exercised by the three device outcomes); project convention is tsc + device gate.
- Type consistency: `deriveResultsPollyLine`, `resultsType/Ledger/Card/VerdictColor`, `PollyResultsPerch({ outcome, line })` match across tasks; `homeDare`/`homePerch`/`homeType` reused from the shipped Home files.
