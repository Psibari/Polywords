import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
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
  | 'switchbackEntry'
  | 'switchbackCorrect'
  | 'gameOver'
  | 'gateIntro'
  | 'gateMastered';

type BreathingSpeed = 'slow' | 'building' | 'hot' | 'danger';

const BREATH_DURATIONS: Record<BreathingSpeed, [number, number]> = {
  slow:     [1200, 1300],
  building: [900,  900],
  hot:      [600,  600],
  danger:   [400,  400],
};

export function usePollyAnimator(
  streakCount: number,
  lives: number,
  _stepIndex: number,
) {
  const [currentPose, setCurrentPose] = useState<PollyPose>('TOP_LEFT');
  const [currentSpeechLine, setCurrentSpeechLine] = useState<string | null>(null);

  // Animated values — all native-driver compatible (transform + opacity only)
  const scale            = useRef(new Animated.Value(1)).current;
  const translateX       = useRef(new Animated.Value(0)).current;
  const translateY       = useRef(new Animated.Value(0)).current;
  const rotate           = useRef(new Animated.Value(0)).current;
  const ghostTintOpacity = useRef(new Animated.Value(0)).current;

  // Loop refs
  const breathLoopRef    = useRef<Animated.CompositeAnimation | null>(null);
  const ghostSwayLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const hesLoopRef       = useRef<Animated.CompositeAnimation | null>(null);

  // Mutable state refs
  const breathSpeedRef      = useRef<BreathingSpeed>('slow');
  const isBossFrozenRef     = useRef(false);
  const wordFirstCorrectRef = useRef(false);
  const wrongCountRef       = useRef(0);
  const speechTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livesRef            = useRef(lives);
  livesRef.current          = lives;

  // ── helpers ───────────────────────────────────────────────────

  function setSpeech(line: string | null, ms = 2000) {
    if (speechTimerRef.current !== null) clearTimeout(speechTimerRef.current);
    setCurrentSpeechLine(line);
    if (line !== null) {
      speechTimerRef.current = setTimeout(() => setCurrentSpeechLine(null), ms);
    }
  }

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

  function stopSwayLoops() {
    ghostSwayLoopRef.current?.stop();
    hesLoopRef.current?.stop();
    Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  }

  function animWin() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(translateY, { toValue: -16, damping: 10, stiffness: 280, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0,   damping: 10, stiffness: 280, useNativeDriver: true }),
    ]).start(() => startBreathing());
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.10, damping: 10, stiffness: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 10, stiffness: 280, useNativeDriver: true }),
    ]).start();
  }

  function animWinMicro() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.06, damping: 10, stiffness: 280, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 10, stiffness: 280, useNativeDriver: true }),
    ]).start(() => startBreathing());
  }

  function animBigWin() {
    breathLoopRef.current?.stop();
    stopSwayLoops();
    Animated.sequence([
      Animated.spring(translateY, { toValue: -24, damping: 6, stiffness: 200, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0,   damping: 6, stiffness: 200, useNativeDriver: true }),
    ]).start(() => startBreathing());
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.20, damping: 6, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 0.95, damping: 6, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 6, stiffness: 200, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(rotate, { toValue: -5, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  5, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  0, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function animWrong() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(translateX, { toValue: -12, damping: 10, stiffness: 300, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0,   damping: 10, stiffness: 300, useNativeDriver: true }),
    ]).start(() => startBreathing());
    Animated.sequence([
      Animated.timing(rotate, { toValue: -4, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  0, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function animWayWrong() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.timing(translateX, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  10, duration: 80, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:  -8, duration: 80, useNativeDriver: true }),
      Animated.timing(translateX, { toValue:   0, duration: 80, useNativeDriver: true }),
    ]).start(() => startBreathing());
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.05, damping: 10, stiffness: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 10, stiffness: 300, useNativeDriver: true }),
    ]).start();
  }

  function animBossSnap(onFreezeEnd?: () => void) {
    breathLoopRef.current?.stop();
    isBossFrozenRef.current = true;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0,  duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        isBossFrozenRef.current = false;
        startBreathing();
        onFreezeEnd?.();
      }, 800);
    });
  }

  function animHeadShake() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.timing(rotate, { toValue: -5, duration: 150, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  5, duration: 300, useNativeDriver: true }),
      Animated.timing(rotate, { toValue:  0, duration: 150, useNativeDriver: true }),
    ]).start(() => startBreathing());
  }

  function setGhostTint(level: 0 | 1 | 2 | 3) {
    const targets = [0, 0.15, 0.25, 0.40] as const;
    Animated.timing(ghostTintOpacity, {
      toValue: targets[level],
      duration: 400,
      useNativeDriver: true,
    }).start();
  }

  function wordBob() {
    breathLoopRef.current?.stop();
    translateY.setValue(12);
    scale.setValue(0.92);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 12, stiffness: 200, useNativeDriver: true }),
      Animated.spring(scale,      { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
    ]).start(() => startBreathing());
  }

  // ── main event dispatcher ─────────────────────────────────────

  const firePollyEvent = useCallback((event: PollyEvent) => {
    switch (event) {

      case 'wordEntry':
        wordFirstCorrectRef.current = false;
        wrongCountRef.current = 0;
        setCurrentPose('TOP_LEFT');
        stopSwayLoops();
        setSpeech(null);
        // Always clear ghost tint on new word — previous ghost state must not bleed through
        Animated.timing(ghostTintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        wordBob();
        break;

      case 'correct':
        if (!wordFirstCorrectRef.current) {
          wordFirstCorrectRef.current = true;
          setCurrentPose('BOT_LEFT');
          animWin();
          setSpeech('WORD UP');
        } else {
          setCurrentPose('BOT_LEFT');
          animWinMicro();
        }
        break;

      case 'allMasksFound':
        setCurrentPose('MID_LEFT');
        animBigWin();
        setSpeech("That's what I'm talking about.");
        break;

      case 'hiddenFound':
        setCurrentPose('BOT_RIGHT');
        animBigWin();
        setSpeech('Brain glitch');
        break;

      case 'cleanSweep':
        setCurrentPose('BOT_LEFT');
        animWin();
        setSpeech('CLEAN SWEEP');
        break;

      case 'wrong': {
        wrongCountRef.current++;
        const wc = wrongCountRef.current;
        if (wc >= 3) {
          setCurrentPose('BOT_CENTER');
          animWayWrong();
          setSpeech(wc === 3 ? 'BLAHH HA HA HA' : 'What was that?');
        } else if (wc === 2) {
          setCurrentPose('MID_CENTER');
          animWrong();
          setSpeech('Hard no.');
        } else {
          setCurrentPose('MID_CENTER');
          animWrong();
          setSpeech('Nope.');
        }
        break;
      }

      case 'bossEntry':
        setCurrentPose('TOP_RIGHT');
        animBossSnap(() => setSpeech('Did you just—'));
        break;

      case 'ghostEntry':
        setCurrentPose('TOP_CENTER');
        setGhostTint(1);
        ghostSwayLoopRef.current?.stop();
        ghostSwayLoopRef.current = Animated.loop(Animated.sequence([
          Animated.timing(translateX, { toValue:  8, duration: 750,  useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -8, duration: 1500, useNativeDriver: true }),
          Animated.timing(translateX, { toValue:  0, duration: 750,  useNativeDriver: true }),
        ]));
        ghostSwayLoopRef.current.start();
        break;

      case 'ghostFoundLate':
        ghostSwayLoopRef.current?.stop();
        Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        setGhostTint(0);
        setCurrentPose('BOT_LEFT');
        animWin();
        setSpeech('You almost left that one behind.');
        break;

      case 'ghostDissolved':
        ghostSwayLoopRef.current?.stop();
        Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        setGhostTint(0);
        setCurrentPose('MID_RIGHT');
        animHeadShake();
        setSpeech("That one's gone. You won't see it again.");
        break;

      case 'oneHeartLeft':
        breathSpeedRef.current = 'danger';
        setCurrentPose('TOP_RIGHT');
        animBossSnap();
        setSpeech('Oh. NOOOooo');
        break;

      case 'hesitation3s':
        setCurrentPose('TOP_CENTER');
        hesLoopRef.current?.stop();
        hesLoopRef.current = Animated.loop(Animated.sequence([
          Animated.timing(translateX, { toValue:  6, duration: 500,  useNativeDriver: true }),
          Animated.timing(translateX, { toValue: -6, duration: 1000, useNativeDriver: true }),
          Animated.timing(translateX, { toValue:  0, duration: 500,  useNativeDriver: true }),
        ]));
        hesLoopRef.current.start();
        setSpeech('You sure about that.');
        break;

      case 'hesitation6s':
        setSpeech('Really. That one.');
        break;

      case 'hesitation9s':
        setSpeech('Hard no.');
        break;

      case 'hesitationCleared':
        hesLoopRef.current?.stop();
        hesLoopRef.current = null;
        Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        break;

      case 'streakX10':
        setCurrentPose('MID_LEFT');
        animBigWin();
        setSpeech('BINGO BANGO ZZZINGOO');
        break;

      case 'switchbackEntry':
        setCurrentPose('TOP_CENTER');
        stopSwayLoops();
        setSpeech(null);
        Animated.timing(ghostTintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        wordBob();
        break;

      case 'switchbackCorrect':
        setCurrentPose('BOT_LEFT');
        animWin();
        setSpeech('Sharp.');
        break;

      case 'gameOver':
        setCurrentPose('BOT_RIGHT');
        animBigWin();
        setSpeech('AARRRGGHH');
        break;

      case 'gateIntro':
        setCurrentPose('BOT_LEFT');
        animWin();
        setSpeech('Only with a perfect sweep — or it will come back to haunt you.', 4500);
        break;

      case 'gateMastered':
        setCurrentPose('BOT_LEFT');
        animBigWin();
        setSpeech('Mastered.', 3000);
        break;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── breathing speed — streak ──────────────────────────────────
  useEffect(() => {
    if (livesRef.current === 1) return;
    if (streakCount >= 7) {
      breathSpeedRef.current = 'hot';
    } else if (streakCount >= 3) {
      breathSpeedRef.current = 'building';
    } else {
      breathSpeedRef.current = 'slow';
    }
    startBreathing();
  }, [streakCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── breathing speed — lives ───────────────────────────────────
  useEffect(() => {
    if (lives === 1) {
      breathSpeedRef.current = 'danger';
      startBreathing();
    }
  }, [lives]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── mount / unmount ───────────────────────────────────────────
  useEffect(() => {
    startBreathing();
    return () => {
      breathLoopRef.current?.stop();
      ghostSwayLoopRef.current?.stop();
      hesLoopRef.current?.stop();
      if (speechTimerRef.current !== null) clearTimeout(speechTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── composed style ────────────────────────────────────────────
  const rotateStr = rotate.interpolate({
    inputRange:  [-10, 0, 10],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return {
    currentPose,
    currentSpeechLine,
    speechLineVisible: currentSpeechLine !== null,
    pollyAnimatedStyle: {
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate: rotateStr },
      ],
    },
    ghostTintOpacity,
    firePollyEvent,
  };
}
