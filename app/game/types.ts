export type Meaning = {
  id: string;
  label: string;
  icon: string;
  links: string[];
};

export type WordEntry = {
  word: string;
  type: "Double" | "Triple" | "Quadruple";
  theme: string;
  difficulty: "Easy" | "Medium" | "Hard";
  meanings: Meaning[];
};

export type GameState = {
  currentWord: WordEntry;
  selectedMeaningId: string | null;
  answers: string[];
  correctAnswer: string;
  score: number;
  combo: number;
  correctMoves: number;
  lives: number;
  timeLeft: number;
  maxTime: number;
  status: "playing" | "upgrade" | "gameOver";
  shieldActive: boolean;
};