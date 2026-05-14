export type Meaning = {
  id: string;
  label: string;
  icon: string;
  links: string[];
  stability?: number;
};
export type WordEntry = {
  word: string;
  type: "Double" | "Triple" | "Quadruple";
  theme: string;
  difficulty: "Easy" | "Medium" | "Hard";
  meanings: Meaning[];
};

export type Prompt = {
  id: string;
  text: string;
  meaningId: string;
};

export type UpgradeChoice =
  | "timeBuffer"
  | "comboJuice"
  | "panicShield";

export type GameState = {
  currentWord: WordEntry;
  currentPrompt: Prompt;
  score: number;
  combo: number;
  correctMoves: number;
  lives: number;
  timeLeft: number;
  maxTime: number;
  status: "playing" | "upgrade" | "gameOver";
  shieldActive: boolean;
};