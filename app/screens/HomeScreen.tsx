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
                  <View style={[styles.cardMark, styles.dailyMark]} />
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
                  <View style={[styles.cardMark, styles.vaultMark]} />
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
                <View style={[styles.cardMark, styles.roseMark]} />
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
    paddingTop: 18,
    paddingBottom: 24,
  },
  hero: {
    minHeight: 330,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 34,
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
    marginTop: -4,
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    backgroundColor: 'rgba(15,13,42,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
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
    marginTop: 8,
    color: 'rgba(255,255,255,0.82)',
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
    marginTop: -4,
    marginHorizontal: 10,
    shadowColor: '#F5C842',
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  playButtonShell: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(245,200,66,0.24)',
    overflow: 'hidden',
  },
  playButton: {
    minHeight: 88,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  playInnerGlow: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 8,
    height: 22,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.28)',
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
    marginTop: 18,
  },
  destinationCard: {
    flex: 1,
    minHeight: 142,
    borderRadius: 18,
    backgroundColor: 'rgba(15,13,42,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.64)',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  dailyCard: {
    borderColor: 'rgba(123,45,139,0.82)',
  },
  dailyMark: {
    backgroundColor: '#7B2D8B',
  },
  vaultCard: {
    borderColor: 'rgba(245,200,66,0.46)',
  },
  continueCard: {
    minHeight: 112,
    marginTop: 12,
    borderColor: 'rgba(155,45,107,0.44)',
    shadowOpacity: 0.20,
  },
  disabledCard: {
    opacity: 0.70,
  },
  cardSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMark: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#7B2D8B',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  vaultMark: {
    backgroundColor: '#F5C842',
    shadowColor: '#F5C842',
  },
  roseMark: {
    backgroundColor: '#9B2D6B',
    shadowColor: '#9B2D6B',
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
    marginTop: 18,
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
