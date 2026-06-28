import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { currentStep } from '../game/polyRunEngine';
import { useGameStore } from '../store/useGameStore';
import { MaskBoard } from '../components/MaskBoard';
import { StreakDisplay } from '../components/StreakDisplay';
import { HeartbeatProvider, useHeartbeat } from '../hooks/useHeartbeat';
import { PW } from '../ui/pwTheme';
import ResultsScreen from './ResultsScreen';
import { initSounds, playRoundComplete } from '../utils/SoundEngine';
import { preloadSfx, unloadSfx } from '../audio/sfx';
import { initMusicEngine, startMusic, stopMusic, setMusicState, triggerChainBreak, disposeMusicEngine, MusicState } from '../audio/MusicEngine';
import * as Haptics from 'expo-haptics';
import FXLayer, { FXLayerHandle } from '../components/FXLayer';
import { ShardVariant } from '../ui/pwEffects';

const MAX_FEATHERS = 5;

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
  const filledFeathers = Math.max(0, Math.min(MAX_FEATHERS, game.lives));
  const hasReserve     = game.lives > MAX_FEATHERS;
  const total   = game.session.length;
  const current = game.stepIndex;

  const animScore = useRef(new Animated.Value(game.score)).current;
  const [displayScore, setDisplayScore] = useState(game.score);

  const progressAnim = useRef(new Animated.Value(
    total > 0 ? current / total : 0
  )).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue:  total > 0 ? current / total : 0,
      duration: 380,
      easing:   Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [current, total]); // eslint-disable-line react-hooks/exhaustive-deps

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
        </View>
      </View>
      <View style={tb.progressTrack}>
        <Animated.View
          style={[tb.progressFill, {
            width: progressAnim.interpolate({
              inputRange:  [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }]}
        />
      </View>
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
    paddingTop: 5,
    paddingBottom: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(11,9,32,0.86)',
    borderWidth: 0.5,
    borderColor: 'rgba(123,45,139,0.22)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreVal: {
    color: PW.color.gold,
    fontSize: FONT_SIZES.hudScore,
    fontFamily: FONTS.hud,
    lineHeight: 34,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowColor: PW.color.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    minWidth: 72,
  },
  featherRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 3,
    minWidth: 82,
    overflow: 'visible',
  },
  featherBox: {
    width: 14,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featherImg: {
    width: 14,
    height: 28,
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
  progressTrack: {
    height: 3,
    marginTop: 7,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: PW.color.gold,
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
});

// ─── INNER DIRECTOR ───────────────────────────────────────────

function GameDirector({ navigation }: { navigation: any }) {
  const game       = useGameStore(s => s.game);
  const startGame  = useGameStore(s => s.startGame);
  const consumeFeatherMilestone = useGameStore(s => s.consumeFeatherMilestone);
  const { setTension } = useHeartbeat();
  const [missedCount, setMissedCount] = useState(0);

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

  useEffect(() => {
    initSounds();
    preloadSfx();
    return () => {
      unloadSfx();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === 'complete' || game.status === 'gameOver') {
      playRoundComplete();
    }
  }, [game.status]);

  useEffect(() => {
    const step = currentStep(game);
    if (step.kind !== 'word') return;

    let t = 0;
    if (step.eventType === 'bossWord') t = 3;
    if (game.lives === 1) t = Math.min(t + 1, 3);
    if (missedCount >= 2) t = Math.min(t + 1, 3);
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

  // ── Music Engine lifecycle ────────────────────────────────────
  useEffect(() => {
    initMusicEngine().then(() => startMusic());
    return () => {
      stopMusic();
      disposeMusicEngine();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Music state machine ───────────────────────────────────────
  useEffect(() => {
    if (game.status !== 'playing') {
      stopMusic();
      return;
    }
    let state: MusicState;
    if (game.stepIndex === 11) {
      state = 'boss';
    } else if (game.lives <= 2) {
      state = 'crisis';
    } else if (game.chainMultiplier >= 2.5) {
      state = 'onARun';
    } else if (game.chainMultiplier >= 1.5) {
      state = 'rhythm';
    } else {
      state = 'neutral';
    }
    setMusicState(state);
  }, [game.chainMultiplier, game.lives, game.stepIndex, game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chain break detection ─────────────────────────────────────
  useEffect(() => {
    if (prevChainRef.current >= 2.5 && game.chainMultiplier === 1.0) {
      triggerChainBreak();
    }
    prevChainRef.current = game.chainMultiplier;
  }, [game.chainMultiplier]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop music on run end ─────────────────────────────────────
  useEffect(() => {
    if (game.status === 'gameOver' || game.status === 'complete') {
      stopMusic();
    }
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRestart() {
    startGame();
    setMissedCount(0);
  }

  function handleHome() {
    navigation.navigate('Home');
  }

  const isDone      = game.status === 'complete' || game.status === 'gameOver';
  return (
    <SafeAreaView style={styles.screen}>
      <ImageBackground
        source={require('../../assets/home/home-hero-bg.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['rgba(6,4,22,0.90)', 'rgba(8,5,24,0.36)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>
      {!isDone && <TopBar />}
      {isDone ? (
        <ResultsScreen onRestart={handleRestart} onHome={handleHome} />
      ) : (
        <GameContent
          spawnEffect={spawnEffect}
          onTrapCaught={handleTrapCaught}
          onWrongSwipe={handleWrongSwipe}
        />
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
      </View>

      <FXLayer ref={fxLayerRef} />
    </SafeAreaView>
  );
}

// ─── GAME CONTENT ─────────────────────────────────────────────

function GameContent({
  spawnEffect,
  onTrapCaught,
  onWrongSwipe,
}: {
  spawnEffect: (type: 'shard' | 'trail', x: number, y: number) => void;
  onTrapCaught: () => void;
  onWrongSwipe: () => void;
}) {
  const game = useGameStore(s => s.game);
  const step = currentStep(game);

  if (step.kind === 'word') {
    return (
      <MaskBoard
        key={`board-${game.stepIndex}`}
        step={step}
        spawnEffect={spawnEffect}
        onTrapCaught={onTrapCaught}
        onWrongSwipe={onWrongSwipe}
      />
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
