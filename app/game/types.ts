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

export type Clue = {
  text: string;
  correctMeaningId: string;
  isDecoy: boolean;
  trickType: 'opposite' | 'emoji' | 'equation' | 'action' | 'rephrase' | 'none';
  spawnDelayMs: number;
};

export type WordStep = {
  kind: 'word';
  word: string;
  mode?: 'conveyorBlitz' | 'switchback' | 'boss';
  emotionalRole: EmotionalRole;
  eventType: EventType | null;
  meanings: Meaning[];
  clues: Clue[];
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
