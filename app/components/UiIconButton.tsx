import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { UI_ICON_BUTTON_SIZE, type UiIconKind } from '../ui/uiIconButton';

const ART: Record<UiIconKind, number> = {
  home: require('../../assets/images/ui/icon_home.webp'),
  pause: require('../../assets/images/ui/icon_pause.webp'),
  settings: require('../../assets/images/ui/icon_settings.webp'),
};

type UiIconButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  kind: UiIconKind;
  /** Where it sits (position, margins). Its size is fixed. */
  style?: StyleProp<ViewStyle>;
};

/** A round gold icon button; all of them are the same size (`UI_ICON_BUTTON_SIZE`). */
export default function UiIconButton({ kind, style, ...rest }: UiIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      {...rest}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
    >
      <Image source={ART[kind]} style={styles.art} resizeMode="contain" />
    </Pressable>
  );
}

// An explicit size on the picture: with only absoluteFill an iOS Image draws at its own pixel size.
const styles = StyleSheet.create({
  button: { width: UI_ICON_BUTTON_SIZE, height: UI_ICON_BUTTON_SIZE },
  art: { width: '100%', height: '100%' },
  pressed: { opacity: 0.8 },
});
