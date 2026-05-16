import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type EventType =
  | "normal"
  | "speedRound"
  | "bossWord"
  | "missingMeaning"
  | "slangDrop"
  | "wordLore"
  | "phraseBreak"
  | "semanticEvolution"
  | "decoyHeavy";

type ClueCard = {
  id: string;
  text: string;
  correct: boolean;
  hidden?: boolean;
  slang?: boolean;
  era?: "old" | "modern";
};

type WordRound = {
  type: "word";
  word: string;
  emotionalRole: string;
  eventType: EventType;
  pollyIntro?: string;
  lore?: string;
  clues: ClueCard[];
};

type PhraseRound = {
  type: "phraseBreak";
  phrase: string;
  question: string;
  choices: string[];
  answerIndex: number;
};

type Round = WordRound | PhraseRound;

const SESSION: Round[] = [
  {
    type: "word",
    word: "BARK",
    emotionalRole: "Confidence",
    eventType: "normal",
    clues: [
      { id: "dog", text: "Sharp sound from a dog", correct: true },
      { id: "tree", text: "Tree’s rough outer skin", correct: true },
      { id: "shout", text: "Snap out an order", correct: true },
      { id: "fruit", text: "A small red fruit", correct: false },
    ],
  },
  {
    type: "word",
    word: "BAT",
    emotionalRole: "Speed",
    eventType: "speedRound",
    pollyIntro: "Quick draw.",
    clues: [
      { id: "animal", text: "Winged cave hunter", correct: true },
      { id: "sports", text: "Swing for the fences", correct: true },
      { id: "hit", text: "Take a turn hitting", correct: true },
      { id: "shoe", text: "A soft running shoe", correct: false },
    ],
  },
  {
    type: "word",
    word: "LIGHT",
    emotionalRole: "Curiosity",
    eventType: "normal",
    clues: [
      { id: "brightness", text: "Brightness in darkness", correct: true },
      { id: "weight", text: "Easy to lift", correct: true },
      { id: "flame", text: "Start a small flame", correct: true },
      { id: "noise", text: "A sudden loud sound", correct: false },
    ],
  },
  {
    type: "word",
    word: "DUCK",
    emotionalRole: "Relief",
    eventType: "normal",
    clues: [
      { id: "bird", text: "Pond bird with a bill", correct: true },
      { id: "avoid", text: "Drop your head fast", correct: true },
      { id: "fabric", text: "Heavy cotton cloth", correct: true },
      { id: "coin", text: "A tiny silver coin", correct: false },
    ],
  },
  {
    type: "word",
    word: "MATCH",
    emotionalRole: "Hesitation",
    eventType: "decoyHeavy",
    clues: [
      { id: "contest", text: "Competitive showdown", correct: true },
      { id: "pair", text: "Fit perfectly together", correct: true },
      { id: "fire", text: "Tiny flame on a stick", correct: true },
      { id: "similar", text: "Look nearly identical", correct: false },
      { id: "mirror", text: "Reflect in glass", correct: false },
    ],
  },
  {
    type: "word",
    word: "SPRING",
    emotionalRole: "Surprise",
    eventType: "missingMeaning",
    pollyIntro: "One meaning is hiding.",
    clues: [
      { id: "season", text: "Winter’s opposite", correct: true },
      { id: "jump", text: "Leap upward", correct: true },
      { id: "coil", text: "Metal tension coil", correct: true },
      { id: "water", text: "???", correct: true, hidden: true },
      { id: "bird", text: "A tropical bird", correct: false },
    ],
  },
  {
    type: "word",
    word: "BANK",
    emotionalRole: "Boss",
    eventType: "bossWord",
    pollyIntro: "Careful. This one splits hard.",
    clues: [
      { id: "money", text: "Where money waits", correct: true },
      { id: "river", text: "Land beside flowing water", correct: true },
      { id: "rely", text: "Count on it happening", correct: true },
      { id: "plane", text: "Tilt into a turn", correct: true },
      { id: "oceanWall", text: "Wall beside the ocean", correct: false },
      { id: "vault", text: "A locked treasure room", correct: false },
    ],
  },
  {
    type: "phraseBreak",
    phrase: "Spill the beans",
    question: "Where did this phrase likely come from?",
    choices: [
      "Secret voting with beans",
      "Cooking soup",
      "Farm markets",
      "Pirate treasure",
    ],
    answerIndex: 0,
  },
  {
    type: "word",
    word: "WAVE",
    emotionalRole: "Relief",
    eventType: "normal",
    clues: [
      { id: "water", text: "Rolling wall of water", correct: true },
      { id: "hand", text: "Gesture across the room", correct: true },
      { id: "signal", text: "Invisible signal pattern", correct: true },
      { id: "weapon", text: "A curved sword", correct: false },
    ],
  },
  {
    type: "word",
    word: "ROCK",
    emotionalRole: "Slang Surprise",
    eventType: "slangDrop",
    pollyIntro: "Language just changed outfits.",
    clues: [
      { id: "stone", text: "Hard chunk of earth", correct: true },
      { id: "music", text: "Loud guitar energy", correct: true },
      { id: "motion", text: "Gentle back-and-forth motion", correct: true },
      { id: "diamond", text: "Flashy diamond", correct: true, slang: true },
      { id: "river", text: "Fast-moving stream", correct: false },
    ],
  },
  {
    type: "word",
    word: "KEY",
    emotionalRole: "Curiosity",
    eventType: "wordLore",
    lore: "“Key” became a symbol for answers, access, and control.",
    clues: [
      { id: "lock", text: "Unlocks what’s closed", correct: true },
      { id: "answer", text: "Answer that solves it", correct: true },
      { id: "music", text: "Home base for a song", correct: true },
      { id: "island", text: "Low island near coral", correct: true },
      { id: "rope", text: "A sailor’s knot", correct: false },
    ],
  },
  {
    type: "word",
    word: "CHECK",
    emotionalRole: "Hesitation",
    eventType: "decoyHeavy",
    clues: [
      { id: "inspect", text: "Look it over carefully", correct: true },
      { id: "money", text: "Paper payment slip", correct: true },
      { id: "stop", text: "Hold something back", correct: true },
      { id: "pattern", text: "Tiny square pattern", correct: true },
      { id: "chess", text: "King under threat", correct: true },
      { id: "mark", text: "A star-shaped mark", correct: false },
    ],
  },
  {
    type: "word",
    word: "SICK",
    emotionalRole: "Semantic Evolution",
    eventType: "semanticEvolution",
    pollyIntro: "Era shift.",
    clues: [
      { id: "ill", text: "Feeling fever-wrecked", correct: true, era: "old" },
      { id: "cool", text: "Wildly impressive", correct: true, era: "modern" },
      { id: "gross", text: "Hard to stomach", correct: true },
      { id: "tired", text: "Ready to sleep", correct: false },
    ],
  },
  {
    type: "word",
    word: "CAN",
    emotionalRole: "Speed Relief",
    eventType: "speedRound",
    pollyIntro: "Fast hands.",
    clues: [
      { id: "container", text: "Metal food container", correct: true },
      { id: "able", text: "Able to do it", correct: true },
      { id: "fire", text: "Dismiss from a job", correct: true },
      { id: "boat", text: "Small wooden boat", correct: false },
    ],
  },
  {
    type: "word",
    word: "ORDER",
    emotionalRole: "Boss",
    eventType: "bossWord",
    pollyIntro: "Final split. Stay sharp.",
    clues: [
      { id: "sequence", text: "Things in sequence", correct: true },
      { id: "command", text: "Command from authority", correct: true },
      { id: "purchase", text: "Request from a menu", correct: true },
      { id: "peace", text: "Calm after chaos", correct: true },
      { id: "group", text: "Ranked group in biology", correct: true },
      { id: "border", text: "Edge around a page", correct: false },
    ],
  },
];

