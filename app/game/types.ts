export type SlangEra = 'CLASSIC' | 'RETRO' | 'OLD SCHOOL' | 'THROWBACK' | 'NOW' | 'FRESH';

export interface GhostMeaning {
  wordId: string;
  word: string;
  hiddenMeaningReal: string;
  hiddenMeaningTrap: string;
  hiddenPairId?: string;
  runsMissed: number;
  isGhostedMaster?: boolean;
  // Run-scoped idempotency marker for Returning Haunt failure reconciliation.
  lastHauntResolutionId?: string;
}

export type GhostRevenge = {
  result: 'correct' | 'wrong';
  word: string;
  meaningText: string;
} | null;

export type EventType =
  | 'normal'
  | 'standard'
  | 'speedRound'
  | 'decoyTension'
  | 'missingMeaning'
  | 'bossWord'
  | 'slangDrop'
  | 'wordLore'
  | 'decoyHeavy'
  | 'semanticEvolution';

export type EmotionalRole =
  | 'confidence'
  | 'curiosity'
  | 'hesitation'
  | 'surprise'
  | 'boss'
  | 'relief'
  | 'reward'
  | 'calibration'
  | 'trap'
  | 'switch'
  | 'opener'
  | 'flow'
  | 'tension'
  | 'brainGlitch'
  | 'recovery'
  | 'freshness'
  | 'culturalSnap'
  | 'adrenaline'
  | 'nearMiss'
  | 'climax'
  | 'firstTension'
  | 'disruption'
  | 'escalation'
  | 'firstBoss'
  | 'rebound'
  | 'lateShock'
  | 'finalBoss'
  | 'panic';

export type Meaning = {
  id: string;
  text: string;
  emoji?: string;
  hidden?: boolean;
  isSlang?: boolean;
  era?: 'old' | 'modern';
};

export type TrapType =
  | 'associatedNeighbor'   // related concept, not a meaning
  | 'domainNeighbor'       // same topic area, wrong word
  | 'almostSynonym'        // crosses the semantic line
  | 'visualNeighbor'       // shares imagery, not meaning
  | 'commonMisconception'  // what players assume
  | 'phraseTrap'           // from a phrase, not standalone
  | 'morphologyTrap'       // related word form
  | 'homophoneTrap';       // sounds connected, isn't

export type Mask = {
  id: string;
  emoji?: string;
  phrase: string;          // recognition-first feeling, not a definition
  isReal: boolean;         // true = correct meaning, false = trap
  isRare?: boolean;        // real meaning most players miss, +300
  isHidden?: boolean;      // shows as ❓ until swiped correctly
  isSlang?: boolean;       // slang meaning, x2 score
  trapType?: TrapType;     // why it's wrong (traps only)
  revealLabel?: string;    // shows after swipe (optional longer label)
  era?: 'old' | 'modern'; // for semanticEvolution words
  borderline?: boolean;  // trap that edges close to a real meaning
};

export type HiddenPair = {
  id: string;
  real: string;
  trap: string;
};

export type WordStep = {
  kind: 'word';
  word: string;
  emotionalRole: EmotionalRole;
  eventType: EventType | null;
  meanings: Meaning[];
  masks: Mask[];
  pollyLine?: string;
  lore?: {
    title: string;
    text: string;
  };
  hiddenMeaning?:    string;
  hiddenTrap?:       string;
  hiddenPairs?:       HiddenPair[];
  slangEra?:         SlangEra;
  slangMaskId?:      string;
  difficulty?:               'easy' | 'medium' | 'hard';
  tileStagger?:              number;
  hapticTier?:               'light' | 'medium' | 'heavy';
  bossModifier?:             boolean;
  postSessionPollyDuration?: number;
  isHauntReturn?:            boolean;
  isMasteryRematch?:         boolean;
};

export type PhraseBreakStep = {
  kind: 'phraseBreak';
  phrase: string;
  emotionalRole: EmotionalRole;
  eventType: 'phraseBreak';
  hapticTier?: 'light' | 'medium' | 'heavy';
  question: string;
  answers: { text: string; correct: boolean }[];
  pollyReveal: string;
  pollyLine?: string;
};

