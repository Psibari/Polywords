import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { MaskBoard } from '../components/MaskBoard';
import { BossBoard } from '../components/BossBoard';
import { StreakDisplay } from '../components/StreakDisplay';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import { PW } from '../ui/pwTheme';
import ResultsScreen from './ResultsScreen';
import { initSounds, playRoundComplete } from '../utils/SoundEngine';
import { playSfx, preloadSfx, unloadSfx } from '../audio/sfx';
import { startMusic, stopMusic, setMusicState, MusicState } from '../audio/MusicEngine';
import * as Haptics from 'expo-haptics';
import FXLayer, { FXLayerHandle } from '../components/FXLayer';
import { ShardVariant } from '../ui/pwEffects';
import { usePollyVisits } from '../hooks/usePollyVisits';
import { PollyHuntVisit } from '../components/PollyHuntVisit';
import { HuntIntroOverlay } from '../components/HuntIntroOverlay';
import { PollyExitConfirm } from '../components/PollyExitConfirm';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_FEATHERS = 6;
const INTRO_SEEN_KEY = 'polywords_intro_seen';
// ─── PURPLE FLASH — trap-caught confirmation ───────────────────
function PurpleFlash({ flashKey }: { flashKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (flashKey === 0) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.50, duration: 69,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 391, useNativeDriver: true }),
    ]).start();
  }, [flashKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#7B2D8B', opacity }}
    />
  );
}

// ─── RED FLASH — wrong-swipe danger signal ─────────────────────
function RedFlash({ flashKey }: { flashKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (flashKey === 0) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.32, duration: 55,  useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 180, useNativeDriver: true }),
    ]).start();
  }, [flashKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: '#CC2200', opacity }}
    />
  );
}

// ─── TOP BAR ─────────────────────────────────────────────────

