import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MASK_DROP, MASK_PAUSE } from '../constants/animations';
import { WordStep } from '../game/types';

type Props = {
  step: WordStep;
  /** other word choices to fill the 4-option grid (excluding the correct word) */
  decoyWords: string[];
  onAnswer: (word: string) => void;
};

type PhaseLabel = 'masks' | 'options';

// multiplier displayed before options appear, based on masks revealed so far
const MULTIPLIERS = [4, 3, 2, 1]; // index = masks revealed so far - 1

export function ReversedBuild({ step, decoyWords, onAnswer }: Props) {
  const { height: H } = useWindowDimensions();
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState<PhaseLabel>('masks');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const maskAnims = useRef(
    step.masks.filter(m => m.isReal).map(() => new Animated.Value(-80)),
  ).current;

  const optionsAnim = useRef(new Animated.Value(H)).current;

  // shuffle options once
  const options = useRef<string[]>(
    [step.word, ...decoyWords.slice(0, 3)]
      .map(w => ({ w, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(x => x.w),
  ).current;

  const realMasks  = step.masks.filter(m => m.isReal);
  const multiplier = MULTIPLIERS[Math.min(revealedCount, MULTIPLIERS.length - 1)] ?? 1;

  // drop masks one at a time
  useEffect(() => {
    let cancelled = false;

    const dropNext = (i: number) => {
      if (cancelled || i >= realMasks.length) {
        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) {
              setPhase('options');
              Animated.timing(optionsAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.back(1.3)),
                useNativeDriver: true,
              }).start();
            }
          }, MASK_PAUSE);
        }
        return;
      }

      Animated.timing(maskAnims[i], {
        toValue: 0,
        duration: MASK_DROP,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        setRevealedCount(i + 1);
        setTimeout(() => dropNext(i + 1), MASK_PAUSE);
      });
    };

    dropNext(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleWordSelect(word: string) {
    if (selectedWord !== null) return;
    setSelectedWord(word);
    const isCorrect = word === step.word;
    setCorrect(isCorrect);
    Haptics.impactAsync(
      isCorrect ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
    );
    setTimeout(() => onAnswer(word), 600);
  }

  const multiplierLabel = phase === 'masks'
    ? `${multiplier}× MULTIPLIER READY`
    : '1× STANDARD';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>WHAT'S THE WORD?</Text>

      {/* revealed masks */}
      <View style={styles.maskList}>
        {realMasks.map((mask, i) => (
          <Animated.View
            key={mask.id}
            style={[
              styles.maskRow,
              { opacity: maskAnims[i].interpolate({ inputRange: [-80, 0], outputRange: [0, 1] }) },
              { transform: [{ translateY: maskAnims[i] }] },
            ]}
          >
            <Text style={styles.maskText}>{mask.phrase}</Text>
          </Animated.View>
        ))}
      </View>

      {/* multiplier badge */}
      <Text style={styles.multiplier}>{multiplierLabel}</Text>

      {/* word options — slide up after all clues */}
      <Animated.View
        style={[
          styles.optionsContainer,
          { transform: [{ translateY: optionsAnim }] },
        ]}
      >
        {options.map(word => {
          const isSelected = selectedWord === word;
          const isWrong = isSelected && !correct;
          const isRight = isSelected && correct;
          return (
            <Pressable
              key={word}
              onPress={() => handleWordSelect(word)}
              style={[
                styles.optionBtn,
                isRight && styles.optionCorrect,
                isWrong && styles.optionWrong,
              ]}
            >
              <Text style={styles.optionText}>{word}</Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 28,
  },
  maskList: {
    gap: 12,
    minHeight: 180,
  },
  maskRow: {
    backgroundColor: '#24175A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
  },
  maskText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  multiplier: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 20,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  optionBtn: {
    backgroundColor: '#311F78',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  optionCorrect: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  optionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
