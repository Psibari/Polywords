import { WORDBANK } from './wordBank';

// Define the shape of a Game Session
export interface GameSession {
  level: number;
  rounds: any[];
  totalScore: number;
  lives: number;
}

export class GameController {
  private usedWords: Set<string> = new Set();

  /**
   * Generates a unique level experience based on the player's progress.
   * @param level The current level number (1 to 100+)
   */
  generateLevel(level: number) {
    // 1. Determine how many words for this level
    // Early levels are shorter (3-5 words), later levels get longer.
    const wordCount = Math.min(3 + Math.floor(level / 5), 8);

    // 2. Filter the Bank by difficulty
    // We scale difficulty based on level: Level 1 is 100% Easy. Level 20 is a mix.
    const easyWords = WORDBANK.filter(w => w.difficulty === 'Easy' && !this.usedWords.has(w.word));
    const mediumWords = WORDBANK.filter(w => w.difficulty === 'Medium' && !this.usedWords.has(w.word));
    const bossWords = WORDBANK.filter(w => w.isBoss === true && !this.usedWords.has(w.word));

    let levelSelection: any[] = [];

    // 3. The "Level Recipe"
    if (level < 3) {
      // Tutorial phase: Just easy double-meaning words
      levelSelection = this.getRandom(easyWords, wordCount);
    } else if (level % 5 === 0) {
      // Every 5th level is a "BOSS RUSH": Mostly triples/quads
      levelSelection = [
        ...this.getRandom(mediumWords, wordCount - 1),
        ...this.getRandom(bossWords, 1)
      ];
    } else {
      // Standard Level: Mixed bag
      levelSelection = [
        ...this.getRandom(easyWords, 2),
        ...this.getRandom(mediumWords, wordCount - 2)
      ];
    }

    // 4. Mark words as used so the player doesn't get bored
    levelSelection.forEach(w => this.usedWords.add(w.word));

    // Reset usedWords if we've seen almost everything (739 words is a lot!)
    if (this.usedWords.size > 600) this.usedWords.clear();

    return this.shuffle(levelSelection);
  }

  /**
   * Logic for the "Switch Up" clue selection.
   * Pulls a random clue from the word's variants.
   */
  getNextClue(wordObj: any) {
    const randomIndex = Math.floor(Math.random() * wordObj.variants.length);
    return wordObj.variants[randomIndex];
  }

  // Helpers
  private getRandom(arr: any[], n: number) {
    const result = new Array(n);
    let len = arr.length;
    const taken = new Array(len);
    if (n > len) return arr; // Fallback if we run out of specific difficulty
    while (n--) {
      const x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  private shuffle(array: any[]) {
    return array.sort(() => Math.random() - 0.5);
  }
}

export const GameEngine = new GameController();