import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { GameEngine } from '../logic/GameController';

// --- TYPES ---
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
  const [levelWords, setLevelWords] = useState<WordData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [targetVariant, setTargetVariant] = useState<WordVariant | null>(null);
  const [score, setScore] = useState(0);
  const [pollyStatus, setPollyStatus] = useState<'thinking' | 'happy' | 'sassy'>('thinking');

  // 1. Initial Load
  useEffect(() => {
    const freshWords = GameEngine.generateLevel(1) as WordData[];
    setLevelWords(freshWords);
    if (freshWords.length > 0) {
      setTargetVariant(freshWords[0].variants[Math.floor(Math.random() * freshWords[0].variants.length)]);
    }
  }, []);

  // 2. Helper to pick the next "Switch Up" clue
  const pickNextRound = (nextIndex: number) => {
    const nextWord = levelWords[nextIndex];
    const randomVariant = nextWord.variants[Math.floor(Math.random() * nextWord.variants.length)];
    setTargetVariant(randomVariant);
    setPollyStatus('thinking');
  };

  const handleChoice = (selected: WordVariant) => {
    if (selected.meaning === targetVariant?.meaning) {
      // CORRECT
      setScore(prev => prev + 10);
      setPollyStatus('happy');

      setTimeout(() => {
        if (currentIdx < levelWords.length - 1) {
          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx);
          pickNextRound(nextIdx);
        } else {
          Alert.alert("LEVEL COMPLETE!", `Final Score: ${score + 10}`, [
            { text: "Continue", onPress: () => navigation.goBack() }
          ]);
        }
      }, 1000);
    } else {
      // WRONG
      setPollyStatus('sassy');
      // Briefly show sass then go back to thinking so they can try again
      setTimeout(() => {
        if (pollyStatus !== 'happy') setPollyStatus('thinking');
      }, 1500);
    }
  };

  if (!levelWords[currentIdx] || !targetVariant) {
    return <View style={styles.loading}><Text>Loading Polly's Brain...</Text></View>;
  }

  const currentWord = levelWords[currentIdx];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>SCORE: {score}</Text>
        <Text style={styles.levelText}>LEVEL 1</Text>
      </View>

      <View style={styles.wordArea}>
        <Text style={styles.mainWord}>{currentWord.word}</Text>
        <View style={styles.themeBadge}>
          <Text style={styles.themeText}>{currentWord.theme}</Text>
        </View>
      </View>

      <View style={styles.pollySection}>
        <View style={styles.speechBubble}>
          <Text style={styles.clueText}>"{targetVariant.clue}"</Text>
        </View>
        
        {/* Placeholder for Polly Asset */}
        <View style={[styles.pollyCircle, pollyStatus === 'happy' ? styles.bgHappy : pollyStatus === 'sassy' ? styles.bgSassy : styles.bgThink]}>
          <Text style={styles.pollyLabel}>POLLY IS:{"\n"}{pollyStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.optionsArea}>
        {currentWord.variants.map((variant, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.optionButton} 
            onPress={() => handleChoice(variant)}
          >
            <Text style={styles.optionText}>{variant.meaning}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEEA', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  scoreText: { fontSize: 20, fontWeight: 'bold', color: '#444' },
  levelText: { fontSize: 20, fontWeight: 'bold', color: '#E67E22' },
  wordArea: { alignItems: 'center', marginTop: 30 },
  mainWord: { fontSize: 50, fontWeight: '900', color: '#111', letterSpacing: 3 },
  themeBadge: { backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 5 },
  themeText: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  pollySection: { alignItems: 'center', marginVertical: 30 },
  speechBubble: { backgroundColor: 'white', padding: 20, borderRadius: 20, borderWidth: 3, borderColor: '#000', marginBottom: 20, width: '90%' },
  clueText: { fontSize: 18, textAlign: 'center', fontStyle: 'italic', fontWeight: '600' },
  pollyCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#000' },
  bgThink: { backgroundColor: '#FFD700' },
  bgHappy: { backgroundColor: '#4CAF50' },
  bgSassy: { backgroundColor: '#F44336' },
  pollyLabel: { textAlign: 'center', fontWeight: 'bold', fontSize: 14 },
  optionsArea: { marginTop: 'auto', marginBottom: 20 },
  optionButton: { backgroundColor: '#222', padding: 18, borderRadius: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  optionText: { color: 'white', textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});