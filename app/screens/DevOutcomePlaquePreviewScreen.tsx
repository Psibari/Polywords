import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AmbientSkyBackground from '../components/AmbientSkyBackground';
import { playSfx } from '../audio/sfx';
import { HauntedOutcomeOverlay, MasteredOutcomeOverlay } from '../components/MaskBoard';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { BOSS_SKY_TUNING } from '../ui/ambientSkyTuning';
import { PW } from '../ui/pwTheme';

export type OutcomePlaquePreviewKind = 'mastered' | 'haunted' | 'banished';

type Props = {
  navigation: any;
  route: { params?: { kind?: OutcomePlaquePreviewKind } };
};

const SHORT_WORD = 'FOLD';
const LONG_WORD = 'CONCENTRATION';

/**
 * DEV ONLY (Pete, 2026-10-30): shows the Results plaque overlays (MASTERED / HAUNTED / BANISHED) on
 * their own, so the carved lettering can be checked on a phone without playing a full Hunt.
 * Mirrors the props the Hunt passes. CONTINUE (or the auto-dismiss) shows a replay button.
 */
export default function DevOutcomePlaquePreviewScreen({ navigation, route }: Props) {
  const kind: OutcomePlaquePreviewKind = route.params?.kind ?? 'mastered';
  const [longWord, setLongWord] = useState(false);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const word = longWord ? LONG_WORD : SHORT_WORD;

  // The Hunt plays the card sound from MaskBoard (not from the overlay), so mirror it here for DEV.
  // Banished is not a boss card and plays nothing there.
  useEffect(() => {
    if (!__DEV__) return;
    if (kind === 'mastered') playSfx('masteredFanfare');
    else if (kind === 'haunted') playSfx('hauntedResult');
  }, [kind, run]);

  if (!__DEV__) return null;

  function replay() {
    setDone(false);
    setRun(r => r + 1);
  }

  const onContinue = () => setDone(true);

  return (
    <View style={styles.screen}>
      <AmbientSkyBackground {...BOSS_SKY_TUNING} />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.kicker}>{kind.toUpperCase()} PLAQUE - {word}</Text>
        <Pressable
          style={styles.toggle}
          onPress={() => { setLongWord(v => !v); replay(); }}
          accessibilityRole="button"
          accessibilityLabel="Switch between a short and a long word"
        >
          <Text style={styles.toggleText}>WORD: {word}  (tap to switch)</Text>
        </Pressable>
        {done && (
          <Pressable style={styles.replay} onPress={replay} accessibilityRole="button">
            <Text style={styles.toggleText}>REPLAY</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </SafeAreaView>
      {!done && kind === 'mastered' && (
        <MasteredOutcomeOverlay key={`m${run}`} word={word} headline="MASTERED" isBoss isRematch={false} onContinue={onContinue} />
      )}
      {!done && kind === 'banished' && (
        <MasteredOutcomeOverlay key={`b${run}`} word={word} headline="BANISHED" isBoss={false} onContinue={onContinue} />
      )}
      {!done && kind === 'haunted' && (
        <HauntedOutcomeOverlay key={`h${run}`} word={word} isBoss onContinue={onContinue} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bgDeep },
  safe: { flex: 1, alignItems: 'center' },
  kicker: {
    marginTop: 16,
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.hudLabel,
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.55)',
    backgroundColor: 'rgba(15,13,42,0.88)',
  },
  toggle: {
    marginTop: 12,
    zIndex: 400,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: 'rgba(15,13,42,0.88)',
  },
  replay: {
    position: 'absolute',
    bottom: 80,
    zIndex: 400,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(15,13,42,0.88)',
  },
  toggleText: { color: PW.color.white, fontFamily: FONTS.label, fontSize: FONT_SIZES.hudLabel, letterSpacing: 1 },
  closeButton: {
    position: 'absolute',
    right: 18,
    top: 8,
    zIndex: 400,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,13,42,0.82)',
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
  },
  closeText: { color: PW.color.white, fontSize: 28, lineHeight: 30 },
});
