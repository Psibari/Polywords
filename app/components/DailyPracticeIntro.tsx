import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DailyAnswerCard from './DailyAnswerCard';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';

// Standalone tutorial. Never imports the Daily engine or store; no real attempt,
// streak, life, reward, or date can be mutated by practice interactions.
export const DAILY_PRACTICE = {
  answer: 'BANK',
  clues: [
    'WHERE YOU GO TO DEPOSIT YOUR PAYCHECK',
    'THE LAND ALONG THE EDGE OF A RIVER',
    'WHAT AN AIRPLANE DOES WHEN IT TILTS INTO A TURN',
  ],
  candidates: ['SHORE', 'CASH', 'BANK', 'TILT', 'VAULT', 'SLOPE'],
} as const;

type Props = { onComplete: () => void; onExit: () => void };

export default function DailyPracticeIntro({ onComplete, onExit }: Props) {
  const [started, setStarted] = useState(false);
  const [clueCount, setClueCount] = useState(1);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  useEffect(() => {
    if (!started || solved || clueCount >= 3) return;
    const timer = setTimeout(() => setClueCount(count => Math.min(3, count + 1)), 4000);
    return () => clearTimeout(timer);
  }, [started, solved, clueCount]);

  const claim = (word: string) => {
    if (solved || wrong.includes(word)) return;
    if (word === DAILY_PRACTICE.answer) {
      setSolved(true);
    } else {
      setWrong(previous => [...previous, word]);
      setClueCount(count => Math.min(3, count + 1));
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.kicker}>PRACTICE • NO LIVES AT RISK</Text>
        <Text style={styles.title}>POLLY'S CHALLENGE</Text>
        {!started ? (
          <>
            <Text style={styles.main}>THREE CLUES. SIX WORDS. ONE ANSWER.</Text>
            <Text style={styles.body}>Find the one word that fits all three clues. Let's try one together.</Text>
            <Pressable style={styles.primary} onPress={() => setStarted(true)} accessibilityRole="button">
              <Text style={styles.primaryText}>LET'S PRACTICE</Text>
            </Pressable>
          </>
        ) : solved ? (
          <>
            <Text style={styles.main}>THAT'S THE ONE!</Text>
            <Text style={styles.body}>BANK fits all three: money, river's edge, and an airplane turning. One word, three meanings.</Text>
            <Text style={styles.body}>The real Daily has five rounds and two lives. This practice didn't cost you either.</Text>
            <Pressable style={styles.primary} onPress={onComplete} accessibilityRole="button">
              <Text style={styles.primaryText}>READY FOR THE DAILY</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.main}>ONE WORD FITS EVERY CLUE</Text>
            {DAILY_PRACTICE.clues.slice(0, clueCount).map((clue, index) => (
              <Text key={clue} style={styles.clue}>{index + 1}. {clue}</Text>
            ))}
            <Text style={styles.body}>
              {clueCount < 3 ? 'SWIPE UP on your answer, or wait for another free clue.' : 'All three clues are showing. Swipe UP on the answer.'}
            </Text>
            {wrong.length > 0 && <Text style={styles.feedback}>Not quite. That word doesn't fit all three clues. No life lost!</Text>}
            <View style={styles.grid}>
              {DAILY_PRACTICE.candidates.map((word, index) => (
                <View key={word} style={styles.tile}>
                  <DailyAnswerCard
                    label={word}
                    state={wrong.includes(word) ? 'disabled' : 'idle'}
                    disabled={wrong.includes(word)}
                    onClaimStart={() => !solved && !wrong.includes(word)}
                    onClaim={claim}
                    testID={`daily-practice-${index}`}
                    roundKey="practice"
                  />
                </View>
              ))}
            </View>
            {clueCount < 3 && (
              <Pressable onPress={() => setClueCount(count => Math.min(3, count + 1))} style={styles.secondary} accessibilityRole="button">
                <Text style={styles.secondaryText}>SHOW NEXT CLUE (FREE)</Text>
              </Pressable>
            )}
          </>
        )}
        <Pressable onPress={onExit} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>NOT NOW</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  wrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  card: { backgroundColor: 'rgba(26,24,48,0.96)', borderColor: PW.color.white, borderWidth: 2, borderRadius: 16, padding: 18, alignItems: 'center' },
  kicker: { color: PW.color.softWhite, fontFamily: FONTS.label, fontSize: 14, letterSpacing: 1.5, textAlign: 'center' },
  title: { color: '#F5C842', fontFamily: FONTS.wordDisplay, fontSize: 30, marginTop: 8, textAlign: 'center' },
  main: { color: PW.color.softWhite, fontFamily: FONTS.hud, fontSize: 19, marginTop: 14, textAlign: 'center' },
  body: { color: PW.color.softWhite, fontFamily: FONTS.tileCopy, fontSize: 17, marginTop: 12, lineHeight: 23, textAlign: 'center' },
  clue: { color: PW.color.softWhite, fontFamily: FONTS.hud, fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  feedback: { color: '#F5C842', fontFamily: FONTS.tileCopy, fontSize: 15, textAlign: 'center', marginTop: 10 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12, rowGap: 8 },
  tile: { width: '48%', height: 70 },
  primary: { width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F5C842', marginTop: 20, alignItems: 'center' },
  primaryText: { color: '#1A1830', fontFamily: FONTS.hud, fontSize: 18, letterSpacing: 1 },
  secondary: { width: '100%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: PW.color.purpleSoft, marginTop: 12, alignItems: 'center' },
  secondaryText: { color: PW.color.softWhite, fontFamily: FONTS.hud, fontSize: 15, letterSpacing: 1 },
});
