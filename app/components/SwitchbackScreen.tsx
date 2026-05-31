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
import { playCorrectSwipe, playWrongBuzz } from '../utils/SoundEngine';

// ── Timing constants ──────────────────────────────────────────
const MASK_ENTRY_DELAY = 400;   // ms after mount before mask bars slide in
const SPRING_SETTLE    = 600;   // estimated spring settle duration
const POLLY_DELAY      = MASK_ENTRY_DELAY + SPRING_SETTLE + 800;
const BOARD_DELAY      = POLLY_DELAY + 300;

// Additional 50ms gate before masks render (matches tilesReady pattern)
const MASK_READY_DELAY = 50;

const TILE_H   = 60;
const TILE_GAP = 10;

// ── Answer tile ───────────────────────────────────────────────

type TileState = 'idle' | 'final-correct' | 'wrong-flash';

function AnswerTile({
  word,
  state,
  onCommit,
  entryDelay,
  disabled,
}: {
  word: string;
  state: TileState;
  onCommit: () => void;
  entryDelay: number;
  disabled: boolean;
}) {
  // Layer 1 (outermost): collapse on final-correct — useNativeDriver: false
  const heightAnim   = useRef(new Animated.Value(TILE_H)).current;
  const marginAnim   = useRef(new Animated.Value(TILE_GAP)).current;

  // Layer 2 (middle): entry — useNativeDriver: true
  const entryTransY  = useRef(new Animated.Value(30)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;

  // Layer 3 (innermost): drag + flash — useNativeDriver: false
  const dragTransY   = useRef(new Animated.Value(0)).current;
  const bgOpacity    = useRef(new Animated.Value(0)).current; // flash overlay

  const committedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);

  // entry animation
  useEffect(() => {
    const id = setTimeout(() => {
      Animated.parallel([
        Animated.spring(entryTransY,  { toValue: 0, tension: 200, friction: 14, useNativeDriver: true }),
        Animated.timing(entryOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, entryDelay);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // state-driven effects
  useEffect(() => {
    if (state === 'final-correct') {
      playCorrectSwipe();
      // Flash gold, then collapse
      Animated.sequence([
        Animated.timing(bgOpacity, { toValue: 1, duration: 80, useNativeDriver: false }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
      const id = setTimeout(() => {
        Animated.parallel([
          Animated.timing(heightAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
          Animated.timing(marginAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start(() => setCollapsed(true));
      }, 300);
      return () => clearTimeout(id);
    }

    if (state === 'wrong-flash') {
      playWrongBuzz();
      // Flash red briefly — no collapse, stays visible
      Animated.sequence([
        Animated.timing(bgOpacity, { toValue: 1, duration: 60, useNativeDriver: false }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start();
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
        dragTransY.setValue(g.dy < 0 ? g.dy : 0);
      },

      onPanResponderRelease: (_, g) => {
        if (committedRef.current) return;
        if (g.dy < -40) {
          committedRef.current = true;
          Animated.timing(dragTransY, {
            toValue: -800,
            duration: 300,
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            committedRef.current = false; // re-arm for phase B
            onCommit();
          }, 300);
        } else {
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

  const flashColor = state === 'wrong-flash' ? '#CC2200' : '#FFD700';

  return (
    <Animated.View style={{ height: heightAnim, marginTop: marginAnim, overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: entryTransY }], opacity: entryOpacity }}>
        <Animated.View
          {...(disabled ? {} : panResponder.panHandlers)}
          style={{ transform: [{ translateY: dragTransY }] }}
        >
          <View style={[styles.answerTile, { height: TILE_H }]}>
            <Text style={styles.answerText}>{word}</Text>
            {/* Flash overlay */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                styles.flashOverlay,
                { backgroundColor: flashColor, opacity: bgOpacity },
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────

type Props = { step: SwitchbackStep };
type MaskPhase = 'A' | 'B';

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

  const [shuffled] = useState(() => shuffleAnswers(step.answers));
  const [tileStates, setTileStates] = useState<Map<string, TileState>>(() => {
    const m = new Map<string, TileState>();
    step.answers.forEach(a => m.set(a.word, 'idle'));
    return m;
  });

  const [maskPhase, setMaskPhase]   = useState<MaskPhase>('A');
  const attemptsRef                 = useRef(0);
  const completedRef                = useRef(false);
  const transitioningRef            = useRef(false); // blocks input during A→B pause

  // ── Polly text ──────────────────────────────────────────────
  const [pollyText, setPollyText]   = useState<string | null>(null);
  const pollyOpacity = useRef(new Animated.Value(0)).current;

  function showPolly(text: string) {
    setPollyText(text);
    pollyOpacity.setValue(0);
    Animated.timing(pollyOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }

  // ── Mask bar slide animations ─────────────────────────────────
  const maskATransX  = useRef(new Animated.Value(-400)).current;
  const maskBTransX  = useRef(new Animated.Value(400)).current;
  const maskBarOpacity = useRef(new Animated.Value(0)).current;

  // ── Mask bar flash on phase-A confirmation ────────────────────
  const maskFlash = useRef(new Animated.Value(0)).current;

  function flashMaskBars() {
    maskFlash.setValue(0);
    Animated.sequence([
      Animated.timing(maskFlash, { toValue: 0.45, duration: 100, useNativeDriver: true }),
      Animated.timing(maskFlash, { toValue: 0,    duration: 250, useNativeDriver: true }),
    ]).start();
  }

  // ── maskReady: gate that ensures step data is available before rendering ──
  const [maskReady, setMaskReady] = useState(false);

  // ── boardReady: controls when answer tiles appear ─────────────
  const [boardReady, setBoardReady] = useState(false);

  // ── Entrance sequence ─────────────────────────────────────────
  useEffect(() => {
    // Confirm mask data is present before rendering
    if (step.maskA?.text && step.maskB?.text) {
      const readyId = setTimeout(() => setMaskReady(true), MASK_READY_DELAY);

      const t1 = setTimeout(() => {
        maskBarOpacity.setValue(1);
        Animated.parallel([
          Animated.spring(maskATransX, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
          Animated.spring(maskBTransX, { toValue: 0, tension: 200, friction: 12, useNativeDriver: true }),
        ]).start();
      }, MASK_ENTRY_DELAY);

      const t2 = setTimeout(() => {
        showPolly('One word. Two lives.');
      }, POLLY_DELAY);

      const t3 = setTimeout(() => {
        setBoardReady(true);
      }, BOARD_DELAY);

      return () => {
        clearTimeout(readyId);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Commit handler ────────────────────────────────────────────
  function handleCommit(word: string, isCorrect: boolean) {
    if (completedRef.current) return;
    if (transitioningRef.current) return;

    if (isCorrect) {
      if (maskPhase === 'A') {
        // Phase A confirmed: flash mask bars, Polly line, pause then activate Phase B
        flashMaskBars();
        showPolly(attemptsRef.current === 0 ? 'Sharp.' : 'Got there.');
        transitioningRef.current = true;
        setTimeout(() => {
          transitioningRef.current = false;
          setMaskPhase('B');
          showPolly('Same word. Confirm it.');
        }, 800);

      } else {
        // Phase B confirmed: complete the round — collapse this tile
        setTileStates(prev => new Map(prev).set(word, 'final-correct'));
        const bonus = attemptsRef.current === 0 ? 200 : 100;
        completedRef.current = true;
        setTimeout(() => store.completeSwitchback(bonus, true, attemptsRef.current), 1500);
      }

    } else {
      // Wrong swipe in either phase — flash tile, keep it visible, count attempt
      attemptsRef.current += 1;
      setTileStates(prev => new Map(prev).set(word, 'wrong-flash'));
      // Re-arm tile to idle after flash completes
      setTimeout(() => {
        setTileStates(prev => {
          if (prev.get(word) === 'wrong-flash') {
            return new Map(prev).set(word, 'idle');
          }
          return prev;
        });
      }, 400);

      // Two wrong guesses and still in Phase A → reveal correct word
      if (attemptsRef.current >= 2 && maskPhase === 'A') {
        completedRef.current = true;
        const correctWord = step.answers.find(a => a.correct)!.word;
        setTimeout(() => {
          setTileStates(prev => new Map(prev).set(correctWord, 'final-correct'));
          showPolly(step.pollyReveal);
        }, 450);
        setTimeout(() => store.completeSwitchback(0, false, attemptsRef.current), 2200);
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* Kicker */}
      <Text style={styles.kicker}>SWITCHBACK</Text>

      {/* Phase indicator */}
      <Text style={styles.phaseLabel}>
        {maskPhase === 'A' ? 'MASK A' : 'MASK B'}
      </Text>

      {/* Mask bars — only render when data is confirmed ready */}
      {maskReady ? (
        <>
          {/* Mask A */}
          <Text style={styles.maskLabel}>MASK A</Text>
          <Animated.View
            style={[
              styles.maskBar,
              { opacity: maskBarOpacity, transform: [{ translateX: maskATransX }] },
            ]}
          >
            <Text style={styles.maskText}>{step.maskA.text}</Text>
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, styles.maskFlashOverlay, { opacity: maskFlash }]}
            />
          </Animated.View>

          {/* Mask B */}
          <Text style={[styles.maskLabel, styles.maskBLabel]}>MASK B</Text>
          <Animated.View
            style={[
              styles.maskBar,
              { opacity: maskBarOpacity, transform: [{ translateX: maskBTransX }] },
            ]}
          >
            <Text style={styles.maskText}>{step.maskB.text}</Text>
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, styles.maskFlashOverlay, { opacity: maskFlash }]}
            />
          </Animated.View>
        </>
      ) : (
        // Loading state while mask data is being confirmed
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Get ready...</Text>
        </View>
      )}

      {/* Polly line */}
      {pollyText !== null && (
        <Animated.Text style={[styles.pollyLine, { opacity: pollyOpacity }]}>
          {pollyText}
        </Animated.Text>
      )}

      {/* Answer tiles — all 4 always present; no tile is ever removed */}
      {boardReady && (
        <View style={styles.tileStack}>
          {shuffled.map((answer, index) => (
            <AnswerTile
              key={answer.word}
              word={answer.word}
              state={tileStates.get(answer.word) ?? 'idle'}
              onCommit={() => handleCommit(answer.word, answer.correct)}
              entryDelay={index * 100}
              disabled={transitioningRef.current}
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
    marginBottom: 6,
  },
  phaseLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  maskLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  maskBLabel: {
    marginTop: 24,
  },
  maskBar: {
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#251F4A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  maskText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    flex: 1,
  },
  maskFlashOverlay: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
  },
  loadingState: {
    height: 168, // approximate height of two mask bars + labels
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
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
    overflow: 'hidden',
  },
  answerText: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'BagelFatOne_400Regular',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  flashOverlay: {
    borderRadius: 10,
  },
});
