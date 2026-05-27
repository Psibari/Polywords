import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { BagelFatOne_400Regular } from '@expo-google-fonts/bagel-fat-one';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import HomeScreen from './app/screens/HomeScreen';
import GameScreen from './app/screens/GameScreen';

LogBox.ignoreAllLogs();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ BagelFatOne_400Regular, PlusJakartaSans_800ExtraBold });
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
