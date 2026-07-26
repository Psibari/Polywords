import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { playSfx } from '../audio/sfx';
import { FONTS } from '../constants/fonts';
import { usePollyAmbientMotion } from '../hooks/usePollyAmbientMotion';
import { POLLY_POSES } from '../ui/pollyPoses';
import { PW } from '../ui/pwTheme';
import { PollySpeechBubble } from './PollySpeechBubble';

const POLLY_BRANCH = require('../../assets/images/polly/polly_branch.png');
const POLLY_IDLE = require('../../assets/images/polly/motion/polly_idle_branchless.png');
const POLLY_LAUGH = require('../../assets/images/polly/motion/polly_laugh_branchless.png');
const POLLY_SMUG = require('../../assets/images/polly/motion/polly_smug_branchless.png');
const POLLY_SHOCKED = require('../../assets/images/polly/motion/polly_shocked_branchless.png');
const POLLY_SULK = require('../../assets/images/polly/motion/polly_sulk_branchless.png');

export type PollyLabPose = 'idle' | 'smug' | 'sulk' | 'fly' | 'laugh' | 'shocked';
export type PollyLabAction = 'idle' | 'flyIn' | 'pollyWins' | 'playerWins';

export type PollyLabCommand = {
  action: PollyLabAction;
  nonce: number;
};

type Props = {
  command: PollyLabCommand;
  moodLabel: string;
  settledPose: Extract<PollyLabPose, 'idle' | 'smug' | 'sulk'>;
  speech: string;
};

type PoseAsset = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  left: number;
  bottom: number;
};

// One canonical character box, with per-pose art normalized inside it.
// Raw source dimensions never determine Polly's on-screen size.
const POSE_ASSET: Record<PollyLabPose, PoseAsset> = {
  idle: {
    source: POLLY_IDLE,
    width: 181,
    height: 362,
    left: 27,
    bottom: -65,
  },
  smug: {
    source: POLLY_SMUG,
    width: 181,
    height: 362,
    left: 27,
    bottom: -65,
  },
  sulk: {
    source: POLLY_SULK,
    width: 181,
    height: 362,
    left: 27,
    bottom: -65,
  },
  fly: {
    source: POLLY_POSES.fly,
    width: 260,
    height: 245,
    left: -10,
    bottom: 30,
  },
  laugh: {
    source: POLLY_LAUGH,
    width: 181,
    height: 362,
    left: 27,
    bottom: -65,
  },
  shocked: {
    source: POLLY_SHOCKED,
    width: 181,
    height: 362,
    left: 27,
    bottom: -65,
  },
};

function PollyPoseAsset({ pose }: { pose: PollyLabPose }) {
  const asset = POSE_ASSET[pose];
  const style = [
    styles.poseAsset,
    {
      width: asset.width,
      height: asset.height,
      left: asset.left,
      bottom: asset.bottom,
    },
  ];

  return <Image resizeMode="contain" source={asset.source} style={style} />;
}

