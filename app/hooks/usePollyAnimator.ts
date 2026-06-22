import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import type { PollyPose } from '../components/ui/PollySprite';

export type PollyEvent =
  | 'wordEntry'
  | 'correct'
  | 'allMasksFound'
  | 'hiddenFound'
  | 'cleanSweep'
  | 'wrong'
  | 'bossEntry'
  | 'ghostEntry'
  | 'ghostFoundLate'
  | 'ghostDissolved'
  | 'oneHeartLeft'
  | 'hesitation3s'
  | 'hesitation6s'
  | 'hesitation9s'
  | 'hesitationCleared'
  | 'streakX10'
  | 'gameOver'
  | 'gateMastered'
  | 'gateMasteredBoss'
  | 'hiddenMasterFailed'
  | 'hauntFailed'
  | 'oneWrongMove';

type PerchSide = 'left' | 'right';
type BreathingSpeed = 'slow' | 'building' | 'hot' | 'danger';

const BREATH_DURATIONS: Record<BreathingSpeed, [number, number]> = {
  slow:     [1200, 1300],
  building: [900,  900],
  hot:      [600,  600],
  danger:   [400,  400],
};

const MID_ROUND_BUDGET = 1;

// Screen layout constants — adjust if layout changes
const SCREEN_W = 390;
const POLLY_SIZE = 190;
const PERCH_LEFT_X  = -16;
const PERCH_LEFT_Y  = 0;
const PERCH_RIGHT_X = SCREEN_W - POLLY_SIZE + 16;
const PERCH_RIGHT_Y = 0;
const START_X = -POLLY_SIZE - 20;
const START_Y = 120;

const LEFT_FACING_POSES: PollyPose[] = ['perchSmug'];

function perchSideForPose(pose: PollyPose, isEndOfRound: boolean): PerchSide {
  if (LEFT_FACING_POSES.includes(pose)) return 'right';
  if (isEndOfRound) return 'right';
  return 'left';
}

