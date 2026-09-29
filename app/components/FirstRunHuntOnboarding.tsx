import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import type { ActiveVisit } from '../hooks/usePollyVisits';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import type { VisitSpec } from '../game/pollyVisitPolicy';
import {
  FINE_RECOGNITION_EXAMPLES,
  fineRecognitionStepDurationMs,
  isOnboardingHandoffOpen,
  recognitionOpensWithHold,
  resolveFineRecognitionExamples,
} from '../game/firstRunOnboarding';
import { useGameStore } from '../store/useGameStore';
import { PW } from '../ui/pwTheme';
import { PollyHuntVisit } from './PollyHuntVisit';

// FINE stands alone this long after the plate settles, before "I'M FINE.".
const RECOGNITION_OPENING_HOLD_MS = 1500;
// How long Polly's challenge line stays up.
const CHALLENGE_COPY_MS = 4000;

const RECOGNITION_COPY = [
  ...FINE_RECOGNITION_EXAMPLES,
  'SAME WORD.\nFOUR DIFFERENT THINGS.',
  'YOUR BRAIN SWITCHES BETWEEN THEM\nWITHOUT YOU EVEN NOTICING.',
  'THAT’S POLYWORDS.',
  'YOU ALREADY KNOW THE MEANINGS.\nNOW YOU HAVE TO RECOGNIZE THEM.',
] as const;

const CHALLENGE_COPY =
  'POLLY MIXES REAL MEANINGS WITH CONVINCING TRAPS.\n\nSHE’S TRYING TO MAKE YOU SECOND-GUESS WHAT YOU ALREADY KNOW.';

function onboardingVisit(line: string, perchPose: VisitSpec['perchPose'] = 'point'): VisitSpec {
  return {
    kind: 'guaranteed',
    flyPose: 'fly',
    perchPose,
    lineId: null,
    line,
    sfx: 'pollySqwawkShort',
    holdPerch: false,
    perchMs: 1250,
  };
}

