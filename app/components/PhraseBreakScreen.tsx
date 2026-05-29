import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { PhraseBreakStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';

const SWIPE_THRESHOLD = 40;

type Props = { step: PhraseBreakStep };

export function PhraseBreakScreen({ step }: Props) {
  const submitPhraseAnswer = useGameStore(s => s.submitPhraseAnswer);

  // ── Phrase + content reveal (native driver) ───────────────────
  const phraseY        = useRef(new Animated.Value(300)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ── Per-tile entry: native driver (translateY + opacity) ──────
  const entryYAnims    = useRef(step.answers.map(() => new Animated.Value(60))).current;
  const entryOpacities = useRef(step.answers.map(() => new Animated.Value(0))).current;

  // ── Per-tile drag + fly-off: JS driver ────────────────────────
  const dragYAnims = useRef(step.answers.map(() => new Animated.Value(0))).current;

  const [tileColors,     setTileColors]     = useState<string[]>(step.answers.map(() => '#2A2560'));
  const [tileTextColors, setTileTextColors] = useState<string[]>(step.answers.map(() => '#FFFFFF'));
  const [pollyText,      setPollyText]      = useState('');

  const answeredRef = useRef(false);
  const pendingRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const correctIdx  = step.answers.findIndex(a => a.correct);

  // ── PanResponders — one per answer tile ───────────────────────
  // Closures capture stable refs: step, dragYAnims, answeredRef,
  // correctIdx, pendingRef, submitPhraseAnswer, and state setters.
  const panResponders = useRef(
    step.answers.map((_, idx) =>
      PanResponder.create({
        onStartShouldSetPanResponder:        () => !answeredRef.current,
        onStartShouldSetPanResponderCapture: () => !answeredRef.current,
        onMoveShouldSetPanResponder:        (_, g) => !answeredRef.current && g.dy < -6,
        onMoveShouldSetPanResponderCapture: (_, g) => !answeredRef.current && g.dy < -4,
        onPanResponderTerminationRequest: () => false,

        onPanResponderMove: (_, g) => {
          if (answeredRef.current) return;
          // Track upward drag only
          dragYAnims[idx].setValue(g.dy < 0 ? g.dy : 0);
        },

        onPanResponderRelease: (_, g) => {
          if (answeredRef.current) return;

          if (g.dy < -SWIPE_THRESHOLD) {
            answeredRef.current = true;
            const isCorrect = step.answers[idx].correct;

            if (isCorrect) {
              // Snap back to resting position, flash gold
              Animated.spring(dragYAnims[idx], {
                toValue: 0,
                speed: 20,
                bounciness: 4,
                useNativeDriver: false,
              }).start();
              setTileColors(step.answers.map((_, i) =>
                i === idx ? '#FFD700' : '#2A2560'
              ));
              setTileTextColors(step.answers.map((_, i) =>
                i === idx ? '#1E1A3A' : '#FFFFFF'
              ));
              setPollyText(step.pollyReveal);
            } else {
              // Flash red, fly off top; correct tile turns gold
              setTileColors(step.answers.map((_, i) => {
                if (i === idx)        return '#CC2200';
                if (i === correctIdx) return '#FFD700';
                return '#2A2560';
              }));
              setTileTextColors(step.answers.map((_, i) =>
                i === correctIdx ? '#1E1A3A' : '#FFFFFF'
              ));
              setPollyText('Now you know.');
              Animated.timing(dragYAnims[idx], {
                toValue: -800,
                duration: 300,
                useNativeDriver: false,
              }).start();
            }

            const t = setTimeout(() => {
              submitPhraseAnswer(step.answers[idx].text);
            }, 1500);
            pendingRef.current.push(t);

          } else {
            // Snap back without committing
            Animated.spring(dragYAnims[idx], {
              toValue: 0,
              speed: 22,
              bounciness: 8,
              useNativeDriver: false,
            }).start();
          }
        },

        onPanResponderTerminate: () => {
          if (!answeredRef.current) {
            Animated.spring(dragYAnims[idx], {
              toValue: 0,
              speed: 22,
              bounciness: 8,
              useNativeDriver: false,
            }).start();
          }
        },
      })
    )
  ).current;

  // ── Mount sequence ────────────────────────────────────────────
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
              Animated.spring(entryYAnims[i], {
                toValue: 0,
                tension: 120,
                friction: 12,
                useNativeDriver: true,
              }),
              Animated.timing(entryOpacities[i], {
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

  // ── Render ────────────────────────────────────────────────────
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
          // Outer: entry animation — native driver (translateY + opacity)
          <Animated.View
            key={i}
            style={{
              opacity:   entryOpacities[i],
              transform: [{ translateY: entryYAnims[i] }],
            }}
          >
            {/* Inner: drag + fly-off — JS driver (translateY only) */}
            <Animated.View
              style={{ transform: [{ translateY: dragYAnims[i] }] }}
              {...panResponders[i].panHandlers}
            >
              <View style={[styles.tile, { backgroundColor: tileColors[i] }]}>
                <Text style={[styles.tileText, { color: tileTextColors[i] }]}>
                  {answer.text}
                </Text>
              </View>
            </Animated.View>
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
