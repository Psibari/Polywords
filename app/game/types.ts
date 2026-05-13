export type Meaning = {
  id: string;
  label: string;
};

export type Prompt = {
  id: string;
  text: string;
  meaningId: string;
};

export type GameState = {
  word: string;
  meanings: Meaning[];
  queue: Prompt[];
  score: number;
  combo: number;
  gameOver: boolean;
};