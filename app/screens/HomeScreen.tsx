import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomNav, { bottomNavContentPadding } from '../components/BottomNav';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const pollyY = useRef(new Animated.Value(0)).current;
  const playPulse = useRef(new Animated.Value(0)).current;

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

  function handleVaultPress() {
    navigation.navigate('Vault');
  }

  const playScale = playPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroRing} />
          <View style={styles.heroShard} />
          <View style={styles.topRow}>
            <View>
              <Text style={styles.kicker}>ARCADE LOBBY</Text>
              <Text style={styles.title}>POLYWORDS</Text>
            </View>
            <Animated.Text style={[styles.polly, { transform: [{ translateY: pollyY }] }]}>
              🦜
            </Animated.Text>
          </View>
          <Text style={styles.tagline}>Steal back every meaning.</Text>
          <Text style={styles.heroCopy}>
            Polly stole the meanings. Take them back.
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: playScale }] }}>
          <Pressable onPress={handlePlay} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
            <Text style={styles.playLabel}>PLAY</Text>
            <Text style={styles.playSubcopy}>Enter the arena</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.cardGrid}>
          <View style={[styles.destinationCard, styles.disabledCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardMark} />
              <Text style={styles.cardEyebrow}>PLACEHOLDER</Text>
            </View>
            <Text style={styles.cardTitle}>DAILY CHALLENGE</Text>
            <Text style={styles.cardCopy}>One stolen word. One shot.</Text>
          </View>

          <Pressable
            onPress={handleVaultPress}
            style={({ pressed }) => [styles.destinationCard, styles.vaultCard, pressed && styles.pressed]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardMark, styles.vaultMark]} />
              <Text style={styles.cardEyebrow}>PLAYER ARCHIVE</Text>
            </View>
            <Text style={styles.cardTitle}>WORD VAULT</Text>
            <Text style={styles.cardCopy}>Mastered words and ghosts live here.</Text>
          </Pressable>
        </View>

        <View style={[styles.destinationCard, styles.continueCard, styles.disabledCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardMark, styles.roseMark]} />
            <Text style={styles.cardEyebrow}>COMING LATER</Text>
          </View>
          <Text style={styles.cardTitle}>Continue Run</Text>
          <Text style={styles.cardCopy}>Your next hunt will wait here.</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Home is the lobby. Play is the arena. Vault is yours.</Text>
        </View>
      </ScrollView>
      <BottomNav active="Home" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1A1830',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: bottomNavContentPadding,
  },
  hero: {
    minHeight: 254,
    borderRadius: 24,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.50)',
    padding: 22,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  heroRing: {
    position: 'absolute',
    right: -52,
    top: -46,
    width: 188,
    height: 188,
    borderRadius: 94,
    borderWidth: 18,
    borderColor: 'rgba(245,200,66,0.08)',
  },
  heroShard: {
    position: 'absolute',
    left: -22,
    bottom: 24,
    width: 92,
    height: 92,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(155,45,107,0.35)',
    transform: [{ rotate: '18deg' }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: 'rgba(255,255,255,0.56)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: '#F5C842',
    fontFamily: FONTS.brand,
    fontSize: 48,
    letterSpacing: 2,
  },
  polly: {
    fontSize: 62,
    marginTop: -6,
  },
  tagline: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 24,
    letterSpacing: 0.5,
    marginTop: 28,
  },
  heroCopy: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 270,
  },
  playButton: {
    marginTop: 18,
    minHeight: 86,
    borderRadius: 20,
    backgroundColor: '#F5C842',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
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
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: '#0F0D2A',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.40)',
    padding: 16,
    justifyContent: 'space-between',
  },
  vaultCard: {
    borderColor: 'rgba(245,200,66,0.26)',
  },
  continueCard: {
    minHeight: 122,
    marginTop: 12,
    borderColor: 'rgba(155,45,107,0.34)',
  },
  disabledCard: {
    opacity: 0.76,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7B2D8B',
  },
  vaultMark: {
    backgroundColor: '#F5C842',
  },
  roseMark: {
    backgroundColor: '#9B2D6B',
  },
  cardEyebrow: {
    color: 'rgba(255,255,255,0.48)',
    fontFamily: FONTS.tileCopy,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.hud,
    fontSize: 18,
    letterSpacing: 1,
    marginTop: 18,
  },
  cardCopy: {
    color: 'rgba(255,255,255,0.64)',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  footer: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.25)',
    backgroundColor: 'rgba(15,13,42,0.72)',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  footerText: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: FONTS.tileCopy,
    fontSize: 12,
    textAlign: 'center',
  },
});