function RecognitionLine({
  animate,
  reduceMotion,
  text,
}: {
  animate: boolean;
  reduceMotion: boolean;
  text: string;
}) {
  const opacity = useRef(new Animated.Value(animate && !reduceMotion ? 0 : 1)).current;

  useEffect(() => {
    opacity.stopAnimation();
    if (!animate || reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [animate, opacity, reduceMotion]);

  return (
    <Animated.View style={{ opacity }}>
      <Text style={styles.recognitionLine}>{text}</Text>
    </Animated.View>
  );
}

type Props = {
  onVisitActivityChange: (active: boolean) => void;
  // The current word's plate has finished its entrance.
  plateSettled: boolean;
};

export function FirstRunHuntOnboarding({
  onVisitActivityChange,
  plateSettled,
}: Props) {
  const game = useGameStore(state => state.game);
  const onboarding = useGameStore(state => state.onboarding);
  const activeRun = onboarding.activeRun;
  const setPhase = useGameStore(state => state.setOnboardingPhase);
  const setPresentationStep = useGameStore(state => state.setOnboardingPresentationStep);
  const finishHandoff = useGameStore(state => state.finishOnboardingHandoff);
  const reduceMotion = useReducedMotionPreference() !== false;
  const [visit, setVisit] = useState<ActiveVisit | null>(null);
  const [resultBeatPhase, setResultBeatPhase] = useState<
    'guided-real-result' | 'guided-trap-result' | null
  >(null);
  const [handoffVisible, setHandoffVisible] = useState(false);
  // The run whose opening hold has run out. Keyed by seed so a later run
  // (Replay) starts its own hold; nothing here is saved.
  const [openingHoldDoneSeed, setOpeningHoldDoneSeed] = useState<number | null>(null);
  const visitIdRef = useRef(0);
  const visitPurposeRef = useRef<
    'challenge-open' | 'challenge-close' | 'real-result' | 'trap-result' | null
  >(null);
  const opacity = useRef(new Animated.Value(1)).current;

  const belongsToThisRun = activeRun &&
    activeRun.runSeed === game.runSeed &&
    game.onboardingMode === activeRun.mode;
  const holdingOpening = recognitionOpensWithHold(onboarding, game) &&
    openingHoldDoneSeed !== game.runSeed;

  const showVisit = (purpose: NonNullable<typeof visitPurposeRef.current>, spec: VisitSpec) => {
    if (visitPurposeRef.current === purpose) return;
    visitIdRef.current += 1;
    visitPurposeRef.current = purpose;
    setVisit({ id: visitIdRef.current, spec, fastExit: false });
  };

  useEffect(() => {
    onVisitActivityChange(visit !== null);
    return () => onVisitActivityChange(false);
  }, [visit, onVisitActivityChange]);

  // The hold counts from the plate settling, so the word has fully landed
  // before FINE's own beat starts.
  useEffect(() => {
    if (!holdingOpening || !plateSettled) return;
    const runSeed = game.runSeed;
    const timer = setTimeout(() => setOpeningHoldDoneSeed(runSeed), RECOGNITION_OPENING_HOLD_MS);
    return () => clearTimeout(timer);
  }, [holdingOpening, plateSettled, game.runSeed]);

  useEffect(() => {
    if (!belongsToThisRun || activeRun.phase !== 'recognition' || holdingOpening) return;
    const step = Math.min(activeRun.presentationStep, RECOGNITION_COPY.length - 1);
    const copy = RECOGNITION_COPY[step];
    AccessibilityInfo.announceForAccessibility(copy.replace(/\n/g, ' '));
    if (step >= FINE_RECOGNITION_EXAMPLES.length) {
      opacity.stopAnimation();
      if (reduceMotion) {
        opacity.setValue(1);
      } else {
        opacity.setValue(0);
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      }
    }
    const duration = fineRecognitionStepDurationMs(step);
    const timer = setTimeout(() => {
      if (step + 1 < RECOGNITION_COPY.length) {
        setPresentationStep(step + 1);
      } else {
        setPhase('challenge', 0);
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [
    activeRun?.phase,
    activeRun?.presentationStep,
    belongsToThisRun,
    holdingOpening,
    opacity,
    reduceMotion,
    setPhase,
    setPresentationStep,
  ]);

  useEffect(() => {
    if (!belongsToThisRun || activeRun.phase !== 'challenge') return;
    if (activeRun.presentationStep === 0) {
      showVisit('challenge-open', onboardingVisit('Think you know this word?'));
      return;
    }
    if (activeRun.presentationStep === 1) {
      AccessibilityInfo.announceForAccessibility(CHALLENGE_COPY.replace(/\n/g, ' '));
      const timer = setTimeout(() => setPresentationStep(2), CHALLENGE_COPY_MS);
      return () => clearTimeout(timer);
    }
    showVisit('challenge-close', onboardingVisit('Let’s see how sure you are.'));
  }, [
    activeRun?.phase,
    activeRun?.presentationStep,
    belongsToThisRun,
    setPresentationStep,
  ]);

  useEffect(() => {
    if (
      !belongsToThisRun ||
      (activeRun.phase !== 'guided-real-result' && activeRun.phase !== 'guided-trap-result')
    ) {
      setResultBeatPhase(null);
      return;
    }
    const phase = activeRun.phase;
    setResultBeatPhase(null);
    const delay = phase === 'guided-real-result'
      ? reduceMotion ? 600 : 1380
      : 420;
    const timer = setTimeout(() => {
      setResultBeatPhase(phase);
      if (phase === 'guided-real-result') {
        AccessibilityInfo.announceForAccessibility('Real meaning. That one was easy.');
        showVisit('real-result', onboardingVisit('That one was easy.', 'smug'));
      } else {
        AccessibilityInfo.announceForAccessibility('Trap. Almost sounded right.');
        showVisit('trap-result', onboardingVisit('Almost sounded right.', 'smug'));
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [activeRun?.phase, belongsToThisRun, reduceMotion]);

  // The hand-off: FINE is done and the next word waits, hidden and locked.
  // Until the player has had the round-progress lesson, that lesson IS the
  // hand-off: HudLessonLayer teaches it and closes the run when it finishes.
  // Only a run that already has it (a Replay) gets the short banner here.
  const handoffOpen = isOnboardingHandoffOpen(onboarding, game);
  const progressLessonDone = onboarding.hudLessons.progress;
  useEffect(() => {
    if (!handoffOpen || !progressLessonDone) return;
    setHandoffVisible(true);
    const copy = 'ONE WORD DOWN. THERE ARE A LOT MORE HIDING IN PLAIN SIGHT.';
    AccessibilityInfo.announceForAccessibility(copy);
    const timer = setTimeout(() => {
      setHandoffVisible(false);
      finishHandoff();
    }, 2300);
    return () => clearTimeout(timer);
  }, [finishHandoff, handoffOpen, progressLessonDone]);

  if (!belongsToThisRun) return null;

  const phase = activeRun.phase;
  const recognitionExamples = phase === 'recognition' && !holdingOpening
    ? resolveFineRecognitionExamples(activeRun.presentationStep)
    : [];
  let copy: string | null = null;
  let compact = false;
  if (phase === 'recognition' && !holdingOpening && recognitionExamples.length === 0) {
    copy = RECOGNITION_COPY[Math.min(activeRun.presentationStep, RECOGNITION_COPY.length - 1)];
  } else if (phase === 'challenge' && activeRun.presentationStep === 1) {
    copy = CHALLENGE_COPY;
  } else if (phase === 'guided-real-result' && resultBeatPhase === phase) {
    copy = 'REAL MEANING';
    compact = true;
  } else if (phase === 'guided-trap-result' && resultBeatPhase === phase) {
    copy = 'TRAP';
    compact = true;
  }

  function handleVisitDone(id: number) {
    if (visit?.id !== id) return;
    const purpose = visitPurposeRef.current;
    visitPurposeRef.current = null;
    setVisit(null);
    if (purpose === 'challenge-open') setPresentationStep(1);
    if (purpose === 'challenge-close') setPhase('guided-real', 0);
    if (purpose === 'real-result') setPhase('guided-trap', 0);
    if (purpose === 'trap-result') setPhase('unaided', 0);
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {recognitionExamples.length > 0 && (
        <View
          accessible
          accessibilityLabel={recognitionExamples.join(' ')}
          style={[styles.copyWrap, styles.recognitionStackWrap]}
        >
          {recognitionExamples.map((line, index) => (
            <RecognitionLine
              key={line}
              animate={index === recognitionExamples.length - 1}
              reduceMotion={reduceMotion}
              text={line}
            />
          ))}
        </View>
      )}
      {copy && (
        <Animated.View
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={copy.replace(/\n/g, ' ')}
          style={[styles.copyWrap, compact && styles.copyWrapCompact, { opacity }]}
        >
          <Text style={[styles.copy, compact && styles.copyCompact]}>{copy}</Text>
        </Animated.View>
      )}
      {handoffVisible && (
        <View accessible accessibilityLiveRegion="polite" style={styles.handoffWrap}>
          <Text style={styles.handoffCopy}>
            ONE WORD DOWN.{`\n`}THERE ARE A LOT MORE HIDING IN PLAIN SIGHT.
          </Text>
        </View>
      )}
      <PollyHuntVisit visit={visit} onDone={handleVisitDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  copyWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '43%',
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.34)',
    backgroundColor: 'rgba(15,13,42,0.90)',
  },
  copyWrapCompact: {
    top: '48%',
    minHeight: 66,
    paddingVertical: 12,
  },
  recognitionStackWrap: {
    minHeight: 130,
    justifyContent: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  recognitionLine: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  copy: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  copyCompact: {
    color: PW.color.gold,
    fontSize: 17,
    lineHeight: 22,
  },
  handoffWrap: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '42%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(15,13,42,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.34)',
  },
  handoffCopy: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
