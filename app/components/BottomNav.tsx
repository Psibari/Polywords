import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '../constants/fonts';
import { useGameStore } from '../store/useGameStore';

export type BottomNavRoute = 'Home' | 'Vault' | 'Settings';

export const bottomNavContentPadding = 118;

type BottomNavProps = {
  active: BottomNavRoute;
  navigation: any;
};

const tabs: Array<{ key: BottomNavRoute | 'Play'; label: string }> = [
  { key: 'Home', label: 'Home' },
  { key: 'Play', label: 'Play' },
  { key: 'Vault', label: 'Vault' },
  { key: 'Settings', label: 'Settings' },
];

export default function BottomNav({ active, navigation }: BottomNavProps) {
  const startGame = useGameStore(s => s.startGame);

  function handlePress(route: BottomNavRoute | 'Play') {
    if (route === 'Play') {
      startGame();
      navigation.navigate('Game');
      return;
    }

    if (route !== active) {
      navigation.navigate(route);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dock}>
        {tabs.map(tab => {
          const isActive = tab.key === active;
          const isPlay = tab.key === 'Play';
          return (
            <Pressable
              key={tab.key}
              onPress={() => handlePress(tab.key)}
              style={({ pressed }) => [
                styles.tab,
                isPlay && styles.playTab,
                isActive && styles.activeTab,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.tabMark, isActive && styles.activeMark, isPlay && styles.playMark]} />
              <Text style={[styles.tabLabel, isActive && styles.activeLabel, isPlay && styles.playLabel]}>
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
    backgroundColor: '#1A1830',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  dock: {
    minHeight: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(15,13,42,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.50)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(245,200,66,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.24)',
  },
  playTab: {
    flex: 1.08,
    backgroundColor: 'rgba(123,45,139,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.52)',
  },
  pressed: {
    opacity: 0.82,
  },
  tabMark: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  activeMark: {
    backgroundColor: '#F5C842',
  },
  playMark: {
    backgroundColor: 'rgba(245,200,66,0.62)',
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
  },
  activeLabel: {
    color: '#F5C842',
  },
  playLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: FONTS.hud,
    fontSize: 12,
    letterSpacing: 1,
  },
});
