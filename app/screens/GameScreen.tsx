import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { GameEngine } from '../logic/GameController';

// 1. ADD THIS TYPE DEFINITION TO STOP THE ERRORS
interface WordVariant {
  meaning: string;
  clue: string;
}

interface WordData {
  word: string;
  theme: string;
  difficulty: string;
  isBoss: boolean;
  variants: WordVariant[];
}

export default function GameScreen({ navigation }: any) {
  // 2. TELL STATE TO EXPECT AN ARRAY OF WORDDATA
  const [levelWords, setLevelWords] = useState<WordData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [pollyStatus, setPollyStatus] = useState('thinking');

  useEffect(() => {
    // Generate Level 1 words
    const freshWords = GameEngine.generateLevel(1) as WordData[];
    setLevelWords(freshWords);
  }, []);

  if (levelWords.length === 0) {
    return (
      <View style={styles.loading}>
        <Text>Loading 739 Words...</Text>
      </View>
    );
  }

  const currentWord = levelWords[currentIdx];

  const handleChoice = (variant: WordVariant) => {
    setScore(prev => prev + 10);
    setPollyStatus('happy');

    setTimeout(() => {
      if (currentIdx < levelWords.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setPollyStatus('thinking');
      } else {
        Alert.alert("LEVEL CLEAR!", `You scored ${score + 10} points!`, [
          { text: "Awesome", onPress: () => navigation.goBack() }
        ]);
      }
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>SCORE: {score}</Text>
        <Text style={styles.levelText}>LEVEL 1</Text>
      </View>

      <View style={styles.wordContainer}>
        <Text style={styles.mainWord}>{currentWord.word}</Text>
        <Text style={styles.themeTag}>{currentWord.theme}</Text>
      </View>

      <View style={styles.pollyContainer}>
        <View style={styles.bubble}>
          {/* We show the clue for the FIRST meaning in the list */}
          <Text style={styles.bubbleText}>"{currentWord.variants[0].clue}"</Text>
        </View>
        <View style={styles.pollyPlaceholder}>
          <Text>Polly: {pollyStatus}</Text>
        </View>
      </View>

      <View style={styles.buttonArea}>
        {currentWord.variants.map((v, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.choiceBtn} 
            onPress={() => handleChoice(v)}
          >
            <Text style={styles.choiceText}>{v.meaning}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEEA', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 10 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#444' },
  levelText: { fontSize: 18, fontWeight: 'bold', color: '#FF8C00' },
  wordContainer: { alignItems: 'center', marginTop: 40 },
  mainWord: { fontSize: 54, fontWeight: '900', color: '#111', letterSpacing: 2 },
  themeTag: { fontSize: 14, color: '#888', textTransform: 'uppercase', marginTop: 5 },
  pollyContainer: { alignItems: 'center', marginVertical: 40 },
  bubble: { backgroundColor: 'white', padding: 20, borderRadius: 25, borderBottomRightRadius: 2, borderWidth: 2, borderColor: '#000', maxWidth: '85%' },
  bubbleText: { fontSize: 18, textAlign: 'center', fontWeight: '500', fontStyle: 'italic' },
  pollyPlaceholder: { width: 120, height: 120, backgroundColor: '#FFD700', borderRadius: 60, marginTop: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  buttonArea: { marginTop: 'auto', marginBottom: 30 },
  choiceBtn: { backgroundColor: '#000', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 5 },
  choiceText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});