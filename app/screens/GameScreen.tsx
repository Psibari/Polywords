import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Step =
  | IntroStep
  | ConveyorStep
  | SwitchbackStep
  | HiddenWordStep;

type IntroStep = {
  type: "intro";
  title: string;
  rule: string;
  polly?: string;
};

type ConveyorClue = {
  clue: string;
  answer: string;
  choices: string[];
};

type ConveyorStep = {
  type: "conveyor";
  word: string;
  label: string;
  speedMs: number;
  polly?: string;
  clues: ConveyorClue[];
  boss?: boolean;
};

type SwitchbackStep = {
  type: "switchback";
  label: string;
  clueA: string;
  clueB: string;
  choices: string[];
  answer: string;
  polly?: string;
};

type HiddenWordStep = {
  type: "hiddenWord";
  label: string;
  answer: string;
  meanings: string[];
  grid: string[][];
  polly?: string;
};

const STEPS: Step[] = [
  {
    type: "intro",
    title: "CONVEYOR BLITZ",
    rule: "Tap the meaning before it slides away.",
    polly: "Word stays still. Meaning moves. Don’t blink.",
  },
  {
    type: "conveyor",
    word: "BARK",
    label: "CONVEYOR BLITZ",
    speedMs: 5600,
    clues: [
      {
        clue: "Noise from the yard",
        answer: "DOG SOUND",
        choices: ["DOG SOUND", "TREE SKIN", "LOUD ORDER", "BITE"],
      },
      {
        clue: "Rough coat on a trunk",
        answer: "TREE SKIN",
        choices: ["WOOD", "TREE SKIN", "LEAF", "DOG SOUND"],
      },
      {
        clue: "Snap an order",
        answer: "LOUD ORDER",
        choices: ["DOG SOUND", "LOUD ORDER", "TREE SKIN", "WHISPER"],
      },
    ],
  },
  {
    type: "conveyor",
    word: "BAT",
    label: "SPEED ROUND",
    speedMs: 3600,
    polly: "Faster now.",
    clues: [
      {
        clue: "Swings for the fences",
        answer: "BASEBALL TOOL",
        choices: ["BALL", "BASEBALL TOOL", "GLOVE", "FLYING MAMMAL"],
      },
      {
        clue: "Sleeps upside down",
        answer: "FLYING MAMMAL",
        choices: ["OWL", "BASEBALL TOOL", "FLYING MAMMAL", "CAVE"],
      },
      {
        clue: "Night hunter with wings",
        answer: "FLYING MAMMAL",
        choices: ["FLYING MAMMAL", "BIRD", "BATTERY", "BASEBALL TOOL"],
      },
    ],
  },
  {
    type: "intro",
    title: "SWITCHBACK",
    rule: "Two clues. One word connects them.",
    polly: "Now we flip the puzzle.",
  },
  {
    type: "switchback",
    label: "SWITCHBACK",
    clueA: "Swings in baseball.",
    clueB: "Sleeps in caves.",
    choices: ["BALL", "BAT", "OWL", "GLOVE"],
    answer: "BAT",
    polly: "Brain glitch incoming.",
  },
  {
    type: "conveyor",
    word: "LIGHT",
    label: "CONVEYOR BLITZ",
    speedMs: 5000,
    clues: [
      {
        clue: "Cuts through darkness",
        answer: "BRIGHTNESS",
        choices: ["BRIGHTNESS", "NOT HEAVY", "IGNITE", "SHADOW"],
      },
      {
        clue: "Easy to carry",
        answer: "NOT HEAVY",
        choices: ["SMALL", "BRIGHTNESS", "NOT HEAVY", "SOFT"],
      },
      {
        clue: "Start the candle",
        answer: "IGNITE",
        choices: ["BURN OUT", "IGNITE", "BRIGHTNESS", "NOT HEAVY"],
      },
    ],
  },
  {
    type: "intro",
    title: "HIDDEN WORD",
    rule: "The clues point to one word. Find it in the grid.",
    polly: "It’s hiding in the alphabet soup.",
  },
  {
    type: "hiddenWord",
    label: "HIDDEN WORD",
    answer: "MATCH",
    meanings: ["Starts a flame.", "Fits perfectly.", "Competitive showdown."],
    grid: [
      ["M", "A", "T", "C", "H"],
      ["B", "R", "I", "N", "G"],
      ["S", "P", "A", "R", "K"],
      ["G", "A", "M", "E", "S"],
      ["P", "A", "I", "R", "S"],
    ],
    polly: "Tap the letters in order for this prototype.",
  },
  {
    type: "intro",
    title: "BOSS WORD",
    rule: "More meanings. Less mercy.",
    polly: "Split it clean.",
  },
  {
    type: "conveyor",
    word: "BANK",
    label: "BOSS WORD",
    speedMs: 3900,
    boss: true,
    polly: "Careful. This one has elbows.",
    clues: [
      {
        clue: "Where money waits",
        answer: "MONEY PLACE",
        choices: ["SAFE", "MONEY PLACE", "RIVER EDGE", "VAULT"],
      },
      {
        clue: "Land beside flowing water",
        answer: "RIVER EDGE",
        choices: ["OCEAN WALL", "MONEY PLACE", "RIVER EDGE", "BRIDGE"],
      },
      {
        clue: "Count on it happening",
        answer: "RELY ON",
        choices: ["RELY ON", "ORDER", "CHECK", "MONEY PLACE"],
      },
      {
        clue: "Tilt into a turn",
        answer: "PLANE TURN",
        choices: ["PLANE TURN", "RIVER EDGE", "SPIN", "FALL"],
      },
    ],
  },
];

