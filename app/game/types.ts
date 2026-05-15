export type Meaning = {
  id: string;
  label: string;
  icon?: string;
  hidden?: boolean;
  isSlang?: boolean;
  era?: "old" | "modern";
};

export type Clue = {
  text: string;
  correctMeaningId: string;
  isSlangClue?: boolean;
  isModernEraClue?: boolean;
};

export type WordStep = {
  kind: "word";
  word: string;
  emotionalRole:
    | "confidence"
    | "curiosity"
    | "relief"
    | "hesitation"
    | "surprise"
    | "boss";
  eventType:
    | "normal"
    | "speedRound"
    | "decoyTension"
    | "missingMeaning"
    | "bossWord"
    | "slangDrop"
    | "wordLore"
    | "decoyHeavy"
    | "semanticEvolution";
  meanings: Meaning[];
  clues: Clue[];
  lore?: {
    title: string;
    text: string;
  };
};

export type PhraseBreakStep = {
  kind: "phraseBreak";
  phrase: string;
  emotionalRole: "reward";
  eventType: "phraseBreak";
  question: string;
  choices: string[];
  correctChoice: string;
};

export type SessionStep = WordStep | PhraseBreakStep;