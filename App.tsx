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

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={resumedGame ? 'Game' : 'Home'}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Vault" component={VaultScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Daily" component={DailyChallengeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
