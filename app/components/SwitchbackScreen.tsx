import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SwitchbackStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { playCorrectTap, playWrongBuzz } from '../utils/SoundEngine';

// ── Timing constants ──────────────────────────────────────────
const CLUE_START    = 400;   // ms after mount before clues slide in
const SPRING_SETTLE = 600;   // estimated spring settle duration
const POLLY_DELAY   = CLUE_START + SPRING_SETTLE + 800; // clues + 800ms pause
const BOARD_DELAY   = POLLY_DELAY + 300;  // after polly starts fading in

const TILE_H    = 60;
const TILE_GAP  = 10;

// ── Answer tile ───────────────────────────────────────────────

type TileState = 'idle' | 'correct' | 'wrong';

function AnswerTile({
  word,
  state,
  onCommit,
  entryDelay,
}: {
  word: string;
  state: TileState;
  onCommit: () => void;
  entryDelay: number;
}) {
  // Layer 1 (outermost): collapse — useNativeDriver: false
  const heightAnim   = useRef(new Animated.Value(TILE_H)).current;
  const marginAnim   = useRef(new Animated.Value(TILE_GAP)).current;

  // Layer 2 (middle): entry — useNativeDriver: true
  const entryTransY  = useRef(new Animated.Value(30)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;

  // Layer 3 (innermost): drag + fly-off — useNativeDriver: false
  const dragTransY   = useRef(new Animated.Value(0)).current;

  const committedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  // entry animation — useNativeDriver: true
  useEffect(() => {
    const id = setTimeout(() => {
      Animated.parallel([
        Animated.spring(entryTransY,  { toValue: 0, tension: 200, friction: 14, useNativeDriver: true }),
        Animated.timing(entryOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, entryDelay);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // state-driven sound + collapse — useNativeDriver: false
  useEffect(() => {
    if (state === 'correct') {
      playCorrectTap();
      Animated.parallel([
        Animated.timing(heightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(marginAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start(() => setCollapsed(true));
    }
    if (state === 'wrong') {
      playWrongBuzz();
      const id = setTimeout(() => {
        Animated.parallel([
          Animated.timing(heightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(marginAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start(() => setCollapsed(true));
      }, 200);
      return () => clearTimeout(id);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !committedRef.current,
      onMoveShouldSetPanResponder:        (_, g) => !committedRef.current && g.dy < -5,
      onMoveShouldSetPanResponderCapture: (_, g) => !committedRef.current && g.dy < -4,
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, g) => {
        if (committedRef.current) return;
        // Only track upward movement (dy < 0)
        dragTransY.setValue(g.dy < 0 ? g.dy : 0);
      },

      onPanResponderRelease: (_, g) => {
        if (committedRef.current) return;
        if (g.dy < -40) {
          committedRef.current = true;
          // Fly tile off top, then trigger correct/wrong logic
          Animated.timing(dragTransY, {
            toValue: -800,
            duration: 300,
            useNativeDriver: false,
          }).start();
          setTimeout(() => onCommit(), 300);
        } else {
          // Spring back to resting position
          Animated.spring(dragTransY, {
            toValue: 0,
            tension: 200,
            friction: 14,
            useNativeDriver: false,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!committedRef.current) {
          Animated.spring(dragTransY, {
            toValue: 0,
            tension: 200,
            friction: 14,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  if (collapsed) return null;

  return (
    // outer: height/margin collapse — useNativeDriver: false
    <Animated.View style={{ height: heightAnim, marginTop: marginAnim, overflow: 'hidden' }}>
      {/* entry: translateY + opacity — useNativeDriver: true */}
      <Animated.View style={{ transform: [{ translateY: entryTransY }], opacity: entryOpacity }}>
        {/* drag + fly-off: translateY — useNativeDriver: false */}
        <Animated.View
          {...panResponder.panHandlers}
          style={{ transform: [{ translateY: dragTransY }] }}
        >
          <View style={[styles.answerTile, { height: TILE_H }]}>
            <Text style={styles.answerText}>{word}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────

type Props = { step: SwitchbackStep };

function shuffleAnswers(answers: SwitchbackStep['answers']): SwitchbackStep['answers'] {
  const arr = [...answers];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function SwitchbackScreen({ step }: Props) {
  const store = useGameStore();

  const [shuffled]     = useState(() => shuffleAnswers(step.answers));
  const [tileStates, setTileStates] = useState<Map<string, TileState>>(() => {
    const m = new Map<string, TileState>();
    step.answers.forEach(a => m.set(a.word, 'idle'));
    return m;
  });

  const attemptsRef  = useRef(0);
  const completedRef = useRef(false);

  // ── Polly text ──────────────────────────────────────────────
  const [pollyText, setPollyText]   = useState<string | null>(null);
  const pollyOpacity = useRef(new Animated.Value(0)).current;

  function showPolly(text: string) {
    setPollyText(text);
    pollyOpacity.setValue(0);
    Animated.timing(pollyOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }

  // ── Clue slide animations ───────────────────────────────────
  const clue1TransX = useRef(new Animated.Value(-400)).current;
  const clue2TransX = useRef(new Animated.Value(400)).current;
  const clueOpacity = useRef(new Animated.Value(0)).current;

  // ── Clue flash on first-correct ─────────────────────────────
  const clueFlash = useRef(new Animated.Value(0)).current;

  function flashClues() {
    clueFlash.setValue(0);
    Animated.sequence([
      Animated.timing(clueFlash, { toValue: 0.45, duration: 100, useNativeDriver: true }),
      Animated.timing(clueFlash, { toValue: 0,    duration: 250, useNativeDriver: true }),
    ]).start();
  }

  // ── Board ready ─────────────────────────────────────────────
  const [boardReady, setBoardReady] = useState(false);

  // ── Entrance sequence ─────────────────────────────────────────
  useEffect(() => {
    const t1 = setTimeout(() => {
      clueOpacity.setValue(1);
      Animated.parallel([
        Animated.spring(clue1TransX, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
        Animated.spring(clue2TransX, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
      ]).start();
    }, CLUE_START);

    const t2 = setTimeout(() => {
      showPolly('One word. Two lives.');
    }, POLLY_DELAY);

    const t3 = setTimeout(() => {
      setBoardReady(true);
    }, BOARD_DELAY);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Commit handler (called after tile flies off) ──────────────
  function handleCommit(word: string, isCorrect: boolean) {
    if (completedRef.current) return;
    if (tileStates.get(word) !== 'idle') return;

    if (isCorrect) {
      setTileStates(prev => new Map(prev).set(word, 'correct'));
      const isFirst = attemptsRef.current === 0;
      if (isFirst) flashClues();
      showPolly(isFirst ? 'Sharp.' : 'Got there.');
      completedRef.current = true;
      const bonus = isFirst ? 200 : 100;
      setTimeout(() => store.completeSwitchback(bonus, true, attemptsRef.current), 1500);

    } else {
      attemptsRef.current += 1;
      setTileStates(prev => new Map(prev).set(word, 'wrong'));

      if (attemptsRef.current >= 2) {
        completedRef.current = true;
        const correctWord = step.answers.find(a => a.correct)!.word;
        const t = setTimeout(() => {
          setTileStates(prev => new Map(prev).set(correctWord, 'correct'));
          showPolly(step.pollyReveal);
        }, 350);
        const u = setTimeout(() => store.completeSwitchback(0, false, attemptsRef.current), 2000);
        void t; void u;
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Kicker */}
      <Text style={styles.kicker}>SWITCHBACK</Text>

      {/* Clue 1 */}
      <Text style={styles.clueLabel}>CLUE 1</Text>
      <Animated.View
        style={[
          styles.clueBar,
          { opacity: clueOpacity, transform: [{ translateX: clue1TransX }] },
        ]}
      >
        <Text style={styles.clueEmoji}>{step.clue1.emoji}</Text>
        <Text style={styles.clueText}>{step.clue1.text}</Text>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.clueFlashOverlay, { opacity: clueFlash }]}
        />
      </Animated.View>

      {/* Clue 2 */}
      <Text style={[styles.clueLabel, styles.clue2Label]}>CLUE 2</Text>
      <Animated.View
        style={[
          styles.clueBar,
          { opacity: clueOpacity, transform: [{ translateX: clue2TransX }] },
        ]}
      >
        <Text style={styles.clueEmoji}>{step.clue2.emoji}</Text>
        <Text style={styles.clueText}>{step.clue2.text}</Text>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.clueFlashOverlay, { opacity: clueFlash }]}
        />
      </Animated.View>

      {/* Polly line */}
      {pollyText !== null && (
        <Animated.Text style={[styles.pollyLine, { opacity: pollyOpacity }]}>
          {pollyText}
        </Animated.Text>
      )}

      {/* Answer tiles */}
      {boardReady && (
        <View style={styles.tileStack}>
          {shuffled.map((answer, index) => (
            <AnswerTile
              key={answer.word}
              word={answer.word}
              state={tileStates.get(answer.word) ?? 'idle'}
              onCommit={() => handleCommit(answer.word, answer.correct)}
              entryDelay={index * 100}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  kicker: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 14,
  },
  clueLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  clue2Label: {
    marginTop: 24,
  },
  clueBar: {
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#251F4A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
    overflow: 'hidden',
  },
  clueEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  clueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    flex: 1,
  },
  clueFlashOverlay: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
  },
  pollyLine: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  tileStack: {
    marginTop: 8,
    flex: 1,
  },
  answerTile: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1A1830',
    backgroundColor: '#2A2560',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'BagelFatOne_400Regular',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});
