import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../constants/fonts";
import { PW } from "../ui/pwTheme";
import { useGameStore } from "../store/useGameStore";

export type BottomNavRoute = "Home" | "Vault" | "Settings";

export const bottomNavContentPadding = 118;

type BottomNavProps = {
  active: BottomNavRoute;
  navigation: any;
};

const tabs: Array<{ key: BottomNavRoute | "Play"; label: string }> = [
  { key: "Home", label: "Home" },
  { key: "Play", label: "Play" },
  { key: "Vault", label: "Polybook" },
  { key: "Settings", label: "Settings" },
];

export default function BottomNav({ active, navigation }: BottomNavProps) {
  const startGame = useGameStore((s) => s.startGame);
  const hasResumableGame = useGameStore((s) => s.hasResumableGame);

  function handlePress(route: BottomNavRoute | "Play") {
    if (route === "Play") {
      // Same rule as Home's hunt button: never overwrite a resumable run.
      if (!hasResumableGame) startGame();
      navigation.navigate("Game");
      return;
    }

    if (route !== active) {
      navigation.navigate(route);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dock}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.10)",
            "rgba(123,45,139,0.16)",
            "rgba(15,13,42,0.98)",
          ]}
          locations={[0, 0.38, 1]}
          style={styles.dockSheen}
        />
        <View pointerEvents="none" style={styles.dockLowerShade} />
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const isPlay = tab.key === "Play";
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              onPress={() => handlePress(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                isPlay && styles.playTab,
                isActive && styles.activeTab,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.tabMark,
                  isActive && styles.activeMark,
                  isPlay && styles.playMark,
                ]}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.activeLabel,
                  isPlay && styles.playLabel,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PW.color.bgDeep,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dock: {
    minHeight: 66,
    borderRadius: 24,
    backgroundColor: PW.color.surfaceDeep,
    borderWidth: 1,
    borderColor: PW.color.purpleSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
    shadowColor: PW.color.purple,
    shadowOpacity: 0.36,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  dockSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  dockLowerShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  tab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  activeTab: {
    backgroundColor: "rgba(245,200,66,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.46)",
    shadowColor: "#F5C842",
    shadowOpacity: 0.42,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 0 },
  },
  playTab: {
    flex: 1.08,
    backgroundColor: "rgba(123,45,139,0.16)",
    borderWidth: 1,
    borderColor: "rgba(123,45,139,0.46)",
  },
  pressed: {
    opacity: 0.82,
  },
  tabMark: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(185,138,222,0.44)",
  },
  activeMark: {
    backgroundColor: PW.color.gold,
    shadowColor: PW.color.gold,
    shadowOpacity: 0.9,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  playMark: {
    backgroundColor: PW.color.goldSoft,
  },
  tabLabel: {
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 11,
  },
  activeLabel: {
    color: PW.color.gold,
  },
  playLabel: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1,
  },
});
