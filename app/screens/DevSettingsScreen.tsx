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
          accessibilityLabel="Preview KING Results"
          onPress={() => props.navigation.navigate('DevResultsPreview', { outcome: 'king' })}
          style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
        >
          <Text style={styles.previewText}>KING</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview BUSTER Results"
          onPress={() => props.navigation.navigate('DevResultsPreview', { outcome: 'buster' })}
          style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
        >
          <Text style={styles.previewText}>BUSTER</Text>
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
    gap: 8,
    zIndex: 200,
  },
  previewButton: {
    minWidth: 94,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PW.color.gold,
    backgroundColor: PW.color.overlayHeavy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...PW.shadow.glowGold,
  },
  previewText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1.2,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
});
