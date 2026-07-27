import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './app/screens/HomeScreen';
import GameScreen from './app/screens/GameScreen';
import VaultScreen from './app/screens/VaultScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import DailyChallengeScreen from './app/screens/DailyChallengeScreen';
import { useGameStore } from './app/store/useGameStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'BebasNeue-Regular':    require('./assets/fonts/BebasNeue-Regular.ttf'),
    'BarlowCondensed-Bold': require('./assets/fonts/BarlowCondensed-Bold.ttf'),
  });

  // null = still checking for a run interrupted by backgrounding/a kill;
  // resolves to whether one was actually resumed, which decides the
  // Navigator's initial route below.
  const [resumedGame, setResumedGame] = useState<boolean | null>(null);

  useEffect(() => {
    if (!fontsLoaded) return;

    const { loadGame, loadGhosts, loadProgress, loadSettings, loadPollyMemory } = useGameStore.getState();

    loadGhosts();
    loadProgress();
    loadSettings();
    loadPollyMemory();
    loadGame().then(setResumedGame);
  }, [fontsLoaded]);

  if (!fontsLoaded || resumedGame === null) return null;

  // Resuming lands on Game, but it must never be the stack's root screen —
  // a root screen has nowhere to go "back" to, so the edge-swipe-back
  // gesture simply doesn't exist there (and Android hardware back at the
  // root exits the app outright, bypassing the exit-confirm entirely).
  // Seeding Home underneath keeps a real previous screen in the stack so
  // the gesture — and PollyExitConfirm intercepting it — both still work.
  const initialState = resumedGame
    ? { index: 1, routes: [{ name: 'Home' }, { name: 'Game' }] }
    : undefined;

  return (
    <SafeAreaProvider>
      <NavigationContainer initialState={initialState}>
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
