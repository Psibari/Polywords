import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGameStore } from "../store/useGameStore";

function Lives({ lives }: { lives: number }) {
  return (
    <Text style={styles.livesText}>
      {"❤️".repeat(lives)}
      {"🖤".repeat(Math.max(0, 3 - lives))}
    </Text>
  );
}

export default function GameScreen() {
  const { game, submitMeaningChoice, tick, startGame, pickUpgrade } =
    useGameStore();

  const pulse = useRef(new Animated.Value(1)).current;

  // ⏳ Timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 Prompt pulse animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.05,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [game.currentPrompt.id]);

  // 💀 GAME OVER
  if (game.status === "gameOver") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Run Over</Text>
          <Text style={styles.stat}>Score: {game.score}</Text>
          <Text style={styles.stat}>Correct: {game.correctMoves}</Text>

          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Run It Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 🎴 UPGRADE
  if (game.status === "upgrade") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Upgrade</Text>

          <Pressable
            style={styles.card}
            onPress={() => pickUpgrade("timeBuffer")}
          >
            <Text style={styles.cardTitle}>+ Time</Text>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => pickUpgrade("comboJuice")}
          >
            <Text style={styles.cardTitle}>Combo Boost</Text>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => pickUpgrade("panicShield")}
          >
            <Text style={styles.cardTitle}>Shield</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 🎮 GAMEPLAY
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.top}>
        <Lives lives={game.lives} />
        <Text style={styles.topText}>⏳ {game.timeLeft}</Text>
        <Text style={styles.topText}>🔥 {game.combo}</Text>
        <Text style={styles.topText}>⭐ {game.score}</Text>
      </View>

      {/* Word */}
      <Text style={styles.word}>{game.currentWord.word}</Text>

      {/* Prompt */}
      <Animated.View style={[styles.prompt, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.promptText}>{game.currentPrompt.text}</Text>
      </Animated.View>

      {/* Meaning Orbs */}
      <View style={styles.orbs}>
        {game.currentWord.meanings.map((m) => (
          <Pressable
            key={m.id}
            style={styles.orb}
            onPress={() => submitMeaningChoice(m.id)}
          >
            <Text style={styles.icon}>{m.icon}</Text>
            <Text style={styles.label}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1220",
    padding: 20,
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  topText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  livesText: {
    fontSize: 20,
  },

  word: {
    textAlign: "center",
    fontSize: 42,
    color: "white",
    marginTop: 40,
    fontWeight: "900",
  },

  prompt: {
    marginTop: 30,
    backgroundColor: "#1c2230",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  promptText: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },

  orbs: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  orb: {
    alignItems: "center",
    backgroundColor: "#20293a",
    padding: 20,
    borderRadius: 20,
  },

  icon: {
    fontSize: 28,
  },

  label: {
    color: "white",
    marginTop: 6,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "white",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 20,
  },

  stat: {
    color: "#ccc",
    fontSize: 18,
  },

  button: {
    marginTop: 20,
    backgroundColor: "#7c5cff",
    padding: 16,
    borderRadius: 12,
  },

  buttonText: {
    color: "white",
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#1c2230",
    padding: 20,
    marginTop: 10,
    borderRadius: 12,
    width: 200,
    alignItems: "center",
  },

  cardTitle: {
    color: "white",
    fontWeight: "800",
  },
});