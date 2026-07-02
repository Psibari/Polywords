import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import {
  DAILY_FIRST_MISS_LINE,
  DAILY_LOSS_LINE,
  DAILY_WIN_LINE,
  DailyPollyReaction,
} from '../ui/pwDailyMaterials';
import { playSfx } from '../audio/sfx';
import { PollyRig } from './PollyRig';
import { PerformanceName } from '../animations/pollyPerformances';

type Props = {
  reaction: DailyPollyReaction | null;
  show?: boolean;
};

const REACTION_TO_PERFORMANCE: Record<
  'happy' | 'laughing' | 'shocked',
  PerformanceName
> = {
  happy: 'smug',
  laughing: 'laugh',
  shocked: 'shocked',
};

function getLine(reaction: DailyPollyReaction | null): string {
  if (reaction === 'happy') return DAILY_FIRST_MISS_LINE;
  if (reaction === 'laughing') return DAILY_LOSS_LINE;
  if (reaction === 'shocked') return DAILY_WIN_LINE;
  return '';
}

export default function PollyDailyPerch({ reaction, show = true }: Props) {
  const [performance, setPerformance] = useState<PerformanceName>('idle');
  const [speaking, setSpeaking] = useState(false);

  // Bubble
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  // Show/hide slide
  const slideY = useRef(new Animated.Value(280)).current;

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (show) {
      Animated.spring(slideY, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideY, {
        toValue: 280,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    const isReacting =
      reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked';

    if (!isReacting) {
      setPerformance('idle');
      setSpeaking(false);
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Fire the matching performance + laugh SFX, and talk while the bubble is up.
    setPerformance(REACTION_TO_PERFORMANCE[reaction]);
    setSpeaking(true);
    if (reaction === 'laughing') playSfx('pollySqwawkLaugh');
    else playSfx('pollySqwawkShort'); // happy + shocked jab

    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setPerformance('idle');
        setSpeaking(false);
      });
    }, 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      {/* Speech bubble */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{getLine(reaction)}</Text>
        </View>
        {/* Tail — two-layer: border then fill */}
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
      </Animated.View>

      {/* Polly — living rig, anchored bottom-right */}
      <View style={styles.pollyWrap}>
        <PollyRig performance={performance} speaking={speaking} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    pointerEvents: 'none',
  },
  // ── Polly ──
  pollyWrap: {
    position: 'absolute',
    right: 4,
    bottom: 0,
    width: 210,
    height: 210,
  },
  // ── Speech bubble ──
  bubbleWrap: {
    position: 'absolute',
    right: 212,
    bottom: 120,
  },
  bubble: {
    backgroundColor: '#1A1055',
    borderWidth: 1.5,
    borderColor: 'rgba(245,200,66,0.55)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 220,
  },
  bubbleText: {
    fontFamily: FONTS.brand,
    fontSize: 15,
    lineHeight: 21,
    color: '#FFF7D6',
    flexWrap: 'wrap',
  },
  tailBorder: {
    position: 'absolute',
    right: -9,
    bottom: 12,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 9,
    borderLeftColor: 'rgba(245,200,66,0.55)',
  },
  tailFill: {
    position: 'absolute',
    right: -7,
    bottom: 12,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftWidth: 9,
    borderLeftColor: '#1A1055',
  },
});
