import { useEffect } from "react";
import {
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
  const { game, chooseMeaning, submit, tick, startGame, continueUpgrade } =
    useGameStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [tick]);

  if (game.status === "gameOver") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBlock}>
          <Text style={styles.gameOverTitle}>Game Over</Text>
          <Text style={styles.statText}>Score: {game.score}</Text>
          <Text style={styles.statText}>Combo: {game.combo}</Text>
          <Text style={styles.statText}>Correct: {game.correctMoves}</Text>

          <Pressable style={styles.primaryButton} onPress={startGame}>
            <Text style={styles.primaryButtonText}>Run It Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (game.status === "upgrade") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBlock}>
          <Text style={styles.upgradeTitle}>Upgrade</Text>
          <Text style={styles.upgradeSubtitle}>Pick a boost for this run</Text>

          <View style={styles.cardList}>
            <Pressable style={styles.upgradeCard} onPress={continueUpgrade}>
              <Text style={styles.cardTitle}>Time Buffer</Text>
              <Text style={styles.cardBody}>More breathing room.</Text>
            </Pressable>

            <Pressable style={styles.upgradeCard} onPress={continueUpgrade}>
              <Text style={styles.cardTitle}>Combo Juice</Text>
              <Text style={styles.cardBody}>Keep streak energy high.</Text>
            </Pressable>

            <Pressable style={styles.upgradeCard} onPress={continueUpgrade}>
              <Text style={styles.cardTitle}>Panic Shield</Text>
              <Text style={styles.cardBody}>One mistake hurts less.</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const selectedMeaning = game.currentWord.meanings.find(
    (meaning) => meaning.id === game.selectedMeaningId
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Lives lives={game.lives} />
        <Text style={styles.topStat}>⏳ {game.timeLeft}</Text>
        <Text style={styles.topStat}>🔥 {game.combo}</Text>
        <Text style={styles.topStat}>⭐ {game.score}</Text>
      </View>

      <View style={styles.wordBlock}>
        <Text style={styles.wordText}>{game.currentWord.word}</Text>
        <Text style={styles.wordMeta}>
          {game.currentWord.type} · {game.currentWord.theme}
        </Text>
      </View>

      <View style={styles.orbRow}>
        {game.currentWord.meanings.map((meaning) => {
          const isSelected = meaning.id === game.selectedMeaningId;

          return (
            <Pressable
              key={meaning.id}
              onPress={() => chooseMeaning(meaning.id)}
              style={[styles.orb, isSelected && styles.orbSelected]}
            >
              <Text style={styles.orbIcon}>{meaning.icon}</Text>
              <Text style={styles.orbLabel}>{meaning.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedMeaningBlock}>
        <Text style={styles.selectedMeaningText}>
          Drift: {selectedMeaning?.icon} {selectedMeaning?.label}
        </Text>
      </View>

      <View style={styles.answerGrid}>
        {game.answers.map((answer) => (
          <Pressable
            key={answer}
            style={styles.answerButton}
            onPress={() => submit(answer)}
          >
            <Text style={styles.answerText}>{answer}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10131a",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topStat: {
    color: "#f5f7ff",
    fontSize: 18,
    fontWeight: "700",
  },
  livesText: {
    fontSize: 20,
  },
  wordBlock: {
    alignItems: "center",
    marginTop: 36,
    marginBottom: 24,
  },
  wordText: {
    color: "#f5f7ff",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 2,
  },
  wordMeta: {
    color: "#98a2b3",
    fontSize: 14,
    marginTop: 8,
  },
  orbRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  orb: {
    minWidth: 90,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "#1c2230",
    borderWidth: 2,
    borderColor: "#1c2230",
  },
  orbSelected: {
    borderColor: "#7c5cff",
    transform: [{ scale: 1.04 }],
  },
  orbIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  orbLabel: {
    color: "#f5f7ff",
    fontSize: 13,
    fontWeight: "700",
  },
  selectedMeaningBlock: {
    marginTop: 18,
    marginBottom: 22,
    alignItems: "center",
  },
  selectedMeaningText: {
    color: "#cbd5e1",
    fontSize: 16,
    fontWeight: "600",
  },
  answerGrid: {
    gap: 12,
  },
  answerButton: {
    backgroundColor: "#20293a",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  answerText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  centerBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverTitle: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 20,
  },
  statText: {
    color: "#cbd5e1",
    fontSize: 18,
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: "#7c5cff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  upgradeTitle: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 8,
  },
  upgradeSubtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    marginBottom: 24,
  },
  cardList: {
    width: "100%",
    gap: 12,
  },
  upgradeCard: {
    backgroundColor: "#1c2230",
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardBody: {
    color: "#cbd5e1",
    fontSize: 15,
  },
});