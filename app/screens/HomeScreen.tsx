import React, { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import PollyHomePerch from '../components/PollyHomePerch';
import { FoilWord } from '../components/ui/FoilWord';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';
import { cardMaterial, stageMaterial } from '../ui/pwMaterials';
import { DAILY_PROMISE, DAILY_TITLE } from '../ui/pwDailyMaterials';
import {
  HOME_TAGLINE,
  homeDare,
  homeDoor,
  homeType,
} from '../ui/pwHomeMaterials';
import { PW } from '../ui/pwTheme';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const darePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(darePulse, { toValue: 1, duration: 950, useNativeDriver: true }),
        Animated.timing(darePulse, { toValue: 0, duration: 950, useNativeDriver: true }),
      ]),
    ).start();
  }, [darePulse]);

  const dareScale = darePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] });

  function handleHunt() {
    startGame();
    navigation.navigate('Game');
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('../../assets/home/home-hero-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          pointerEvents="none"
          colors={[...stageMaterial.vignette]}
          locations={[...stageMaterial.vignetteLocations]}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Title block — baseline foil wordmark (bespoke logotype: own session) */}
            <View style={styles.titleBlock}>
              <View style={styles.wordmarkBox}>
                <FoilWord
                  word="POLYWORDS"
                  fontSize={homeType.wordmark}
                  baseStyle={styles.wordmark}
                />
              </View>
              <Text style={styles.tagline}>{HOME_TAGLINE}</Text>
            </View>

            {/* Open plaza — Polly's room to breathe */}
            <View style={styles.plaza} />

            {/* The dare */}
            <Animated.View style={[styles.dareWrap, { transform: [{ scale: dareScale }] }]}>
              <Pressable
                onPress={handleHunt}
                style={({ pressed }) => [styles.dareShell, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={[...homeDare.faceGradient]}
                  locations={[...homeDare.faceLocations]}
                  style={styles.dareFace}
                >
                  <View style={styles.dareBottomEdge} />
                  <Text style={styles.dareLabel}>ENTER THE HUNT</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* The doors */}
            <View style={styles.doorRow}>
              <Pressable
                onPress={() => navigation.navigate('Daily')}
                style={({ pressed }) => [
                  cardMaterial.base,
                  styles.door,
                  styles.dailyDoor,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doorEyebrow}>DAILY CHALLENGE</Text>
                <Text style={styles.doorTitle}>{DAILY_TITLE}</Text>
                <Text style={styles.doorCopy}>{DAILY_PROMISE}</Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Vault')}
                style={({ pressed }) => [
                  cardMaterial.base,
                  styles.door,
                  styles.vaultDoor,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.doorEyebrow}>PLAYER ARCHIVE</Text>
                <Text style={styles.doorTitle}>WORD VAULT</Text>
                <Text style={styles.doorCopy}>Reclaimed meanings.</Text>
              </Pressable>
            </View>

            {/* Quiet settings — low opacity, never tiny */}
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              style={({ pressed }) => [styles.settingsLinkWrap, pressed && styles.pressed]}
            >
              <Text style={styles.settingsLink}>SETTINGS</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        <PollyHomePerch />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PW.color.bg,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  titleBlock: {
    alignItems: 'center',
  },
  wordmarkBox: {
    width: '100%',
    height: homeType.wordmark + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: FONTS.wordDisplay,
    fontSize: homeType.wordmark,
    letterSpacing: homeType.wordmarkTracking,
    textAlign: 'center',
    width: '100%',
  },
  tagline: {
    marginTop: 6,
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: homeType.tagline,
    lineHeight: homeType.tagline + 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  plaza: {
    flex: 1,
  },
  dareWrap: {
    marginHorizontal: 8,
    ...PW.shadow.glowGold,
  },
  dareShell: {
    borderRadius: PW.radius.card,
    borderWidth: 2,
    borderColor: homeDare.rim,
    overflow: 'hidden',
  },
  dareFace: {
    minHeight: homeDare.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dareBottomEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: homeDare.bottomEdge,
  },
  dareLabel: {
    color: homeDare.label,
    fontFamily: FONTS.hud,
    fontSize: homeType.dareLabel,
    letterSpacing: 3,
    textShadowColor: homeDare.labelHighlight,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  doorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  door: {
    flex: 1,
    minHeight: homeDoor.minHeight,
    justifyContent: 'space-between',
  },
  dailyDoor: {
    borderColor: homeDoor.dailyTrim,
  },
  vaultDoor: {
    borderColor: homeDoor.vaultTrim,
  },
  doorEyebrow: {
    color: homeDoor.eyebrow,
    fontFamily: FONTS.label,
    fontSize: homeType.doorEyebrow,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  doorTitle: {
    color: homeDoor.title,
    fontFamily: FONTS.hud,
    fontSize: homeType.doorTitle,
    letterSpacing: 1,
    marginTop: 12,
  },
  doorCopy: {
    color: homeDoor.copy,
    fontFamily: FONTS.tileCopy,
    fontSize: homeType.doorCopy,
    lineHeight: homeType.doorCopy + 5,
    marginTop: 8,
  },
  settingsLinkWrap: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingsLink: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.label,
    fontSize: homeType.settingsLink,
    letterSpacing: 1.6,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
