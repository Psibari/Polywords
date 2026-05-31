import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const startGame = useGameStore(s => s.startGame);
  const bobY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, { toValue: -12, duration: 700, useNativeDriver: true }),
        Animated.timing(bobY, { toValue: 0,   duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [bobY]);

  function handlePlay() {
    startGame();
    navigation.navigate('Game');
  }

  return (
    <View style={s.container}>
      <Animated.Text style={[s.parrot, { transform: [{ translateY: bobY }] }]}>
        🦜
      </Animated.Text>
      <Text style={s.title}>POLY WORDS</Text>
      <Pressable onPress={handlePlay} style={s.playBtn}>
        <Text style={s.playLabel}>PLAY</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1040',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  parrot: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.brandTitle,
    fontFamily: FONTS.brand,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 48,
  },
  playBtn: {
    width: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  playLabel: {
    color: '#1A1040',
    fontSize: FONT_SIZES.hudScore,
    fontFamily: FONTS.hud,
    letterSpacing: 3,
  },
});
