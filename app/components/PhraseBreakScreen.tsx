import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { PhraseBreakStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';

type Props = { step: PhraseBreakStep };

export function PhraseBreakScreen({ step }: Props) {
  const submitPhraseAnswer = useGameStore(s => s.submitPhraseAnswer);

  const phraseY        = useRef(new Animated.Value(300)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const tileYAnims     = useRef(step.answers.map(() => new Animated.Value(60))).current;
  const tileOpacities  = useRef(step.answers.map(() => new Animated.Value(0))).current;

  const [answered,    setAnswered]    = useState(false);
  const [tappedIdx,   setTappedIdx]   = useState<number | null>(null);
  const [flashRedIdx, setFlashRedIdx] = useState<number | null>(null);
  const [pollyText,   setPollyText]   = useState('');

  const pendingRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    Animated.spring(phraseY, {
      toValue: 0,
      tension: 140,
      friction: 14,
      useNativeDriver: true,
    }).start(() => {
      const t1 = setTimeout(() => {
        setPollyText('Tiny detour. Big meaning.');

        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        step.answers.forEach((_, i) => {
          const t2 = setTimeout(() => {
            Animated.parallel([
              Animated.spring(tileYAnims[i], {
                toValue: 0,
                tension: 120,
                friction: 12,
                useNativeDriver: true,
              }),
              Animated.timing(tileOpacities[i], {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }, i * 80);
          pendingRef.current.push(t2);
        });
      }, 600);
      pendingRef.current.push(t1);
    });

    return () => { pendingRef.current.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTap(idx: number) {
    if (answered) return;
    setAnswered(true);
    setTappedIdx(idx);

    const isCorrect = step.answers[idx].correct;

    if (isCorrect) {
      setPollyText(step.pollyReveal);
    } else {
      setFlashRedIdx(idx);
      setPollyText('Now you know.');
      const tFlash = setTimeout(() => setFlashRedIdx(null), 400);
      pendingRef.current.push(tFlash);
    }

    const tAdvance = setTimeout(() => {
      submitPhraseAnswer(step.answers[idx].text);
    }, 2000);
    pendingRef.current.push(tAdvance);
  }

  function tileBg(idx: number): string {
    if (!answered) return '#2A2560';
    if (step.answers[idx].correct) return '#FFD700';
    if (idx === tappedIdx && flashRedIdx === idx) return '#CC2200';
    return '#2A2560';
  }

  function tileTextColor(idx: number): string {
    if (answered && step.answers[idx].correct) return '#1E1A3A';
    return '#FFFFFF';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>PHRASE BREAK</Text>

      <Animated.Text style={[styles.phrase, { transform: [{ translateY: phraseY }] }]}>
        {step.phrase}
      </Animated.Text>

      <Animated.View style={[styles.contentArea, { opacity: contentOpacity }]}>
        <Text style={styles.pollyLine}>{pollyText}</Text>
        <Text style={styles.question}>{step.question}</Text>
      </Animated.View>

      <View style={styles.tileStack}>
        {step.answers.map((answer, i) => (
          <Animated.View
            key={i}
            style={{
              opacity: tileOpacities[i],
              transform: [{ translateY: tileYAnims[i] }],
            }}
          >
            <Pressable
              style={[styles.tile, { backgroundColor: tileBg(i) }]}
              onPress={() => handleTap(i)}
              disabled={answered}
            >
              <Text style={[styles.tileText, { color: tileTextColor(i) }]}>
                {answer.text}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  kicker: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 16,
  },
  phrase: {
    fontFamily: 'BagelFatOne_400Regular',
    fontSize: 36,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 48,
    marginBottom: 24,
  },
  contentArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pollyLine: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  question: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
  },
  tileStack: {
    gap: 10,
  },
  tile: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1830',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  tileText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
  },
});
