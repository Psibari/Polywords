import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { SESSION } from '../game/session';
import { WordStep, PhraseBreakStep } from '../game/types';

const { width: SW } = Dimensions.get('window');

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  bg:          '#0F1220',
  bgCard:      '#171B2E',
  bgBoss:      '#1A0D1F',
  bgSpeed:     '#1A1000',
  bgPhrase:    '#0A1A14',
  border:      '#2A2F4A',
  borderGold:  '#F0B429',
  borderBoss:  '#993556',
  borderSpeed: '#FF6B35',
  text:        '#F0EEF8',
  textMuted:   '#8A88A0',
  textSub:     '#5A5870',
  gold:        '#F0B429',
  green:       '#06D6A0',
  red:         '#E74C3C',
  purple:      '#7C5CFC',
  orange:      '#FF6B35',
  pink:        '#D4537E',
  indigo:      '#534AB7',
};

// ─── Event type metadata ───────────────────────────────────────────────────
function getEventMeta(eventType: string) {
  switch (eventType) {
    case 'speedRound':
      return { label: '⚡ SPEED ROUND', color: C.orange, bg: C.bgSpeed, border: C.borderSpeed };
    case 'bossWord':
      return { label: '💥 BOSS WORD', color: C.pink, bg: C.bgBoss, border: C.borderBoss };
    case 'slangDrop':
      return { label: '😎 SLANG DROP', color: C.purple, bg: C.bgCard, border: C.purple };
    case 'missingMeaning':
      return { label: '💎 HIDDEN MEANING', color: C.gold, bg: C.bgCard, border: C.gold };
    case 'semanticEvolution':
      return { label: '🧠 ERA SHIFT', color: C.green, bg: C.bgCard, border: C.green };
    case 'decoyTension':
    case 'decoyHeavy':
      return { label: '⚠️ DECOY ALERT', color: C.red, bg: C.bgCard, border: C.red };
    case 'wordLore':
      return { label: '📜 WORD LORE', color: C.gold, bg: C.bgCard, border: C.gold };
    default:
      return null;
  }
}

// ─── XP Float ─────────────────────────────────────────────────────────────
function XPFloat({ value, onDone }: { value: string; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(anim, { toValue: 2, duration: 300, useNativeDriver: true }),
    ]).start(onDone);
  }, []);
  return (
    <Animated.Text style={[styles.xpFloat, {
      opacity: anim.interpolate({ inputRange: [0, 0.5, 1, 1.8, 2], outputRange: [0, 1, 1, 1, 0] }),
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1, 2], outputRange: [0, -20, -50] }) }],
    }]}>{value}</Animated.Text>
  );
}

// ─── Shift Banner ──────────────────────────────────────────────────────────
function ShiftBanner({ label, color }: { label: string; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.shiftBanner, { borderColor: color, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
      <Text style={[styles.shiftBannerText, { color }]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Lives display ─────────────────────────────────────────────────────────
function Lives({ count }: { count: number }) {
  return (
    <View style={styles.livesRow}>
      {[0, 1, 2].map(i => (
        <Text key={i} style={[styles.lifeIcon, i >= count && styles.lifeIconDead]}>♥</Text>
      ))}
    </View>
  );
}

// ─── Timer bar ─────────────────────────────────────────────────────────────
function TimerBar({ active, duration, onExpire }: { active: boolean; duration: number; onExpire: () => void }) {
  const anim = useRef(new Animated.Value(1)).current;
  const ref = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (active) {
      anim.setValue(1);
      ref.current = Animated.timing(anim, { toValue: 0, duration: duration * 1000, useNativeDriver: false });
      ref.current.start(({ finished }) => { if (finished) onExpire(); });
    } else {
      ref.current?.stop();
    }
    return () => ref.current?.stop();
  }, [active]);

  const color = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [C.red, C.gold, C.orange] });

  return (
    <View style={styles.timerTrack}>
      <Animated.View style={[styles.timerFill, { flex: anim, backgroundColor: color }]} />
    </View>
  );
}