function TopBar() {
  const game  = useGameStore(s => s.game);
  const goldFeatherAvailable = useGameStore(s => s.goldFeatherAvailable);
  const goldFeatherExpiresAt = useGameStore(s => s.goldFeatherExpiresAt);
  const filledFeathers = Math.max(0, Math.min(MAX_FEATHERS, game.lives));
  const hasReserve     = game.lives > MAX_FEATHERS;
  const hasGoldFeather =
    goldFeatherAvailable &&
    goldFeatherExpiresAt !== null &&
    Date.now() < goldFeatherExpiresAt;
  const total   = game.session.length;
  const current = game.stepIndex;

  const animScore = useRef(new Animated.Value(game.score)).current;
  const [displayScore, setDisplayScore] = useState(game.score);

  useEffect(() => {
    const id = animScore.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => animScore.removeListener(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Animated.timing(animScore, {
      toValue: game.score,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [game.score]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={tb.root}>
      <View style={tb.statsRow}>
        <Text style={tb.scoreVal}>{displayScore}</Text>
        <StreakDisplay />
        <View
          style={tb.featherRow}
          accessible
          accessibilityLabel={`${filledFeathers} feathers remaining`}
        >
          {Array.from({ length: MAX_FEATHERS }, (_, i) => (
            <FeatherIcon key={i} filled={i < filledFeathers} />
          ))}
          {hasReserve && (
            <View style={tb.reserveFeatherWrap}>
              <View style={[tb.featherBlade, tb.featherBladeFilled, tb.reserveBlade]}>
                <View style={[tb.featherHighlight, tb.featherHighlightFilled]} />
              </View>
              <View style={[tb.featherShaft, tb.featherShaftFilled, tb.reserveShaft]} />
              <Text style={tb.reservePlus}>+</Text>
            </View>
          )}
          {hasGoldFeather && (
            <View
              style={tb.goldFeatherWrap}
              accessible
              accessibilityLabel="Gold Feather free life available"
            >
              <Image
                source={require('../../assets/ui/feather-gold-reward.png')}
                style={tb.goldFeatherImg}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </View>
      <RoundChips current={current} total={total} />
    </View>
  );
}

// ─── ROUND CHIPS ─────────────────────────────────────────────

function RoundChips({ current, total }: { current: number; total: number }) {
  const chipAnims = useRef(
    Array.from({ length: total }, (_, i) => ({
      scale: new Animated.Value(i === current ? 1.25 : i < current ? 0.92 : 1),
      translateY: new Animated.Value(i === current ? -3 : 0),
      opacity: new Animated.Value(i < current ? 0.45 : 1),
    }))
  ).current;

  const prevCurrentRef = useRef(current);

  useEffect(() => {
    const justCompletedIndex = current > prevCurrentRef.current ? current - 1 : null;
    prevCurrentRef.current = current;

    chipAnims.forEach((anim, i) => {
      const isDone = i < current;
      const isCurrent = i === current;
      const toScale = isCurrent ? 1.25 : isDone ? 0.92 : 1;
      const toY = isCurrent ? -3 : 0;
      const toOpacity = isDone ? 0.45 : 1;

      if (i === justCompletedIndex) {
        // The chip that just finished gets one deliberate pop before
        // settling to its resting "done" scale — this is the round's
        // actual completion signal now that the floating text is gone.
        Animated.sequence([
          Animated.spring(anim.scale, { toValue: 1.4, damping: 9, stiffness: 260, useNativeDriver: true }),
          Animated.spring(anim.scale, { toValue: toScale, damping: 12, stiffness: 180, useNativeDriver: true }),
        ]).start();
      } else {
        Animated.spring(anim.scale, {
          toValue: toScale,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }).start();
      }
      Animated.spring(anim.translateY, {
        toValue: toY,
        damping: 12,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
      Animated.timing(anim.opacity, {
        toValue: toOpacity,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={tb.chipsRow}>
      {chipAnims.map((anim, i) => {
        const isBoss = i === total - 1;
        const isCurrent = i === current;
        const isPurpleFramed = isCurrent || isBoss;
        return (
          <Animated.View
            key={i}
            style={[
              tb.chip,
              {
                borderColor: isPurpleFramed
                  ? PW.color.purple
                  : 'rgba(255,255,255,0.55)',
                borderWidth: isPurpleFramed ? 1.5 : 1,
                opacity: anim.opacity,
                transform: [
                  { scale: anim.scale },
                  { translateY: anim.translateY },
                ],
              },
              isCurrent && {
                shadowColor: PW.color.purple,
                shadowOpacity: 0.5,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
              },
            ]}
          >
            {isBoss ? (
              // PLACEHOLDER — swap for a real crown icon asset when available
              <View style={{ width: 12, height: 10 }}>
                <View style={tb.crownBase} />
                <View style={[tb.crownPoint, { left: 0, bottom: 2 }]} />
                <View style={[tb.crownPoint, { left: 4, bottom: 4 }]} />
                <View style={[tb.crownPoint, { left: 8, bottom: 2 }]} />
              </View>
            ) : (
              <Text style={[tb.chipLabel, isCurrent && tb.chipLabelCurrent]}>
                {i + 1}
              </Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const FEATHER_DUST_ANGLES = [0, 60, 120, 180, 240, 300].map(
  a => (a * Math.PI) / 180,
);

function FeatherDustParticle({
  angle,
  progress,
}: {
  angle: number;
  progress: Animated.Value;
}) {
  const tx = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, Math.cos(angle) * 16],
  });
  const ty = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, Math.sin(angle) * 16],
  });
  const op = progress.interpolate({
    inputRange:  [0, 0.35, 1],
    outputRange: [0.9, 0.6, 0],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 6,
        left: 5,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#9B59B6',
        transform: [{ translateX: tx }, { translateY: ty }],
        opacity: op,
      }}
    />
  );
}

function FeatherIcon({ filled }: { filled: boolean }) {
  const prevFilled    = useRef(filled);
  const shakeRotate   = useRef(new Animated.Value(0)).current;
  const launchY       = useRef(new Animated.Value(0)).current;
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const dustProgress  = useRef(new Animated.Value(0)).current;
  const [dustVisible, setDustVisible] = useState(false);

  useEffect(() => {
    if (prevFilled.current === true && filled === false) {
      // Phase 1 — Shake (80ms)
      Animated.sequence([
        Animated.timing(shakeRotate, { toValue:  8, duration: 22, useNativeDriver: true }),
        Animated.timing(shakeRotate, { toValue: -8, duration: 22, useNativeDriver: true }),
        Animated.timing(shakeRotate, { toValue:  5, duration: 20, useNativeDriver: true }),
        Animated.timing(shakeRotate, { toValue:  0, duration: 16, useNativeDriver: true }),
      ]).start(() => {
        // Phase 2 — Launch up + dust burst (200ms)
        setDustVisible(true);
        dustProgress.setValue(0);
        Animated.parallel([
          Animated.timing(launchY,       { toValue: -40, duration: 140, useNativeDriver: true }),
          Animated.timing(launchOpacity, { toValue: 0,   duration: 140, useNativeDriver: true }),
          Animated.timing(dustProgress,  { toValue: 1,   duration: 300, useNativeDriver: true }),
        ]).start(() => {
          // Reset — slot now shows dim silhouette (empty styles)
          launchY.setValue(0);
          launchOpacity.setValue(1);
          setDustVisible(false);
          dustProgress.setValue(0);
        });
      });
    }
    prevFilled.current = filled;
  }, [filled]); // eslint-disable-line react-hooks/exhaustive-deps

  const rotate = shakeRotate.interpolate({
    inputRange:  [-8, 8],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={[tb.featherBox, { overflow: 'visible' }]}>
      <Animated.View
        style={{
          transform: [{ rotate }, { translateY: launchY }],
          opacity: launchOpacity,
        }}
      >
        <Image
          source={
            filled
              ? require('../../assets/ui/feather-life-filled.png')
              : require('../../assets/ui/feather-life-empty.png')
          }
          style={tb.featherImg}
          resizeMode="contain"
        />
      </Animated.View>
      {dustVisible && FEATHER_DUST_ANGLES.map((angle, i) => (
        <FeatherDustParticle key={i} angle={angle} progress={dustProgress} />
      ))}
    </View>
  );
}

const tb = StyleSheet.create({
  root: {
    marginHorizontal: PW.space.screenX,
    marginTop: 4,
    marginBottom: 0,
    paddingHorizontal: PW.space.md,
    paddingTop: 8,
    paddingBottom: 9,
    borderRadius: 6,
    backgroundColor: 'rgba(11,9,32,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.38)',
    borderBottomColor: 'rgba(245,200,66,0.42)',
    borderBottomWidth: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreVal: {
    color: PW.color.gold,
    fontSize: 42,
    fontFamily: FONTS.hud,
    lineHeight: 44,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: PW.color.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    minWidth: 96,
  },
  featherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 5,
    minWidth: 108,
    overflow: 'visible',
  },
  featherBox: {
    width: 18,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featherImg: {
    width: 18,
    height: 34,
  },
  featherBlade: {
    position: 'absolute',
    width: 7,
    height: 17,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 1,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 7,
    borderWidth: 1,
    transform: [{ rotate: '-24deg' }],
    shadowColor: PW.color.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 2,
    elevation: 2,
  },
  featherBladeFilled: {
    backgroundColor: PW.color.softWhite,
    borderColor: 'rgba(185,138,222,0.62)',
    shadowOpacity: 0.12,
  },
  featherHighlight: {
    position: 'absolute',
    top: 4,
    right: 1.5,
    width: 1.25,
    height: 7,
    borderRadius: 1,
    transform: [{ rotate: '28deg' }],
  },
  featherHighlightFilled: {
    backgroundColor: 'rgba(123,45,139,0.34)',
  },
  featherShaft: {
    position: 'absolute',
    top: 1,
    left: 4.25,
    width: 1,
    height: 17,
    borderRadius: 1,
    transform: [{ rotate: '-24deg' }],
  },
  featherShaftFilled: {
    backgroundColor: 'rgba(123,45,139,0.70)',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  chip: {
    width: 22,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: PW.color.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 10,
    fontFamily: FONTS.hud,
    color: PW.color.softWhite,
  },
  chipLabelCurrent: {
    color: PW.color.lavender,
  },
  crownBase: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 4,
    borderRadius: 1,
    backgroundColor: PW.color.gold,
  },
  crownPoint: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 1,
    backgroundColor: PW.color.gold,
    transform: [{ rotate: '45deg' }],
  },
  reserveFeatherWrap: {
    width:          8,
    height:         14,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     2,
  },
  reserveBlade: {
    width:  6,
    height: 13,
    borderColor: PW.color.goldSoft,
    backgroundColor: PW.color.goldGlow,
  },
  reserveShaft: {
    backgroundColor: PW.color.goldSoft,
    height: 12,
  },
  reservePlus: {
    position:   'absolute',
    top:        -5,
    right:      -3,
    color:      PW.color.gold,
    fontSize:   7,
    fontWeight: '700',
    lineHeight: 8,
  },
  goldFeatherWrap: {
    width: 20,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  goldFeatherImg: {
    width: 20,
    height: 34,
  },
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

function GameDirector({ navigation }: { navigation: any }) {
  const game       = useGameStore(s => s.game);
  const startGame  = useGameStore(s => s.startGame);
  const consumeFeatherMilestone = useGameStore(s => s.consumeFeatherMilestone);
  const consumeMercy = useGameStore(s => s.consumeMercy);
  const loadGoldFeather = useGameStore(s => s.loadGoldFeather);
  const checkGoldFeatherExpiry = useGameStore(s => s.checkGoldFeatherExpiry);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

  // ── Exit guard — leaving mid-Hunt takes a real choice, never silence ────
  // beforeRemove fires for edge-swipe-back, Android back, and any
  // navigation away, so this is the one place that covers all three.
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);
  const pendingExitActionRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (game.status !== 'playing') return;
      e.preventDefault();
      pendingExitActionRef.current = e.data.action;
      setExitConfirmVisible(true);
    });
    return unsubscribe;
  }, [navigation, game.status]);

  const handleStayHunting = useCallback(() => {
    pendingExitActionRef.current = null;
    setExitConfirmVisible(false);
  }, []);

  const handleConfirmLeave = useCallback(() => {
    setExitConfirmVisible(false);
    const action = pendingExitActionRef.current;
    pendingExitActionRef.current = null;
    if (action) navigation.dispatch(action);
  }, [navigation]);

  // ── Feather float animation ────────────────────────────────
  const featherFloatY       = useRef(new Animated.Value(0)).current;
  const featherFloatOpacity = useRef(new Animated.Value(0)).current;
  const [showFeatherFloat, setShowFeatherFloat] = useState(false);

  // ── Effects overlay ────────────────────────────────────────
  const fxLayerRef    = useRef<FXLayerHandle>(null);
  const prevChainRef  = useRef<number>(1);

  const spawnEffect = useCallback(
    (type: 'shard' | 'trail', x: number, y: number, variant?: ShardVariant) => {
      if (type === 'shard') {
        fxLayerRef.current?.spawn({ type, x, y, variant });
      } else {
        fxLayerRef.current?.spawn({ type, x, y });
      }
    },
    []
  );

  // ── Flash overlay state ────────────────────────────────────
  const [purpleFlashKey, setPurpleFlashKey] = useState(0);
  const [redFlashKey,    setRedFlashKey]    = useState(0);

  const handleTrapCaught = useCallback(() => setPurpleFlashKey(k => k + 1), []);
  const handleWrongSwipe = useCallback(() => setRedFlashKey(k => k + 1),    []);

  // ── Idle/stuck-static timer ──────────────────────────────────
  const STATIC_IDLE_TIMEOUT_MS = 15000;
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isIdleStatic, setIsIdleStatic] = useState(false);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
    }
    setIsIdleStatic(false);
    idleTimerRef.current = setTimeout(() => {
      setIsIdleStatic(true);
    }, STATIC_IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (game.status !== 'playing') {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      setIsIdleStatic(false);
      return;
    }
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [game.stepIndex, game.status, resetIdleTimer]);

  useEffect(() => {
    initSounds();
    preloadSfx();
    return () => {
      unloadSfx();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadGoldFeather().then(() => {
      checkGoldFeatherExpiry();
    });
  }, [loadGoldFeather, checkGoldFeatherExpiry]);

  // ── First-hunt intro overlay ──────────────────────────────────
  // null = still loading the flag; fail open so gameplay is never blocked.
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(INTRO_SEEN_KEY)
      .then(v => setIntroSeen(v === 'true'))
      .catch(() => setIntroSeen(true));
  }, []);
  const [introVisitPending, setIntroVisitPending] = useState(false);
  const handleIntroDismiss = useCallback(() => {
    setIntroSeen(true);
    setIntroVisitPending(true);
    AsyncStorage.setItem(INTRO_SEEN_KEY, 'true').catch(() => {});
  }, []);

  useEffect(() => {
    if (game.status === 'complete' || game.status === 'gameOver') {
      playRoundComplete();
    }
  }, [game.status]);

  const prevTensionRef = useRef(0);

  useEffect(() => {
    const step = currentStep(game);
    if (step.kind !== 'word') return;

    const phaseFloor = (role: typeof step.emotionalRole): number => {
      switch (role) {
        case 'confidence':
        case 'flow':
          return 0;
        case 'firstTension':
        case 'tension':
          return 1;
        case 'panic':
        case 'adrenaline':
          return 2;
        case 'finalBoss':
          return 3;
        default:
          return 0;
      }
    };

    let t = phaseFloor(step.emotionalRole);
    if (step.eventType === 'bossWord') t = 3;
    if (game.lives === 1) t = Math.min(t + 1, 3);
    if (missedCount >= 2) t = Math.min(t + 1, 3);

    if (t > prevTensionRef.current) {
      Haptics.selectionAsync();
    }
    prevTensionRef.current = t;
    setTension(t);
  }, [game.stepIndex, game.lives, missedCount, setTension]);

  useEffect(() => { setMissedCount(0); }, [game.stepIndex]);

  useEffect(() => {
    if (!game.featherMilestone) return;
    consumeFeatherMilestone();
    Haptics.selectionAsync();
    featherFloatY.setValue(0);
    featherFloatOpacity.setValue(0);
    setShowFeatherFloat(true);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(featherFloatOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
        Animated.timing(featherFloatY, {
          toValue: -12, duration: 200, useNativeDriver: true,
        }),
      ]),
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(featherFloatOpacity, {
          toValue: 0, duration: 300, useNativeDriver: true,
        }),
        Animated.timing(featherFloatY, {
          toValue: -44, duration: 300, useNativeDriver: true,
        }),
      ]),
    ]).start(() => setShowFeatherFloat(false));
  }, [game.featherMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fledgling Mercy — Polly revives her prey once ─────────────
  const mercyFloatY       = useRef(new Animated.Value(0)).current;
  const mercyFloatOpacity = useRef(new Animated.Value(0)).current;
  const [showMercyFloat, setShowMercyFloat] = useState(false);

  useEffect(() => {
    if (!game.mercyTriggered) return;
    consumeMercy();
    playSfx('pollySqwawkLaugh');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    mercyFloatY.setValue(0);
    mercyFloatOpacity.setValue(0);
    setShowMercyFloat(true);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mercyFloatOpacity, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
        Animated.timing(mercyFloatY, {
          toValue: -10, duration: 220, useNativeDriver: true,
        }),
      ]),
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(mercyFloatOpacity, {
          toValue: 0, duration: 320, useNativeDriver: true,
        }),
        Animated.timing(mercyFloatY, {
          toValue: -36, duration: 320, useNativeDriver: true,
        }),
      ]),
    ]).start(() => setShowMercyFloat(false));
  }, [game.mercyTriggered]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Music Engine lifecycle ────────────────────────────────────
  // Tied to navigation focus, not mount/unmount: native-stack keeps the
  // outgoing and incoming screens both mounted during the transition
  // animation, so a mount/unmount effect here would overlap with whatever
  // screen is fading out, bleeding both tracks together.
  useFocusEffect(
    useCallback(() => {
      startMusic('hunt');
      return () => {
        stopMusic('hunt');
      };
    }, []),
  );

  // ── Music state machine ───────────────────────────────────────
  useEffect(() => {
    if (game.status !== 'playing') {
      setMusicState('hunt', 'off');
      return;
    }
    const activeStep = currentStep(game);
    const isBossStep = activeStep.kind === 'word' && activeStep.eventType === 'bossWord';

    let state: MusicState;
    if (isBossStep) {
      state = 'boss';
    } else if (game.lives <= 2) {
      state = 'crisis';
    } else if (isIdleStatic) {
      state = 'static';
    } else if (game.chainMultiplier >= 2.5) {
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState('hunt', state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status, isIdleStatic]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chain break detection ─────────────────────────────────────
  useEffect(() => {
    if (prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0) {
      playSfx('chainBreak');
    }
    prevChainRef.current = game.chainMultiplier;
  }, [game.chainMultiplier]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  function handleHome() {
    navigation.navigate('Home');
  }

  function handleDevJumpToBoss(livesOverride?: number) {
    if (!__DEV__) return;

    const currentGame = useGameStore.getState().game;
    const bossIndex = currentGame.session.findIndex(
      step => step.kind === 'word' && step.eventType === 'bossWord'
    );
    if (bossIndex === -1) return;

    useGameStore.setState({
      game: {
        ...currentGame,
        stepIndex: bossIndex,
        lives: livesOverride ?? currentGame.lives,
        swipedUpIds: [],
        swipedDownIds: [],
        revealedHiddenMasks: {},
        mistakesOnWord: 0,
        feedback: null,
        lastActionAt: Date.now(),
        pollyTrigger: null,
        streakMilestone: null,
        featherMilestone: null,
      },
    });
    setMissedCount(0);
    setShowFeatherFloat(false);
  }

  const isDone = game.status === 'complete' || game.status === 'gameOver';
  const activeStep = currentStep(game);
  const isBossRound =
    !isDone &&
    activeStep.kind === 'word' &&
    activeStep.eventType === 'bossWord';

  return (
    <SafeAreaView style={styles.screen}>
      <ImageBackground
        source={
          isBossRound
            ? require('../../assets/backgrounds/boss-round-bg.png')
            : require('../../assets/home/home-hero-bg.png')
        }
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={isBossRound
            ? ['rgba(15,13,42,0.46)', 'rgba(15,13,42,0.18)']
            : ['rgba(6,4,22,0.93)', 'rgba(9,6,26,0.55)', 'rgba(7,5,23,0.82)']}
          locations={isBossRound ? undefined : [0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>
      {isBossRound && (
        <View pointerEvents="none" style={styles.bossBackground}>
          <View style={styles.bossBookGlow}>
            <View style={styles.bossBookGlowCore} />
          </View>
          <LinearGradient
            colors={[
              'rgba(15,13,42,0.30)',
              'rgba(15,13,42,0.00)',
              'rgba(15,13,42,0.04)',
              'rgba(15,13,42,0.34)',
            ]}
            locations={[0, 0.30, 0.70, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={[
              'rgba(15,13,42,0.22)',
              'rgba(15,13,42,0.00)',
              'rgba(15,13,42,0.22)',
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}
      {!isDone && <TopBar />}
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} onHome={handleHome} />
      ) : (
        <GameContent
          spawnEffect={spawnEffect}
          onTrapCaught={handleTrapCaught}
          onWrongSwipe={handleWrongSwipe}
          onSwipeAttempt={resetIdleTimer}
          fireIntroVisit={introVisitPending}
          onIntroVisitFired={() => setIntroVisitPending(false)}
        />
      )}
      {__DEV__ && !isDone && !isBossRound && (
        <View pointerEvents="box-none" style={styles.devBossOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to boss round"
            onPress={() => handleDevJumpToBoss()}
            style={styles.devBossButton}
          >
            <Text style={styles.devBossButtonText}>BOSS</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to boss round with two lives remaining"
            onPress={() => handleDevJumpToBoss(2)}
            style={[styles.devBossButton, styles.devBossButtonCrisis]}
          >
            <Text style={styles.devBossButtonText}>BOSS{'\n'}(CRISIS)</Text>
          </Pressable>
        </View>
      )}

      {/* ── Flash overlays — zIndex 50, above game content ── */}
      <PurpleFlash flashKey={purpleFlashKey} />
      <RedFlash    flashKey={redFlashKey} />

      {/* ── Effects overlay — pointerEvents none, zIndex 100 ── */}
      <View style={styles.effectsOverlay} pointerEvents="none">
        {showFeatherFloat && (
          <Animated.Text
            style={[
              gs.featherFloat,
              {
                opacity:   featherFloatOpacity,
                transform: [{ translateY: featherFloatY }],
              },
            ]}
          >
            +1 FEATHER
          </Animated.Text>
        )}
        {showMercyFloat && (
          <Animated.Text
            style={[
              gs.mercyFloat,
              {
                opacity:   mercyFloatOpacity,
                transform: [{ translateY: mercyFloatY }],
              },
            ]}
          >
            POLLY ISN'T DONE WITH YOU
          </Animated.Text>
        )}
      </View>

      <FXLayer ref={fxLayerRef} />

      {introSeen === false && !isDone && (
        <HuntIntroOverlay onDismiss={handleIntroDismiss} />
      )}

      {exitConfirmVisible && (
        <PollyExitConfirm onStay={handleStayHunting} onLeave={handleConfirmLeave} />
      )}
    </SafeAreaView>
  );
}

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent({
  spawnEffect,
  onTrapCaught,
  onWrongSwipe,
  onSwipeAttempt,
  fireIntroVisit,
  onIntroVisitFired,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught: () => void;
  onWrongSwipe: () => void;
  onSwipeAttempt: () => void;
  fireIntroVisit: boolean;
  onIntroVisitFired: () => void;
}) {
  const game = useGameStore(s => s.game);
  const ghosts = useGameStore(s => s.ghosts);
  const step = currentStep(game);
  const ghostRunsMissed = step.kind === 'word' && step.isHauntReturn
    ? ghosts.find(ghost => ghost.wordId === step.word.trim().toUpperCase())?.runsMissed ?? 0
    : 0;

  // Visit layer lives HERE, above MaskBoard's per-word remount boundary
  // (key={stepIndex}) — word-completion beats must outlive the board.
  const { visit, onVisitDone, firePollyEvent } = usePollyVisits(
    step.kind === 'word' && step.eventType === 'speedRound',
    ghostRunsMissed,
  );

  useEffect(() => {
    if (!fireIntroVisit) return;
    firePollyEvent('huntIntro');
    onIntroVisitFired();
  }, [fireIntroVisit, firePollyEvent, onIntroVisitFired]);

  if (step.kind === 'word') {
    // Same predicate GameDirector uses for isBossRound, so routing here and
    // the boss background/scrim there stay in lockstep.
    const isBossStep = step.eventType === 'bossWord';
    const Board = isBossStep ? BossBoard : MaskBoard;
    return (
      <View style={{ flex: 1 }}>
        <Board
          key={`board-${game.stepIndex}`}
          step={step}
          spawnEffect={spawnEffect}
          onTrapCaught={onTrapCaught}
          onWrongSwipe={onWrongSwipe}
          onSwipeAttempt={onSwipeAttempt}
          firePollyEvent={firePollyEvent}
        />
        <PollyHuntVisit visit={visit} onDone={onVisitDone} />
      </View>
    );
  }

  return null;
}

// ─── ROOT EXPORT ─────────────────────────────────────────────

export default function GameScreen({ navigation }: { navigation: any }) {
  return (
    <HeartbeatProvider>
      <GameDirector navigation={navigation} />
    </HeartbeatProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bossBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  bossBookGlow: {
    position: 'absolute',
    top: 72,
    left: '6%',
    right: '6%',
    height: 230,
    borderRadius: 150,
    backgroundColor: 'rgba(155,45,107,0.08)',
  },
  bossBookGlowCore: {
    position: 'absolute',
    top: 48,
    bottom: 48,
    left: '16%',
    right: '16%',
    borderRadius: 90,
    backgroundColor: 'rgba(245,200,66,0.04)',
  },
  devBossOverlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 200,
    gap: 6,
    alignItems: 'flex-end',
  },
  devBossButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    backgroundColor: PW.color.surfaceDeep,
    opacity: 0.72,
  },
  devBossButtonCrisis: {
    borderColor: '#CC2200',
  },
  devBossButtonText: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  effectsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});

const gs = StyleSheet.create({
  mercyFloat: {
    position:   'absolute',
    top:        128,
    left:       0,
    right:      0,
    textAlign:  'center',
    color:      PW.color.lavender,
    fontSize:   16,
    fontFamily: FONTS.hud,
    letterSpacing: 2,
    textShadowColor:  'rgba(123,45,139,0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  featherFloat: {
    position:   'absolute',
    top:        72,
    right:      20,
    color:      '#F5C842',
    fontSize:   13,
    fontFamily: FONTS.wordDisplay,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor:  'rgba(245,200,66,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
