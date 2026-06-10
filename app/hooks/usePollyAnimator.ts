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
  | 'gateMastered'
  | 'gateMasteredBoss'
  | 'hiddenMasterFailed';

type BreathingSpeed = 'slow' | 'building' | 'hot' | 'danger';

const BREATH_DURATIONS: Record<BreathingSpeed, [number, number]> = {
  slow:     [1200, 1300],
  building: [900,  900],
  hot:      [600,  600],
  danger:   [400,  400],
};

// Max 1 mid-round pop-in per word. End-of-round events always fire.
const MID_ROUND_BUDGET = 1;

export function usePollyAnimator(
  streakCount: number,
  lives: number,
  _stepIndex: number,
) {
  const [currentPose, setCurrentPose] = useState<PollyPose>('TOP_LEFT');
  const [currentSpeechLine, setCurrentSpeechLine] = useState<string | null>(null);

  // ── Pop-in visibility ─────────────────────────────────────────
  const [pollyPopInVisible, _setPollyPopInVisible] = useState(false);
  const pollyPopInVisibleRef = useRef(false);
  function setPollyPopInVisible(v: boolean) {
    pollyPopInVisibleRef.current = v;
    _setPollyPopInVisible(v);
  }

  // Enter/exit animation (native driver: opacity + translateY)
  const pollyEnterAnim    = useRef(new Animated.Value(0)).current;
  const pollyHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-word mid-round budget — resets on word entry / component remount
  const popInCountRef = useRef(0);

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

  // ── pop-in helpers ─────────────────────────────────────────────

  function showPollyPopIn() {
    if (pollyHideTimerRef.current !== null) {
      clearTimeout(pollyHideTimerRef.current);
      pollyHideTimerRef.current = null;
    }
    setPollyPopInVisible(true);
    Animated.spring(pollyEnterAnim, {
      toValue: 1, damping: 18, stiffness: 280, useNativeDriver: true,
    }).start();
  }

  function schedulePollyHide(afterMs: number) {
    if (pollyHideTimerRef.current !== null) clearTimeout(pollyHideTimerRef.current);
    pollyHideTimerRef.current = setTimeout(() => {
      pollyHideTimerRef.current = null;
      Animated.timing(pollyEnterAnim, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }).start();
      // Unmount after fade completes
      setTimeout(() => setPollyPopInVisible(false), 320);
    }, afterMs);
  }

  /** One mid-round pop-in per word. Silently skipped if budget is used. */
  function tryMidRoundPopIn(action: () => void, speechDuration: number) {
    if (popInCountRef.current >= MID_ROUND_BUDGET) return;
    popInCountRef.current += 1;
    action();
    showPollyPopIn();
    schedulePollyHide(speechDuration + 600);
  }

  /** End-of-round or major event — always fires regardless of budget. */
  function endOfRoundPopIn(action: () => void, speechDuration: number) {
    action();
    showPollyPopIn();
    schedulePollyHide(speechDuration + 800);
  }

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
        popInCountRef.current = 0;
        setCurrentPose('TOP_LEFT');
        stopSwayLoops();
        setSpeech(null);
        Animated.timing(ghostTintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        wordBob();
        break;

      case 'correct':
        if (!wordFirstCorrectRef.current) {
          wordFirstCorrectRef.current = true;
          tryMidRoundPopIn(() => {
            setCurrentPose('BOT_LEFT');
            animWin();
            setSpeech('Put that meaning back.', 2000);
          }, 2000);
        } else if (pollyPopInVisibleRef.current) {
          // Already visible — just react, no new pop-in
          setCurrentPose('BOT_LEFT');
          animWinMicro();
        }
        break;

      case 'allMasksFound':
        tryMidRoundPopIn(() => {
          setCurrentPose('MID_LEFT');
          animBigWin();
          setSpeech("Stop picking my locks.", 2500);
        }, 2500);
        break;

      case 'hiddenFound':
        tryMidRoundPopIn(() => {
          setCurrentPose('BOT_RIGHT');
          animBigWin();
          setSpeech('That meaning was buried.', 2000);
        }, 2000);
        break;

      case 'cleanSweep':
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animWin();
          setSpeech('My stash is empty.', 2000);
        }, 2000);
        break;

      case 'wrong': {
        wrongCountRef.current++;
        const wc = wrongCountRef.current;
        const doWrongAnim = () => {
          if (wc >= 3) {
            setCurrentPose('BOT_CENTER');
            animWayWrong();
            setSpeech(wc === 3 ? 'That swipe was butter-knife sharp.' : 'My trap had more bite.', 2000);
          } else if (wc === 2) {
            setCurrentPose('MID_CENTER');
            animWrong();
            setSpeech('Close enough to fool you.', 2000);
          } else {
            setCurrentPose('MID_CENTER');
            animWrong();
            setSpeech('That one almost belonged.', 2000);
          }
        };
        if (pollyPopInVisibleRef.current) {
          // Already visible — react without consuming budget again
          doWrongAnim();
          schedulePollyHide(2600);
        } else {
          tryMidRoundPopIn(doWrongAnim, 2000);
        }
        break;
      }

      case 'bossEntry':
        // Boss entrance — always show, major moment
        endOfRoundPopIn(() => {
          setCurrentPose('TOP_RIGHT');
          animBossSnap(() => setSpeech('This word stays mine.'));
        }, 3500);
        break;

      case 'ghostEntry':
        tryMidRoundPopIn(() => {
          setCurrentPose('TOP_CENTER');
          setGhostTint(1);
          ghostSwayLoopRef.current?.stop();
          ghostSwayLoopRef.current = Animated.loop(Animated.sequence([
            Animated.timing(translateX, { toValue:  8, duration: 750,  useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -8, duration: 1500, useNativeDriver: true }),
            Animated.timing(translateX, { toValue:  0, duration: 750,  useNativeDriver: true }),
          ]));
          ghostSwayLoopRef.current.start();
        }, 4000);
        break;

      case 'ghostFoundLate':
        ghostSwayLoopRef.current?.stop();
        Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        setGhostTint(0);
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animWin();
          setSpeech('Rematch won.', 2500);
        }, 2500);
        break;

      case 'ghostDissolved':
        ghostSwayLoopRef.current?.stop();
        Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        setGhostTint(0);
        endOfRoundPopIn(() => {
          setCurrentPose('MID_RIGHT');
          animHeadShake();
          setSpeech("Still haunting you.", 2500);
        }, 2500);
        break;

      case 'oneHeartLeft':
        // Critical — always show regardless of budget
        breathSpeedRef.current = 'danger';
        setCurrentPose('TOP_RIGHT');
        showPollyPopIn();
        animBossSnap();
        setSpeech('One feather left. Delicious.', 2500);
        schedulePollyHide(3500);
        break;

      case 'hesitation3s':
        tryMidRoundPopIn(() => {
          setCurrentPose('TOP_CENTER');
          hesLoopRef.current?.stop();
          hesLoopRef.current = Animated.loop(Animated.sequence([
            Animated.timing(translateX, { toValue:  6, duration: 500,  useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -6, duration: 1000, useNativeDriver: true }),
            Animated.timing(translateX, { toValue:  0, duration: 500,  useNativeDriver: true }),
          ]));
          hesLoopRef.current.start();
          setSpeech('That one looks guilty.', 3000);
        }, 6000);
        break;

      case 'hesitation6s':
        // Only update speech if Polly is already visible from hesitation3s
        if (pollyPopInVisibleRef.current) {
          setSpeech('Almost real. Almost.', 3000);
          schedulePollyHide(3800);
        }
        break;

      case 'hesitation9s':
        if (pollyPopInVisibleRef.current) {
          setSpeech('Trust that swipe?', 2000);
          schedulePollyHide(2800);
        }
        break;

      case 'hesitationCleared':
        hesLoopRef.current?.stop();
        hesLoopRef.current = null;
        Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        break;

      case 'streakX10':
        tryMidRoundPopIn(() => {
          setCurrentPose('MID_LEFT');
          animBigWin();
          setSpeech("Cute streak. Still mine.", 2500);
        }, 2500);
        break;

      case 'switchbackEntry':
        popInCountRef.current = 0;
        setCurrentPose('TOP_CENTER');
        stopSwayLoops();
        setSpeech(null);
        Animated.timing(ghostTintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        wordBob();
        break;

      case 'switchbackCorrect':
        tryMidRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animWin();
          setSpeech('Borrowed brains.', 1800);
        }, 1800);
        break;

      case 'gameOver':
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_RIGHT');
          animBigWin();
          setSpeech('Mine. Every meaning.', 2500);
        }, 2500);
        break;

      case 'gateIntro':
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animWin();
          setSpeech('Miss one, and it haunts you.', 4500);
        }, 4500);
        break;

      case 'gateMastered':
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animBigWin();
          setSpeech('That was mine.', 3000);
        }, 3000);
        break;

      case 'gateMasteredBoss':
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animBigWin();
          setSpeech('The word betrayed me.', 3000);
        }, 3000);
        break;

      case 'hiddenMasterFailed':
        endOfRoundPopIn(() => {
          setCurrentPose('BOT_LEFT');
          animWin();
          setSpeech('Not yours. Yet.', 3000);
        }, 3000);
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
      if (pollyHideTimerRef.current !== null) clearTimeout(pollyHideTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── composed styles ───────────────────────────────────────────
  const rotateStr = rotate.interpolate({
    inputRange:  [-10, 0, 10],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const pollyEnterTranslateY = pollyEnterAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [40, 0],
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
    pollyPopInVisible,
    pollyPopInStyle: {
      opacity: pollyEnterAnim,
      transform: [{ translateY: pollyEnterTranslateY }],
    },
  };
}
