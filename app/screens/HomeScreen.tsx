import React, { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import BottomNav from '../components/BottomNav';
import { FONTS } from '../constants/fonts';
import { DAILY_ROUND_COUNT, getChallengeNumber, getTodayDateString } from '../game/dailyChallengeEngine';
import { useGameStore } from '../store/useGameStore';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame           = useGameStore(s => s.startGame);
  const loadDailyResult     = useGameStore(s => s.loadDailyResult);
  const dailyResult         = useGameStore(s => s.dailyResult);
  const startDailyChallenge = useGameStore(s => s.startDailyChallenge);

  const challengeNumber = getChallengeNumber(getTodayDateString());
  const alreadyPlayed   = dailyResult?.date === getTodayDateString();
  const canReplayDailyInDev = __DEV__;
  const dailyLocked = alreadyPlayed && !canReplayDailyInDev;
  const pollyY = useRef(new Animated.Value(0)).current;
  const playPulse = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(width - 34, 390);
  const logoHeight = Math.max(112, Math.min(152, logoWidth * 0.39));

  useEffect(() => { loadDailyResult(); }, []); // eslint-disable-line

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pollyY, { toValue: -8, duration: 900, useNativeDriver: true }),
        Animated.timing(pollyY, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(playPulse, { toValue: 1, duration: 950, useNativeDriver: true }),
        Animated.timing(playPulse, { toValue: 0, duration: 950, useNativeDriver: true }),
      ]),
    ).start();
  }, [playPulse, pollyY]);

  function handlePlay() {
    startGame();
    navigation.navigate('Game');
  }

  function handleDaily() {
    if (dailyLocked) return;
    startDailyChallenge();
    navigation.navigate('Daily');
  }

  function handleVaultPress() {
    navigation.navigate('Vault');
  }

  const playScale = playPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('../../assets/home/home-hero-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(4,3,16,0.34)', 'rgba(26,24,48,0.08)', 'rgba(7,5,22,0.66)']}
          locations={[0, 0.48, 1]}
          style={styles.backgroundShade}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(15,13,42,0.72)', 'rgba(15,13,42,0.08)', 'rgba(15,13,42,0.80)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.backgroundShade}
        />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <Animated.Text style={[styles.polly, { transform: [{ translateY: pollyY }] }]}>
                Polly
              </Animated.Text>
              <View style={styles.logoGlow} />
              <Image
                source={require('../../assets/brand/polywords-logo.png')}
                style={[styles.logoImage, { width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
                accessibilityLabel="POLYWORDS"
              />
              <View style={styles.copyPlate}>
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.07)', 'rgba(123,45,139,0.10)', 'rgba(15,13,42,0.02)']}
                  style={styles.copySheen}
                />
                <Text style={styles.logoSlogan}>WORDS HAVE MEANING...SSSSS</Text>
                <Text style={styles.storyLine}>Polly stole the meanings. Take them back.</Text>
              </View>
            </View>

            <Animated.View style={[styles.playWrap, { transform: [{ scale: playScale }] }]}>
              <Pressable onPress={handlePlay} style={({ pressed }) => [styles.playButtonShell, pressed && styles.pressed]}>
                <LinearGradient
                  colors={['#FFF1A8', '#F5C842', '#A66E14']}
                  locations={[0, 0.52, 1]}
                  style={styles.playButton}
                >
                  <View style={styles.playInnerGlow} />
                  <View style={styles.playBottomShade} />
                  <Text style={styles.playLabel}>PLAY</Text>
                  <Text style={styles.playSubcopy}>Enter the arena</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <View style={styles.cardGrid}>
              <Pressable
                onPress={handleDaily}
                disabled={dailyLocked}
                style={({ pressed }) => [
                  styles.destinationCard,
                  styles.dailyCard,
                  dailyLocked && styles.disabledCard,
                  pressed && !dailyLocked && styles.pressed,
                ]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0.08)', 'rgba(123,45,139,0.12)', 'rgba(15,13,42,0.08)']}
                  style={styles.cardSheen}
                />
                <View style={styles.cardHeader}>
                  <View style={[styles.modeIcon, styles.dailyIcon]}>
                    <View style={[styles.modeIconCore, styles.dailyIconCore]} />
                  </View>
                  <Text style={styles.cardEyebrow}>DAILY #{challengeNumber}</Text>
                </View>
                {alreadyPlayed ? (
                  <>
                    <Text style={styles.cardTitle}>{dailyResult?.title}</Text>
                    <Text style={styles.cardCopy}>
                      {dailyResult?.solvedCount}/{DAILY_ROUND_COUNT} words -{' '}
                      {canReplayDailyInDev ? 'Dev replay enabled.' : 'Come back tomorrow.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>DAILY CHALLENGE</Text>
                    <Text style={styles.cardCopy}>Five words. Two lives.</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleVaultPress}
                style={({ pressed }) => [styles.destinationCard, styles.vaultCard, pressed && styles.pressed]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(245,200,66,0.10)', 'rgba(123,45,139,0.10)', 'rgba(15,13,42,0.10)']}
                  style={styles.cardSheen}
                />
                <View style={styles.cardHeader}>
                  <View style={[styles.modeIcon, styles.vaultIcon]}>
                    <View style={[styles.modeIconCore, styles.vaultIconCore]} />
                  </View>
                  <Text style={styles.cardEyebrow}>PLAYER ARCHIVE</Text>
                </View>
                <Text style={styles.cardTitle}>WORD VAULT</Text>
                <Text style={styles.cardCopy}>Reclaimed meanings.</Text>
              </Pressable>
            </View>

            <View style={[styles.destinationCard, styles.continueCard, styles.disabledCard]}>
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(255,255,255,0.06)', 'rgba(155,45,107,0.10)', 'rgba(15,13,42,0.08)']}
                style={styles.cardSheen}
              />
              <View style={styles.cardHeader}>
                <View style={[styles.modeIcon, styles.lockedIcon]}>
                  <View style={[styles.modeIconCore, styles.lockedIconCore]} />
                </View>
                <Text style={styles.cardEyebrow}>LOCKED</Text>
              </View>
              <Text style={styles.cardTitle}>Continue Run</Text>
              <Text style={styles.cardCopy}>Your next hunt will wait here.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
      <BottomNav active="Home" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  background: {
    flex: 1,
  },
  backgroundShade: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
  },
  hero: {
    minHeight: 318,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 28,
  },
  logoGlow: {
    position: 'absolute',
    top: 78,
    width: '82%',
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(123,45,139,0.22)',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.44,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  logoImage: {
    marginTop: 14,
    shadowColor: '#F5C842',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  copyPlate: {
    marginTop: -8,
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    backgroundColor: 'rgba(8,6,26,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(193,136,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  copySheen: {
    ...StyleSheet.absoluteFillObject,
  },
  logoSlogan: {
    color: '#FFFFFF',
    fontFamily: FONTS.label,
    fontSize: 14,
    letterSpacing: 2.4,
    textAlign: 'center',
    textShadowColor: 'rgba(123,45,139,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  storyLine: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.80)',
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  polly: {
    position: 'absolute',
    right: 4,
    top: 4,
    color: 'rgba(255,255,255,0.56)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 1.6,
    opacity: 0.9,
  },
  playWrap: {
    marginTop: 0,
    marginHorizontal: 10,
    shadowColor: '#F5C842',
    shadowOpacity: 0.58,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
  },
  playButtonShell: {
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255,244,175,0.46)',
    backgroundColor: 'rgba(245,200,66,0.30)',
    overflow: 'hidden',
  },
  playButton: {
    minHeight: 90,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.42)',
    borderLeftColor: 'rgba(255,255,255,0.26)',
    borderRightColor: 'rgba(93,54,8,0.28)',
    borderBottomColor: 'rgba(77,44,7,0.46)',
  },
  playInnerGlow: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 7,
    height: 24,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  playBottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 30,
    backgroundColor: 'rgba(76,43,5,0.16)',
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  playLabel: {
    color: '#0F0D2A',
    fontFamily: FONTS.hud,
    fontSize: 32,
    letterSpacing: 3,
    textShadowColor: 'rgba(255,255,255,0.38)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playSubcopy: {
    color: 'rgba(15,13,42,0.72)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    marginTop: 3,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  destinationCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: 18,
    backgroundColor: 'rgba(7,5,24,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.72)',
    padding: 15,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  dailyCard: {
    borderColor: 'rgba(245,200,66,0.36)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.22,
  },
  vaultCard: {
    borderColor: 'rgba(123,45,139,0.86)',
    shadowColor: '#7B2D8B',
  },
  continueCard: {
    minHeight: 104,
    marginTop: 12,
    backgroundColor: 'rgba(7,5,24,0.66)',
    borderColor: 'rgba(169,154,196,0.18)',
    shadowOpacity: 0.10,
  },
  disabledCard: {
    opacity: 0.60,
  },
  cardSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modeIconCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dailyIcon: {
    backgroundColor: 'rgba(245,200,66,0.13)',
    borderColor: 'rgba(245,200,66,0.46)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.46,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  dailyIconCore: {
    backgroundColor: '#F5C842',
  },
  vaultIcon: {
    backgroundColor: 'rgba(123,45,139,0.26)',
    borderColor: 'rgba(245,200,66,0.26)',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.62,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  vaultIconCore: {
    backgroundColor: '#7B2D8B',
  },
  lockedIcon: {
    backgroundColor: 'rgba(155,45,107,0.10)',
    borderColor: 'rgba(169,154,196,0.20)',
  },
  lockedIconCore: {
    backgroundColor: '#9B2D6B',
    opacity: 0.58,
  },
  cardEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: FONTS.tileCopy,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 17,
    letterSpacing: 1,
    marginTop: 16,
    textShadowColor: 'rgba(123,45,139,0.80)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cardCopy: {
    color: 'rgba(255,255,255,0.76)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
});
