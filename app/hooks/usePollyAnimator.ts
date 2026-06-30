import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';
import type { PollyPose } from '../components/ui/PollySprite';
import { playSfx } from '../audio/sfx';

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

export type PollyState = 'idle' | 'interested' | 'taunting' | 'aggressive' | 'defeated';

const SCREEN_W = Dimensions.get('window').width;
export const POLLY_GAMEPLAY_SIZE = 130; // ambient default, kept for import compat

// Branch geometry — fraction of screen width Polly can occupy
const BRANCH_MIN_X = SCREEN_W * 0.08;
const BRANCH_MAX_X = SCREEN_W * 0.78; // leaves room for her own width

const STATE_SIZE: Record<PollyState, number> = {
  idle:        120,
  interested:  130,
  taunting:    130,
  aggressive:  140,
  defeated:    110,
};

const STATE_BREATH_MS: Record<PollyState, number> = {
  idle:        1400,
  interested:  1100,
  taunting:    850,
  aggressive:  600,
  defeated:    1400,
};

const REACTION_SIZE = {
  wrong1:     150,
  wrong2:     155,
  wrong3:     165,
  shocked:    145,
  laugh:      155,
  bossFail:   175,
  bossMaster: 110,
} as const;

function clampBranchX(x: number) {
  return Math.min(Math.max(x, BRANCH_MIN_X), BRANCH_MAX_X);
}

