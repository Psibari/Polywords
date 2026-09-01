import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import {
  DAILY_FIRST_MISS_LINE,
  DAILY_LOSS_LINE_IDS,
  DAILY_WIN_LINE,
  DailyPollyReaction,
} from '../ui/pwDailyMaterials';
import { playSfx } from '../audio/sfx';
import { POLLY_POSES, pollyPoseScale } from '../ui/pollyPoses';
import { POLLY_LINES, PollyLineId } from '../game/pollyCharacter';
import { pickFreshLine } from '../game/pollyVisitPolicy';
import { useGameStore } from '../store/useGameStore';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollyPerchRig, POLLY_PERCH_RIG_ENABLED } from './PollyPerchRig';
import { PollySpeechBubble } from './PollySpeechBubble';

type Props = {
  reaction: DailyPollyReaction | null;
  show?: boolean;
};

// Clean full-pose drawings (background stripped to transparent). The expression
// lives in the art; life + menace come from whole-image motion + the SFX.
const POSE: Record<'idle' | 'happy' | 'laughing' | 'shocked', ImageSourcePropType> = {
  idle: POLLY_POSES.idle,        // smug perched — watchful
  happy: POLLY_POSES.point,      // pointing taunt (wrong)
  laughing: POLLY_POSES.laugh,   // laughing wide (out of lives)
  shocked: POLLY_POSES.shocked,  // shocked (win)
};
const POSE_FLY = POLLY_POSES.fly; // fly-in entrance

function getLine(reaction: DailyPollyReaction | null, lossLineId: PollyLineId): string {
  if (reaction === 'happy') return DAILY_FIRST_MISS_LINE;
  if (reaction === 'laughing') return POLLY_LINES[lossLineId];
  if (reaction === 'shocked') return DAILY_WIN_LINE;
  return '';
}

function getLineId(reaction: DailyPollyReaction | null, lossLineId: PollyLineId): PollyLineId | null {
  if (reaction === 'happy') return 'dailyButterKnife';
  if (reaction === 'laughing') return lossLineId;
  if (reaction === 'shocked') return 'dailyWinTomorrow';
  return null;
}

export default function PollyDailyPerch({ reaction, show = true }: Props) {
  const rememberLine = useGameStore(s => s.rememberPollyLine);
  // Both held stable for the life of this perch, same pattern as
  // ResultsScreen.tsx's pollyMemoryBeforeRunRecorded: a live pollyMemory
  // selector would re-derive recentLineIds (and this pick) right after
  // rememberLine fires below, flipping the bubble away from the line
  // actually remembered. useGameStore.getState() (not a selector — matches
  // usePollyVisits' own reasoning) reads once at mount.
  const [pollyMemoryBeforeRecorded] = useState(() => useGameStore.getState().pollyMemory);
  const [dailyLossRoll] = useState(() => Math.random());
  const dailyLossLineId = pickFreshLine(DAILY_LOSS_LINE_IDS, pollyMemoryBeforeRecorded.recentLineIds, dailyLossRoll);
  const [pose, setPose] = useState<ImageSourcePropType>(POSE_FLY);
  const enteredRef = useRef(false);

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(280)).current;

  // Whole-image drivers (no part seams possible — we only move the whole image).
  const { translateX: breatheX, translateY: breatheY, reduceMotion } =
    usePollyAmbientMotion('daily', show);
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const reactScale = useRef(new Animated.Value(1)).current;

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    };
  }, []);

  // Fly in when Daily opens, then settle onto the perch.
  useEffect(() => {
    if (reduceMotion === null) return;
    const t = setTimeout(() => {
      enteredRef.current = true;
      setPose(POSE.idle);
    }, reduceMotion ? 0 : 650);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion === null) return;
    if (show) {
      if (reduceMotion) slideY.setValue(0);
      else {
        Animated.spring(slideY, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (reduceMotion) slideY.setValue(280);
      else {
        Animated.timing(slideY, {
          toValue: 280,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, reduceMotion]);

  useEffect(() => {
    const isReacting =
      reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked';

    if (!isReacting) {
      if (enteredRef.current) setPose(POSE.idle);
      reactX.setValue(0);
      reactY.setValue(0);
      reactScale.setValue(1);
      Animated.timing(bubbleOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
      return;
    }

    setPose(POSE[reaction]);
    const lineId = getLineId(reaction, dailyLossLineId);
    if (lineId && show) rememberLine(lineId, 'daily');
    if (reaction === 'laughing') playSfx('pollySqwawkLaugh');
    else playSfx('pollySqwawkShort');

    reactX.setValue(0);
    reactY.setValue(0);
    reactScale.setValue(1);

    if (reduceMotion) {
      reactX.setValue(0);
      reactY.setValue(0);
      reactScale.setValue(1);
    } else if (reaction === 'laughing') {
      // Sharp bark: quick pop + hard shake.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.08, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactX, { toValue: 9, duration: 55, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: -9, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    } else if (reaction === 'happy') {
      // Cold, slow lean toward the puzzle (she's on the left → lean right).
      Animated.sequence([
        Animated.timing(reactX, { toValue: 12, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactX, { toValue: 0, duration: 540, delay: 720, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else {
      // Shocked: fast recoil pop.
      Animated.sequence([
        Animated.timing(reactScale, { toValue: 1.1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactScale, { toValue: 1, duration: 320, delay: 60, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
      Animated.sequence([
        Animated.timing(reactY, { toValue: -10, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(reactY, { toValue: 0, duration: 400, delay: 80, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }

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
        setPose(POSE.idle);
      });
    }, 2500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction]);

  return (
    <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
      {/* Speech bubble — to Polly's right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <PollySpeechBubble
          line={getLine(reaction, dailyLossLineId)}
          maxWidth={185}
          fontSize={15}
          lineHeight={21}
        />
      </Animated.View>

      {/* Polly — clean full pose, whole-image motion, bottom-left facing right */}
      <Animated.View
        style={[
          styles.pollyWrap,
          {
            transform: [
              { translateX: reactX },
              { translateX: breatheX },
              { translateY: breatheY },
              { translateY: reactY },
              { scale: reactScale },
            ],
          },
        ]}
      >
        {POLLY_PERCH_RIG_ENABLED && pose === POSE.idle ? (
          // 288 must track styles.pollyImage — StyleSheet.create() returns
          // opaque style IDs, not readable objects, so it can't be sourced live.
          <PollyPerchRig size={288} reduceMotion={reduceMotion} />
        ) : (
          <Image
            source={pose}
            style={[styles.pollyImage, { transform: [{ scale: pollyPoseScale(pose) }] }]}
            resizeMode="contain"
          />
        )}
      </Animated.View>
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
    zIndex: 45,
    elevation: 45,
  },
  pollyWrap: {
    position: 'absolute',
    left: -104,
    bottom: -70,
    width: 288,
    height: 288,
  },
  pollyImage: {
    width: 288,
    height: 288,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 162,
    bottom: 158,
  },
});
