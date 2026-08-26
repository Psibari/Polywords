import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './app/screens/HomeScreen';
import GameScreen from './app/screens/GameScreen';
import VaultScreen from './app/screens/VaultScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import DailyChallengeScreen from './app/screens/DailyChallengeScreen';
import { flushActiveGamePersistence, useGameStore } from './app/store/useGameStore';
import { preloadHuntTrack, setMusicAppActive } from './app/audio/MusicEngine';
import { preloadSfx } from './app/audio/sfx';
import { loadPlaytestEvents } from './app/game/playtestTelemetry';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'BebasNeue-Regular':    require('./assets/fonts/BebasNeue-Regular.ttf'),
    'BarlowCondensed-Bold': require('./assets/fonts/BarlowCondensed-Bold.ttf'),
  });

  // Home is always the landing screen — this only gates the first paint so
  // hasResumableGame is known before Home renders its button (otherwise
  // it'd flash ENTER THE HUNT then flip to RESUME HUNT a beat later).
  const [bootChecksDone, setBootChecksDone] = useState(false);

  useEffect(() => {
    if (!fontsLoaded) return;

    const { loadGame, loadGhosts, loadProgress, loadSettings, loadPollyMemory } = useGameStore.getState();

    // All five must finish before anything renders — a screen that mounts
    // against partially-loaded state (e.g. a Hunt generated before ghosts or
    // progress load) is the same class of bug as the audio engines racing
    // their own readiness independently.
    Promise.all([
      loadGhosts(),
      loadProgress(),
      loadSettings(),
      loadPollyMemory(),
      loadGame(),
      loadPlaytestEvents(),
    ]).finally(() => setBootChecksDone(true));
  }, [fontsLoaded]);

  // Warms the hunt music track and every SFX pool in the background as soon
  // as Home is about to render, so the first real Hunt/Daily entry doesn't
  // pay the full load cost that startMusic('hunt')/preloadSfx() would
  // otherwise hit cold — same fix as the music preload, same root cause.
  // Audio is app-owned: screens request readiness and music ownership but do
  // not preload or destroy the shared SFX pools while navigation transitions.
  useEffect(() => {
    if (bootChecksDone) {
      preloadHuntTrack();
      preloadSfx();
    }
  }, [bootChecksDone]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      setMusicAppActive(nextState === 'active');
      if (nextState !== 'active') {
        void flushActiveGamePersistence().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || !bootChecksDone) {
    return <View style={{ flex: 1, backgroundColor: '#1A1830' }} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* Interactive swipe-back disabled: it's a native-driven gesture that
              can complete before the beforeRemove exit-guard in GameScreen gets
              a chance to intervene, desyncing JS from the native screen stack
              (react-native-screens' "removed natively but didn't get removed
              from JS side" error). Leaving now only happens through the pause
              button (a JS-dispatched navigation.goBack()), which the guard
              catches reliably every time. */}
          <Stack.Screen name="Game" component={GameScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Vault" component={VaultScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Daily" component={DailyChallengeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
