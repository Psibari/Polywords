import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { GameEngine } from '../logic/GameController';

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
  
  // State to handle the background "Flash" feedback
  const [bgColor, setBgColor] = useState('#0F1220');

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
    setBgColor('#0F1220'); // Reset to deep indigo
  };

  const handleChoice = (selected: WordVariant) => {
    if (selected.meaning === targetVariant?.meaning) {
      // CORRECT
      setScore(prev => prev + 10);
      setPollyStatus('happy');
      setBgColor('#11291D'); // Flash Correct Green Background

      setTimeout(() => {
        if (currentIdx < levelWords.length - 1) {
          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx);
          pickNextRound(nextIdx);
        } else {
          Alert.alert("LEVEL COMPLETE!", `Score: ${score + 10}`, [{ text: "Done", onPress: () => navigation.goBack() }]);
        }
      }, 800);
    } else {
      // WRONG
      setPollyStatus('sassy');
      setBgColor('#341316'); // Flash Wrong Red Background
      setTimeout(() => { 
        setBgColor('#0F1220'); 
        setPollyStatus('thinking'); 
      }, 1000);
    }
  };

  if (!levelWords[currentIdx] || !targetVariant) return null;
  const currentWord = levelWords[currentIdx];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={styles.topMeta}>SCORE: {score}</Text>
        <Text style={[styles.topMeta, { color: '#FACC15' }]}>LEVEL 1</Text>
      </View>

      <View style={styles.gameArea}>
        <Text style={styles.mainWord}>{currentWord.word}</Text>
        
        {/* Main Clue Card */}
        <View style={styles.clueCard}>
          <Text style={styles.clueText}>"{targetVariant.clue}"</Text>
        </View>

        {/* Polly placeholder - will be replaced by your PNGs */}
        <View style={[styles.pollyCircle, 
          pollyStatus === 'happy' ? {borderColor: '#4ADE80'} : 
          pollyStatus === 'sassy' ? {borderColor: '#F87171'} : 
          {borderColor: '#A5B4FC'}
        ]}>
           <Text style={styles.pollyStatusText}>{pollyStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.buttonArea}>
        {currentWord.variants.map((v, i) => (
          <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleChoice(v)}>
            <Text style={styles.optionText}>{v.meaning}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  topMeta: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC' },
  gameArea: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  mainWord: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4, marginBottom: 20 },
  
  // Clue Card Styling
  clueCard: { 
    backgroundColor: '#2A2147', 
    padding: 25, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#433572', 
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  clueText: { textAlign: 'center', fontSize: 18, color: '#E5E7EB', fontStyle: 'italic', lineHeight: 24 },
  
  pollyCircle: { 
    width: 80, height: 80, borderRadius: 40, marginTop: 25, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 3 
  },
  pollyStatusText: { color: '#E5E7EB', fontSize: 10, fontWeight: 'bold' },

  buttonArea: { marginBottom: 30 },
  
  // Option Button Styling
  optionBtn: { 
    backgroundColor: '#231B3C', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#3D2F63' 
  },
  optionText: { color: '#FFFFFF', textAlign: 'center', fontSize: 17, fontWeight: '600' }
});