export default function GameScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [clueIndex, setClueIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showClear, setShowClear] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [perfectWords, setPerfectWords] = useState(0);
  const [wordMistakes, setWordMistakes] = useState(0);
  const [introCount, setIntroCount] = useState(3);
  const [selectedSwitchback, setSelectedSwitchback] = useState<string | null>(
    null
  );
  const [hiddenPath, setHiddenPath] = useState<
    { row: number; col: number; letter: string }[]
  >([]);
  const [finished, setFinished] = useState(false);

  const slideX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const timerScale = useRef(new Animated.Value(1)).current;

  const step = STEPS[stepIndex];

  const currentClue = useMemo(() => {
    if (step.type !== "conveyor") return null;
    return step.clues[clueIndex];
  }, [step, clueIndex]);

  useEffect(() => {
    if (step.type !== "intro") return;

    setIntroCount(3);

   const timeouts: ReturnType<typeof setTimeout>[] = []; 

    timeouts.push(
      setTimeout(() => {
        setIntroCount(2);
      }, 800)
    );

    timeouts.push(
      setTimeout(() => {
        setIntroCount(1);
      }, 1600)
    );

    timeouts.push(
      setTimeout(() => {
        setIntroCount(0);
      }, 2400)
    );

    timeouts.push(
      setTimeout(() => {
        goNextStep();
      }, 3200)
    );

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [stepIndex]);

  useEffect(() => {
    if (step.type !== "conveyor" || showClear) return;

    setLocked(false);
    setFeedback("");

    slideX.setValue(SCREEN_WIDTH);
    timerScale.setValue(1);

    Animated.timing(slideX, {
      toValue: -SCREEN_WIDTH * 1.35,
      duration: step.speedMs,
      useNativeDriver: true,
    }).start();

    Animated.timing(timerScale, {
      toValue: 0,
      duration: step.speedMs,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(() => {
      handleConveyorMiss();
    }, step.speedMs);

    return () => {
      clearTimeout(timeout);
      slideX.stopAnimation();
      timerScale.stopAnimation();
    };
  }, [stepIndex, clueIndex, showClear]);

  function goNextStep() {
    if (stepIndex + 1 >= STEPS.length) {
      setFinished(true);
      return;
    }

    setStepIndex((current) => current + 1);
    setClueIndex(0);
    setLocked(false);
    setFeedback("");
    setShowClear(false);
    setWordMistakes(0);
    setSelectedSwitchback(null);
    setHiddenPath([]);
  }

  function clearCurrentWord() {
    const perfect = wordMistakes === 0;

    if (perfect) {
      setPerfectWords((current) => current + 1);
      setScore((current) => current + 350);
      setFeedback("Perfect clear +350");
    } else {
      setFeedback("Word cleared");
    }

    setShowClear(true);
  }

  function advanceConveyor() {
    if (step.type !== "conveyor") return;

    if (clueIndex + 1 >= step.clues.length) {
      clearCurrentWord();
      return;
    }

    setClueIndex((current) => current + 1);
  }

  function handleConveyorMiss() {
    if (locked || step.type !== "conveyor" || showClear) return;

    setLocked(true);
    setMistakes((current) => current + 1);
    setWordMistakes((current) => current + 1);
    setStreak(0);
    setFeedback("Too late.");

    setTimeout(() => {
      advanceConveyor();
    }, 650);
  }

  function handleMeaningTap(choice: string) {
    if (locked || step.type !== "conveyor" || !currentClue) return;

    setLocked(true);

    const correct = choice === currentClue.answer;

    if (correct) {
      const speedBonus = step.label === "SPEED ROUND" ? 2 : 1;
      const bossBonus = step.boss ? 2 : 1;
      const streakBonus = Math.min(streak * 10, 100);
      const points = 100 * speedBonus * bossBonus + streakBonus;

      setScore((current) => current + points);
      setStreak((current) => current + 1);
      setFeedback(`Clean +${points}`);
    } else {
      setMistakes((current) => current + 1);
      setWordMistakes((current) => current + 1);
      setStreak(0);
      setFeedback(`Not that meaning. It was ${currentClue.answer}.`);
    }

    setTimeout(() => {
      advanceConveyor();
    }, 700);
  }

  function handleSwitchback(choice: string) {
    if (step.type !== "switchback" || selectedSwitchback) return;

    setSelectedSwitchback(choice);

    if (choice === step.answer) {
      const points = 500 + streak * 10;
      setScore((current) => current + points);
      setStreak((current) => current + 1);
      setFeedback(`Brain glitch solved +${points}`);
    } else {
      setMistakes((current) => current + 1);
      setStreak(0);
      setFeedback(`Almost. The bridge word was ${step.answer}.`);
    }
  }

  function handleGridTap(row: number, col: number, letter: string) {
    if (step.type !== "hiddenWord") return;

    const nextIndex = hiddenPath.length;
    const expectedLetter = step.answer[nextIndex];

    if (letter !== expectedLetter) {
      setHiddenPath([]);
      setMistakes((current) => current + 1);
      setStreak(0);
      setFeedback("Wrong trail. Start again.");
      return;
    }

    const nextPath = [...hiddenPath, { row, col, letter }];
    setHiddenPath(nextPath);
    setFeedback("");

    if (nextPath.length === step.answer.length) {
      const points = 600 + streak * 15;
      setScore((current) => current + points);
      setStreak((current) => current + 1);
      setFeedback(`${step.answer} found +${points}`);
    }
  }

  function restart() {
    setStepIndex(0);
    setClueIndex(0);
    setLocked(false);
    setFeedback("");
    setShowClear(false);
    setScore(0);
    setStreak(0);
    setMistakes(0);
    setPerfectWords(0);
    setWordMistakes(0);
    setIntroCount(3);
    setSelectedSwitchback(null);
    setHiddenPath([]);
    setFinished(false);
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.kicker}>POLY RUN COMPLETE</Text>
          <Text style={styles.title}>Score {score}</Text>
          <Text style={styles.stat}>Perfect words: {perfectWords}</Text>
          <Text style={styles.stat}>Mistakes: {mistakes}</Text>
          <Text style={styles.polly}>🦜 That had shape. Now we tune the rhythm.</Text>

          <Pressable style={styles.primaryButton} onPress={restart}>
            <Text style={styles.primaryButtonText}>Run It Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step.type === "intro") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.kicker}>NEW ROUND TYPE</Text>
          <Text style={styles.introTitle}>{step.title}</Text>
          <Text style={styles.introRule}>{step.rule}</Text>

          {step.polly && <Text style={styles.polly}>🦜 {step.polly}</Text>}

          <Text style={styles.countdown}>
            {introCount === 0 ? "GO" : introCount}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step.type === "switchback") {
    const answered = selectedSwitchback !== null;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TopBar score={score} streak={streak} stepIndex={stepIndex} />

          <Text style={styles.label}>{step.label}</Text>
          <Text style={styles.switchClue}>{step.clueA}</Text>
          <Text style={styles.switchClue}>{step.clueB}</Text>

          {step.polly && <Text style={styles.pollySmall}>🦜 {step.polly}</Text>}

          <View style={styles.choiceGrid}>
            {step.choices.map((choice) => {
              const selected = choice === selectedSwitchback;
              const correct = choice === step.answer;

              return (
                <Pressable
                  key={choice}
                  onPress={() => handleSwitchback(choice)}
                  style={[
                    styles.staticChoice,
                    selected && styles.selectedChoice,
                    answered && correct && styles.correctChoice,
                    answered && selected && !correct && styles.wrongChoice,
                  ]}
                >
                  <Text style={styles.staticChoiceText}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>

          {answered && (
            <FeedbackBox
              text={feedback}
              buttonText="Continue"
              onPress={goNextStep}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step.type === "hiddenWord") {
    const found = hiddenPath.length === step.answer.length;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TopBar score={score} streak={streak} stepIndex={stepIndex} />

          <Text style={styles.label}>{step.label}</Text>
          <Text style={styles.hiddenInstruction}>These meanings point to one word:</Text>

          <View style={styles.meaningBox}>
            {step.meanings.map((meaning) => (
              <Text key={meaning} style={styles.meaningLine}>
                {meaning}
              </Text>
            ))}
          </View>

          {step.polly && <Text style={styles.pollySmall}>🦜 {step.polly}</Text>}

          <Text style={styles.hiddenProgress}>
            {hiddenPath.map((item) => item.letter).join("") || "Find the word"}
          </Text>

          <View style={styles.grid}>
            {step.grid.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {row.map((letter, colIndex) => {
                  const selected = hiddenPath.some(
                    (item) => item.row === rowIndex && item.col === colIndex
                  );

                  return (
                    <Pressable
                      key={`${rowIndex}-${colIndex}`}
                      onPress={() => handleGridTap(rowIndex, colIndex, letter)}
                      style={[styles.gridCell, selected && styles.gridCellSelected]}
                    >
                      <Text style={styles.gridLetter}>{letter}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {!!feedback && <Text style={styles.inlineFeedback}>{feedback}</Text>}

          {found && (
            <Pressable style={styles.primaryButton} onPress={goNextStep}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step.type === "conveyor") {
    if (showClear) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.center}>
            <Text style={styles.kicker}>{step.label}</Text>
            <Text style={styles.clearWord}>{step.word}</Text>
            <Text style={styles.clearTitle}>WORD CLEARED</Text>
            <Text style={styles.clearFeedback}>{feedback}</Text>
            <Text style={styles.polly}>
              🦜 {wordMistakes === 0 ? "Clean split." : "Still cleared. Sharpen the beak."}
            </Text>

            <Pressable style={styles.primaryButton} onPress={goNextStep}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gameScreen}>
          <TopBar score={score} streak={streak} stepIndex={stepIndex} />

          <Text style={[styles.label, step.boss && styles.bossLabel]}>
            {step.label}
          </Text>

          {step.polly && <Text style={styles.pollySmall}>🦜 {step.polly}</Text>}

          <Text style={styles.word}>{step.word}</Text>

          <View style={styles.clueCard}>
            <Text style={styles.clueText}>{currentClue?.clue}</Text>
          </View>

          <View style={styles.timerTrack}>
            <Animated.View
              style={[
                styles.timerFill,
                {
                  transform: [{ scaleX: timerScale }],
                },
              ]}
            />
          </View>

          <View style={styles.conveyorWindow}>
            <Animated.View
              style={[
                styles.conveyorRow,
                {
                  transform: [{ translateX: slideX }],
                },
              ]}
            >
              {currentClue?.choices.map((choice) => (
                <Pressable
                  key={choice}
                  style={styles.movingTile}
                  onPress={() => handleMeaningTap(choice)}
                >
                  <Text style={styles.movingTileText}>{choice}</Text>
                </Pressable>
              ))}
            </Animated.View>
          </View>

          <Text style={styles.clueCounter}>
            Clue {clueIndex + 1}/{step.clues.length}
          </Text>

          {!!feedback && <Text style={styles.inlineFeedback}>{feedback}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

function TopBar({
  score,
  streak,
  stepIndex,
}: {
  score: number;
  streak: number;
  stepIndex: number;
}) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.topText}>Score {score}</Text>
      <Text style={styles.topText}>Streak x{streak}</Text>
      <Text style={styles.topText}>{stepIndex + 1}/{STEPS.length}</Text>
    </View>
  );
}

function FeedbackBox({
  text,
  buttonText,
  onPress,
}: {
  text: string;
  buttonText: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.feedbackBox}>
      <Text style={styles.feedbackText}>🦜 {text}</Text>
      <Pressable style={styles.primaryButton} onPress={onPress}>
        <Text style={styles.primaryButtonText}>{buttonText}</Text>
      </Pressable>
    </View>
  );
}

const COLORS = {
  bg: "#1A1040",
  card: "#24175A",
  card2: "#311F78",
  gold: "#FFD700",
  purple: "#8B5CF6",
  white: "#FFFFFF",
  muted: "#B8B3D9",
  success: "#22C55E",
  error: "#EF4444",
  darkSuccess: "#143D2A",
  darkError: "#421818",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    padding: 24,
    paddingTop: 54,
    paddingBottom: 40,
  },
  gameScreen: {
    flex: 1,
    padding: 24,
    paddingTop: 54,
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
    marginBottom: 24,
  },
  topText: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 14,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  title: {
    color: COLORS.white,
    fontSize: 44,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 16,
  },
  stat: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },
  introTitle: {
    color: COLORS.gold,
    fontSize: 40,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
  },
  introRule: {
    color: COLORS.white,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 18,
  },
  countdown: {
    color: COLORS.gold,
    fontSize: 72,
    fontWeight: "900",
    marginTop: 38,
  },
  label: {
    color: COLORS.gold,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  bossLabel: {
    color: COLORS.gold,
  },
  polly: {
    color: COLORS.white,
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    marginTop: 28,
    fontWeight: "700",
  },
  pollySmall: {
    color: COLORS.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 12,
    fontWeight: "700",
  },
  word: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 58,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 30,
  },
  clueCard: {
    backgroundColor: COLORS.card,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    marginTop: 34,
    minHeight: 120,
    justifyContent: "center",
  },
  clueText: {
    color: COLORS.white,
    fontSize: 25,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
  },
  timerTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 24,
  },
  timerFill: {
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.gold,
    transformOrigin: "left",
  },
  conveyorWindow: {
    height: 110,
    marginTop: 40,
    overflow: "hidden",
    justifyContent: "center",
  },
  conveyorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    width: SCREEN_WIDTH * 3,
  },
  movingTile: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.gold,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 150,
    alignItems: "center",
  },
  movingTileText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  clueCounter: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 18,
  },
  inlineFeedback: {
    color: COLORS.gold,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 18,
  },
  clearWord: {
    color: COLORS.white,
    fontSize: 60,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 18,
  },
  clearTitle: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 12,
  },
  clearFeedback: {
    color: COLORS.muted,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 10,
  },
  switchClue: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "900",
    marginTop: 18,
  },
  choiceGrid: {
    marginTop: 34,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  staticChoice: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
  },
  selectedChoice: {
    borderColor: COLORS.gold,
  },
  correctChoice: {
    backgroundColor: COLORS.darkSuccess,
    borderColor: COLORS.success,
  },
  wrongChoice: {
    backgroundColor: COLORS.darkError,
    borderColor: COLORS.error,
  },
  staticChoiceText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },
  feedbackBox: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    padding: 20,
    marginTop: 28,
  },
  feedbackText: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  hiddenInstruction: {
    color: COLORS.white,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 22,
  },
  meaningBox: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
  },
  meaningLine: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    marginVertical: 5,
    textAlign: "center",
  },
  hiddenProgress: {
    color: COLORS.gold,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 26,
    letterSpacing: 3,
  },
  grid: {
    marginTop: 20,
    alignItems: "center",
    gap: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
  },
  gridCell: {
    width: 54,
    height: 54,
    backgroundColor: COLORS.card2,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCellSelected: {
    backgroundColor: COLORS.gold,
  },
  gridLetter: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },
  primaryButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: "center",
    marginTop: 28,
    width: "100%",
  },
  primaryButtonText: {
    color: COLORS.bg,
    fontSize: 19,
    fontWeight: "900",
  },
});