import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { FONTS } from "../constants/fonts";
import { PW } from "../ui/pwTheme";

type HomeButtonProps = {
  navigation: any;
};

/**
 * The way back to Home from Polybook and Settings, which no longer have a bottom nav (Pete, 2026-10-23).
 * Home is already underneath in the stack. React Navigation 7 pushes a second Home on a plain navigate,
 * which left the Polybook (opened transparent from Home) showing through its top, so going Home goes
 * back to the Home that is already there (the same call the old nav made).
 */
export default function HomeButton({ navigation }: HomeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go home"
      onPress={() => navigation.navigate("Home", undefined, { pop: true })}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>HOME</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: 34,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,13,42,0.72)",
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 2,
  },
});
