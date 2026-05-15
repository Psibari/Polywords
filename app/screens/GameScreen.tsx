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

    const isWrong = game.feedback.toLowerCase().includes("mistake");

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
          <Text style={styles.stat}>Score: {game.score}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🎮 GAMEPLAY
  if (step.kind === "word") {
    const clue = step.clues[game.currentClueIndex];

    return (
      <SafeAreaView
        style={[
          styles.container,
          flash === "correct" && styles.flashCorrect,
          flash === "wrong" && styles.flashWrong,
        ]}
      >
        <Text style={styles.word}>{step.word}</Text>

        <Text style={styles.clueBig}>{clue.text.toUpperCase()}</Text>

        <View style={styles.options}>
          {step.meanings.map((m) => {
            const isHidden =
              m.hidden && !game.revealedMeanings[m.id];

            return (
              <Pressable
                key={m.id}
                style={styles.option}
                onPress={() => submitAnswer(m.id)}
              >
                <Text style={styles.optionText}>
                  {m.icon ?? ""} {isHidden ? "???" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {game.feedback && (
          <Text
            style={[
              styles.feedbackBig,
              {
                color: game.feedback.includes("Mistake")
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

  flashCorrect: { backgroundColor: "#062e1c" },
  flashWrong: { backgroundColor: "#3b0a0a" },

  word: {
    fontSize: 42,
    color: "white",
    textAlign: "center",
    fontWeight: "900",
  },

  clueBig: {
    fontSize: 28,
    color: "white",
    textAlign: "center",
    marginTop: 20,
  },

  options: {
    marginTop: 30,
  },

  option: {
    backgroundColor: "#1c2230",
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
    alignItems: "center",
  },

  optionText: {
    color: "white",
    fontSize: 26,
  },

  feedbackBig: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "900",
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
});