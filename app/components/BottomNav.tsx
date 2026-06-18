import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.10)', 'rgba(123,45,139,0.16)', 'rgba(5,4,18,0.98)']}
          locations={[0, 0.38, 1]}
          style={styles.dockSheen}
        />
        <View pointerEvents="none" style={styles.dockLowerShade} />
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
    backgroundColor: '#09071E',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dock: {
    minHeight: 66,
    borderRadius: 24,
    backgroundColor: 'rgba(15,13,42,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(193,136,255,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: 'hidden',
    shadowColor: '#7B2D8B',
    shadowOpacity: 0.36,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  dockSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  dockLowerShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.18)',
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
    backgroundColor: 'rgba(245,200,66,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.46)',
    shadowColor: '#F5C842',
    shadowOpacity: 0.42,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 0 },
  },
  playTab: {
    flex: 1.08,
    backgroundColor: 'rgba(123,45,139,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.46)',
  },
  pressed: {
    opacity: 0.82,
  },
  tabMark: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(169,154,196,0.44)',
  },
  activeMark: {
    backgroundColor: '#F5C842',
    shadowColor: '#F5C842',
    shadowOpacity: 0.90,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  playMark: {
    backgroundColor: 'rgba(245,200,66,0.62)',
  },
  tabLabel: {
    color: 'rgba(196,185,218,0.60)',
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
