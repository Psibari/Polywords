import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/useGameStore';

export default function GameScreen() {
  const { game, answer, tick } = useGameStore();
useEffect(() => {
  const interval = setInterval(() => {
    tick();
  }, 1000);

  return () => clearInterval(interval);
}, [])
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 32 }}>{game.word}</Text>
      <Text>Score: {game.score} | Combo: {game.combo}</Text>
      <Text>Time: {game.timeLeft}</Text>
      {game.queue.map((p) => (
        <View key={p.id} style={{ marginVertical: 10 }}>
          <Text>{p.text}</Text>

          <View style={{ flexDirection: 'row' }}>
            {game.meanings.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => answer(p.id, m.id)}
                style={{ margin: 5, padding: 10, backgroundColor: 'gray' }}
              >
                <Text style={{ color: 'white' }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}