import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import { getPollyBudgetState, trackPollyTime } from '../logic/pollyBudget';
import { BUDGET, POLLY_LINES } from './PollyController';

const POLLY_FACE: Record<string, ImageSourcePropType> = {
  sessionStart:  require('../../assets/images/Polly/polly_excited.png'),   // swap for polly_letsPlay when available
  intro:         require('../../assets/images/Polly/polly_knowing.png'),
  correct:       require('../../assets/images/Polly/polly_clever.png'),
  wrong:         require('../../assets/images/Polly/polly_thinking.png'),
  wordUp:        require('../../assets/images/Polly/polly_pointing.png'),  // swap for polly_wordUp when available
  bossWord:      require('../../assets/images/Polly/polly_angle.png'),     // swap for polly_reading when available
  hiddenReveal:  require('../../assets/images/Polly/polly_clever.png'),
  locked:        require('../../assets/images/Polly/polly_thinking.png'),
  cleanSplit:    require('../../assets/images/Polly/polly_pointing.png'),  // swap for polly_wordUp when available
  default:       require('../../assets/images/Polly/polly_knowing.png'),
  ghostIntro:    require('../../assets/images/Polly/polly_thinking.png'),
  ghostCorrect:  require('../../assets/images/Polly/polly_clever.png'),
  ghostWrong:    require('../../assets/images/Polly/polly_thinking.png'),
};

const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function numWord(n: number): string {
  const w = NUM_WORDS[n];
  const word = w ?? String(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function computeIntroLine(step: WordStep): string {
  const visible = step.masks.filter(m => !m.isHidden);
  const realCount = visible.filter(m => m.isReal).length;
  const fakeCount = visible.filter(m => !m.isReal).length;
  const fakes = fakeCount === 1 ? 'fake' : 'fakes';
  return `${numWord(realCount)} real, ${numWord(fakeCount).toLowerCase()} ${fakes}.`;
}

function eventKicker(step: WordStep): string | null {
  if (step.eventType === 'bossWord')   return 'BOSS WORD · 2× SCORE';
  if (step.eventType === 'speedRound') return 'SPEED ROUND';
  if (step.eventType === 'slangDrop')  return 'SLANG DROP';
  return null;
}

type Props = {
  step: WordStep;
  foundCount: number;
  totalReal: number;
  suppressIntro?: boolean;
};

export function PollyCard({ step, foundCount, totalReal, suppressIntro }: Props) {
  const game         = useGameStore(s => s.game);
  const setTrigger   = useGameStore(s => s.setPollyTrigger);
  const clearTrigger = useGameStore(s => s.clearPollyTrigger);
  const [pollyText, setPollyText] = useState<string | null>(null);
  const [pollyFace, setPollyFace] = useState<ImageSourcePropType>(POLLY_FACE.sessionStart);

  const fillAnim = useRef(new Animated.Value(0)).current;

  // Fire intro on word mount — boss words suppress this (bossWord trigger fires after entrance)
  useEffect(() => {
    if (suppressIntro) return;
    setTrigger('intro');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate find-meter fill
  useEffect(() => {
    const target = totalReal > 0 ? foundCount / totalReal : 0;
    Animated.timing(fillAnim, {
      toValue: target,
      duration: 300,
      useNativeDriver: false,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundCount, totalReal]);

  // Handle polly trigger → display text
  useEffect(() => {
    if (!game.pollyTrigger) return;

    if (step.eventType === 'speedRound') { clearTrigger(); return; }

    const { totalShown, runStart } = getPollyBudgetState();
    const runtime = Math.max((Date.now() - runStart) / 1000, 0.001);
    if (totalShown / runtime > 0.15) { clearTrigger(); return; }

    setPollyFace(POLLY_FACE[game.pollyTrigger] ?? POLLY_FACE.default);

    const line = game.pollyTrigger === 'intro'
      ? computeIntroLine(step)
      : (POLLY_LINES[game.pollyTrigger] ?? game.pollyTrigger);

    const dur = BUDGET[game.pollyTrigger] ?? 1.0;
    trackPollyTime(dur);
    setPollyText(line);

    const id = setTimeout(() => {
      setPollyText(null);
      clearTrigger();
    }, dur * 1000);

    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.pollyTrigger]);

  const kicker = eventKicker(step);

  const fillWidth = fillAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.strip}>
      {kicker ? (
        <Text style={styles.kicker}>{kicker}</Text>
      ) : null}

      <View style={styles.pill}>
        <Image source={pollyFace} style={styles.pollyImage} />
        {pollyText ? <Text style={styles.pillText}>{pollyText}</Text> : null}
      </View>

      <View style={styles.meterRow}>
        <Text style={styles.meterLabel}>
          {foundCount} OF {totalReal} REAL MEANINGS FOUND
        </Text>
        <View style={styles.meterTrack}>
          <Animated.View style={[styles.meterFill, { width: fillWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 6,
  },
  kicker: {
    color: '#FFD700',
    fontSize: FONT_SIZES.hudLabel,
    fontFamily: FONTS.label,
    letterSpacing: 2,
    textAlign: 'center',
  },
  pill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pollyImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  } as const,
  pillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONT_SIZES.pollyLine,
    fontFamily: FONTS.brand,
    flexShrink: 1,
  },
  meterRow: {
    gap: 4,
  },
  meterLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZES.progressLabel,
    fontFamily: FONTS.label,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  meterTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  meterFill: {
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
});
