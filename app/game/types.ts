export type EventType =
  | 'normal'
  | 'speedRound'
  | 'decoyTension'
  | 'missingMeaning'
  | 'bossWord'
  | 'slangDrop'
  | 'wordLore'
  | 'decoyHeavy'
  | 'semanticEvolution'
  | 'phraseBreak';

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
  | 'switch';

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
  isHidden?: boolean;      // shows as ❓ until tapped correctly
  isSlang?: boolean;       // slang meaning, x2 score
  trapType?: TrapType;     // why it's wrong (traps only)
  revealLabel?: string;    // shows after tap (optional longer label)
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
};

export type PhraseBreakStep = {
  kind: 'phraseBreak';
  phrase: string;
  emotionalRole: 'reward';
  eventType: 'phraseBreak';
  question: string;
  choices: string[];
  correctChoice: string;
  pollyLine: string;
};

export type SessionStep = WordStep | PhraseBreakStep;