export function usePollyAnimator(
  streakCount: number,
  lives: number,
  _stepIndex: number,
) {
  const [currentPose, setCurrentPose] = useState<PollyPose>('perchNeutral');
  const [currentSpeechLine, setCurrentSpeechLine] = useState<string | null>(null);
  const [pollyState, setPollyState] = useState<PollyState>('idle');
  const pollyStateRef = useRef<PollyState>('idle');

  function advanceState(next: PollyState) {
    const order: PollyState[] = ['idle', 'interested', 'taunting', 'aggressive', 'defeated'];
    const cur = order.indexOf(pollyStateRef.current);
    const tgt = order.indexOf(next);
    if (tgt > cur) {
      pollyStateRef.current = next;
      setPollyState(next);
    }
  }

  function forceState(next: PollyState) {
    pollyStateRef.current = next;
    setPollyState(next);
  }

  // ── Position on branch (X only — Y is fixed to branch height) ──
  const pollyX = useRef(new Animated.Value(SCREEN_W * 0.2)).current;
  const facingLeftToRight = useRef(true); // true = scaleX 1, false = scaleX -1
  const [facingFlip, setFacingFlip] = useState(1);

  // ── Hop (Y offset from branch) ──────────────────────────────────
  const hopY = useRef(new Animated.Value(0)).current;

  // ── Size (spring-animated) ──────────────────────────────────────
  const sizeAnim = useRef(new Animated.Value(STATE_SIZE.idle)).current;
  const [currentSize, setCurrentSize] = useState(STATE_SIZE.idle);
  useEffect(() => {
    const id = sizeAnim.addListener(({ value }) => setCurrentSize(value));
    return () => sizeAnim.removeListener(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Secondary animations ────────────────────────────────────────
  const scale  = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const ghostTintOpacity = useRef(new Animated.Value(0)).current;

  const breathLoopRef   = useRef<Animated.CompositeAnimation | null>(null);
  const wanderTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongCountRef   = useRef(0);
  const wordFirstCorrectRef = useRef(false);
  const oneWrongMoveFiredRef = useRef(false);
  const wanderingPausedRef = useRef(false);
  const livesRef = useRef(lives);
  livesRef.current = lives;

  // ── Breathing (always running, speed tied to state) ─────────────
  function startBreathing() {
    breathLoopRef.current?.stop();
    const dur = STATE_BREATH_MS[pollyStateRef.current];
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.02, duration: dur, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0,  duration: dur, useNativeDriver: true }),
    ]));
    breathLoopRef.current = loop;
    loop.start();
  }

  // ── Wander (idle drift along branch) ─────────────────────────────
  function scheduleWander() {
    if (wanderTimerRef.current !== null) clearTimeout(wanderTimerRef.current);
    const delay = 3000 + Math.random() * 4000;
    wanderTimerRef.current = setTimeout(() => {
      if (wanderingPausedRef.current) { scheduleWander(); return; }
      const targetX = clampBranchX(Math.random() * SCREEN_W);
      const goingRight = targetX > (pollyX as any)._value;
      facingLeftToRight.current = goingRight;
      setFacingFlip(goingRight ? 1 : -1);
      const dur = 1800 + Math.random() * 1400;
      Animated.timing(pollyX, {
        toValue: targetX,
        duration: dur,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => scheduleWander());
    }, delay);
  }

  function pauseWander() {
    wanderingPausedRef.current = true;
  }
  function resumeWander() {
    wanderingPausedRef.current = false;
  }

  // ── Size transitions ──────────────────────────────────────────
  function setSizeForState(state: PollyState) {
    Animated.spring(sizeAnim, {
      toValue: STATE_SIZE[state],
      damping: 14,
      stiffness: 160,
      useNativeDriver: false,
    }).start();
  }

  function bumpSize(px: number, holdMs: number) {
    Animated.spring(sizeAnim, {
      toValue: px,
      damping: 14,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
    if (reactionTimerRef.current !== null) clearTimeout(reactionTimerRef.current);
    reactionTimerRef.current = setTimeout(() => {
      setSizeForState(pollyStateRef.current);
    }, holdMs);
  }

  // ── Hop animations ──────────────────────────────────────────────
  function hopSmall() {
    // stays on branch — used for smug head tilt, no vertical hop
    Animated.sequence([
      Animated.timing(rotate, { toValue: -8, duration: 200, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 4,  duration: 200, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0,  duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function hopBig(shake?: boolean) {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(hopY, { toValue: -55, damping: 9, stiffness: 240, useNativeDriver: true }),
      Animated.delay(shake ? 280 : 420),
      Animated.spring(hopY, { toValue: 0, damping: 7, stiffness: 220, useNativeDriver: true }),
    ]).start(() => startBreathing());

    if (shake) {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(rotate, { toValue: -6, duration: 70, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 6,  duration: 70, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -6, duration: 70, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0,  duration: 70, useNativeDriver: true }),
        ]).start();
      }, 100);
    }
  }

  function hopRecoil() {
    // shocked — recoil up + brief shrink-settle
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(hopY, { toValue: -45, damping: 7, stiffness: 280, useNativeDriver: true }),
      Animated.delay(380),
      Animated.spring(hopY, { toValue: 0, damping: 8, stiffness: 220, useNativeDriver: true }),
    ]).start(() => startBreathing());
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, damping: 6, stiffness: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.03, damping: 6, stiffness: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0,  damping: 6, stiffness: 300, useNativeDriver: true }),
    ]).start();
  }

  function laughBob() {
    breathLoopRef.current?.stop();
    Animated.sequence([
      Animated.spring(hopY, { toValue: -45, damping: 8, stiffness: 240, useNativeDriver: true }),
      Animated.timing(hopY, { toValue: -12, duration: 280, useNativeDriver: true }),
      Animated.timing(hopY, { toValue: -45, duration: 280, useNativeDriver: true }),
      Animated.timing(hopY, { toValue: -12, duration: 280, useNativeDriver: true }),
      Animated.spring(hopY, { toValue: 0,   damping: 9, stiffness: 220, useNativeDriver: true }),
    ]).start(() => startBreathing());
  }

  function sulkDrop() {
    breathLoopRef.current?.stop();
    Animated.timing(hopY, { toValue: 6, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    Animated.timing(scale, { toValue: 0.95, duration: 500, useNativeDriver: true }).start(() => startBreathing());
  }

  function silentRetreat() {
    const edgeX = facingLeftToRight.current ? BRANCH_MIN_X : BRANCH_MAX_X;
    Animated.timing(pollyX, { toValue: edgeX, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }

  // ── Speech ────────────────────────────────────────────────────
  function setSpeech(line: string | null, ms = 2200) {
    if (speechTimerRef.current !== null) clearTimeout(speechTimerRef.current);
    setCurrentSpeechLine(line);
    if (line !== null) {
      speechTimerRef.current = setTimeout(() => setCurrentSpeechLine(null), ms);
    }
  }

  // ── Drift toward center on hesitation ───────────────────────────
  function driftToward(fraction: number) {
    const centerX = SCREEN_W / 2;
    const cur = (pollyX as any)._value as number;
    const target = clampBranchX(cur + (centerX - cur) * fraction);
    Animated.spring(pollyX, { toValue: target, damping: 16, stiffness: 90, useNativeDriver: true }).start();
  }

  // ── Main event dispatcher ────────────────────────────────────────
  const firePollyEvent = useCallback((event: PollyEvent) => {
    switch (event) {

      case 'wordEntry':
        wordFirstCorrectRef.current = false;
        wrongCountRef.current = 0;
        oneWrongMoveFiredRef.current = false;
        setSpeech(null);
        Animated.timing(ghostTintOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        break;

      case 'correct':
        if (!wordFirstCorrectRef.current) {
          wordFirstCorrectRef.current = true;
          setCurrentPose('perchDismissive');
          hopSmall();
        }
        break;

      case 'allMasksFound':
        setCurrentPose('perchShocked');
        bumpSize(REACTION_SIZE.shocked, 2000);
        hopRecoil();
        break;

      case 'hiddenFound':
        setCurrentPose('perchShocked');
        bumpSize(REACTION_SIZE.shocked, 1800);
        hopRecoil();
        break;

      case 'cleanSweep':
        setCurrentPose('perchLaughing');
        bumpSize(REACTION_SIZE.laugh, 2000);
        setSpeech('Bet you can\'t do that again.', 2200);
        laughBob();
        break;

      case 'wrong': {
        wrongCountRef.current++;
        const wc = wrongCountRef.current;
        pauseWander();
        if (wc === 1) {
          advanceState('taunting');
          setCurrentPose('perchSmug');
          setSpeech('Thought so.', 2200);
          bumpSize(REACTION_SIZE.wrong1, 2200);
          hopSmall();
        } else if (wc === 2) {
          setCurrentPose('perchPointing');
          setSpeech('NOPE.', 2000);
          bumpSize(REACTION_SIZE.wrong2, 2000);
          hopSmall();
        } else {
          advanceState('aggressive');
          setCurrentPose('perchLaughing');
          setSpeech('BBBLAAAAHHAHAHA!', 2400);
          bumpSize(REACTION_SIZE.wrong3, 2400);
          playSfx('pollySqwawkLaugh');
          hopBig(true);
        }
        setTimeout(resumeWander, 2600);
        break;
      }

      case 'bossEntry':
        forceState('aggressive');
        pauseWander();
        setCurrentPose('perchPointing');
        setSpeech('This word stays mine.', 3000);
        setSizeForState('aggressive');
        Animated.spring(pollyX, { toValue: SCREEN_W * 0.32, damping: 14, stiffness: 140, useNativeDriver: true }).start();
        break;

      case 'ghostEntry':
        setCurrentPose('perchSmug');
        setSpeech('Remember me.', 2400);
        bumpSize(REACTION_SIZE.wrong1, 2000);
        hopSmall();
        setGhostTint(1);
        break;

      case 'ghostFoundLate':
        setGhostTint(0);
        setCurrentPose('perchLaughing');
        setSpeech('LUCKY.', 2000);
        bumpSize(REACTION_SIZE.laugh, 2000);
        hopBig();
        break;

      case 'ghostDissolved':
        setGhostTint(0);
        setCurrentPose('perchSmug');
        setSpeech('Still haunting you.', 2200);
        break;

      case 'oneHeartLeft':
        advanceState('aggressive');
        setCurrentPose('perchSmug');
        setSpeech('Last one.', 2200);
        bumpSize(REACTION_SIZE.wrong1, 2200);
        hopSmall();
        break;

      case 'oneWrongMove':
        if (!oneWrongMoveFiredRef.current) {
          oneWrongMoveFiredRef.current = true;
          advanceState('aggressive');
          setSpeech(null);
          // silent — watching, waiting
        }
        break;

      case 'hesitation3s':
        advanceState('interested');
        setCurrentPose('perchPointing');
        setSpeech('YES...', 1800);
        driftToward(0.12);
        break;

      case 'hesitation6s':
        setCurrentPose('perchPointing');
        setSpeech('NO...', 1800);
        driftToward(0.18);
        break;

      case 'hesitation9s':
        setCurrentPose('perchPointing');
        setSpeech('MAYBE SO...', 1800);
        driftToward(0.18);
        break;

      case 'hesitationCleared':
        break;

      case 'streakX10':
        setCurrentPose('perchDismissive');
        setSpeech(null);
        silentRetreat();
        bumpSize(STATE_SIZE[pollyStateRef.current] - 15, 1800);
        break;

      case 'gameOver':
        advanceState('aggressive');
        setCurrentPose('perchLaughing');
        setSpeech('BBBLAAAAHHAHAHA!', 2600);
        bumpSize(REACTION_SIZE.laugh, 2600);
        playSfx('pollySqwawkLaugh');
        laughBob();
        break;

      case 'gateMastered':
        forceState('defeated');
        setCurrentPose('perchSulking');
        setSpeech('I\'ll remember that.', 2400);
        bumpSize(REACTION_SIZE.bossMaster, 2400);
        sulkDrop();
        break;

      case 'gateMasteredBoss':
        forceState('defeated');
        setCurrentPose('perchSulking');
        setSpeech(null); // silent — Furious/defeated face only
        bumpSize(REACTION_SIZE.bossMaster, 3000);
        sulkDrop();
        break;

      case 'hiddenMasterFailed':
        setCurrentPose('perchLaughing');
        setSpeech('I WIN', 2400);
        bumpSize(REACTION_SIZE.bossFail, 2400);
        playSfx('pollySqwawkLaugh');
        hopBig();
        break;

      case 'hauntFailed':
        setCurrentPose('perchLaughing');
        setSpeech('BBBLAAAAHHAHAHA!', 2600);
        bumpSize(REACTION_SIZE.laugh, 2600);
        playSfx('pollySqwawkLaugh');
        laughBob();
        break;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Breathing speed reacts to state ───────────────────────────
  useEffect(() => {
    startBreathing();
  }, [pollyState]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mount / unmount ───────────────────────────────────────────
  useEffect(() => {
    setSizeForState('idle');
    startBreathing();
    scheduleWander();
    return () => {
      breathLoopRef.current?.stop();
      if (wanderTimerRef.current !== null) clearTimeout(wanderTimerRef.current);
      if (speechTimerRef.current !== null) clearTimeout(speechTimerRef.current);
      if (reactionTimerRef.current !== null) clearTimeout(reactionTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Composed styles ────────────────────────────────────────────
  const rotateStr = rotate.interpolate({
    inputRange: [-10, 0, 10],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return {
    currentPose,
    currentSpeechLine,
    speechLineVisible: currentSpeechLine !== null,
    pollyState,
    currentSize,
    facingFlip,
    pollyPositionStyle: {
      transform: [
        { translateX: pollyX },
        { translateY: hopY },
      ],
    },
    pollyAnimatedStyle: {
      transform: [
        { scale },
        { rotate: rotateStr },
        { scaleX: facingFlip },
      ],
    },
    ghostTintOpacity,
    firePollyEvent,
  };

  function setGhostTint(level: 0 | 1 | 2 | 3) {
    const targets = [0, 0.15, 0.25, 0.40] as const;
    Animated.timing(ghostTintOpacity, {
      toValue: targets[level],
      duration: 400,
      useNativeDriver: true,
    }).start();
  }
}