export function PollyMotionStage({
  command,
  moodLabel,
  settledPose,
  speech,
}: Props) {
  const [pose, setPose] = useState<PollyLabPose>(settledPose);
  const [isPerforming, setIsPerforming] = useState(false);
  const stageWidthRef = useRef(360);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const branchY = useRef(new Animated.Value(0)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(0.96)).current;
  const { translateX: ambientX, translateY: ambientY, reduceMotion } =
    usePollyAmbientMotion('daily', !isPerforming);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function later(callback: () => void, delayMs: number) {
    const timer = setTimeout(callback, delayMs);
    timersRef.current.push(timer);
  }

  function resetTransforms() {
    translateX.stopAnimation();
    translateY.stopAnimation();
    scale.stopAnimation();
    rotate.stopAnimation();
    branchY.stopAnimation();
    translateX.setValue(0);
    translateY.setValue(0);
    scale.setValue(1);
    rotate.setValue(0);
    branchY.setValue(0);
  }

  function showSpeech(delayMs = 140) {
    bubbleOpacity.setValue(0);
    bubbleScale.setValue(0.96);
    later(() => {
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScale, {
          toValue: 1,
          speed: 24,
          bounciness: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }, delayMs);
  }

  function settle(showBubble = false) {
    resetTransforms();
    setPose(settledPose);
    setIsPerforming(false);
    if (showBubble) showSpeech();
  }

  useEffect(() => () => clearTimers(), []);

  // A memory preset is a settled emotional state, not a performance.
  useEffect(() => {
    clearTimers();
    bubbleOpacity.stopAnimation();
    bubbleOpacity.setValue(0);
    settle(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledPose, speech]);

  useEffect(() => {
    if (reduceMotion === null) return;
    clearTimers();
    bubbleOpacity.stopAnimation();
    bubbleOpacity.setValue(0);
    setIsPerforming(command.action !== 'idle');

    if (reduceMotion) {
      if (command.action === 'pollyWins') {
        setPose('laugh');
        playSfx('pollySqwawkLaugh');
      } else if (command.action === 'playerWins') {
        setPose('shocked');
      } else {
        settle(command.action === 'flyIn');
      }
      return;
    }

    if (command.action === 'idle') {
      settle(true);
      return;
    }

    if (command.action === 'flyIn') {
      resetTransforms();
      setPose('fly');
      translateX.setValue(-Math.max(210, stageWidthRef.current * 0.72));
      translateY.setValue(-86);
      scale.setValue(0.82);
      rotate.setValue(-0.8);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 590,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -32,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 230,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scale, {
          toValue: 1,
          duration: 590,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(rotate, {
            toValue: 0.18,
            duration: 410,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      later(() => {
        setPose(settledPose);
        Animated.sequence([
          Animated.timing(branchY, {
            toValue: 4,
            duration: 80,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(branchY, {
            toValue: 0,
            speed: 22,
            bounciness: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500);
      later(() => {
        resetTransforms();
        setIsPerforming(false);
        showSpeech(0);
      }, 720);
      return;
    }

    if (command.action === 'pollyWins') {
      resetTransforms();
      setPose(settledPose);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.94,
            duration: 130,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 6,
            duration: 130,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -68,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.07,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: -0.35,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 310,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 310,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 310,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      later(() => {
        setPose('laugh');
        playSfx('pollySqwawkLaugh');
      }, 160);
      later(() => {
        Animated.sequence([
          Animated.timing(branchY, {
            toValue: 5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.spring(branchY, {
            toValue: 0,
            speed: 22,
            bounciness: 4,
            useNativeDriver: true,
          }),
        ]).start();
      }, 660);
      later(() => settle(false), 1460);
      return;
    }

    // Player mastered the boss: shock first, then the remembered sulk.
    resetTransforms();
    setPose('shocked');
    playSfx('pollySqwawkShort');
    Animated.parallel([
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -18,
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 430,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: -0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    later(() => {
      setPose('sulk');
      setIsPerforming(false);
      resetTransforms();
    }, 1450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command.nonce, reduceMotion]);

  const rotation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '12deg'],
  });

  return (
    <View
      onLayout={event => {
        stageWidthRef.current = event.nativeEvent.layout.width;
      }}
      style={styles.stage}
    >
      <View pointerEvents="none" style={styles.stageGlow} />
      <View style={styles.moodPill}>
        <View style={styles.moodDot} />
        <Text style={styles.moodText}>{moodLabel}</Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[styles.branchWrap, { transform: [{ translateY: branchY }] }]}
      >
        <Image resizeMode="stretch" source={POLLY_BRANCH} style={styles.branch} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.pollyBox,
          {
            transform: [
              { translateX },
              { translateY },
              { translateX: ambientX },
              { translateY: ambientY },
              { rotate: rotation },
              { scale },
            ],
          },
        ]}
      >
        <PollyPoseAsset pose={pose} />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            opacity: bubbleOpacity,
            transform: [{ scale: bubbleScale }],
          },
        ]}
      >
        <PollySpeechBubble fontSize={15} line={speech} lineHeight={20} maxWidth={168} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 360,
    borderRadius: PW.radius.xl,
    borderWidth: 1.5,
    borderColor: PW.color.cardRimStrong,
    backgroundColor: PW.color.surfaceDeep,
    overflow: 'hidden',
    ...PW.shadow.panel,
  },
  stageGlow: {
    position: 'absolute',
    left: -60,
    bottom: -90,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: PW.color.purpleSoft,
    opacity: 0.42,
  },
  moodPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    minHeight: 30,
    maxWidth: 210,
    borderRadius: PW.radius.pill,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PW.color.overlayMedium,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    zIndex: 8,
  },
  moodDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PW.color.gold,
  },
  moodText: {
    flexShrink: 1,
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  branchWrap: {
    position: 'absolute',
    left: -22,
    right: -22,
    bottom: 28,
    height: 42,
    zIndex: 1,
  },
  branch: {
    width: '100%',
    height: 42,
  },
  pollyBox: {
    position: 'absolute',
    left: 8,
    bottom: 39,
    width: 240,
    height: 300,
    zIndex: 3,
  },
  poseAsset: {
    position: 'absolute',
  },
  bubble: {
    position: 'absolute',
    right: 15,
    bottom: 151,
    zIndex: 5,
  },
});
