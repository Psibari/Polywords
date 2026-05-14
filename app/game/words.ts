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
        links: ["howl", "puppy", "leash", "woof"],
      },
      {
        id: "tree",
        label: "Tree",
        icon: "🌳",
        links: ["trunk", "forest", "wood", "oak"],
      },
    ],
  },
  {
    word: "BAT",
    type: "Double",
    theme: "Everyday",
    difficulty: "Easy",
    meanings: [
      {
        id: "animal",
        label: "Animal",
        icon: "🦇",
        links: ["cave", "night", "wing", "echo"],
      },
      {
        id: "sports",
        label: "Sport",
        icon: "🏏",
        links: ["swing", "hit", "pitch", "baseball"],
      },
    ],
  },
  {
    word: "LIGHT",
    type: "Triple",
    theme: "General",
    difficulty: "Medium",
    meanings: [
      {
        id: "glow",
        label: "Glow",
        icon: "💡",
        links: ["lamp", "bright", "shine", "bulb"],
      },
      {
        id: "weight",
        label: "Light",
        icon: "🪶",
        links: ["feather", "thin", "airy", "gentle"],
      },
      {
        id: "fire",
        label: "Fire",
        icon: "🔥",
        links: ["spark", "burn", "flame", "ignite"],
      },
    ],
  },
];