# Material Language + Vault Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Codify the POLYWORDS material language (BOOK / CARD / STAGE + Warmth clause) as tokens and shared components, then rebuild the Vault as a real library of reclaimed words (shelves + spines), and swap MaskBoard's hero word onto the shared `FoilWord` component.

**Architecture:** Extend `pwTheme.ts`/`pwMaterials.ts` with the material vocabulary (foil, library wood, stage recipe). Three shared components built the HeroBook way (SVG + tokens): `FoilWord` (three-layer foil stamp), `BookSpine` (leather slab + rotated foil title, ghost variant), `Bookcase` (wood shelves, greedy row packing). `VaultScreen` is rebuilt as one tab-less library screen consuming them. Last, MaskBoard's three inline word layers become one `FoilWord` call (pixel-parity swap).

**Tech Stack:** Expo SDK 54 managed, TS strict, react-native-svg 15.12.1, RN `Animated` (NOT Reanimated), plain-Node tests via `npx tsx`.

**Spec:** `docs/superpowers/specs/2026-07-02-material-language-and-vault-library-design.md` (approved, incl. Warmth clause + no-tabs amendment).

## Global Constraints

- Windows dev box: `npx.cmd` for npx in PowerShell.
- Every hex must trace to `pwTheme`/`pwMaterials` — no inline hexes in screens/components (foil colors live in `foilMaterial`, library colors in `libraryMaterial`, stage in `stageMaterial`).
- No new hues: wood family = `#6A5A48` + darkened variants; amber = `#C8920E`; parchment = `#9A8E7A`/`#887868`; foil catch-light = `#FFF7D6` family; everything else already exists in `PW`/`heroBookMaterial`.
- Foil recipe (verbatim, scaled from 96px): deboss `rgba(0,0,0,0.72)` at +4px; catch-light `rgba(255,247,214,0.95)` at −2.5px; fill `#F5C842` with text-shadow `rgba(245,200,66,0.62)` offset {0,1} radius 2. Never a wide zero-offset glow.
- `useNativeDriver: true` → transform + opacity only; never mix drivers on one `Animated.Value`; `setTimeout` between phases, not `.start()` callbacks.
- Reanimated locked to `SwipeMask.tsx`. `babel.config.js` frozen.
- `MaskBoard.tsx` warroom-gated: only the Task 8 edits, nothing else.
- Polly Green `#4CAF50` Polly-only. Max 2 gold focus elements per screen. No Polly presence on the Vault screen. Archive language only (no cage/prison).
- Parchment stays dark — never near-white cream.
- Vault data model unchanged: `progress.masteredWords: MasteredWordRecord { word; isBoss; hiddenMeaningFound: string; dateMastered: string }`, `ghosts: GhostMeaning { wordId; word; runsMissed; … }`. No new fields.
- After every task: `npx.cmd tsc --noEmit` · `git diff --check` · `git status --short` — clean before commit.
- Tasks 6–8 are visual: device screenshot (Expo Go) required before their commits; tag `v0.working-YYYYMMDD` after final device confirmation.
- Do not pop/drop/clear any stash.

---

### Task 1: Material tokens (`pwTheme` + `pwMaterials`)

**Files:**
- Modify: `app/ui/pwTheme.ts:20-29` (add two colors to `PW.color`)
- Modify: `app/ui/pwMaterials.ts` (append three material exports at end of file)

**Interfaces:**
- Produces: `PW.color.amber` (`'#C8920E'`), `PW.color.foilLight` (`'#FFF7D6'`); `foilMaterial { fill, edge, deboss, catchLight }`; `libraryMaterial { wood, woodDark, woodShadow, shelfHairline, spineLeather, spineLeatherTop, spineLeatherBot, spineTooling, spineToolingHairline, spineAmber, ghostLeather, ghostTint, parchment, parchmentDeep }`; `stageMaterial { base, vignette, vignetteLocations, purpleAmbient, candleGlow }`. Consumed by Tasks 2, 4, 5, 6, 7.

- [ ] **Step 1: Add colors to `PW.color`**

In `app/ui/pwTheme.ts`, after the line `goldGlow: 'rgba(245,200,66,0.30)',` insert:

```ts
    amber: '#C8920E',
    foilLight: '#FFF7D6',
```

- [ ] **Step 2: Append material exports to `app/ui/pwMaterials.ts`**

At the end of the file (after the `heroBookMaterial` export), append:

