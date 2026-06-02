export type SlangEra = 'CLASSIC' | 'RETRO' | 'OLD SCHOOL' | 'THROWBACK' | 'NOW' | 'FRESH';

export interface GhostMeaning {
  wordId: string;
  word: string;
  hiddenMeaningReal: string;
  hiddenMeaningTrap: string;
  runsMissed: number;
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
  | 'semanticEvolution'
  | 'phraseBreak'
  | 'switchback';

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
  | 'climax';

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
  emoji: string;
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
  hiddenEmoji?:      string;
  hiddenTrapEmoji?:  string;
  slangEra?:         SlangEra;
  slangMaskId?:      string;
  tileStagger?:              number;
  hapticTier?:               'light' | 'medium' | 'heavy';
  bossModifier?:             'reverseMountOrder';
  postSessionPollyDuration?: number;
};

export type PhraseBreakStep = {
  kind: 'phraseBreak';
  phrase: string;
  emotionalRole: EmotionalRole;
  eventType: 'phraseBreak';
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
