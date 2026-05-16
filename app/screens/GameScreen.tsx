import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { GameEngine } from '../logic/GameController';

// --- TYPES ---
interface WordVariant { meaning: string; clue: string; }
interface WordData { 
    word: string; theme: string; variants: WordVariant[]; 
    difficulty: string; isBoss: boolean;
}

export default function GameScreen({ navigation }: any) {
  const [levelWords, setLevelWords] = useState<WordData[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [targetVariant, setTargetVariant] = useState<WordVariant | null>(null);
  const [score, setScore] = useState(0);
  const [pollyStatus, setPollyStatus] = useState<'thinking' | 'happy' | 'sassy'>('thinking');

  useEffect(() => {
    const freshWords = GameEngine.generateLevel(1) as WordData[];
    setLevelWords(freshWords);
    if (freshWords.length > 0) {
      setTargetVariant(freshWords[0].variants[Math.floor(Math.random() * freshWords[0].variants.length)]);
    }
  }, []);

  const pickNextRound = (nextIndex: number) => {
    const nextWord = levelWords[nextIndex];
    const randomVariant = nextWord.variants[Math.floor(Math.random() * nextWord.variants.length)];
    setTargetVariant(randomVariant);
    setPollyStatus('thinking');
  };

  const handleChoice = (selected: WordVariant) => {
    if (selected.meaning === targetVariant?.meaning) {
      setScore(prev => prev + 10);
      setPollyStatus('happy');
      setTimeout(() => {
        if (currentIdx < levelWords.length - 1) {
          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx);
          pickNextRound(nextIdx);
        } else {
          Alert.alert("LEVEL COMPLETE!", `Final Score: ${score + 10}`, [{ text: "Done", onPress: () => navigation.goBack() }]);
        }
      }, 1000);
    } else {
      setPollyStatus('sassy');
      setTimeout(() => { if (pollyStatus !== 'happy') setPollyStatus('thinking'); }, 1500);
    }
  };

  if (!levelWords[currentIdx] || !targetVariant) return null;

  const currentWord = levelWords[currentIdx];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Score: {score}</Text>
        <Text style={styles.headerText}>Level 1</Text>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.wordTitle}>{currentWord.word}</Text>
        
        <View style={styles.clueBox}>
          <Text style={styles.clueText}>"{targetVariant.clue}"</Text>
        </View>

        {/* ONLY Polly changes color now */}
        <View style={[styles.pollyCircle, 
          pollyStatus === 'happy' ? {backgroundColor: '#4CAF50'} : 
          pollyStatus === 'sassy' ? {backgroundColor: '#F44336'} : 
          {backgroundColor: '#FFD700'}
        ]}>
          <Text style={styles.pollyText}>Polly is {pollyStatus}</Text>
        </View>
      </View>

      <View style={styles.buttonList}>
        {currentWord.variants.map((v, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleChoice(v)}>
            <Text style={styles.btnText}>{v.meaning}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  headerText: { fontSize: 18, fontWeight: '600' },
  gameArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  wordTitle: { fontSize: 48, fontWeight: '900', marginBottom: 10 },
  clueBox: { padding: 20, marginHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  clueText: { fontSize: 20, textAlign: 'center', fontStyle: 'italic' },
  pollyCircle: { width: 100, height: 100, borderRadius: 50, marginTop: 30, justifyContent: 'center', alignItems: 'center' },
  pollyText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  buttonList: { padding: 20 },
  btn: { 
    padding: 15, 
    borderWidth: 1, // <--- FIXED: changed from borderWeight
    borderColor: '#ccc', 
    borderRadius: 10, 
    marginBottom: 10 
  },
  btnText: { textAlign: 'center', fontSize: 18 }
});