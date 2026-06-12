import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { BagelFatOne_400Regular } from '@expo-google-fonts/bagel-fat-one';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import HomeScreen from './app/screens/HomeScreen';
import GameScreen from './app/screens/GameScreen';
import VaultScreen from './app/screens/VaultScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import DailyChallengeScreen from './app/screens/DailyChallengeScreen';
import { useGameStore } from './app/store/useGameStore';

LogBox.ignoreAllLogs();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    BagelFatOne_400Regular,
    PlusJakartaSans_800ExtraBold,
    'SuperCartoon-6R791':    require('./assets/fonts/SuperCartoon-6R791.ttf'),
    'SuperCarnival-j9Wq0':  require('./assets/fonts/SuperCarnival-j9Wq0.ttf'),
    'SuperFrosting-R9z4o':  require('./assets/fonts/SuperFrosting-R9z4o.ttf'),
    'gomarice_okuba_cloud': require('./assets/fonts/gomarice_okuba_cloud.ttf'),
    'InterVariable':        require('./assets/fonts/InterVariable.ttf'),
    'Poppins-Bold':         require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold':     require('./assets/fonts/Poppins-SemiBold.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const { loadGhosts, loadProgress, loadDailyResult } = useGameStore.getState();

    loadGhosts();
    loadProgress();
    loadDailyResult();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Vault" component={VaultScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="Daily"
          component={DailyChallengeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
