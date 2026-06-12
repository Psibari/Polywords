export type SlangEra = 'CLASSIC' | 'RETRO' | 'OLD SCHOOL' | 'THROWBACK' | 'NOW' | 'FRESH';

export interface GhostMeaning {
  wordId: string;
  word: string;
  hiddenMeaningReal: string;
  hiddenMeaningTrap: string;
  runsMissed: number;
  isGhostedMaster?: boolean;
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
  phrase: string;          // 2-4 words max, feeling not definition
  isReal: boolean;         // true = correct meaning, false = trap
  isRare?: boolean;        // real meaning most players miss, +300
  isHidden?: boolean;      // shows as ❓ until swiped correctly
  isSlang?: boolean;       // slang meaning, x2 score
  trapType?: TrapType;     // why it's wrong (traps only)
  revealLabel?: string;    // shows after swipe (optional longer label)
  era?: 'old' | 'modern'; // for semanticEvolution words
  borderline?: boolean;  // trap that edges close to a real meaning
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
  slangEra?:         SlangEra;
  slangMaskId?:      string;
  difficulty?:               'easy' | 'medium' | 'hard';
  tileStagger?:              number;
  hapticTier?:               'light' | 'medium' | 'heavy';
  bossModifier?:             boolean;
  postSessionPollyDuration?: number;
  isHauntReturn?:            boolean;
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
  dateMastered: string;
};

export type PlayerProgress = {
  masteredWords: MasteredWordRecord[];
  personalBest: number;
  runsCompleted: number;
};

export type DailyTier = 1 | 2 | 3;

export type DailyWord = {
  word:       string;
  meanings:   [string, string, string]; // exactly 3, hardest → easiest
  candidates: string[];                 // 9 word board: 1 correct + 8 distractors
  tier:       DailyTier;
};

export type DailyRoundStatus = 'solved' | 'missed' | 'pending';

export type DailyRoundResult = {
  word:        string;
  tier:        DailyTier;
  status:      DailyRoundStatus;
  wrongSwipes: number;
};

export type DailyTitle =
  | 'WORD MASTER'
  | 'SHARP'
  | 'SURVIVED'
  | 'HAUNTED';

export type DailyChallengeState = {
  date:                string;             // YYYY-MM-DD
  rounds:              DailyWord[];        // 3 rounds, one per tier
  currentRound:        number;             // 0 | 1 | 2
  lives:               number;             // starts at 2
  remainingCandidates: string[][];         // [round][candidate] — shrinks as tiles exit
  results:             DailyRoundResult[];
  status:              'playing' | 'complete';
};

export type DailyResult = {
  date:            string;
  challengeNumber: number;
  title:           DailyTitle;
  solvedCount:     number;     // 0–3
  livesLeft:       number;
  wordResults:     DailyRoundResult[];
  shareText:       string;
};
