import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import SettingsScreen from './SettingsScreen';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';

type Props = {
  navigation: any;
  route: any;
};

export default function DevSettingsScreen(props: Props) {
  if (!__DEV__) return <SettingsScreen {...props} />;

  return (
    <View style={styles.root}>
      <SettingsScreen {...props} />
      <View pointerEvents="box-none" style={styles.previewDock}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview KING in-game outcome"
          onPress={() => props.navigation.navigate('DevRematchOutcomePreview', { outcome: 'king' })}
          style={({ pressed }) => [styles.previewButton, styles.liveButton, pressed && styles.pressed]}
        >
          <Text style={styles.previewText}>KING LIVE</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview BUSTER in-game outcome"
          onPress={() => props.navigation.navigate('DevRematchOutcomePreview', { outcome: 'buster' })}
          style={({ pressed }) => [styles.previewButton, styles.liveButton, pressed && styles.pressed]}
        >
          <Text style={styles.previewText}>BUSTER LIVE</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview KING Results"
          onPress={() => props.navigation.navigate('DevResultsPreview', { outcome: 'king' })}
          style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
        >
          <Text style={styles.previewText}>KING RESULT</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview BUSTER Results"
          onPress={() => props.navigation.navigate('DevResultsPreview', { outcome: 'buster' })}
          style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
        >
          <Text style={styles.previewText}>BUSTER RESULT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  previewDock: {
    position: 'absolute',
    right: 14,
    bottom: 92,
    gap: 7,
    zIndex: 200,
  },
  previewButton: {
    minWidth: 116,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: PW.color.overlayHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    ...PW.shadow.glowGold,
  },
  liveButton: {
    borderColor: PW.color.white,
  },
  previewText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
