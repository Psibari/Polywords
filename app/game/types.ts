export type ClueType =
  | 'vivid'
  | 'opposite'
  | 'negative'
  | 'slang'
  | 'context'
  | 'emoji'
  | 'era'
  | 'misdirect';

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
  | 'reward';

export type Meaning = {
  id: string;
  label: string;
  icon: string;
  hidden?: boolean;
  isSlang?: boolean;
  era?: 'old' | 'modern';
};

export type Clue = {
  text: string;
  correctMeaningId: string;
  clueType: ClueType;
  difficulty: 1 | 2 | 3;
  isSlangClue?: boolean;
  isModernEraClue?: boolean;
};

export type WordStep = {
  kind: 'word';
  word: string;
  emotionalRole: EmotionalRole;
  eventType: EventType;
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
