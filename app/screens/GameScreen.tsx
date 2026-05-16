import { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

import { useGameStore } from "../store/useGameStore";
import { SESSION } from "../game/session";

export default function GameScreen() {
  const { game, submitAnswer, submitPhraseAnswer, startGame } =
    useGameStore();

  const step = SESSION[game.currentStepIndex];

  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  // 🔊 sounds
  const correctSound = useRef<Audio.Sound | null>(null);
  const wrongSound = useRef<Audio.Sound | null>(null);

  // 🎧 load sounds once
  useEffect(() => {
    (async () => {
      const correct = new Audio.Sound();
      const wrong = new Audio.Sound();

      await correct.loadAsync(require("../../assets/correct.mp3"));
      await wrong.loadAsync(require("../../assets/wrong.mp3"));

      correctSound.current = correct;
      wrongSound.current = wrong;
    })();

    return () => {
      correctSound.current?.unloadAsync();
      wrongSound.current?.unloadAsync();
    };
  }, []);

  // ⚡ feedback system
  useEffect(() => {
    if (!game.feedback) return;

    const isWrong = game.feedback.toLowerCase().includes("mistake") || game.feedback.includes("💔");

    setFlash(isWrong ? "wrong" : "correct");

    // 📳 HAPTICS
    if (isWrong) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      wrongSound.current?.replayAsync();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      correctSound.current?.replayAsync();
    }

    const t = setTimeout(() => setFlash(null), 250);
    return () => clearTimeout(t);
  }, [game.feedback]);

  // 💀 GAME OVER
  if (game.status === "gameOver") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Run Failed</Text>
          <Text style={styles.stat}>Score: {game.score}</Text>

          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 🏁 COMPLETE
  if (game.status === "complete") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Run Complete</Text>
          <Text style={styles.stat}>Final Score: {game.score}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 📝 PHRASE BREAK SCREEN
  if (game.status === "phraseBreak" && step.kind === "phraseBreak") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.phraseCard}>
          <Text style={styles.badgeText}>🧠 COGNITIVE REWARD BREAK</Text>
          <Text style={styles.phraseTitle}>"{step.phrase.toUpperCase()}"</Text>
          <Text style={styles.phraseQuestion}>{step.question}</Text>

          <View style={styles.options}>
            {step.choices.map((choice) => (
              <Pressable
                key={choice}
                style={styles.phraseOption}
                onPress={() => submitPhraseAnswer(choice)}
              >
                <Text style={styles.optionText}>{choice}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 🎮 GAMEPLAY ENGINE UI
  if (step.kind === "word") {
    const clue = step.clues[game.currentClueIndex];

    // Determine custom border/badge flair using your custom eventTypes
    const isBoss = step.eventType === "bossWord";
    const isSpeed = step.eventType === "speedRound";

    return (
      <SafeAreaView
        style={[
          styles.container,
          flash === "correct" && styles.flashCorrect,
          flash === "wrong" && styles.flashWrong,
          isBoss && styles.borderBoss,
          isSpeed && styles.borderSpeed,
        ]}
      >
        {/* 🏆 TOP STATUS HUD SYSTEM */}
        <View style={styles.hudRow}>
          <Text style={styles.hudText}>✨ SCORE: {game.score}</Text>
          <Text style={styles.hudText}>🔥 COMBO: {game.combo}</Text>
          <Text style={styles.hudText}>❤️ LIVES: {"❤️".repeat(game.lives)}</Text>
        </View>

        {/* 🏷️ DYNAMIC EVENT BADGE */}
        <View style={styles.badgeContainer}>
          <Text style={[
            styles.badgeText, 
            isBoss && { color: "#ff4a4a" },
            isSpeed && { color: "#ffdf00" }
          ]}>
            {step.eventType.toUpperCase()} • {step.emotionalRole.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.word}>{step.word}</Text>

        <View style={styles.clueBox}>
          {clue.isSlangClue && <Text style={styles.slangTag}>💬 SLANG MODE</Text>}
          <Text style={styles.clueBig}>{clue.text.toUpperCase()}</Text>
        </View>

        <View style={styles.options}>
          {step.meanings.map((m) => {
            const isHidden = m.hidden && !game.revealedMeanings[m.id];

            return (
              <Pressable
                key={m.id}
                style={[styles.option, isHidden && styles.optionHidden]}
                onPress={() => submitAnswer(m.id)}
              >
                <Text style={styles.optionText}>
                  {m.icon ?? ""} {isHidden ? "🔒 UNKNOWN MEANING" : m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Dynamic feedback panel with clean state strings */}
        {game.feedback && (
          <Text
            style={[
              styles.feedbackBig,
              {
                color: game.feedback.includes("Mistake") || game.feedback.includes("💔")
                  ? "#f87171"
                  : "#4ade80",
              },
            ]}
          >
            {game.feedback}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1220",
    padding: 20,
    justifyContent: "center",
  },

  // Event Context Styling Boundaries
  borderBoss: { borderWidth: 4, borderColor: "#ff4a4a" },
  borderSpeed: { borderWidth: 4, borderColor: "#ffdf00" },

  flashCorrect: { backgroundColor: "#062e1c" },
  flashWrong: { backgroundColor: "#3b0a0a" },

  // Top Status Bar Layout
  hudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
  },
  hudText: {
    color: "#a0aec0",
    fontWeight: "800",
    fontSize: 14,
  },

  badgeContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  badgeText: {
    color: "#7c5cff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 2,
  },

  word: {
    fontSize: 48,
    color: "white",
    textAlign: "center",
    fontWeight: "900",
    letterSpacing: 4,
  },

  clueBox: {
    backgroundColor: "#161b30",
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    minHeight: 120,
    justifyContent: "center",
  },
  slangTag: {
    color: "#ff8a00",
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 6,
  },
  clueBig: {
    fontSize: 24,
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 32,
  },

  options: {
    marginTop: 30,
  },
  option: {
    backgroundColor: "#1c2230",
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  optionHidden: {
    backgroundColor: "#090b14",
    borderStyle: "dashed",
    borderColor: "#4a5568",
  },
  optionText: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
  },

  // Phrase Break Module Layout
  phraseCard: {
    padding: 24,
    backgroundColor: "#161b30",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#7c5cff",
  },
  phraseTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
    marginVertical: 16,
  },
  phraseQuestion: {
    fontSize: 18,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 10,
  },
  phraseOption: {
    backgroundColor: "#22293f",
    padding: 18,
    borderRadius: 14,
    marginTop: 10,
  },

  feedbackBig: {
    position: "absolute",
    bottom: 60,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1,
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
  },
  stat: {
    color: "#ccc",
    marginTop: 10,
    fontSize: 18,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#7c5cff",
    padding: 16,
    borderRadius: 12,
    width: 160,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
});