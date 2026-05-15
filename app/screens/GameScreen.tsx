import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type WordChallenge = {
  word: string;
  options: string[];
  answers: number[];
};

const CHALLENGES: WordChallenge[] = [
  {
    word: "BARK",
    options: [
      "Sound a dog makes",
      "Outer layer of a tree",
      "A type of fruit",
      "A small boat",
    ],
    answers: [0, 1],
  },
  {
    word: "BAT",
    options: [
      "Flying mammal",
      "Sports equipment",
      "To hit something",
      "A type of shoe",
    ],
    answers: [0, 1, 2],
  },
  {
    word: "SPRING",
    options: ["A season", "To jump", "A coil", "A type of bird"],
    answers: [0, 1, 2],
  },
  {
    word: "RING",
    options: ["Jewelry", "A phone sound", "To surround", "A type of soup"],
    answers: [0, 1, 2],
  },
  {
    word: "LIGHT",
    options: [
      "Opposite of heavy",
      "Illumination",
      "Pale in color",
      "A loud noise",
    ],
    answers: [0, 1, 2],
  },
  {
    word: "WATCH",
    options: ["To look at", "A timepiece", "To guard", "A wild animal"],
    answers: [0, 1, 2],
  },
  {
    word: "MATCH",
    options: ["A contest", "To pair", "A fire stick", "A winter coat"],
    answers: [0, 1, 2],
  },
  {
    word: "ROCK",
    options: ["A stone", "A music genre", "To move back and forth", "A liquid"],
    answers: [0, 1, 2],
  },
  {
    word: "BANK",
    options: [
      "Financial institution",
      "River edge",
      "To rely on",
      "A musical instrument",
    ],
    answers: [0, 1, 2],
  },
  {
    word: "CURRENT",
    options: [
      "Happening now",
      "Flow of water or electricity",
      "A type of currency",
      "A small insect",
    ],
    answers: [0, 1],
  },
];

function arraysMatch(a: number[], b: number[]) {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((value, index) => value === sortedB[index]);
}

export default function GameScreen() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = CHALLENGES[index];

  const isCorrect = useMemo(
    () => arraysMatch(selected, current.answers),
    [selected, current.answers]
  );

  function toggleOption(optionIndex: number) {
    if (submitted) return;

    setSelected((currentSelection) =>
      currentSelection.includes(optionIndex)
        ? currentSelection.filter((item) => item !== optionIndex)
        : [...currentSelection, optionIndex]
    );
  }

  function submitAnswer() {
    if (selected.length === 0 || submitted) return;

    setSubmitted(true);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setScore((currentScore) => currentScore + 1 + (nextStreak >= 3 ? 1 : 0));
    } else {
      setStreak(0);
    }
  }

  function nextWord() {
    if (index + 1 >= CHALLENGES.length) {
      setFinished(true);
      return;
    }

    setIndex((currentIndex) => currentIndex + 1);
    setSelected([]);
    setSubmitted(false);
  }

  function playAgain() {
    setIndex(0);
    setSelected([]);
    setSubmitted(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.kicker}>Session Complete</Text>
          <Text style={styles.title}>POLYWORDS</Text>

          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.subtitle}>Best streak: {bestStreak}</Text>

          <Text style={styles.pollyLine}>
            🦜 Nice work. Ready for another round?
          </Text>

          <Pressable style={styles.primaryButton} onPress={playAgain}>
            <Text style={styles.primaryButtonText}>Play Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.stat}>Score {score}</Text>
        <Text style={styles.stat}>🔥 {streak}</Text>
        <Text style={styles.stat}>
          {index + 1}/{CHALLENGES.length}
        </Text>
      </View>

      <Text style={styles.kicker}>Select every meaning that fits</Text>
      <Text style={styles.word}>{current.word}</Text>
      <Text style={styles.prompt}>One word. Multiple truths.</Text>

      <View style={styles.optionsWrap}>
        {current.options.map((option, optionIndex) => {
          const optionSelected = selected.includes(optionIndex);
          const optionCorrect = current.answers.includes(optionIndex);

          let optionStyle = styles.optionCard;

          if (optionSelected && !submitted) {
            optionStyle = styles.optionCardSelected;
          }

          if (submitted && optionCorrect) {
            optionStyle = styles.optionCardCorrect;
          }

          if (submitted && optionSelected && !optionCorrect) {
            optionStyle = styles.optionCardWrong;
          }

          return (
            <Pressable
              key={option}
              style={optionStyle}
              onPress={() => toggleOption(optionIndex)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      {!submitted ? (
        <Pressable
          style={[
            styles.primaryButton,
            selected.length === 0 && styles.disabledButton,
          ]}
          onPress={submitAnswer}
        >
          <Text style={styles.primaryButtonText}>Submit</Text>
        </Pressable>
      ) : (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>
            {isCorrect ? "🦜 Word Up!" : "🦜 Nice try!"}
          </Text>

          <Text style={styles.feedbackText}>
            {isCorrect
              ? "You found every meaning."
              : "The full correct set is highlighted above."}
          </Text>

          <Pressable style={styles.primaryButton} onPress={nextWord}>
            <Text style={styles.primaryButtonText}>
              {index + 1 >= CHALLENGES.length ? "Finish" : "Next Word"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const COLORS = {
  bg: "#1A1040",
  card: "#24175A",
  cardSelected: "#3A2480",
  gold: "#FFD700",
  purple: "#8B5CF6",
  white: "#FFFFFF",
  muted: "#B8B3D9",
  success: "#22C55E",
  successDim: "#143D2A",
  error: "#EF4444",
  errorDim: "#421818",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
    paddingTop: 56,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  stat: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "800",
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: COLORS.gold,
    fontSize: 42,
    fontWeight: "900",
    marginTop: 12,
    textAlign: "center",
  },
  word: {
    color: COLORS.white,
    fontSize: 54,
    fontWeight: "900",
    marginTop: 22,
    textAlign: "center",
    letterSpacing: 2,
  },
  prompt: {
    color: COLORS.muted,
    fontSize: 17,
    marginTop: 8,
    textAlign: "center",
  },
  optionsWrap: {
    marginTop: 38,
    gap: 14,
  },
  optionCard: {
    backgroundColor: COLORS.card,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  optionCardSelected: {
    backgroundColor: COLORS.cardSelected,
    borderColor: COLORS.gold,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  optionCardCorrect: {
    backgroundColor: COLORS.successDim,
    borderColor: COLORS.success,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  optionCardWrong: {
    backgroundColor: COLORS.errorDim,
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  optionText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    marginTop: 28,
    paddingVertical: 18,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 19,
    fontWeight: "900",
  },
  feedbackCard: {
    backgroundColor: COLORS.card,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 22,
    marginTop: 26,
    padding: 20,
  },
  feedbackTitle: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  feedbackText: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  scoreText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 28,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 18,
    marginTop: 10,
    textAlign: "center",
  },
  pollyLine: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 26,
    marginTop: 28,
    textAlign: "center",
  },
});