import { WordEntry } from "./types";

export const WORDS: WordEntry[] = [
  {
    word: "BARK",
    type: "Double",
    theme: "Nature",
    difficulty: "Easy",
    meanings: [
      {
        id: "dog",
        label: "Dog",
        icon: "🐶",
        links: ["howl", "puppy", "leash"],
      },
      {
        id: "tree",
        label: "Tree",
        icon: "🌳",
        links: ["trunk", "forest", "wood"],
      },
    ],
  },
  {
    word: "LIGHT",
    type: "Triple",
    theme: "General",
    difficulty: "Easy",
    meanings: [
      {
        id: "illumination",
        label: "Light",
        icon: "💡",
        links: ["lamp", "bright", "glow"],
      },
      {
        id: "weight",
        label: "Weight",
        icon: "🪶",
        links: ["feather", "thin", "air"],
      },
      {
        id: "ignite",
        label: "Fire",
        icon: "🔥",
        links: ["burn", "spark", "flame"],
      },
    ],
  },
];