```ts
// ── Material language (spec: 2026-07-02 material-language-and-vault-library) ──

// Foil-stamped lettering — the trophy-word treatment. Rendered by FoilWord.
export const foilMaterial = {
  fill: PW.color.gold,
  edge: 'rgba(245,200,66,0.62)',      // tight warm edge on the fill
  deboss: 'rgba(0,0,0,0.72)',          // pressed-in shadow below
  catchLight: 'rgba(255,247,214,0.95)',// PW.color.foilLight at 0.95
} as const;

// Library wood + spine leather (Warmth clause: spines stand against warm
// wood, never purple-on-purple).
export const libraryMaterial = {
  wood: '#6A5A48',
  woodDark: '#4A3E30',
  woodShadow: '#332A20',
  shelfHairline: 'rgba(245,200,66,0.30)',
  spineLeather: heroBookMaterial.coverPurple,
  spineLeatherTop: heroBookMaterial.coverPurpleTop,
  spineLeatherBot: heroBookMaterial.coverPurpleBot,
  spineTooling: heroBookMaterial.goldTrim,
  spineToolingHairline: heroBookMaterial.goldHairline,
  spineAmber: PW.color.amber,
  ghostLeather: 'rgba(42,28,92,0.45)', // coverPurpleTop, faded — her grip
  ghostTint: 'rgba(123,45,139,0.35)',
  parchment: heroBookMaterial.pagesCreamTop,
  parchmentDeep: heroBookMaterial.pagesCream,
} as const;

// STAGE — the room the drama happens in. Backgrounds only, never panels.
export const stageMaterial = {
  base: PW.color.bgDeep,
  vignette: ['rgba(6,4,22,0.93)', 'rgba(9,6,26,0.55)', 'rgba(7,5,23,0.82)'] as const,
  vignetteLocations: [0, 0.5, 1] as const,
  purpleAmbient: 'rgba(123,45,139,0.14)',
  candleGlow: 'rgba(245,200,66,0.09)', // every room gets a candle
} as const;
```

- [ ] **Step 3: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the two files modified.

- [ ] **Step 4: Commit**

```powershell
git add app/ui/pwTheme.ts app/ui/pwMaterials.ts
git commit -m @'
Add material-language tokens: foilMaterial, libraryMaterial, stageMaterial + amber/foilLight

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 2: `FoilWord` component

**Files:**
- Create: `app/components/ui/FoilWord.tsx`

**Interfaces:**
- Consumes: `foilMaterial` (Task 1).
- Produces: `FoilWord({ word, baseStyle, fontSize, numberOfLines?, adjustsFontSizeToFit?, minimumFontScale? })` — renders a fragment of three sibling `Text` layers (deboss, catch-light, fill). `baseStyle: StyleProp<TextStyle>` carries font family/size/letterSpacing/textAlign/layout; `fontSize: number` drives the layer offsets so the recipe scales (96 → +4 / −2.5 / radius 2, exact parity with the current hero word). Consumed by Tasks 4 (spine titles) and 8 (MaskBoard swap).

- [ ] **Step 1: Create `app/components/ui/FoilWord.tsx`**

```tsx
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { foilMaterial } from '../../ui/pwMaterials';

type Props = {
  word: string;
  // Font family/size/letterSpacing/textAlign/layout. Color and text-shadow
  // are owned by the foil layers and override anything in baseStyle.
  baseStyle: StyleProp<TextStyle>;
  // Drives layer offsets so the recipe scales with the set size.
  fontSize: number;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
};

