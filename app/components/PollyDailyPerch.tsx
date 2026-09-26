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
  DAILY_MOOD_LINES,
  DAILY_WIN_LINE,
  DailyPollyReaction,
} from '../ui/pwDailyMaterials';
import { playSfx } from '../audio/sfx';
import { POLLY_POSES, pollyPoseScale } from '../ui/pollyPoses';
import { POLLY_LINES, PollyLineId } from '../game/pollyCharacter';
import { BookRivalryState } from '../game/pollyBookLines';
import { pickFreshLine } from '../game/pollyVisitPolicy';
import { useGameStore } from '../store/useGameStore';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { PollyPerchRig, POLLY_PERCH_RIG_ENABLED } from './PollyPerchRig';
import { PollySpeechBubble } from './PollySpeechBubble';

// DailyPollyReaction here is pwDailyMaterials' POSE-keyed type ('perched' |
// 'happy' | 'laughing' | 'shocked'), NOT the trigger type of the same name in
// game/types.ts. 'correct' is a distinct trigger that happens to render the
// same 'perched' pose, so it's added on locally rather than folded into
// either DailyPollyReaction.
type Reaction = DailyPollyReaction | 'correct';

type Props = {
  reaction: Reaction | null;
  rivalryState: BookRivalryState;
  show?: boolean;
  /**
   * Bottom edge of the Daily HUD, in the same parent coordinates as this
   * perch's own layout. When given, Polly drops to sit on the left tower just
   * under the HUD instead of over its label.
   */
  hudBottom?: number;
};

// Gap between the HUD's bottom edge and the top of Polly's pose box. Her
// crown starts a few points inside the box, so this keeps it clear of the HUD.
const DAILY_POLLY_HUD_GAP = 2;
// pollyWrap's top inside the perch root. A constant rather than a read of
// styles.pollyWrap.top: react-native-web's StyleSheet does not hand back the
// raw values.
const DAILY_POLLY_WRAP_TOP = 5;

// Clean full-pose drawings (background stripped to transparent). The expression
// lives in the art; life + menace come from whole-image motion + the SFX.
const POSE: Record<'idle' | 'happy' | 'laughing' | 'shocked', ImageSourcePropType> = {
  idle: POLLY_POSES.idle,        // smug perched — watchful
  happy: POLLY_POSES.point,      // pointing taunt (wrong)
  laughing: POLLY_POSES.laugh,   // laughing wide (out of lives)
  shocked: POLLY_POSES.shocked,  // shocked (win)
};
const POSE_FLY = POLLY_POSES.fly; // fly-in entrance
const DAILY_POLLY_SIZE = 150;

function getLine(
  reaction: Reaction | null,
  lossLineId: PollyLineId,
  correctLineId: PollyLineId | null,
): string {
  if (reaction === 'happy') return DAILY_FIRST_MISS_LINE;
  if (reaction === 'laughing') return POLLY_LINES[lossLineId];
  if (reaction === 'shocked') return DAILY_WIN_LINE;
  if (reaction === 'correct') return correctLineId ? POLLY_LINES[correctLineId] : '';
  return '';
}

function getLineId(
  reaction: Reaction | null,
  lossLineId: PollyLineId,
  correctLineId: PollyLineId | null,
): PollyLineId | null {
  if (reaction === 'happy') return 'dailyButterKnife';
  if (reaction === 'laughing') return lossLineId;
  if (reaction === 'shocked') return 'dailyWinTomorrow';
  if (reaction === 'correct') return correctLineId;
  return null;
}

export default function PollyDailyPerch({
  reaction,
  rivalryState,
  show = true,
  hudBottom,
}: Props) {
  // Where this perch's root actually lands in its parent. Read from layout,
  // not assumed, so the drop below is right however the parent pads it.
  // Transforms never change layout, so applying the drop cannot feed back.
  const [rootY, setRootY] = useState<number | null>(null);
  const perchDrop =
    hudBottom && rootY !== null
      ? Math.max(0, hudBottom + DAILY_POLLY_HUD_GAP - (rootY + DAILY_POLLY_WRAP_TOP))
      : 0;
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

  // Unlike firstMiss/loss/win, 'correct' can fire several times per session
  // (every non-winning correct claim), so it needs a fresh roll each time
  // rather than the frozen mount-time pattern above — and its own record of
  // which lines already fired this session, so it doesn't repeat sooner than
  // the DAILY_MOOD_LINES pool for the current rivalry state runs out.
  const [correctLineId, setCorrectLineId] = useState<PollyLineId | null>(null);
  const firedCorrectLineIdsRef = useRef<string[]>([]);

  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(280)).current;
  // Hidden is slideY 280. The root is anchored to the top of the screen, so
  // the slide alone leaves her on screen, over the entry card and Results;
  // she fades on the same value, so she is gone whenever she is slid away.
  const perchOpacity = slideY.interpolate({
    inputRange: [0, 280],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
      reaction === 'happy' || reaction === 'laughing' || reaction === 'shocked' || reaction === 'correct';

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

    // 'correct' can fire several times a session, so its line is rolled
    // fresh here rather than at mount, and remembered locally so it doesn't
    // repeat within this session even though pollyMemoryBeforeRecorded is a
    // frozen snapshot.
    let pickedCorrectLineId: PollyLineId | null = correctLineId;
    if (reaction === 'correct') {
      const roll = Math.random();
      const recent = [
        ...pollyMemoryBeforeRecorded.recentLineIds,
        ...firedCorrectLineIdsRef.current,
      ];
      pickedCorrectLineId = pickFreshLine(DAILY_MOOD_LINES[rivalryState], recent, roll);
      firedCorrectLineIdsRef.current = [...firedCorrectLineIdsRef.current, pickedCorrectLineId];
      setCorrectLineId(pickedCorrectLineId);
    }

    setPose(reaction === 'correct' ? POSE.idle : POSE[reaction]);
    const lineId = getLineId(reaction, dailyLossLineId, pickedCorrectLineId);
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
    } else if (reaction === 'shocked') {
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
    // 'correct' fires every non-winning round, so it deliberately gets no
    // extra body motion (unlike the three original reactions) — just the
    // pose hold + speech bubble, so a repeatable beat doesn't wear out.

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
    <Animated.View
      onLayout={(e) => setRootY(e.nativeEvent.layout.y)}
      style={[
        styles.root,
        { opacity: perchOpacity, transform: [{ translateY: slideY }, { translateY: perchDrop }] },
      ]}
    >
      {/* Speech bubble — to Polly's right, tail points left at her */}
      <Animated.View style={[styles.bubbleWrap, { opacity: bubbleOpacity }]}>
        <PollySpeechBubble
          line={getLine(reaction, dailyLossLineId, correctLineId)}
          maxWidth={185}
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
          <PollyPerchRig size={DAILY_POLLY_SIZE} reduceMotion={reduceMotion} />
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
    top: 0,
    height: 260,
    pointerEvents: 'none',
    zIndex: 90,
    elevation: 90,
  },
  pollyWrap: {
    position: 'absolute',
    left: -20,
    top: DAILY_POLLY_WRAP_TOP,
    width: DAILY_POLLY_SIZE,
    height: DAILY_POLLY_SIZE,
  },
  pollyImage: {
    width: DAILY_POLLY_SIZE,
    height: DAILY_POLLY_SIZE,
  },
  bubbleWrap: {
    position: 'absolute',
    left: 100,
    top: 90,
  },
});
