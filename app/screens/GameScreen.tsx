import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";
import { useGameStore } from "../store/useGameStore";
import { SESSION } from "../game/session";

export default function GameScreen() {
  const { game, submitAnswer, submitPhraseAnswer, startGame } =
    useGameStore();

  const step = SESSION[game.currentStepIndex];

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

  // 🎴 PHRASE BREAK
  if (game.status === "phraseBreak" && step.kind === "phraseBreak") {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.label}>PHRASE BREAK</Text>
        <Text style={styles.word}>{step.phrase}</Text>

        <Text style={styles.clue}>{step.question}</Text>

        {step.choices.map((choice) => (
          <Pressable
            key={choice}
            style={styles.option}
            onPress={() => submitPhraseAnswer(choice)}
          >
            <Text style={styles.optionText}>{choice}</Text>
          </Pressable>
        ))}

        {game.feedback && (
          <Text style={styles.feedback}>{game.feedback}</Text>
        )}
      </SafeAreaView>
    );
  }

  // 🎮 WORD GAMEPLAY
  if (step.kind === "word") {
    const clue = step.clues[game.currentClueIndex];

    return (
      <SafeAreaView style={styles.container}>
        {/* TOP BAR */}
        <View style={styles.top}>
          <Text style={styles.topText}>
            Round {game.currentStepIndex + 1}
          </Text>
          <Text style={styles.topText}>❤️ {game.lives}</Text>
          <Text style={styles.topText}>🔥 {game.combo}</Text>
          <Text style={styles.topText}>⭐ {game.score}</Text>
        </View>

        {/* EVENT LABEL */}
        {step.eventType !== "normal" && (
          <Text style={styles.event}>{step.eventType.toUpperCase()}</Text>
        )}

        {/* WORD */}
        <Text style={styles.word}>{step.word}</Text>

        {/* CLUE */}
        <Text style={styles.clue}>{clue.text}</Text>

        {/* MEANINGS */}
        <View style={styles.options}>
          {step.meanings.map((m) => (
            <Pressable
              key={m.id}
              style={styles.option}
              onPress={() => submitAnswer(m.id)}
            >
              <Text style={styles.optionText}>
                {m.icon ?? ""} {m.hidden ? "???" : m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* FEEDBACK */}
        {game.feedback && (
          <Text style={styles.feedback}>{game.feedback}</Text>
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
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  topText: {
    color: "white",
    fontWeight: "700",
  },

  label: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 10,
  },

  event: {
    color: "#facc15",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "800",
  },

  word: {
    fontSize: 42,
    color: "white",
    textAlign: "center",
    marginTop: 30,
    fontWeight: "900",
  },

  clue: {
    fontSize: 24,
    color: "#ddd",
    textAlign: "center",
    marginTop: 20,
  },

  options: {
    marginTop: 30,
  },

  option: {
    backgroundColor: "#1c2230",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  optionText: {
    color: "white",
    fontWeight: "700",
  },

  feedback: {
    marginTop: 20,
    textAlign: "center",
    color: "#4ade80",
    fontWeight: "800",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 36,
    color: "white",
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