// The trophy-word treatment: gold-foil stamping, three layers.
// At 96px this is byte-identical to the hero word's original recipe:
// deboss +4px, catch-light -2.5px, fill edge radius 2.
export function FoilWord({
  word,
  baseStyle,
  fontSize,
  numberOfLines = 1,
  adjustsFontSizeToFit = true,
  minimumFontScale,
}: Props) {
  const debossY = Math.max(1, Math.round(fontSize * (4 / 96)));
  const catchLightY = -Math.max(1, fontSize * (2.5 / 96));
  const edgeRadius = Math.max(1, Math.round(fontSize / 48));

  const textProps = { numberOfLines, adjustsFontSizeToFit, minimumFontScale };

  return (
    <>
      <Text
        {...textProps}
        style={[baseStyle, styles.deboss, { transform: [{ translateY: debossY }] }]}
      >
        {word}
      </Text>
      <Text
        {...textProps}
        style={[baseStyle, styles.catchLight, { transform: [{ translateY: catchLightY }] }]}
      >
        {word}
      </Text>
      <Text
        {...textProps}
        style={[baseStyle, styles.fill, { textShadowRadius: edgeRadius }]}
      >
        {word}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  deboss: {
    position: 'absolute',
    color: foilMaterial.deboss,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  catchLight: {
    position: 'absolute',
    color: foilMaterial.catchLight,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  fill: {
    color: foilMaterial.fill,
    textShadowColor: foilMaterial.edge,
    textShadowOffset: { width: 0, height: 1 },
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the one new file. (Component is unused until Tasks 4/8 — no visual change, no device gate.)

- [ ] **Step 3: Commit**

```powershell
git add app/components/ui/FoilWord.tsx
git commit -m @'
Add FoilWord: shared three-layer gold-foil trophy-word component

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 3: Spine variant helper (TDD)

Deterministic per-word spine variety so the shelf feels collected, not manufactured. Pure TS, no imports — the test runs under plain Node via `npx tsx` (repo has no jest; follow the `pollyVisitPolicy.test.ts` style: local `eq` helper, no `node:assert`).

**Files:**
- Create: `app/ui/spineVariants.ts`
- Test: `app/ui/spineVariants.test.ts`

**Interfaces:**
- Produces: `type SpineVariant = { widthTier: 0 | 1 | 2; leanDeg: number }`; `spineVariantFor(word: string): SpineVariant` — same word always returns the same variant; `leanDeg ∈ [-1.0, 1.0]`. Consumed by Tasks 4/5.

- [ ] **Step 1: Write the failing test `app/ui/spineVariants.test.ts`**

```ts
// Run with: npx.cmd -y tsx app/ui/spineVariants.test.ts
// Plain assert script (repo has no jest; no node:assert — no @types/node).
import { spineVariantFor } from './spineVariants';

function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}
function ok(cond: boolean, label: string): void {
  if (!cond) throw new Error(label);
}

const SAMPLE = [
  'BARK', 'DRAFT', 'SEAL', 'PALM', 'STEAL', 'TIDE', 'MASK', 'CHARGE',
  'SPRING', 'LIGHT', 'CAST', 'SCALE', 'PITCH', 'CROWN', 'FILE', 'TOAST',
  'BOLT', 'RING', 'JAM', 'DUCK',
];

// Determinism: same word, same variant — every time.
for (const w of SAMPLE) {
  const a = spineVariantFor(w);
  const b = spineVariantFor(w);
  eq(a.widthTier, b.widthTier, `${w} widthTier deterministic`);
  eq(a.leanDeg, b.leanDeg, `${w} leanDeg deterministic`);
}

// Ranges: tier in {0,1,2}, lean within ±1 degree.
for (const w of SAMPLE) {
  const v = spineVariantFor(w);
  ok(v.widthTier === 0 || v.widthTier === 1 || v.widthTier === 2, `${w} tier in range (${v.widthTier})`);
  ok(v.leanDeg >= -1.0 && v.leanDeg <= 1.0, `${w} lean in range (${v.leanDeg})`);
}

// Variety: a 20-word shelf must not be uniform.
const tiers = new Set(SAMPLE.map(w => spineVariantFor(w).widthTier));
ok(tiers.size >= 2, `sample uses ${tiers.size} width tier(s) — expected at least 2`);

console.log('OK — spineVariants: all assertions passed');
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx.cmd -y tsx app/ui/spineVariants.test.ts`
Expected: FAIL — cannot find module `./spineVariants`.

- [ ] **Step 3: Write `app/ui/spineVariants.ts`**

```ts
// Deterministic per-word spine variety (width tier + lean) so the Vault
// bookcase feels collected, not manufactured. Pure TS — no RN imports;
// the test runs under plain Node via npx tsx.

export type SpineVariant = {
  widthTier: 0 | 1 | 2;
  leanDeg: number; // -1.0 … +1.0 in 0.1° steps
};

export function spineVariantFor(word: string): SpineVariant {
  // djb2 — stable, cheap, good spread on short uppercase words.
  let h = 5381;
  for (let i = 0; i < word.length; i++) {
    h = ((h << 5) + h + word.charCodeAt(i)) >>> 0;
  }
  const widthTier = (h % 3) as 0 | 1 | 2;
  const leanDeg = (((h >>> 3) % 21) - 10) / 10;
  return { widthTier, leanDeg };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx.cmd -y tsx app/ui/spineVariants.test.ts`
Expected: `OK — spineVariants: all assertions passed`

- [ ] **Step 5: Verify and commit**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the two new files.

```powershell
git add app/ui/spineVariants.ts app/ui/spineVariants.test.ts
git commit -m @'
Add deterministic spine variant helper (width tier + lean per word) + assert tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 4: `BookSpine` component

**Files:**
- Create: `app/components/ui/BookSpine.tsx`

**Interfaces:**
- Consumes: `foilMaterial`, `libraryMaterial` (Task 1); `FoilWord` (Task 2); `spineVariantFor` (Task 3); `FONTS` from `app/constants/fonts`; react-native-svg.
- Produces: `BookSpine({ word, kind, isBoss?, hiddenFound?, raised?, onPress? })` where `kind: 'mastered' | 'ghost'`; exported constants `SPINE_HEIGHT = 128` and `SPINE_WIDTHS = [30, 36, 44]`. Consumed by Task 5's `Bookcase`.

- [ ] **Step 1: Create `app/components/ui/BookSpine.tsx`**

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { FONTS } from '../../constants/fonts';
import { libraryMaterial } from '../../ui/pwMaterials';
import { spineVariantFor } from '../../ui/spineVariants';
import { FoilWord } from './FoilWord';

export const SPINE_HEIGHT = 128;
export const SPINE_WIDTHS = [30, 36, 44] as const;

const TITLE_FONT_SIZE = 15;
const RAISE_Y = -14;

type Props = {
  word: string;
  kind: 'mastered' | 'ghost';
  isBoss?: boolean;
  hiddenFound?: boolean; // gold pin near the head — hidden meaning cracked
  raised?: boolean;      // slid up out of the row (selected)
  onPress?: () => void;
};

// One reclaimed word as a standing book: leather slab, gold tooling bands,
// foil title reading down the spine. Ghost variant: translucent, purple-
// tinted, faded lavender title, feather claim tag — Polly's grip.
export function BookSpine({ word, kind, isBoss, hiddenFound, raised, onPress }: Props) {
  const { widthTier, leanDeg } = spineVariantFor(word);
  const width = SPINE_WIDTHS[widthTier];
  const isGhost = kind === 'ghost';

  const raiseY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(raiseY, {
      toValue: raised ? RAISE_Y : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [raised, raiseY]);

  // Rotated title track: width = usable spine length (between tooling bands).
  const titleTrack = SPINE_HEIGHT - 40;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Animated.View
        style={[
          styles.root,
          { width, height: SPINE_HEIGHT },
          isGhost && styles.ghostRoot,
          {
            transform: [{ translateY: raiseY }, { rotate: `${leanDeg}deg` }],
          },
        ]}
      >
        <Svg width={width} height={SPINE_HEIGHT}>
          <Defs>
            <LinearGradient id={`leather-${word}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={libraryMaterial.spineLeatherTop} />
              <Stop offset="0.5" stopColor={libraryMaterial.spineLeather} />
              <Stop offset="1" stopColor={libraryMaterial.spineLeatherBot} />
            </LinearGradient>
          </Defs>
          {/* Leather slab */}
          <Rect
            x={0.5}
            y={0.5}
            width={width - 1}
            height={SPINE_HEIGHT - 1}
            rx={3}
            fill={isGhost ? libraryMaterial.ghostLeather : `url(#leather-${word})`}
            stroke={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineToolingHairline}
            strokeWidth={1}
          />
          {/* Tooling bands — head and tail */}
          <Rect x={3} y={10} width={width - 6} height={2}
            fill={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineTooling} />
          <Rect x={3} y={SPINE_HEIGHT - 14} width={width - 6} height={2}
            fill={isGhost ? libraryMaterial.ghostTint : libraryMaterial.spineTooling} />
          {/* Boss books carry a second amber band at head and tail */}
          {isBoss && !isGhost && (
            <>
              <Rect x={3} y={15} width={width - 6} height={1.5} fill={libraryMaterial.spineAmber} />
              <Rect x={3} y={SPINE_HEIGHT - 18} width={width - 6} height={1.5} fill={libraryMaterial.spineAmber} />
            </>
          )}
          {/* Hidden-meaning pin — gold head, amber core */}
          {hiddenFound && !isGhost && (
            <>
              <Path d={`M ${width / 2} 5 a 3 3 0 1 0 0.001 0`} fill={libraryMaterial.spineTooling} />
              <Path d={`M ${width / 2} 6.5 a 1.5 1.5 0 1 0 0.001 0`} fill={libraryMaterial.spineAmber} />
            </>
          )}
          {/* Ghost feather claim tag at the tail — her signature */}
          {isGhost && (
            <Path
              d={`M ${width / 2 - 4} ${SPINE_HEIGHT - 24}
                  q 4 -10 8 -2 q -2 8 -8 10 q 2 -5 0 -8 z`}
              fill={libraryMaterial.ghostTint}
              stroke="rgba(185,138,222,0.5)"
              strokeWidth={0.6}
            />
          )}
        </Svg>

        {/* Title reading down the spine */}
        <View style={[styles.titleHolder, { width, height: SPINE_HEIGHT }]} pointerEvents="none">
          <View style={[styles.titleTrack, { width: titleTrack, height: width - 6 }]}>
            {isGhost ? (
              <Text style={styles.ghostTitle} numberOfLines={1} adjustsFontSizeToFit>
                {word}
              </Text>
            ) : (
              <FoilWord
                word={word}
                baseStyle={styles.titleBase}
                fontSize={TITLE_FONT_SIZE}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostRoot: {
    opacity: 0.55,
  },
  titleHolder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTrack: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '90deg' }],
  },
  titleBase: {
    fontSize: 15,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '100%',
  },
  ghostTitle: {
    fontSize: 15,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 1,
    textAlign: 'center',
    maxWidth: '100%',
    color: 'rgba(185,138,222,0.75)', // PW.color.lavender, faded
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the one new file (unused until Task 5 — no device gate).

- [ ] **Step 3: Commit**

```powershell
git add app/components/ui/BookSpine.tsx
git commit -m @'
Add BookSpine: SVG leather spine with foil title, ghost/boss/hidden variants

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 5: `Bookcase` component

**Files:**
- Create: `app/components/ui/Bookcase.tsx`

**Interfaces:**
- Consumes: `libraryMaterial` (Task 1); `BookSpine`, `SPINE_HEIGHT`, `SPINE_WIDTHS` (Task 4); `spineVariantFor` (Task 3); `MasteredWordRecord`, `GhostMeaning` from `app/game/types`; `FONTS`, `FONT_SIZES` from `app/constants/fonts`.
- Produces: `Bookcase({ mastered, ghosts, selectedWord, onSelect })` — `mastered: MasteredWordRecord[]`, `ghosts: GhostMeaning[]`, `selectedWord: string | null`, `onSelect: (word: string | null) => void`. Renders the wood bookcase: mastered shelves (min 3 shelves even when sparse — honest empty space), then the `STILL HAUNTED` shelf when ghosts exist. Not scrollable itself — the screen scrolls (Task 6).

- [ ] **Step 1: Create `app/components/ui/Bookcase.tsx`**

```tsx
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../../constants/fonts';
import { GhostMeaning, MasteredWordRecord } from '../../game/types';
import { libraryMaterial } from '../../ui/pwMaterials';
import { spineVariantFor } from '../../ui/spineVariants';
import { BookSpine, SPINE_HEIGHT, SPINE_WIDTHS } from './BookSpine';

const SPINE_GAP = 5;
const SHELF_RAIL_H = 12;
const SHELF_PAD_X = 14;
const MIN_SHELVES = 3; // honest empty space early on

type Props = {
  mastered: MasteredWordRecord[];
  ghosts: GhostMeaning[];
  selectedWord: string | null;
  onSelect: (word: string | null) => void;
};

type ShelfRow<T> = T[];

// Greedy row packing: fill a shelf until the next spine won't fit.
function packShelves<T>(items: T[], widthOf: (item: T) => number, shelfWidth: number): ShelfRow<T>[] {
  const rows: ShelfRow<T>[] = [];
  let row: T[] = [];
  let used = 0;
  for (const item of items) {
    const w = widthOf(item) + SPINE_GAP;
    if (row.length > 0 && used + w > shelfWidth) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(item);
    used += w;
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

function spineWidthFor(word: string): number {
  return SPINE_WIDTHS[spineVariantFor(word).widthTier];
}

// The player's bookcase: warm wood backboard and rails (Warmth clause —
// purple leather spines stand against wood, never purple-on-purple).
export function Bookcase({ mastered, ghosts, selectedWord, onSelect }: Props) {
  const [innerWidth, setInnerWidth] = useState(0);

  const usable = Math.max(innerWidth - SHELF_PAD_X * 2, SPINE_WIDTHS[2] + SPINE_GAP);
  const masteredRows = innerWidth === 0
    ? []
    : packShelves(mastered, r => spineWidthFor(r.word), usable);
  while (masteredRows.length < MIN_SHELVES) masteredRows.push([]);

  const ghostRows = innerWidth === 0 || ghosts.length === 0
    ? []
    : packShelves(ghosts, g => spineWidthFor(g.word), usable);

  return (
    <View
      style={styles.case}
      onLayout={e => setInnerWidth(e.nativeEvent.layout.width)}
    >
      {masteredRows.map((row, i) => (
        <View key={`shelf-${i}`}>
          <View style={styles.shelfBooks}>
            {row.map(record => (
              <View key={record.word} style={{ marginRight: SPINE_GAP }}>
                <BookSpine
                  word={record.word}
                  kind="mastered"
                  isBoss={record.isBoss}
                  hiddenFound={record.hiddenMeaningFound.length > 0}
                  raised={selectedWord === record.word}
                  onPress={() =>
                    onSelect(selectedWord === record.word ? null : record.word)
                  }
                />
              </View>
            ))}
          </View>
          <View style={styles.rail}>
            <View style={styles.railHairline} />
          </View>
        </View>
      ))}

      {ghostRows.length > 0 && (
        <>
          <Text style={styles.hauntedLabel}>STILL HAUNTED</Text>
          {ghostRows.map((row, i) => (
            <View key={`haunt-${i}`}>
              <View style={styles.shelfBooks}>
                {row.map(ghost => (
                  <View key={ghost.wordId} style={{ marginRight: SPINE_GAP }}>
                    <BookSpine
                      word={ghost.word}
                      kind="ghost"
                      raised={selectedWord === ghost.word}
                      onPress={() =>
                        onSelect(selectedWord === ghost.word ? null : ghost.word)
                      }
                    />
                  </View>
                ))}
              </View>
              <View style={styles.rail}>
                <View style={styles.railHairline} />
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  case: {
    backgroundColor: libraryMaterial.woodDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: libraryMaterial.woodShadow,
    paddingHorizontal: SHELF_PAD_X,
    paddingTop: 18,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  shelfBooks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: SPINE_HEIGHT + 14, // headroom for the raise animation
    paddingTop: 14,
  },
  rail: {
    height: SHELF_RAIL_H,
    backgroundColor: libraryMaterial.wood,
    borderRadius: 2,
    marginBottom: 4,
  },
  railHairline: {
    height: 1,
    backgroundColor: libraryMaterial.shelfHairline,
  },
  hauntedLabel: {
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 3,
    color: 'rgba(185,138,222,0.6)', // faded lavender — her hold
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 2,
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; exactly the one new file (unused until Task 6).

- [ ] **Step 3: Commit**

```powershell
git add app/components/ui/Bookcase.tsx
git commit -m @'
Add Bookcase: wood shelf system with greedy spine packing + haunted shelf

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 6: VaultScreen — the library (stage, header, bookplate, bookcase)

Rebuild `app/screens/VaultScreen.tsx` as the tab-less library. This task lands the static screen; Task 7 adds the detail/rank panels. The existing rank math (`RANK_TIERS`, `getRankTier`, `getRankProgress`), `formatDate`, data selectors, and `BottomNav` wiring are KEPT — this is presentation only.

**Files:**
- Modify: `app/screens/VaultScreen.tsx` (major rewrite of the render + styles; keep the helpers listed above)

**Interfaces:**
- Consumes: `stageMaterial`, `libraryMaterial` (Task 1), `Bookcase` (Task 5), `LinearGradient` from `expo-linear-gradient`, existing store selectors (`progress`, `ghosts`), existing `RANK_TIERS`/`getRankTier`/`getRankProgress`/`formatDate`, `BottomNav` + `bottomNavContentPadding`.
- Produces: local state `selectedWord: string | null` and `showRanks: boolean` consumed by Task 7's panels. Keeps `export default function VaultScreen({ navigation })`.

- [ ] **Step 1: Rewrite the screen body**

Replace the component body and render (keep imports it still needs; add the new ones; DELETE the `sections` array, `VaultSectionKey`, `activeSection` state, tab strip, and `renderSectionContent`). New body:

```tsx
export default function VaultScreen({ navigation }: Props) {
  const progress = useGameStore(s => s.progress);
  const ghosts   = useGameStore(s => s.ghosts);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showRanks, setShowRanks] = useState(false);

  const masteredNewestLast = progress.masteredWords; // shelf grows left→right, newest last
  const tier = getRankTier(progress.personalBest);
  const rankProgress = getRankProgress(progress.personalBest, tier);

  return (
    <SafeAreaView style={styles.screen}>
      {/* STAGE — night air, candle on the bookcase */}
      <LinearGradient
        colors={[...stageMaterial.vignette]}
        locations={[...stageMaterial.vignetteLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />
      <View pointerEvents="none" style={styles.candlePool} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomNavContentPadding() }}
      >
        {/* Header — archive language */}
        <Text style={styles.title}>THE VAULT</Text>
        <Text style={styles.counts}>
          {progress.masteredWords.length} RECLAIMED · {ghosts.length} HAUNTED
        </Text>

        {/* Bookplate — parchment inset, tier seal; tap → rank ladder (Task 7) */}
        <Pressable style={styles.bookplate} onPress={() => setShowRanks(true)}>
          <View style={styles.bookplateInner}>
            <Text style={[styles.bookplateSeal, { color: tier.color }]}>{tier.letter}</Text>
            <View style={styles.bookplateMeta}>
              <Text style={styles.bookplateDesc}>{tier.description}</Text>
              <View style={styles.bookplateTrack}>
                <View style={[styles.bookplateFill, { width: `${Math.round(rankProgress * 100)}%` }]} />
              </View>
            </View>
          </View>
        </Pressable>

        {/* The library */}
        <Bookcase
          mastered={masteredNewestLast}
          ghosts={ghosts}
          selectedWord={selectedWord}
          onSelect={setSelectedWord}
        />

        {progress.masteredWords.length === 0 && (
          <Text style={styles.emptyLine}>Your first reclaimed word will stand here.</Text>
        )}
      </ScrollView>

      <BottomNav navigation={navigation} active="vault" />
    </SafeAreaView>
  );
}
```

NOTE for the implementer: check how `BottomNav` and `bottomNavContentPadding` are actually invoked in the CURRENT file (prop names, whether the padding helper is a function or constant) and keep that usage exactly — the snippet above marks intent, the existing file is authoritative for those two call sites. Same for the screen's current header title text: if the current screen title differs from `THE VAULT`, keep the existing title string.

- [ ] **Step 2: Replace the styles**

Delete styles that belonged to the removed tab UI (`plaqueShelf`, `wordPlaque*`, tab strip, section styles — everything unreferenced after Step 1) and add:

```ts
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: stageMaterial.base,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: PW.space.screenX,
  },
  candlePool: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: stageMaterial.candleGlow,
  },
  title: {
    fontFamily: FONTS.label,
    fontSize: 24,
    letterSpacing: 6,
    color: PW.color.softWhite,
    textAlign: 'center',
    marginTop: 18,
  },
  counts: {
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 2.5,
    color: PW.color.mutedWhite,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  bookplate: {
    backgroundColor: libraryMaterial.parchmentDeep,
    borderRadius: PW.radius.md,
    borderWidth: 2,
    borderColor: PW.color.goldSoft,
    padding: 3,
    marginBottom: 16,
  },
  bookplateInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: PW.color.amber,
    borderRadius: PW.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bookplateSeal: {
    fontFamily: FONTS.wordDisplay,
    fontSize: 34,
  },
  bookplateMeta: {
    flex: 1,
    gap: 6,
  },
  bookplateDesc: {
    fontFamily: FONTS.brand,
    fontSize: 13,
    color: 'rgba(15,13,42,0.85)', // ink on parchment
  },
  bookplateTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15,13,42,0.30)',
    overflow: 'hidden',
  },
  bookplateFill: {
    height: 4,
    backgroundColor: PW.color.amber,
  },
  emptyLine: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    color: PW.color.mutedWhite,
    textAlign: 'center',
    marginTop: 18,
  },
});
```

Imports to add at top of file: `LinearGradient` from `expo-linear-gradient`; `PW` from `../ui/pwTheme`; `libraryMaterial, stageMaterial` from `../ui/pwMaterials`; `Bookcase` from `../components/ui/Bookcase`; `FONT_SIZES` from `../constants/fonts`.

- [ ] **Step 3: Verify**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent. (`showRanks` is only read in Task 7; that's fine — the repo's tsconfig is `strict` without `noUnusedLocals`, so an as-yet-unread local does not error. Do not add eslint-disables or dummy reads.)
Expected files: only `app/screens/VaultScreen.tsx`.

- [ ] **Step 4: DO NOT COMMIT YET**

Visual task — hold the commit until Task 7 completes so the device pass covers the full screen once. Report the working-tree state.

---

### Task 7: VaultScreen — spine detail panel + rank ladder panel

**Files:**
- Modify: `app/screens/VaultScreen.tsx` (add two overlay panels + styles)

**Interfaces:**
- Consumes: Task 6's `selectedWord`/`setSelectedWord`, `showRanks`/`setShowRanks`, `RANK_TIERS`, `formatDate`; `FoilWord` (Task 2); `cardMaterial` (existing `pwMaterials`); `libraryMaterial`.
- Produces: complete Vault screen, ready for the device gate.

- [ ] **Step 1: Add the detail panel**

Inside the component, before `return`, derive the selected record:

```tsx
  const selectedMastered = selectedWord
    ? progress.masteredWords.find(m => m.word === selectedWord) ?? null
    : null;
  const selectedGhost = selectedWord && !selectedMastered
    ? ghosts.find(g => g.word === selectedWord) ?? null
    : null;
```

After the `ScrollView` (before `BottomNav`), add:

```tsx
      {(selectedMastered || selectedGhost) && (
        <Pressable style={styles.panelScrim} onPress={() => setSelectedWord(null)}>
          <Pressable style={[cardMaterial.base, styles.detailPanel]} onPress={() => {}}>
            <View style={styles.detailTitleRow}>
              {selectedMastered ? (
                <FoilWord
                  word={selectedMastered.word}
                  baseStyle={styles.detailWord}
                  fontSize={40}
                />
              ) : (
                <Text style={[styles.detailWord, styles.detailWordGhost]} numberOfLines={1} adjustsFontSizeToFit>
                  {selectedGhost!.word}
                </Text>
              )}
            </View>
            {selectedMastered && (
              <>
                <Text style={styles.detailLine}>
                  Reclaimed {formatDate(selectedMastered.dateMastered)}
                </Text>
                {selectedMastered.isBoss && (
                  <Text style={[styles.detailLine, styles.detailBoss]}>POLLY'S WORD — TAKEN</Text>
                )}
                {selectedMastered.hiddenMeaningFound.length > 0 && (
                  <Text style={styles.detailLine}>
                    Hidden meaning: {selectedMastered.hiddenMeaningFound}
                  </Text>
                )}
              </>
            )}
            {selectedGhost && (
              <>
                <Text style={styles.detailLine}>
                  Still haunted — missed {selectedGhost.runsMissed} {selectedGhost.runsMissed === 1 ? 'run' : 'runs'}.
                </Text>
                <Text style={styles.detailLine}>Win it back in the next Hunt.</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      )}
```

- [ ] **Step 2: Add the rank ladder panel**

After the detail panel block:

```tsx
      {showRanks && (
        <Pressable style={styles.panelScrim} onPress={() => setShowRanks(false)}>
          <Pressable style={[cardMaterial.base, styles.detailPanel]} onPress={() => {}}>
            <Text style={styles.ranksTitle}>RANKS</Text>
            {RANK_TIERS.map(t => (
              <View key={t.letter} style={styles.rankRow}>
                <Text style={[styles.rankLetter, { color: t.color }]}>{t.letter}</Text>
                <Text style={styles.rankDesc}>{t.description}</Text>
                <Text style={styles.rankThreshold}>{t.threshold.toLocaleString()}</Text>
              </View>
            ))}
          </Pressable>
        </Pressable>
      )}
```

- [ ] **Step 3: Add panel styles**

```ts
  panelScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,4,22,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  detailPanel: {
    alignSelf: 'stretch',
    gap: 8,
  },
  detailTitleRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  detailWord: {
    fontSize: 40,
    fontFamily: FONTS.wordDisplay,
    letterSpacing: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  detailWordGhost: {
    color: PW.color.lavender,
  },
  detailLine: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    lineHeight: 21,
    color: PW.color.softWhite,
    textAlign: 'center',
  },
  detailBoss: {
    color: PW.color.gold,
    letterSpacing: 1.5,
  },
  ranksTitle: {
    fontFamily: FONTS.label,
    fontSize: 16,
    letterSpacing: 4,
    color: PW.color.gold,
    textAlign: 'center',
    marginBottom: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  rankLetter: {
    fontFamily: FONTS.wordDisplay,
    fontSize: 22,
    width: 78,
  },
  rankDesc: {
    flex: 1,
    fontFamily: FONTS.brand,
    fontSize: 13,
    color: PW.color.mutedWhite,
  },
  rankThreshold: {
    fontFamily: FONTS.label,
    fontSize: 12,
    color: PW.color.faintWhite,
  },
});
```

- [ ] **Step 4: Verify**

Run: `npx.cmd tsc --noEmit` then `npx.cmd -y tsx app/ui/spineVariants.test.ts` then `git diff --check` then `git status --short`
Expected: tsc silent; spine test OK; only `app/screens/VaultScreen.tsx` modified (uncommitted, together with Task 6's changes).

- [ ] **Step 5: Device gate (human) — then commit**

Ask Pete for the Expo Go pass: bookcase with his real collection; ghost shelf; spine tap raise + detail open/close; bookplate tap → ranks; hidden-meaning pins; empty-state line (fresh install or judgement call); scroll with a large collection; warmth check (wood backboard + candle pool — the screen should NOT read 90% purple). Screenshot for the record. Only after confirmation:

```powershell
git add app/screens/VaultScreen.tsx
git commit -m @'
Rebuild Vault as the library: wood bookcase, foil spines, haunted shelf, bookplate ranks (device-confirmed)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

---

### Task 8: MaskBoard `FoilWord` swap + docs

`MaskBoard.tsx` is warroom-gated — exactly these edits. The swap must be pixel-parity: at fontSize 96 the component reproduces +4 / −2.5 / radius 2 exactly.

**Files:**
- Modify: `app/components/MaskBoard.tsx` (imports; the three static word `Text` layers → one `FoilWord`; delete two orphaned styles)
- Modify: `docs/GAME_REFERENCE.md` (foil bullet gains "lives in FoilWord")

**Interfaces:**
- Consumes: `FoilWord` (Task 2).
- The absorption-gold / red-flash / haunt-tint `Animated.Text` overlays and the boss word are NOT touched — they keep using `styles.word`, which stays defined.

- [ ] **Step 1: Add the import**

With the other component imports: `import { FoilWord } from './ui/FoilWord';`

- [ ] **Step 2: Swap the three static layers**

Replace this block (the emboss layer, the catch-light layer, and the main word `Text` — currently around lines 1589–1615; match on text, not line numbers):

```tsx
            {!isBoss && (
              <Text
                style={[styles.word, styles.wordEmboss]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {step.word}
              </Text>
            )}
            {/* Foil catch-light — warm rim peeking above the gold fill */}
            {!isBoss && (
              <Text
                style={[styles.word, styles.wordTopLight]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {step.word}
              </Text>
            )}
            <Text
              style={[styles.word, isBoss && styles.wordBoss]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {step.word}
            </Text>
```

with:

```tsx
            {!isBoss ? (
              <FoilWord
                word={step.word}
                baseStyle={styles.word}
                fontSize={96}
                minimumFontScale={0.72}
              />
            ) : (
              <Text
                style={[styles.word, styles.wordBoss]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {step.word}
              </Text>
            )}
```

- [ ] **Step 3: Delete the two orphaned styles**

Remove `wordEmboss` and `wordTopLight` from the StyleSheet (they are now unreferenced — verify with a search before deleting). `styles.word` itself stays exactly as-is (the boss word and the three Animated overlays use it).

- [ ] **Step 4: Update `docs/GAME_REFERENCE.md`**

In the Key Learnings foil bullet, change "three Text layers (MaskBoard `styles.word*`)" to "three Text layers rendered by the shared `FoilWord` component (`app/components/ui/FoilWord.tsx`); MaskBoard passes `styles.word` as baseStyle".

- [ ] **Step 5: Verify + diff discipline**

Run: `npx.cmd tsc --noEmit` then `git diff --check` then `git status --short`
Expected: tsc silent; only `MaskBoard.tsx` + `docs/GAME_REFERENCE.md`. `git diff app/components/MaskBoard.tsx` must contain ONLY the import, the swap, and the two style deletions.

- [ ] **Step 6: Device gate (human) — parity check, then commit**

Ask Pete to eyeball the hero word on device against memory/screenshot: identical foil (this is a refactor, not a change). Then:

```powershell
git add app/components/MaskBoard.tsx docs/GAME_REFERENCE.md
git commit -m @'
Swap MaskBoard hero word onto shared FoilWord (pixel-parity refactor)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
'@
```

- [ ] **Step 7: Tag**

After both device confirmations: `git tag v0.working-20260703-vault-library`

---

## Post-plan notes (not tasks)

- Rotated spine titles: RN rotates around the view center; the title track is centered in the spine, so the rotation stays centered. If a long word's foil title looks cramped on device, the dial is `TITLE_FONT_SIZE` (15) or the track inset (`SPINE_HEIGHT - 40`).
- If shelf packing looks too tight/loose on device, the dial is `SPINE_GAP` (5).
- Results and Home conversions are future specs consuming this language — do not start them from this plan.