// ─── Meaning Tile ──────────────────────────────────────────────────────────
function MeaningTile({
  meaning,
  isSelected,
  isCorrect,
  isWrong,
  isHidden,
  isSlang,
  isModern,
  onPress,
  revealed,
}: {
  meaning: { id: string; label: string; icon?: string; hidden?: boolean; isSlang?: boolean; era?: string };
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isHidden: boolean;
  isSlang: boolean;
  isModern: boolean;
  onPress: () => void;
  revealed: boolean;
}) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isWrong) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    if (isCorrect) {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.06, damping: 10, stiffness: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 10, stiffness: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isWrong, isCorrect]);

  let bg = C.bgCard;
  let border = C.border;
  let labelColor = C.text;

  if (revealed && isCorrect) { bg = '#063D2E'; border = C.green; labelColor = '#7FFFD4'; }
  else if (revealed && isWrong) { bg = '#3D0F1F'; border = C.red; labelColor = '#FF9999'; }
  else if (isHidden) { bg = '#1A1500'; border = C.gold; }
  else if (isSlang) { bg = '#12082A'; border = C.purple; }
  else if (isModern) { bg = '#081A12'; border = C.green; }

  const displayLabel = meaning.hidden && !revealed ? '???' : meaning.label;
  const displayIcon = meaning.hidden && !revealed ? '🔮' : meaning.icon;

  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.tile, { backgroundColor: bg, borderColor: border }]}
        onPress={onPress}
        disabled={revealed}
        activeOpacity={0.75}
      >
        <View style={styles.tileInner}>
          <Text style={styles.tileIcon}>{displayIcon || '▸'}</Text>
          <Text style={[styles.tileLabel, { color: labelColor }]}>{displayLabel}</Text>
          {isSlang && !revealed && <View style={styles.slangBadge}><Text style={styles.slangBadgeText}>SLANG</Text></View>}
          {isModern && !revealed && <View style={styles.eraBadge}><Text style={styles.eraBadgeText}>MODERN</Text></View>}
          {revealed && isCorrect && <Text style={styles.tileTick}>✓</Text>}
          {revealed && isWrong && <Text style={styles.tileCross}>✗</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Results Screen ────────────────────────────────────────────────────────
function ResultsScreen({ score, combo, hiddenFound, onRestart }: {
  score: number; combo: number; hiddenFound: number; onRestart: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 16, stiffness: 140, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const grade = score >= 5000 ? 'S' : score >= 3000 ? 'A' : score >= 1500 ? 'B' : 'C';
  const gradeColor = grade === 'S' ? C.gold : grade === 'A' ? C.green : grade === 'B' ? C.purple : C.textMuted;

  // Retention hook — what they almost got
  const nearMiss = hiddenFound === 0
    ? '💎 You missed all hidden meanings — find them next run!'
    : combo < 5
    ? '🔥 One more combo and you would have hit PERFECT FLOW'
    : null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
        <Text style={styles.resultsTitle}>Session Complete</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{score.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.orange }]}>{combo}x</Text>
            <Text style={styles.statLabel}>Best Combo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: C.gold }]}>{hiddenFound}</Text>
            <Text style={styles.statLabel}>Hidden Found</Text>
          </View>
        </View>

        {nearMiss && (
          <View style={styles.nearMissCard}>
            <Text style={styles.nearMissText}>{nearMiss}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.85}>
          <Text style={styles.restartBtnText}>Play Again ↗</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Phrase Break Screen ───────────────────────────────────────────────────
function PhraseBreakScreen({ step, onAnswer }: { step: PhraseBreakStep; onAnswer: (c: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(SW)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }).start();
  }, []);

  const pick = (c: string) => {
    if (selected) return;
    setSelected(c);
    setTimeout(() => onAnswer(c), 900);
  };

  return (
    <Animated.View style={[styles.phraseContainer, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.phraseHeader}>
        <Text style={styles.phraseEyebrow}>🎉 PHRASE BREAK</Text>
        <Text style={styles.phraseTitle}>"{step.phrase}"</Text>
        <Text style={styles.phraseQuestion}>{step.question}</Text>
      </View>
      <View style={styles.phraseChoices}>
        {step.choices.map((c, i) => {
          const isSelected = selected === c;
          const isCorrect = c === step.correctChoice;
          let bg = C.bgCard;
          let border = C.border;
          if (selected && isCorrect) { bg = '#063D2E'; border = C.green; }
          else if (selected && isSelected && !isCorrect) { bg = '#3D0F1F'; border = C.red; }
          return (
            <TouchableOpacity key={i} style={[styles.phraseChoice, { backgroundColor: bg, borderColor: border }]} onPress={() => pick(c)} disabled={!!selected} activeOpacity={0.75}>
              <Text style={styles.phraseChoiceText}>{c}</Text>
              {selected && isCorrect && <Text style={styles.tileTick}>✓</Text>}
              {selected && isSelected && !isCorrect && <Text style={styles.tileCross}>✗</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GAME SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export default function GameScreen({ navigation }: any) {
  const { game, startGame, submitAnswer, submitPhraseAnswer } = useGameStore();

  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMeta, setBannerMeta] = useState<{ label: string; color: string } | null>(null);
  const [prevEventType, setPrevEventType] = useState<string>('');
  const [xpFloats, setXpFloats] = useState<{ id: number; value: string }[]>([]);
  const [xpCounter, setXpCounter] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const [selectedMeaningId, setSelectedMeaningId] = useState<string | null>(null);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const screenShakeAnim = useRef(new Animated.Value(0)).current;

  const step = SESSION[game.currentStepIndex];
  const isWord = step?.kind === 'word';
  const wordStep = isWord ? (step as WordStep) : null;
  const phraseStep = !isWord ? (step as PhraseBreakStep) : null;

  // Animate card in when step changes
  useEffect(() => {
    cardAnim.setValue(0);
    setSelectedMeaningId(null);
    setTimerExpired(false);
    Animated.spring(cardAnim, { toValue: 1, damping: 16, stiffness: 160, useNativeDriver: true }).start();

    // Show shift banner when event type changes
    if (wordStep && wordStep.eventType !== prevEventType && prevEventType !== '') {
      const meta = getEventMeta(wordStep.eventType);
      if (meta) {
        setBannerMeta(meta);
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 1800);
      }
    }
    if (wordStep) setPrevEventType(wordStep.eventType);
  }, [game.currentStepIndex]);

  // Show feedback
  useEffect(() => {
    if (game.feedback) {
      setLastFeedback(game.feedback);
      feedbackAnim.setValue(0);
      Animated.sequence([
        Animated.timing(feedbackAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      // Screen shake on boss hit
      if (game.feedback.includes('BOSS HIT')) {
        Animated.sequence([
          Animated.timing(screenShakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
          Animated.timing(screenShakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(screenShakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(screenShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }

      // Float XP on positive feedback
      const xpMatch = game.feedback.match(/\+(\d+)/);
      if (xpMatch) {
        const id = xpCounter + 1;
        setXpCounter(id);
        setXpFloats(prev => [...prev, { id, value: `+${xpMatch[1]} XP` }]);
      } else if (game.feedback.includes('x')) {
        const id = xpCounter + 1;
        setXpCounter(id);
        setXpFloats(prev => [...prev, { id, value: game.feedback! }]);
      }
    }
  }, [game.feedback]);

  const handleAnswer = useCallback((meaningId: string) => {
    setSelectedMeaningId(meaningId);
    submitAnswer(meaningId);
  }, [submitAnswer]);

  const handleTimerExpire = useCallback(() => {
    setTimerExpired(true);
    // Force wrong on timer expiry — find first unselected correct meaning
    if (wordStep) {
      const clue = wordStep.clues[game.currentClueIndex];
      submitAnswer('__timeout__');
    }
  }, [wordStep, game.currentClueIndex, submitAnswer]);

  const handlePhraseAnswer = useCallback((choice: string) => {
    submitPhraseAnswer(choice);
  }, [submitPhraseAnswer]);

  // ── Game Over ──
  if (game.status === 'gameOver') {
    const hiddenFound = Object.keys(game.revealedMeanings).length;
    return <ResultsScreen score={game.score} combo={game.combo} hiddenFound={hiddenFound} onRestart={startGame} />;
  }

  // ── Complete ──
  if (game.status === 'complete') {
    const hiddenFound = Object.keys(game.revealedMeanings).length;
    return <ResultsScreen score={game.score} combo={game.combo} hiddenFound={hiddenFound} onRestart={startGame} />;
  }

  // ── No step ──
  if (!step) return null;

  const eventMeta = wordStep ? getEventMeta(wordStep.eventType) : null;
  const isSpeedRound = wordStep?.eventType === 'speedRound';
  const isBossWord = wordStep?.eventType === 'bossWord';
  const screenBg = eventMeta?.bg || C.bg;
  const clue = wordStep?.clues[game.currentClueIndex];

  return (
    <Animated.View style={[styles.rootWrap, { transform: [{ translateX: screenShakeAnim }] }]}>
      <SafeAreaView style={[styles.root, { backgroundColor: screenBg }]}>

        {/* Shift Banner */}
        {showBanner && bannerMeta && (
          <View style={styles.bannerWrap}>
            <ShiftBanner label={bannerMeta.label} color={bannerMeta.color} />
          </View>
        )}

        {/* XP Floats */}
        <View style={styles.xpWrap} pointerEvents="none">
          {xpFloats.map(f => (
            <XPFloat key={f.id} value={f.value} onDone={() => setXpFloats(prev => prev.filter(x => x.id !== f.id))} />
          ))}
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: eventMeta?.border || C.border }]}>
          <Lives count={game.lives} />
          <View style={styles.headerCenter}>
            {eventMeta && <Text style={[styles.eventLabel, { color: eventMeta.color }]}>{eventMeta.label}</Text>}
            <Text style={styles.wordCounter}>
              Word {game.currentStepIndex + 1} of {SESSION.length}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{game.score.toLocaleString()}</Text>
            {game.combo > 1 && <Text style={styles.comboText}>{game.combo}x</Text>}
          </View>
        </View>

        {/* Speed timer */}
        {isSpeedRound && (
          <TimerBar active={!timerExpired && game.status === 'playing'} duration={5} onExpire={handleTimerExpire} />
        )}

        {/* Feedback bar */}
        <Animated.View style={[styles.feedbackBar, { opacity: feedbackAnim, backgroundColor: lastFeedback?.includes('✗') || lastFeedback?.includes('💔') || lastFeedback?.includes('💥') ? '#3D0F1F' : '#063D2E' }]}>
          <Text style={styles.feedbackText}>{lastFeedback}</Text>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Phrase Break */}
          {phraseStep && game.status === 'phraseBreak' && (
            <PhraseBreakScreen step={phraseStep} onAnswer={handlePhraseAnswer} />
          )}

          {/* Word Step */}
          {wordStep && (
            <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>

              {/* Main Word */}
              <View style={[styles.wordCard, { borderColor: eventMeta?.border || C.border, backgroundColor: isBossWord ? '#1A0A20' : C.bgCard }]}>
                {isBossWord && <Text style={styles.bossLabel}>⚔️  BOSS WORD</Text>}
                <Text style={[styles.mainWord, { color: isBossWord ? C.pink : C.text }]}>{wordStep.word}</Text>
                <View style={styles.clueProgress}>
                  {wordStep.clues.map((_, i) => (
                    <View key={i} style={[styles.clueDot, i < game.currentClueIndex && styles.clueDotDone, i === game.currentClueIndex && styles.clueDotActive]} />
                  ))}
                </View>
              </View>

              {/* Clue Card */}
              {clue && (
                <View style={[styles.clueCard, { borderColor: eventMeta?.border || C.border }]}>
                  {isSpeedRound && <Text style={styles.clueEyebrow}>⚡ Match fast for bonus XP</Text>}
                  <Text style={styles.clueText}>"{clue.text}"</Text>
                  {clue.isSlangClue && <Text style={styles.clueBadge}>😎 slang clue</Text>}
                  {clue.isModernEraClue && <Text style={[styles.clueBadge, { color: C.green }]}>🧠 modern usage</Text>}
                </View>
              )}

              {/* Meaning Tiles */}
              <View style={styles.tilesGrid}>
                {wordStep.meanings.map(m => {
                  const isSelected = selectedMeaningId === m.id;
                  const isCorrect = clue?.correctMeaningId === m.id;
                  const isWrong = isSelected && !isCorrect;
                  const wasRevealed = !!game.revealedMeanings[m.id];
                  return (
                    <MeaningTile
                      key={m.id}
                      meaning={m}
                      isSelected={isSelected}
                      isCorrect={isSelected && isCorrect}
                      isWrong={isWrong}
                      isHidden={!!m.hidden && !wasRevealed}
                      isSlang={!!m.isSlang}
                      isModern={m.era === 'modern'}
                      revealed={isSelected}
                      onPress={() => handleAnswer(m.id)}
                    />
                  );
                })}
              </View>

              {/* Word Lore */}
              {wordStep.lore && game.currentClueIndex === wordStep.clues.length - 1 && (
                <View style={styles.loreCard}>
                  <Text style={styles.loreTitle}>{wordStep.lore.title}</Text>
                  <Text style={styles.loreText}>{wordStep.lore.text}</Text>
                </View>
              )}

            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootWrap: { flex: 1 },
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40, gap: 12 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  headerCenter: { flex: 1, alignItems: 'center' },
  eventLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  wordCounter: { fontSize: 11, color: C.textMuted },
  scoreBox: { alignItems: 'flex-end' },
  scoreText: { fontSize: 16, fontWeight: '700', color: C.gold },
  comboText: { fontSize: 11, color: C.orange, fontWeight: '700' },

  // Lives
  livesRow: { flexDirection: 'row', gap: 3 },
  lifeIcon: { fontSize: 18, color: C.red },
  lifeIconDead: { opacity: 0.2 },

  // Timer
  timerTrack: { height: 4, flexDirection: 'row', backgroundColor: C.bgCard },
  timerFill: { height: 4 },

  // Feedback
  feedbackBar: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  feedbackText: { color: C.text, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Shift Banner
  bannerWrap: { position: 'absolute', top: 100, left: 0, right: 0, zIndex: 100, alignItems: 'center' },
  shiftBanner: { borderWidth: 1.5, borderRadius: 30, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.bgCard },
  shiftBannerText: { fontSize: 15, fontWeight: '800', letterSpacing: 2 },

  // XP Floats
  xpWrap: { position: 'absolute', top: 120, right: 24, zIndex: 200 },
  xpFloat: { fontSize: 18, fontWeight: '800', color: C.gold, textShadowColor: C.gold, textShadowRadius: 8 },

  // Word Card
  wordCard: { borderWidth: 1.5, borderRadius: 16, padding: 20, alignItems: 'center' },
  bossLabel: { fontSize: 11, fontWeight: '700', color: C.pink, letterSpacing: 2, marginBottom: 8 },
  mainWord: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  clueProgress: { flexDirection: 'row', gap: 8, marginTop: 12 },
  clueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  clueDotDone: { backgroundColor: C.green },
  clueDotActive: { backgroundColor: C.gold, width: 20 },

  // Clue Card
  clueCard: { borderWidth: 1.5, borderRadius: 14, padding: 18, backgroundColor: C.bgCard },
  clueEyebrow: { fontSize: 11, color: C.orange, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  clueText: { fontSize: 18, color: C.text, fontStyle: 'italic', lineHeight: 26, textAlign: 'center' },
  clueBadge: { marginTop: 8, fontSize: 12, color: C.purple, fontWeight: '600', textAlign: 'center' },

  // Tiles
  tilesGrid: { gap: 10 },
  tile: { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  tileInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  tileIcon: { fontSize: 22 },
  tileLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  tileTick: { fontSize: 18, color: C.green, fontWeight: '700' },
  tileCross: { fontSize: 18, color: C.red, fontWeight: '700' },
  slangBadge: { backgroundColor: '#12082A', borderWidth: 1, borderColor: C.purple, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  slangBadgeText: { fontSize: 9, color: C.purple, fontWeight: '700', letterSpacing: 1 },
  eraBadge: { backgroundColor: '#081A12', borderWidth: 1, borderColor: C.green, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  eraBadgeText: { fontSize: 9, color: C.green, fontWeight: '700', letterSpacing: 1 },

  // Lore
  loreCard: { borderWidth: 1, borderColor: C.gold, borderRadius: 14, padding: 16, backgroundColor: '#1A1200' },
  loreTitle: { fontSize: 11, color: C.gold, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  loreText: { fontSize: 14, color: C.text, lineHeight: 22 },

  // Phrase Break
  phraseContainer: { flex: 1 },
  phraseHeader: { padding: 20, alignItems: 'center', gap: 8 },
  phraseEyebrow: { fontSize: 12, color: C.green, fontWeight: '700', letterSpacing: 2 },
  phraseTitle: { fontSize: 28, fontWeight: '900', color: C.text, textAlign: 'center' },
  phraseQuestion: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  phraseChoices: { gap: 10, paddingHorizontal: 16 },
  phraseChoice: { borderWidth: 1.5, borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phraseChoiceText: { fontSize: 16, color: C.text, fontWeight: '600', flex: 1 },

  // Results
  resultsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  gradeText: { fontSize: 96, fontWeight: '900', lineHeight: 100 },
  resultsTitle: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 32 },
  statsGrid: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  nearMissCard: { width: '100%', backgroundColor: '#1A1200', borderWidth: 1, borderColor: C.gold, borderRadius: 14, padding: 16, marginBottom: 24 },
  nearMissText: { fontSize: 14, color: C.gold, lineHeight: 22, textAlign: 'center' },
  restartBtn: { width: '100%', backgroundColor: C.purple, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  restartBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});