export type SwitchbackStep = {
  kind: 'switchback';
  maskA: { text: string };
  maskB: { text: string };
  answers: { word: string; correct: boolean }[];
  pollyReveal: string;
  emotionalRole?:   EmotionalRole;
  eventType?:       EventType | null;
  hapticTier?:      'light' | 'medium' | 'heavy';
  pollyLine?:       string;
  pollyBufferDelay?: number;
  pollyBufferLine?:  string;
  // pool-entry metadata
  id?:          string;
  word?:        string;
  labelA?:      string;
  labelB?:      string;
  senseA?:      string;
  senseB?:      string;
  switchbackId?: string;
};

export type SessionStep = WordStep | PhraseBreakStep | SwitchbackStep;

export type MasteredWordRecord = {
  word: string;
  isBoss: boolean;
  hiddenMeaningFound: string;
  hiddenMeaningsFound?: string[];
  hiddenPairIds?: string[];
  priorHauntAttempts?: number;
  dateMastered: string;
  flawless?: boolean;
};

export type PlayerProgress = {
  masteredWords: MasteredWordRecord[];
  personalBest: number;
  runsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  // First-reached date (ISO) per rank tier letter (D/C/B/A/S/MASTER) — see
  // app/game/ranks.ts computeRankHistoryUpdates(). Absent tiers haven't been
  // reached yet; personalBest alone has no record of when a tier was first hit.
  rankHistory?: Partial<Record<string, string>>;
  /** Stable hidden-pair ids (e.g. 'battery_h00') the player has answered correctly,
   *  whether or not the word was ultimately mastered. Set semantics — each id
   *  appears at most once. There is no denominator and no ceiling by design.
   *  Not to be confused with MasteredWordRecord.hiddenMeaningsFound, which
   *  holds REAL-text strings, not ids. */
  hiddenPairIdsFound?: string[];
  /** Words actually shown to the player across their most recent runs,
   *  most-recent-first, capped. Biases word selection away from immediate
   *  repeats — never a hard exclusion, never surfaced to the player, not a
   *  permanent record like masteredWords. */
  recentWordIds?: string[];
};

export type DailyTier = 1 | 2 | 3;

export type DailyCandidates = [
  string,
  string,
  string,
  string,
  string,
  string,
];

export type DailyClues = [string, string, string];

export type DailyWord = {
  id: string;
  answer: string;
  tier: DailyTier;
  clues: DailyClues;
  candidates: DailyCandidates;
};

export type DailyRevealedClueCount = 1 | 2 | 3;
export type DailyChanceCount = 0 | 1 | 2;
export type DailySessionStatus = 'active' | 'won' | 'lost';
export type DailyPollyReaction = 'firstMiss' | 'loss' | 'win';

export type DailyRound = {
  roundIndex: number;
  word: DailyWord;
  candidates: DailyCandidates;
  revealedClueCount: DailyRevealedClueCount;
  solved: boolean;
  wrongClaims: string[];
};

export type DailySession = {
  date: string;
  challengeNumber: number;
  rounds: DailyRound[];
  currentRoundIndex: number;
  chancesRemaining: DailyChanceCount;
  status: DailySessionStatus;
  solvedCount: number;
  startedAt: number;
  // Active time spent on the current round. Wall-clock time while the app is
  // backgrounded or Daily is out of focus must not reveal extra clues.
  roundElapsedMs: number;
  completedAt?: number;
};

export type DailyClaimResult = {
  isCorrect: boolean;
  status: DailySessionStatus;
  chancesRemaining: DailyChanceCount;
  revealedClueCount: DailyRevealedClueCount;
  solvedCount: number;
  roundAdvanced: boolean;
  pollyReaction?: DailyPollyReaction;
};

export type DailyRoundResult = {
  word: string;
  tier: DailyTier;
  status: 'solved' | 'missed' | 'unreached';
  wrongClaims: number;
  cluesUsed: DailyRevealedClueCount;
};

export type DailyResult = {
  date: string;
  challengeNumber: number;
  status: 'won' | 'lost';
  solvedCount: number;
  chancesRemaining: DailyChanceCount;
  goldFeatherEarned: boolean;
  completedAt: number;
  // Temporary read-only fields for the quarantined stale screen/store.
  title: string;
  livesLeft: DailyChanceCount;
  wordResults: DailyRoundResult[];
  shareText: string;
};

// Temporary adapter shape for quarantined stale store/screen imports.
export type DailyChallengeState = {
  session: DailySession;
  date: string;
  rounds: Array<DailyWord & {
    word: string;
    meanings: DailyClues;
  }>;
  currentRound: number;
  lives: DailyChanceCount;
  remainingCandidates: string[][];
  results: DailyRoundResult[];
  status: 'playing' | 'complete';
};
