import { SessionStep } from "./types";

export const SESSION: SessionStep[] = [
  // 1 — BARK
  {
    kind: "word",
    word: "BARK",
    emotionalRole: "confidence",
    eventType: "normal",
    meanings: [
      { id: "dogSound", label: "Dog Sound", icon: "🐶" },
      { id: "treeLayer", label: "Tree Skin", icon: "🌳" },
    ],
    clues: [
      { text: "Sharp sound from a dog", correctMeaningId: "dogSound" },
      { text: "Rough skin of a tree", correctMeaningId: "treeLayer" },
      { text: "Noise from the yard", correctMeaningId: "dogSound" },
      { text: "Outside layer of wood", correctMeaningId: "treeLayer" },
    ],
  },

  // 2 — BAT (Speed)
  {
    kind: "word",
    word: "BAT",
    emotionalRole: "confidence",
    eventType: "speedRound",
    meanings: [
      { id: "animal", label: "Night Flyer", icon: "🦇" },
      { id: "sportsTool", label: "Swing Tool", icon: "⚾" },
    ],
    clues: [
      { text: "Cave shadow", correctMeaningId: "animal" },
      { text: "Home-run swing", correctMeaningId: "sportsTool" },
      { text: "Night wings", correctMeaningId: "animal" },
      { text: "Hit it hard", correctMeaningId: "sportsTool" },
    ],
  },

  // 3 — LIGHT
  {
    kind: "word",
    word: "LIGHT",
    emotionalRole: "curiosity",
    eventType: "normal",
    meanings: [
      { id: "brightness", label: "Brightness", icon: "💡" },
      { id: "notHeavy", label: "Not Heavy", icon: "🪶" },
      { id: "ignite", label: "Set Fire", icon: "🔥" },
      { id: "paleColor", label: "Pale Color", icon: "🎨" },
    ],
    clues: [
      { text: "Glow in the dark", correctMeaningId: "brightness" },
      { text: "Opposite of heavy", correctMeaningId: "notHeavy" },
      { text: "Start a candle", correctMeaningId: "ignite" },
      { text: "Soft blue shade", correctMeaningId: "paleColor" },
      { text: "Room after the switch", correctMeaningId: "brightness" },
      { text: "Easy to carry", correctMeaningId: "notHeavy" },
    ],
  },

  // 4 — DUCK
  {
    kind: "word",
    word: "DUCK",
    emotionalRole: "relief",
    eventType: "normal",
    meanings: [
      { id: "bird", label: "Water Bird", icon: "🦆" },
      { id: "lowerHead", label: "Dodge Low", icon: "⬇️" },
    ],
    clues: [
      { text: "Pond swimmer", correctMeaningId: "bird" },
      { text: "Lower your head fast", correctMeaningId: "lowerHead" },
      { text: "Quacks near water", correctMeaningId: "bird" },
      { text: "Avoid the flying ball", correctMeaningId: "lowerHead" },
    ],
  },

  // 5 — MATCH
  {
    kind: "word",
    word: "MATCH",
    emotionalRole: "hesitation",
    eventType: "decoyTension",
    meanings: [
      { id: "contest", label: "Contest", icon: "🏟" },
      { id: "fireStick", label: "Flame Stick", icon: "🔥" },
      { id: "similarity", label: "Same Fit", icon: "🧩" },
      { id: "correspond", label: "Fits", icon: "✅" },
    ],
    clues: [
      { text: "Tennis showdown", correctMeaningId: "contest" },
      { text: "Tiny flame on a stick", correctMeaningId: "fireStick" },
      { text: "Colors that belong together", correctMeaningId: "similarity" },
      { text: "Skills fit the job", correctMeaningId: "correspond" },
      { text: "Final score battle", correctMeaningId: "contest" },
      { text: "Perfect pair", correctMeaningId: "similarity" },
    ],
  },

  // 6 — SPRING (Hidden Meaning)
  {
    kind: "word",
    word: "SPRING",
    emotionalRole: "surprise",
    eventType: "missingMeaning",
    meanings: [
      { id: "season", label: "Bloom Season", icon: "🌸" },
      { id: "coil", label: "Metal Coil", icon: "🌀" },
      { id: "waterSource", label: "???", hidden: true },
      { id: "jump", label: "Leap", icon: "🐇" },
    ],
    clues: [
      { text: "Winter’s opposite", correctMeaningId: "season" },
      { text: "Bouncy metal coil", correctMeaningId: "coil" },
      { text: "Mountain water source", correctMeaningId: "waterSource" },
      { text: "Leap upward", correctMeaningId: "jump" },
      { text: "Flowers return", correctMeaningId: "season" },
      { text: "Sudden jump", correctMeaningId: "jump" },
    ],
  },

  // 7 — BANK (Boss)
  {
    kind: "word",
    word: "BANK",
    emotionalRole: "boss",
    eventType: "bossWord",
    meanings: [
      { id: "money", label: "Money", icon: "🏦" },
      { id: "riverEdge", label: "River Edge", icon: "🌊" },
      { id: "aircraftTilt", label: "Plane Tilt", icon: "✈️" },
      { id: "reserve", label: "Reserve", icon: "🩸" },
    ],
    clues: [
      { text: "Where money waits", correctMeaningId: "money" },
      { text: "Land beside flowing water", correctMeaningId: "riverEdge" },
      { text: "Plane leaning into a turn", correctMeaningId: "aircraftTilt" },
      { text: "Emergency blood supply", correctMeaningId: "reserve" },
      { text: "Loan counter", correctMeaningId: "money" },
      { text: "Muddy river side", correctMeaningId: "riverEdge" },
      { text: "Sharp aircraft turn", correctMeaningId: "aircraftTilt" },
      { text: "Stored backup supply", correctMeaningId: "reserve" },
    ],
  },

  // 8 — PHRASE BREAK
  {
    kind: "phraseBreak",
    phrase: "Spill the beans",
    emotionalRole: "reward",
    eventType: "phraseBreak",
    question: "Where did this phrase likely come from?",
    choices: [
      "Secret voting with beans",
      "Cooking soup",
      "Farm markets",
      "Pirate treasure",
    ],
    correctChoice: "Secret voting with beans",
  },

  // 9 — WAVE
  {
    kind: "word",
    word: "WAVE",
    emotionalRole: "relief",
    eventType: "normal",
    meanings: [
      { id: "water", label: "Water Swell", icon: "🌊" },
      { id: "hand", label: "Hand Signal", icon: "👋" },
    ],
    clues: [
      { text: "Ocean rising up", correctMeaningId: "water" },
      { text: "Goodbye with your hand", correctMeaningId: "hand" },
      { text: "Surf rolling in", correctMeaningId: "water" },
      { text: "Friendly motion across the room", correctMeaningId: "hand" },
    ],
  },

  // 10 — ROCK (Slang)
  {
    kind: "word",
    word: "ROCK",
    emotionalRole: "surprise",
    eventType: "slangDrop",
    meanings: [
      { id: "stone", label: "Stone", icon: "🪨" },
      { id: "music", label: "Loud Music", icon: "🎸" },
      { id: "sway", label: "Gentle Sway", icon: "👶" },
      { id: "diamond", label: "Flashy Diamond", icon: "💎", isSlang: true },
    ],
    clues: [
      { text: "Hard chunk of earth", correctMeaningId: "stone" },
      { text: "Guitar-heavy sound", correctMeaningId: "music" },
      { text: "Soothe with motion", correctMeaningId: "sway" },
      { text: "Flashy ring stone", correctMeaningId: "diamond", isSlangClue: true },
      { text: "Boulder in the path", correctMeaningId: "stone" },
      { text: "Cradle back and forth", correctMeaningId: "sway" },
    ],
  },

  // 11 — KEY (Lore)
  {
    kind: "word",
    word: "KEY",
    emotionalRole: "curiosity",
    eventType: "wordLore",
    meanings: [
      { id: "lockTool", label: "Lock Opener", icon: "🔑" },
      { id: "crucial", label: "Crucial Thing", icon: "⭐" },
      { id: "music", label: "Music Tone", icon: "🎵" },
      { id: "keyboard", label: "Button", icon: "⌨️" },
    ],
    clues: [
      { text: "Opens the door", correctMeaningId: "lockTool" },
      { text: "The thing that matters most", correctMeaningId: "crucial" },
      { text: "Song’s tonal home", correctMeaningId: "music" },
      { text: "Button under your finger", correctMeaningId: "keyboard" },
      { text: "Unlocking metal shape", correctMeaningId: "lockTool" },
      { text: "Central answer", correctMeaningId: "crucial" },
    ],
    lore: {
      title: "WORD LORE UNLOCKED",
      text: "“Key” became a symbol for answers, access, and control.",
    },
  },

  // 12 — CHECK
  {
    kind: "word",
    word: "CHECK",
    emotionalRole: "hesitation",
    eventType: "decoyHeavy",
    meanings: [
      { id: "examine", label: "Inspect", icon: "🔍" },
      { id: "payment", label: "Payment Slip", icon: "💵" },
      { id: "pattern", label: "Square Pattern", icon: "◼️" },
      { id: "chess", label: "King Threat", icon: "♟" },
    ],
    clues: [
      { text: "Look it over", correctMeaningId: "examine" },
      { text: "Pay with paper", correctMeaningId: "payment" },
      { text: "Black-and-white squares", correctMeaningId: "pattern" },
      { text: "King under threat", correctMeaningId: "chess" },
      { text: "Verify the answer", correctMeaningId: "examine" },
      { text: "Restaurant payment slip", correctMeaningId: "payment" },
    ],
  },

  // 13 — SICK (Semantic Evolution)
  {
    kind: "word",
    word: "SICK",
    emotionalRole: "surprise",
    eventType: "semanticEvolution",
    meanings: [
      { id: "ill", label: "Ill", icon: "🤒" },
      { id: "impressive", label: "Impressive", icon: "🔥", era: "modern" },
    ],
    clues: [
      { text: "Fever and chills", correctMeaningId: "ill" },
      { text: "That trick was wild", correctMeaningId: "impressive", isModernEraClue: true },
      { text: "Hospital bed feeling", correctMeaningId: "ill" },
      { text: "Crowd went crazy", correctMeaningId: "impressive", isModernEraClue: true },
    ],
  },

  // 14 — CAN (Speed)
  {
    kind: "word",
    word: "CAN",
    emotionalRole: "relief",
    eventType: "speedRound",
    meanings: [
      { id: "container", label: "Metal Container", icon: "🥫" },
      { id: "able", label: "Able To", icon: "💪" },
    ],
    clues: [
      { text: "Soup in metal", correctMeaningId: "container" },
      { text: "Able to do it", correctMeaningId: "able" },
      { text: "Pop the lid", correctMeaningId: "container" },
      { text: "You’ve got the ability", correctMeaningId: "able" },
    ],
  },

  // 15 — ORDER (Final Boss)
  {
    kind: "word",
    word: "ORDER",
    emotionalRole: "boss",
    eventType: "bossWord",
    meanings: [
      { id: "sequence", label: "Sequence", icon: "🔢" },
      { id: "purchase", label: "Purchase Request", icon: "📦" },
      { id: "command", label: "Command", icon: "🗣" },
      { id: "arrangement", label: "Arrangement", icon: "⚖️" },
    ],
    clues: [
      { text: "Alphabet lined up", correctMeaningId: "sequence" },
      { text: "Package request", correctMeaningId: "purchase" },
      { text: "General’s command", correctMeaningId: "command" },
      { text: "Chaos cleaned up", correctMeaningId: "arrangement" },
      { text: "First, second, third", correctMeaningId: "sequence" },
      { text: "Checkout confirmation", correctMeaningId: "purchase" },
      { text: "Do it now", correctMeaningId: "command" },
      { text: "Everything in place", correctMeaningId: "arrangement" },
    ],
  },
];