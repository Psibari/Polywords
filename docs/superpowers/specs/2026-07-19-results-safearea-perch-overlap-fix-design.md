# Results Screen — Safe-Area Clipping & Polly Overlap Fix

## Why

A device screenshot of the loss/"Run It Back" state of [ResultsScreen.tsx](../../../app/screens/ResultsScreen.tsx)
showed two bugs: the verdict title ("POLLY CLIPPED YOUR RUN.") rendering with
its top sliced off under the status bar, and Polly's character overlapping/
obscuring the Gold Feather card and the Run It Back / Share Result button text.
Both root causes are confirmed by reading the code, not guessed. Scope is fix-only
— no color, card-style, or copy changes.

## Root cause 1: title clipping

[App.tsx](../../../App.tsx) never mounts a `SafeAreaProvider`. `GameScreen.tsx`'s
`SafeAreaView` (line 733) is imported from `react-native-safe-area-context`
(confirmed via its import line and `package.json`'s `react-native-safe-area-context: ~5.6.0`
dependency), which requires a `SafeAreaProvider` ancestor to measure real device
insets — without one it cannot know the safe area and renders with an effective
zero top inset. Grepped the entire `app/` tree and `App.tsx`: zero matches for
`SafeAreaProvider` anywhere. Settings doesn't show this symptom because it
imports React Native's own built-in `SafeAreaView` (from `'react-native'`, not
`'react-native-safe-area-context'`), which works standalone on iOS without a
provider.

**Fix:** wrap `<NavigationContainer>` in `<SafeAreaProvider>` in `App.tsx`. This
is the library's standard required setup, not a workaround — it also corrects
every other `react-native-safe-area-context` consumer in the app going forward,
not just Results.

## Root cause 2: Polly overlap

`POLLY_RESULTS_PERCH_CLEARANCE` (380px, [PollyResultsPerch.tsx:15](../../../app/components/PollyResultsPerch.tsx))
is applied as **trailing `paddingBottom`** on `ResultsScreen.tsx`'s
`scrollContent` (line 687), after the Home link. That only creates safe space
once the user has scrolled all the way to the bottom of the content — it does
nothing for where the buttons land in their natural resting position. On a
short result (loss, few cards), the content doesn't need scrolling at all, so
the Gold Feather card and buttons render wherever they naturally fall — which
lands inside Polly's fixed bottom-of-screen reach zone regardless of the
reserved trailing padding.

The 380px clearance value itself is not wrong — its own comment notes it
accounts for both the 300px `pollyImage` and the speech bubble popping up
above it — the bug is *where* it's applied, not the number.

**Fix:** move the button block (Gold Feather / Run It Back / Share / Home) out
of the scrollable content into a fixed footer that always sits below the
ScrollView and above Polly, using the same `POLLY_RESULTS_PERCH_CLEARANCE`
value relocated to the footer's own `paddingBottom`. This guarantees the
buttons can never land in Polly's zone regardless of how much ledger/card
content a given run produces.

### Structure change in `ResultsScreen.tsx`

Current: verdict block, then one `Animated.View` (driven by `detailOpacity`/
`detailY`) wrapping ledger + callout cards + Gold Feather + Run It Back +
Share + Home, all inside the `ScrollView`.

New: the `ScrollView` (still `flex: 1`) contains only the verdict block and
the ledger/callout-cards `Animated.View`. A new sibling `View` (`footer`)
renders after `</ScrollView>` and before `<PollyResultsPerch />`, containing
Gold Feather (conditional) / Run It Back / Share / Home — wrapped in its own
`Animated.View` using the *same* `detailOpacity`/`detailY` Animated.Values, so
the existing "details reveal ~700ms after verdict" choreography is unchanged,
just now driving two sibling elements instead of one.

`footer` style: `paddingHorizontal: 24` (matches the scroll content's own
horizontal inset, now needed here since it's no longer inside
`scrollContent`), `paddingTop: 16` (breathing room below the scrolled
content), `paddingBottom: POLLY_RESULTS_PERCH_CLEARANCE` (imported from
`PollyResultsPerch.tsx`, already exported).

`scrollContent`'s `paddingBottom` drops from `POLLY_RESULTS_PERCH_CLEARANCE + 24`
to a small fixed value (`16`) — just enough breathing room at the end of the
ledger/cards before the footer begins; the large reserve is no longer this
style's job.

No changes to `RunItBackButton`, `ShareRunButton`, `GoldFeatherButton`, or the
Home `Pressable` themselves — only their position in the tree moves.

## Scope boundaries

- No changes to `PollyResultsPerch.tsx` itself (the 380px clearance constant
  is reused as-is, just relocated to a new consumer).
- No changes to card colors, copy, fonts, or the verdict/ledger visual style.
- No changes to any other screen's `SafeAreaView` usage — `SafeAreaProvider` is
  an app-root addition; existing React-Native-core `SafeAreaView` usages
  (Settings, etc.) are unaffected by it.
- Modified: `App.tsx`, `app/screens/ResultsScreen.tsx`.
