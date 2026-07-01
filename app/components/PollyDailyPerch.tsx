import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import {
  DAILY_FIRST_MISS_LINE,
  DAILY_LOSS_LINE,
  DAILY_WIN_LINE,
  DailyPollyReaction,
} from '../ui/pwDailyMaterials';
import { POLLY_ANIMATIONS } from '../animations/pollyAnimations';

type Props = {
  reaction: DailyPollyReaction | null;
  show?: boolean;
};

// Idle pool — cycles while silent
const IDLE_POSES: ImageSourcePropType[] = [
  POLLY_ANIMATIONS.idle,
  POLLY_ANIMATIONS.sulk,
  POLLY_ANIMATIONS.idle,
  POLLY_ANIMATIONS.tauntPoint,
  POLLY_ANIMATIONS.sulk,
];

// Trigger poses — reserved, never appear in idle cycle
const TRIGGER_POSE: Partial<Record<DailyPollyReaction, ImageSourcePropType>> = {
  happy: POLLY_ANIMATIONS.idle,
  laughing: POLLY_ANIMATIONS.laugh,
  shocked: POLLY_ANIMATIONS.bossWarning,
};

function getLine(reaction: DailyPollyReaction | null): string {
  if (reaction === 'happy') return DAILY_FIRST_MISS_LINE;
  if (reaction === 'laughing') return DAILY_LOSS_LINE;
  if (reaction === 'shocked') return DAILY_WIN_LINE;
  return '';
}

export default function PollyDailyPerch({ reaction, show = true }: Props) {
  // A/B image crossfade
  const [poseA, setPoseA] = useState<ImageSourcePropType>(IDLE_POSES[0]!);
  const [poseB, setPoseB] = useState<ImageSourcePropType>(IDLE_POSES[0]!);
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
  const opacityA = useRef(new Animated.Value(1)).current;
  const opacityB = useRef(new Animated.Value(0)).current;

  // Bubble
  const bubbleOpacity = useRef(new Animated.Value(0)).current;

  // Show/hide slide
  const slideY = useRef(new Animated.Value(280)).current;

  // Interval + timeout refs for cleanup
  const idleIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTriggeredRef = useRef(false);

  const crossfadeTo = useCallback(
    (nextPose: ImageSourcePropType) => {
      if (activeLayer === 'A') {
        setPoseB(nextPose);
        Animated.timing(opacityB, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(opacityA, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
        setActiveLayer('B');
      } else {
        setPoseA(nextPose);
        Animated.timing(opacityA, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          Animated.timing(opacityB, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
        setActiveLayer('A');
      }
    },
    [activeLayer, opacityA, opacityB],
  );

  const startIdleCycle = useCallback(() => {
    if (idleIntervalRef.current) clearTimeout(idleIntervalRef.current);

    const scheduleNext = () => {
      // Random interval 4000–7000ms
      const delay = 4000 + Math.random() * 3000;
      idleIntervalRef.current = setTimeout(() => {
        if (isTriggeredRef.current) return;

        // Pick a random pose that isn't currently shown
        const current = activeLayer === 'A' ? poseA : poseB;
        const pool = IDLE_POSES.filter((p) => p !== current);
        const next = pool[Math.floor(Math.random() * pool.length)]!;
        crossfadeTo(next);
        scheduleNext();
      }, delay);
    };

    scheduleNext();
  }, [activeLayer, crossfadeTo, poseA, poseB]);

  const stopIdleCycle = useCallback(() => {
    if (idleIntervalRef.current) {
      clearTimeout(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
  }, []);

  // Start idle cycle on mount, clean up on unmount
  useEffect(() => {
    isTriggeredRef.current = false;
    startIdleCycle();
    return () => {
      stopIdleCycle();
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const isSpeaking =
      reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked';

    if (!isSpeaking) {
      // Back to idle
      isTriggeredRef.current = false;
      startIdleCycle();
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Trigger fires
    isTriggeredRef.current = true;
    stopIdleCycle();

    const triggerPose = TRIGGER_POSE[reaction];
    if (triggerPose) crossfadeTo(triggerPose);

    // Bubble fade in
    Animated.timing(bubbleOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss bubble after 2500ms
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        // Return to neutral then resume idle
        crossfadeTo(IDLE_POSES[0]!);
        isTriggeredRef.current = false;
        startIdleCycle();
      });
    }, 2500);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction]);

  return (
    <Animated.View
      style={[styles.root, { transform: [{ translateY: slideY }] }]}
    >
      {/* Speech bubble */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{getLine(reaction)}</Text>
        </View>
        {/* Tail — two-layer: border then fill */}
        <View style={styles.tailBorder} />
        <View style={styles.tailFill} />
      </Animated.View>

      {/* Polly — A/B crossfade layers, both absolute, same position */}
      <View style={styles.pollyWrap}>
        <Animated.Image
          source={poseA}
          style={[styles.pollyImage, { opacity: opacityA }]}
        />
        <Animated.Image
          source={poseB}
          style={[styles.pollyImage, styles.pollyImageB, { opacity: opacityB }]}
        />
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
    right: 0,
    bottom: 0,
    width: 220,
    height: 220,
  },
  pollyImage: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
  pollyImageB: {
    position: 'absolute',
    top: 0,
    left: 0,
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