export function usePollyAnimator(
  streakCount: number,
  lives: number,
  _stepIndex: number,
) {
  const [currentPose, setCurrentPose] = useState<PollyPose>('flyExcited');
  const [currentSpeechLine, setCurrentSpeechLine] = useState<string | null>(null);
  const [pollyVisible, _setPollyVisible] = useState(false);
  const pollyVisibleRef = useRef(false);
  const [perchSide, setPerchSide] = useState<PerchSide>('left');

  function setPollyVisible(v: boolean) {
    pollyVisibleRef.current = v;
    _setPollyVisible(v);
  }

  // Position animated values — useNativeDriver: true (transform only)
  const pollyX = useRef(new Animated.Value(START_X)).current;
  const pollyY = useRef(new Animated.Value(START_Y)).current;
  const pollyOpacity = useRef(new Animated.Value(0)).current;

  // Secondary animations
  const scale            = useRef(new Animated.Value(1)).current;
  const rotate           = useRef(new Animated.Value(0)).current;
  const ghostTintOpacity = useRef(new Animated.Value(0)).current;

  const breathLoopRef    = useRef<Animated.CompositeAnimation | null>(null);
  const speechTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathSpeedRef   = useRef<BreathingSpeed>('slow');
  const isBossFrozenRef  = useRef(false);
  const popInCountRef    = useRef(0);
  const wordFirstCorrectRef  = useRef(false);
  const wrongCountRef        = useRef(0);
  const oneWrongMoveFiredRef = useRef(false);
  const livesRef = useRef(lives);
  livesRef.current = lives;

  // ── Fly-in animation ──────────────────────────────────────────

  function flyInToPerch(side: PerchSide, onLand?: () => void) {
    const targetX = side === 'left' ? PERCH_LEFT_X  : PERCH_RIGHT_X;
    const targetY = side === 'left' ? PERCH_LEFT_Y  : PERCH_RIGHT_Y;

    // Reset to start position, make visible
    pollyX.setValue(START_X);
    pollyY.setValue(START_Y);
    pollyOpacity.setValue(1);
    setPollyVisible(true);
    setPerchSide(side);

    Animated.parallel([
      Animated.timing(pollyX, {
        toValue: targetX,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(pollyY, {
        toValue: targetY,
        damping: 14,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onLand?.();
    });
  }

  function exitPerch(side: PerchSide, onDone?: () => void) {
    const exitX = side === 'left' ? -(POLLY_SIZE + 40) : SCREEN_W + 40;
    Animated.timing(pollyX, {
      toValue: exitX,
      duration: 300,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setPollyVisible(false);
      pollyOpacity.setValue(0);
      onDone?.();
    });
  }

  function scheduleExit(afterMs: number, side: PerchSide) {
    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      exitPerch(side);
    }, afterMs);
  }

  // ── Mid-round and end-of-round helpers ────────────────────────

  function tryMidRound(flyPose: PollyPose, perchPose: PollyPose, speech: string, speechMs: number) {
    if (popInCountRef.current >= MID_ROUND_BUDGET) return;
    popInCountRef.current += 1;
    const side = perchSideForPose(perchPose, false);
    setCurrentPose(flyPose);
    flyInToPerch(side, () => {
      setCurrentPose(perchPose);
      startBreathing();
    });
    setSpeech(speech, speechMs);
    scheduleExit(speechMs + 600, side);
  }

  function endOfRound(flyPose: PollyPose, perchPose: PollyPose, speech: string, speechMs: number) {
    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
    const side = perchSideForPose(perchPose, true);
    setCurrentPose(flyPose);
    flyInToPerch(side, () => {
      setCurrentPose(perchPose);
      startBreathing();
    });
    setSpeech(speech, speechMs);
    scheduleExit(speechMs + 800, side);
  }

  function forceMidRound(flyPose: PollyPose, perchPose: PollyPose, speech: string, speechMs: number) {
    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
    const side = perchSideForPose(perchPose, false);
    setCurrentPose(flyPose);
    flyInToPerch(side, () => {
      setCurrentPose(perchPose);
      startBreathing();
    });
    setSpeech(speech, speechMs);
    scheduleExit(speechMs + 600, side);
  }

  // ── Speech ────────────────────────────────────────────────────

  function setSpeech(line: string | null, ms = 2000) {
    if (speechTimerRef.current !== null) clearTimeout(speechTimerRef.current);
    setCurrentSpeechLine(line);
    if (line !== null) {
      speechTimerRef.current = setTimeout(() => setCurrentSpeechLine(null), ms);
    }
  }

  // ── Breathing ─────────────────────────────────────────────────

  function startBreathing() {
    breathLoopRef.current?.stop();
    if (isBossFrozenRef.current) return;
    const [inDur, outDur] = BREATH_DURATIONS[breathSpeedRef.current];
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.015, duration: inDur,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0,   duration: outDur, useNativeDriver: true }),
    ]));
    breathLoopRef.current = loop;
    loop.start();
  }

  // ── Secondary animations ──────────────────────────────────────

  function animWin() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.10, damping: 10, stiffness: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 10, stiffness: 280, useNativeDriver: true }),
    ]).start(() => startBreathing());
  }

  function animWrong() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.timing(rotate, { toValue: -4, duration: 120, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  0, duration: 120, useNativeDriver: true }),
    ]).start(() => startBreathing());
  }

  function animBigWin() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.20, damping: 6, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 0.95, damping: 6, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 6, stiffness: 200, useNativeDriver: true }),
    ]).start(() => startBreathing());
    Animated.sequence([
      Animated.timing(rotate, { toValue: -5, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  5, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  0, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function setGhostTint(level: 0 | 1 | 2 | 3) {
    const targets = [0, 0.15, 0.25, 0.40] as const;
    Animated.timing(ghostTintOpacity, {
      toValue: targets[level],
      duration: 400,
      useNativeDriver: true,
    }).start();
  }

  // ── Main event dispatcher ─────────────────────────────────────

  const firePollyEvent = useCallback((event: PollyEvent) => {
    switch (event) {

      case 'wordEntry':
        wordFirstCorrectRef.current = false;
        wrongCountRef.current = 0;
        popInCountRef.current = 0;
        oneWrongMoveFiredRef.current = false;
        setSpeech(null);
        if (exitTimerRef.current !== null) { clearTimeout(exitTimerRef.current); exitTimerRef.current = null; }
        Animated.timing(ghostTintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        break;

      case 'correct':
        if (!wordFirstCorrectRef.current) {
          wordFirstCorrectRef.current = true;
          tryMidRound('flyExcited', 'perchDismissive', 'Put that meaning back.', 2000);
        } else if (pollyVisibleRef.current) {
          setCurrentPose('perchDismissive');
          animWin();
        }
        break;

      case 'allMasksFound':
        tryMidRound('flyExcited', 'perchShocked', 'Stop picking my locks.', 2500);
        break;

      case 'hiddenFound':
        tryMidRound('flyExcited', 'perchShocked', 'That meaning was buried.', 2000);
        break;

      case 'cleanSweep':
        endOfRound('flyRelaxed', 'perchSulking', 'My stash is empty.', 2000);
        break;

      case 'wrong': {
        wrongCountRef.current++;
        const wc = wrongCountRef.current;
        const speech = wc >= 3 ? 'BBBLAAAAHHAHAHA!' : wc === 2 ? 'Close enough to fool you.' : 'Thought so.';
        const pose: PollyPose = wc >= 3 ? 'perchLaughing' : 'perchSmug';
        if (pollyVisibleRef.current) {
          setCurrentPose(pose);
          animWrong();
          setSpeech(speech, 2000);
          scheduleExit(2600, perchSide);
        } else {
          tryMidRound('flyExcited', pose, speech, 2000);
        }
        break;
      }

      case 'bossEntry':
        endOfRound('flyExcited', 'perchPointing', 'This word stays mine.', 3500);
        break;

      case 'ghostEntry':
        tryMidRound('flyExcited', 'perchSmug', "It's still here.", 4000);
        setGhostTint(1);
        break;

      case 'ghostFoundLate':
        setGhostTint(0);
        endOfRound('flyRelaxed', 'perchSulking', 'Rematch won.', 2500);
        break;

      case 'ghostDissolved':
        setGhostTint(0);
        endOfRound('flyExcited', 'perchSmug', 'Still haunting you.', 2500);
        break;

      case 'oneHeartLeft':
        forceMidRound('flyExcited', 'perchSmug', 'One feather left. Delicious.', 2500);
        break;

      case 'oneWrongMove':
        if (!oneWrongMoveFiredRef.current) {
          oneWrongMoveFiredRef.current = true;
          endOfRound('flyExcited', 'perchSmug', 'One wrong move.', 2000);
        }
        break;

      case 'hesitation3s':
        tryMidRound('flyExcited', 'perchSmug', 'That one looks guilty.', 6000);
        break;

      case 'hesitation6s':
        if (pollyVisibleRef.current) setSpeech('Almost real. Almost.', 3000);
        break;

      case 'hesitation9s':
        if (pollyVisibleRef.current) setSpeech('Trust that swipe?', 2000);
        break;

      case 'hesitationCleared':
        break;

      case 'streakX10':
        tryMidRound('flyExcited', 'perchDismissive', 'Cute streak. Still mine.', 2500);
        break;

      case 'gameOver':
        endOfRound('flyAngry', 'perchLaughing', 'POLLY CLIPPED YOUR RUN.', 3000);
        break;

      case 'gateMastered':
        endOfRound('flyRelaxed', 'perchSulking', 'YOU BEAT POLLY', 3000);
        animBigWin();
        break;

      case 'gateMasteredBoss':
        endOfRound('flyRelaxed', 'perchSulking', 'The word betrayed me.', 3000);
        break;

      case 'hiddenMasterFailed':
        endOfRound('flyExcited', 'perchLaughing', 'Not yours. Yet.', 3000);
        break;

      case 'hauntFailed':
        endOfRound('flyAngry', 'perchLaughing', 'BBBLAAAAHHAHAHA!', 3000);
        animBigWin();
        break;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Breathing speed — streak ──────────────────────────────────
  useEffect(() => {
    if (livesRef.current === 1) return;
    breathSpeedRef.current = streakCount >= 7 ? 'hot' : streakCount >= 3 ? 'building' : 'slow';
    startBreathing();
  }, [streakCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lives === 1) { breathSpeedRef.current = 'danger'; startBreathing(); }
  }, [lives]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount / unmount ───────────────────────────────────────────
  useEffect(() => {
    startBreathing();
    return () => {
      breathLoopRef.current?.stop();
      if (speechTimerRef.current !== null) clearTimeout(speechTimerRef.current);
      if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Composed style ────────────────────────────────────────────
  const rotateStr = rotate.interpolate({
    inputRange: [-10, 0, 10],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return {
    currentPose,
    currentSpeechLine,
    speechLineVisible: currentSpeechLine !== null,
    pollyVisible,
    perchSide,
    pollyPositionStyle: {
      transform: [
        { translateX: pollyX },
        { translateY: pollyY },
      ],
    },
    pollyAnimatedStyle: {
      transform: [
        { scale },
        { rotate: rotateStr },
      ],
    },
    ghostTintOpacity,
    firePollyEvent,
  };
}
