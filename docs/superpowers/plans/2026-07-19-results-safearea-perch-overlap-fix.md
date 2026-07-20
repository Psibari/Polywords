# Results Safe-Area & Polly Overlap Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two confirmed bugs on the Hunt Results screen: the verdict title
rendering clipped under the status bar, and Polly's character overlapping the
Gold Feather card and the Run It Back / Share Result / Home buttons.

**Architecture:** Two independent, root-cause fixes. (1) Mount the missing
`SafeAreaProvider` at the app root so `GameScreen`'s context-based
`SafeAreaView` can measure real device insets. (2) Restructure
`ResultsScreen.tsx` so the button block lives in a fixed footer below the
scrollable ledger/cards and above Polly's reach, instead of as trailing
scroll-content padding that only helps once fully scrolled.

**Tech Stack:** React Native, `react-native-safe-area-context`, existing
`Animated` API entrance choreography (unchanged, just re-targeted).

**Spec:** `docs/superpowers/specs/2026-07-19-results-safearea-perch-overlap-fix-design.md`

## Global Constraints

- No color, card-style, copy, or animation-timing changes — this is a
  structural/positioning fix only.
- No changes to `PollyResultsPerch.tsx` — `POLLY_RESULTS_PERCH_CLEARANCE`
  (380, already exported) is reused as-is, only relocated to a new consumer.
- No changes to any other screen's `SafeAreaView` usage.
- Verification: this project has no component-level test harness. The check
  step is `npx tsc --noEmit`, `git diff --check`, and `git status --short`.

---

## Task 1: Mount `SafeAreaProvider` at the app root

**Files:**
- Modify: `App.tsx`

**Interfaces:**
- Produces: real device safe-area insets available to every
  `react-native-safe-area-context` consumer in the app (currently only
  `GameScreen.tsx`'s `SafeAreaView`, which wraps `ResultsScreen.tsx`).

- [ ] **Step 1: Add the import**

In `App.tsx`, replace:

```tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
```

with:

```tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
```

- [ ] **Step 2: Wrap the navigator**

Replace:

```tsx
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Vault" component={VaultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Daily" component={DailyChallengeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

with:

```tsx
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Vault" component={VaultScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Daily" component={DailyChallengeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`react-native-safe-area-context` is already a
dependency — `package.json` lists `"react-native-safe-area-context": "~5.6.0"`
— so this import requires no install.)

- [ ] **Step 4: Verify diff and commit**

```bash
git diff --check
git status --short
git add App.tsx
git commit -m "Mount SafeAreaProvider at app root to fix Results title clipping under status bar"
```

---

## Task 2: Move Results' button block into a fixed footer above Polly

**Files:**
- Modify: `app/screens/ResultsScreen.tsx`

**Interfaces:**
- Consumes: `POLLY_RESULTS_PERCH_CLEARANCE` (already imported at the top of
  this file from `../components/PollyResultsPerch`).

- [ ] **Step 1: Read the current file to confirm it matches this plan**

Read `app/screens/ResultsScreen.tsx` in full. The return statement (function
`ResultsScreen`) should currently render: a `View` (`rs.container`)
containing a `ScrollView` (`rs.scroll` / `rs.scrollContent`) whose children
are the verdict `Animated.View` (`rs.verdictBlock`) followed by one details
`Animated.View` (driven by `detailOpacity`/`detailY`) that wraps the ledger
panel, ghost-revenge cards, `GhostSetCard`, `TrapCard`, the conditional
`GoldFeatherButton`, `RunItBackButton`, `ShareRunButton`, and the Home
`Pressable` — followed by `<PollyResultsPerch ... />` as a sibling after
`</ScrollView>`. If the current file differs from this description, stop and
report NEEDS_CONTEXT with what you actually found instead of guessing.

- [ ] **Step 2: Split the return statement**

Replace the entire return statement (from `return (` through the matching
`);` that closes the component, i.e. from the line `return (` down to the
`);` immediately before the function's closing `}`):

```tsx
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
            <Animated.Text
              style={[rs.rankLetter, { color: rank.color, transform: [{ scale: rankPulseScale }] }]}
            >
              {rank.letter}
            </Animated.Text>
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

          {/* Meaning missed — haunts only */}
          {hauntMissedMaskIds.length > 0 && (
            <GhostSetCard firstMissedMaskId={hauntMissedMaskIds[0]} />
          )}

          {/* Trap that got you */}
          {firstWrongMaskId && <TrapCard maskId={firstWrongMaskId} />}

          {/* Buttons */}
          {hasGoldFeather && (
            <GoldFeatherButton
              onPress={handleUseGoldFeather}
              disabled={usingGoldFeather}
            />
          )}
          <RunItBackButton onPress={onRestart} />
          <ShareRunButton onPress={handleShare} />
          <Pressable onPress={onHome} style={rs.homeLink}>
            <Text style={rs.homeLinkText}>HOME</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <PollyResultsPerch outcome={outcome} line={pollyMoment?.line ?? null} />
    </View>
  );
}
```

with:

```tsx
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
            <Animated.Text
              style={[rs.rankLetter, { color: rank.color, transform: [{ scale: rankPulseScale }] }]}
            >
              {rank.letter}
            </Animated.Text>
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

          {/* Meaning missed — haunts only */}
          {hauntMissedMaskIds.length > 0 && (
            <GhostSetCard firstMissedMaskId={hauntMissedMaskIds[0]} />
          )}

          {/* Trap that got you */}
          {firstWrongMaskId && <TrapCard maskId={firstWrongMaskId} />}
        </Animated.View>
      </ScrollView>

      {/* ── FOOTER — always above Polly's reach, outside the scroll ── */}
      <Animated.View
        style={[rs.footer, { opacity: detailOpacity, transform: [{ translateY: detailY }] }]}
      >
        {hasGoldFeather && (
          <GoldFeatherButton
            onPress={handleUseGoldFeather}
            disabled={usingGoldFeather}
          />
        )}
        <RunItBackButton onPress={onRestart} />
        <ShareRunButton onPress={handleShare} />
        <Pressable onPress={onHome} style={rs.homeLink}>
          <Text style={rs.homeLinkText}>HOME</Text>
        </Pressable>
      </Animated.View>

      <PollyResultsPerch outcome={outcome} line={pollyMoment?.line ?? null} />
    </View>
  );
}
```

- [ ] **Step 3: Update `scrollContent` and add `footer` styles**

Replace:

```ts
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: POLLY_RESULTS_PERCH_CLEARANCE + 24, // full sprite height + breathing room
  },
```

with:

```ts
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 44,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: POLLY_RESULTS_PERCH_CLEARANCE, // clears Polly's reach regardless of scroll position
  },
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Verify diff and commit**

```bash
git diff --check
git status --short
git add app/screens/ResultsScreen.tsx
git commit -m "Move Results button block into a fixed footer above Polly's reach"
```

---

## Done Criteria

- Both tasks committed.
- `npx tsc --noEmit` clean on the final state.
- Visual check on-device/simulator (not automatable in this repo): the
  verdict title renders fully below the status bar (no clipped glyphs), and
  on both a short (loss) and long (complete) run, the Gold Feather card,
  Run It Back, Share Result, and Home are all fully visible and untouched by
  Polly's character or speech bubble.