function arraysMatch(a: string[], b: string[]) {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((value, index) => value === sortedB[index]);
}

function getEventLabel(eventType: EventType) {
  switch (eventType) {
    case "speedRound":
      return "SPEED ROUND";
    case "bossWord":
      return "BOSS WORD";
    case "missingMeaning":
      return "MISSING MEANING";
    case "slangDrop":
      return "SLANG DROP";
    case "wordLore":
      return "WORD LORE";
    case "semanticEvolution":
      return "ERA SHIFT";
    case "decoyHeavy":
      return "DECOY HEAVY";
    default:
      return "BLITZ";
  }
}

function getPerfectLine(eventType: EventType) {
  switch (eventType) {
    case "bossWord":
      return "Boss cleared.";
    case "speedRound":
      return "Too quick.";
    case "missingMeaning":
      return "That meaning was hiding.";
    case "slangDrop":
      return "Language just changed outfits.";
    case "semanticEvolution":
      return "Time traveler.";
    default:
      return "Clean.";
  }
}

export default function GameScreen() {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [phraseChoice, setPhraseChoice] = useState<number | null>(null);
  const [showLore, setShowLore] = useState(false);
  const [score, setScore] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [finished, setFinished] = useState(false);

  const round = SESSION[roundIndex];

  const correctIds = useMemo(() => {
    if (round.type !== "word") return [];
    return round.clues.filter((clue) => clue.correct).map((clue) => clue.id);
  }, [round]);

  const isPerfect = useMemo(() => {
    if (round.type !== "word") return false;
    return arraysMatch(selectedIds, correctIds);
  }, [selectedIds, correctIds, round]);

  function toggleCard(id: string) {
    if (submitted || round.type !== "word") return;

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  }

  function submitWord() {
    if (round.type !== "word" || selectedIds.length === 0 || submitted) return;

    setSubmitted(true);

    const correctSelected = selectedIds.filter((id) =>
      correctIds.includes(id)
    ).length;

    const wrongSelected = selectedIds.filter(
      (id) => !correctIds.includes(id)
    ).length;

    let points = correctSelected * 100 - wrongSelected * 50;

    if (isPerfect) {
      points += 250;
      setPerfects((current) => current + 1);
    }

    if (round.eventType === "speedRound") points *= 2;
    if (round.eventType === "bossWord") points *= 2;

    if (
      round.eventType === "missingMeaning" &&
      selectedIds.some((id) => {
        const clue = round.clues.find((item) => item.id === id);
        return clue?.hidden;
      })
    ) {
      points += 300;
    }

    if (
      round.eventType === "slangDrop" &&
      selectedIds.some((id) => {
        const clue = round.clues.find((item) => item.id === id);
        return clue?.slang;
      })
    ) {
      points += 200;
    }

    if (
      round.eventType === "semanticEvolution" &&
      selectedIds.some((id) => {
        const clue = round.clues.find((item) => item.id === id);
        return clue?.era === "modern";
      })
    ) {
      points += 300;
    }

    setScore((current) => Math.max(0, current + points));

    if (round.lore && isPerfect) {
      setShowLore(true);
    }
  }

  function submitPhrase(choiceIndex: number) {
    if (round.type !== "phraseBreak" || phraseChoice !== null) return;

    setPhraseChoice(choiceIndex);

    if (choiceIndex === round.answerIndex) {
      setScore((current) => current + 500);
    }
  }

  function nextRound() {
    if (roundIndex + 1 >= SESSION.length) {
      setFinished(true);
      return;
    }

    setRoundIndex((current) => current + 1);
    setSelectedIds([]);
    setSubmitted(false);
    setPhraseChoice(null);
    setShowLore(false);
  }

  function restart() {
    setRoundIndex(0);
    setSelectedIds([]);
    setSubmitted(false);
    setPhraseChoice(null);
    setShowLore(false);
    setScore(0);
    setPerfects(0);
    setFinished(false);
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.kicker}>Vertical Slice Complete</Text>
          <Text style={styles.title}>POLYWORDS</Text>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.subtitle}>Perfect clears: {perfects}</Text>
          <Text style={styles.polly}>🦜 That had rhythm.</Text>

          <Pressable style={styles.primaryButton} onPress={restart}>
            <Text style={styles.primaryButtonText}>Run It Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (round.type === "phraseBreak") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eventLabel}>PHRASE BREAK</Text>
          <Text style={styles.phrase}>“{round.phrase}”</Text>
          <Text style={styles.prompt}>{round.question}</Text>

          <View style={styles.cards}>
            {round.choices.map((choice, index) => {
              const chosen = phraseChoice === index;
              const correct = index === round.answerIndex;
              const revealed = phraseChoice !== null;

              return (
                <Pressable
                  key={choice}
                  style={[
                    styles.card,
                    chosen && styles.cardSelected,
                    revealed && correct && styles.cardCorrect,
                    revealed && chosen && !correct && styles.cardWrong,
                  ]}
                  onPress={() => submitPhrase(index)}
                >
                  <Text style={styles.cardText}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>

          {phraseChoice !== null && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>
                {phraseChoice === round.answerIndex
                  ? "🦜 Lore snagged. +500"
                  : "🦜 Close. No penalty."}
              </Text>
              <Text style={styles.feedbackText}>
                Correct answer: {round.choices[round.answerIndex]}
              </Text>

              <Pressable style={styles.primaryButton} onPress={nextRound}>
                <Text style={styles.primaryButtonText}>Continue</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showLore && round.type === "word") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.eventLabel}>WORD LORE UNLOCKED</Text>
          <Text style={styles.title}>{round.word}</Text>
          <Text style={styles.lore}>{round.lore}</Text>

          <Pressable style={styles.primaryButton} onPress={nextRound}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Text style={styles.topText}>Score {score}</Text>
          <Text style={styles.topText}>
            {roundIndex + 1}/{SESSION.length}
          </Text>
        </View>

        <Text style={styles.eventLabel}>{getEventLabel(round.eventType)}</Text>
        <Text style={styles.role}>{round.emotionalRole}</Text>

        {round.pollyIntro && (
          <Text style={styles.pollyIntro}>🦜 {round.pollyIntro}</Text>
        )}

        <Text style={styles.word}>{round.word}</Text>
        <Text style={styles.instruction}>Select every true meaning clue.</Text>

        <View style={styles.cards}>
          {round.clues.map((clue) => {
            const selected = selectedIds.includes(clue.id);

            return (
              <Pressable
                key={clue.id}
                style={[
                  styles.card,
                  selected && !submitted && styles.cardSelected,
                  submitted && clue.correct && styles.cardCorrect,
                  submitted && selected && !clue.correct && styles.cardWrong,
                  clue.slang && styles.slangCard,
                  round.eventType === "bossWord" && styles.bossCard,
                ]}
                onPress={() => toggleCard(clue.id)}
              >
                <Text style={styles.cardText}>
                  {submitted && clue.hidden ? "Mountain water source" : clue.text}
                </Text>

                {clue.slang && <Text style={styles.tag}>SLANG</Text>}
                {clue.era && <Text style={styles.tag}>{clue.era.toUpperCase()}</Text>}
              </Pressable>
            );
          })}
        </View>

        {!submitted ? (
          <Pressable
            style={[
              styles.primaryButton,
              selectedIds.length === 0 && styles.disabledButton,
            ]}
            onPress={submitWord}
          >
            <Text style={styles.primaryButtonText}>Submit</Text>
          </Pressable>
        ) : (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackTitle}>
              {isPerfect ? `🦜 ${getPerfectLine(round.eventType)}` : "🦜 You found part of it."}
            </Text>

            <Text style={styles.feedbackText}>
              {isPerfect
                ? "Perfect clear."
                : `Correct clues: ${correctIds.length}. Your picks: ${selectedIds.length}.`}
            </Text>

            {round.eventType === "missingMeaning" && (
              <Text style={styles.bonusText}>Meaning discovered +300</Text>
            )}

            {round.eventType === "slangDrop" && (
              <Text style={styles.bonusText}>Slang hit. Language moves.</Text>
            )}

            {round.eventType === "semanticEvolution" && (
              <Text style={styles.bonusText}>Era bonus available.</Text>
            )}

            <Pressable style={styles.primaryButton} onPress={nextRound}>
              <Text style={styles.primaryButtonText}>
                {roundIndex + 1 >= SESSION.length ? "Finish" : "Next"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  },
  scroll: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  topText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: "800",
  },
  eventLabel: {
    color: COLORS.gold,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  role: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
  },
  pollyIntro: {
    color: COLORS.white,
    textAlign: "center",
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
  },
  word: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 54,
    fontWeight: "900",
    marginTop: 22,
    letterSpacing: 2,
  },
  phrase: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 28,
  },
  prompt: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 20,
    marginTop: 18,
    lineHeight: 28,
  },
  instruction: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 17,
    marginTop: 10,
  },
  cards: {
    marginTop: 32,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  cardSelected: {
    backgroundColor: COLORS.cardSelected,
    borderColor: COLORS.gold,
  },
  cardCorrect: {
    backgroundColor: COLORS.successDim,
    borderColor: COLORS.success,
  },
  cardWrong: {
    backgroundColor: COLORS.errorDim,
    borderColor: COLORS.error,
  },
  bossCard: {
    borderColor: COLORS.gold,
  },
  slangCard: {
    borderColor: COLORS.purple,
  },
  cardText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
  tag: {
    color: COLORS.gold,
    marginTop: 8,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    marginTop: 26,
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
  feedbackBox: {
    marginTop: 28,
    backgroundColor: COLORS.card,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  feedbackTitle: {
    color: COLORS.gold,
    textAlign: "center",
    fontSize: 23,
    fontWeight: "900",
  },
  feedbackText: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 16,
    marginTop: 8,
    lineHeight: 23,
  },
  bonusText: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 15,
    marginTop: 12,
    fontWeight: "800",
  },
  title: {
    color: COLORS.gold,
    fontSize: 42,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
  },
  score: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 30,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 18,
    marginTop: 10,
  },
  polly: {
    color: COLORS.white,
    fontSize: 18,
    textAlign: "center",
    marginTop: 28,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 1,
  },
  lore: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 30,
    marginTop: 28,
  },
});