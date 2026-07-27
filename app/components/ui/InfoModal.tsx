import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../../constants/fonts';
import { PW } from '../../ui/pwTheme';

// Plain informational overlay (Credits, Privacy) — no Polly voice, no game
// stakes, just something to read and dismiss. Shares the dark-scrim-and-
// card language every other overlay in the app uses.

type Props = {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
};

export function InfoModal({ visible, title, body, onClose }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[im.root, { opacity }]} pointerEvents={visible ? 'auto' : 'none'}>
      <View style={im.card}>
        <Text style={im.title}>{title}</Text>
        <ScrollView style={im.scroll} showsVerticalScrollIndicator={false}>
          <Text style={im.body}>{body}</Text>
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
          onPress={onClose}
          style={({ pressed }) => [im.closeBtn, pressed && im.closePressed]}
        >
          <Text style={im.closeLabel}>CLOSE</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const im = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 400,
    backgroundColor: 'rgba(9,7,26,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '78%',
    borderRadius: PW.radius.lg,
    borderWidth: 1.5,
    borderColor: PW.color.purpleSoft,
    backgroundColor: 'rgba(15,13,42,0.96)',
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.wordDisplay,
    fontSize: 26,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  scroll: {
    marginBottom: 16,
  },
  body: {
    color: PW.color.softWhite,
    fontFamily: FONTS.tileCopy,
    fontSize: 15,
    lineHeight: 22,
  },
  closeBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: 'rgba(245,200,66,0.10)',
  },
  closePressed: {
    opacity: 0.84,
  },
  closeLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 15,
    letterSpacing: 3,
  },
});
