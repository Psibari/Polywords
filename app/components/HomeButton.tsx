import React from "react";
import UiIconButton from "./UiIconButton";

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
    <UiIconButton
      kind="home"
      accessibilityLabel="Go home"
      onPress={() => navigation.navigate("Home", undefined, { pop: true })}
    />
  );
}
