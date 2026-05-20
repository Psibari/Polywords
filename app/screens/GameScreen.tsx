import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const WORDS = [
  {
    clues: ['dog sound', 'tree outer layer'],
    options: ['BARK', 'ROOT', 'LEAF', 'TRUNK'],
    answer: 'BARK',
  },
  {
    clues: ['calendar day', 'romantic outing'],
    options: ['DATE', 'LOVE', 'TIME', 'ROSE'],
    answer: 'DATE',
  },
  {
    clues: ['electrical flow', 'formal accusation'],
    options: ['POWER', 'CHARGE', 'CURRENT', 'COURT'],
    answer: 'CHARGE',
  },
];

export default function PolywordsPrototype() {
  const [index, setIndex] = useState(0);
  const [beat, setBeat] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [holding, setHolding] = useState<string | null>(null);

  const current = WORDS[index];

  useEffect(() => {
    const interval = setInterval(() => {
      setBeat(true);

      setTimeout(() => {
        setBeat(false);
      }, 220);
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  function handlePress(word: string) {
    setHolding(word);

    const onBeat = beat;
    const correct = word === current.answer;

    if (correct && onBeat) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setFeedback('PERFECT SYNC');
      setScore((s) => s + 200);
      setStreak((s) => s + 1);
    } else if (correct && !onBeat) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFeedback('OFF BEAT');
      setStreak(0);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFeedback('FALSE SIGNAL');
      setStreak(0);
    }

    setTimeout(() => {
      setHolding(null);
    }, 160);

    setTimeout(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
      setFeedback('');
    }, 650);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.label}>SCORE</Text>
          <Text style={styles.score}>{score}</Text>
        </View>

        <View style={styles.centerTop}>
          <View style={[styles.heartbeat, beat && styles.heartbeatActive]} />
          <Text style={styles.label}>SYNC</Text>
        </View>

        <View>
          <Text style={styles.label}>STREAK</Text>
          <Text style={styles.score}>x{streak}</Text>
        </View>
      </View>

      <View style={styles.clueArea}>
        {current.clues.map((clue) => (
          <Text key={clue} style={styles.clue}>
            {clue}
          </Text>
        ))}
      </View>

      <View style={styles.optionArea}>
        {current.options.map((option) => {
          const pressed = holding === option;

          return (
            <Pressable
              key={option}
              onPressIn={() => handlePress(option)}
              style={[
                styles.option,
                pressed && styles.optionPressed,
                beat && styles.optionBeat,
              ]}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.feedback}>{feedback}</Text>
    </SafeAreaView>
  );
}

const COLORS = {
  bg: '#16142B',
  card: '#241F47',
  purple: '#8D5CFF',
  gold: '#FFD23F',
  white: '#FFFFFF',
  red: '#FF4E6A',
  muted: '#B0AACF',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  centerTop: {
    alignItems: 'center',
  },
  heartbeat: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#4A348A',
    marginBottom: 8,
  },
  heartbeatActive: {
    backgroundColor: COLORS.gold,
    transform: [{ scale: 1.6 }],
  },
  label: {
    color: COLORS.muted,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  score: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 28,
    textAlign: 'center',
  },
  clueArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
  },
  clue: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  optionArea: {
    gap: 14,
    marginBottom: 36,
  },
  option: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingVertical: 22,
    borderWidth: 2,
    borderColor: 'rgba(141,92,255,0.25)',
  },
  optionBeat: {
    borderColor: 'rgba(255,210,63,0.6)',
  },
  optionPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#34275C',
  },
  optionText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  feedback: {
    color: COLORS.gold,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    minHeight: 28,
    marginBottom: 12,
  },
});
