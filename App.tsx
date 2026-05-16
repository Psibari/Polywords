import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 1. Logic Imports (Paths verified from your screenshot)
import { GameEngine } from './app/logic/GameController'; 
import { WORDBANK } from './app/logic/wordBank';

// 2. Screen Imports
import HomeScreen from './app/screens/HomeScreen';
import GameScreen from './app/screens/GameScreen';
import ProfileScreen from './app/screens/ProfileScreen';

// --- THE SANITY CHECK ---
console.log("---------------------------------");
console.log("🦁 POLYWORDS BRAIN CHECK:");
console.log("Total Words in Bank:", WORDBANK.length);

const testLevel = GameEngine.generateLevel(1);
if (testLevel && testLevel.length > 0) {
    console.log("✅ Level 1 Generated successfully!");
    console.log("First Word today is:", testLevel[0].word);
    console.log("It has", testLevel[0].variants.length, "meanings.");
}
console.log("---------------------------------");

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}