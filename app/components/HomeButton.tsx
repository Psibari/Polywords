import React from "react";
import UiIconButton from "./UiIconButton";
import { withHuntExitGuardBypass } from "../game/huntPauseNavigation";

type HomeButtonProps = {
  navigation: any;
  preserveHunt?: boolean;
};

/**
 * The way back to Home from Polybook and Settings, which no longer have a bottom nav (Pete, 2026-10-23).
 * If Settings is sitting above a deliberately paused Hunt, Home removes that Hunt screen without
 * forfeiting it; the run is already persisted and Home will offer RESUME HUNT.
 */
export default function HomeButton({ navigation, preserveHunt = false }: HomeButtonProps) {
  const goHome = () => {
    const navigateHome = () => navigation.navigate("Home", undefined, { pop: true });

    if (preserveHunt) {
      withHuntExitGuardBypass(navigateHome);
      return;
    }

    navigateHome();
  };

  return (
    <UiIconButton
      kind="home"
      accessibilityLabel="Go home"
      onPress={goHome}
    />
  );
}
