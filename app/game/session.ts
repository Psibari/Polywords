// ============================================================
// POLY WORDS — POLY RUN SESSION
// 12-word Poly Run session. Fixed order. No randomization.
// ============================================================

import { SessionStep, WordStep, PhraseBreakStep, SwitchbackStep } from './types';

// ============================================================
// SESSION — 12 steps
// ============================================================

export const SESSION: SessionStep[] = [

  // STEP 1 — LIGHT (Standard, confidence)
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'confidence',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    pollyLine: 'More than one kind of light.',
    meanings: [],
    hiddenMeaning:   'Where the bird rested',
    hiddenTrap:      "A traffic signal's job",
    hiddenEmoji:     '🌿',
    hiddenTrapEmoji: '🚦',
    masks: [
      { id: 'light_darkness', emoji: '✨', phrase: 'What darkness surrenders to', isReal: true },
      { id: 'light_weight',   emoji: '🪶', phrase: 'Easy on the shoulders',       isReal: true },
      { id: 'light_wick',     emoji: '🕯️', phrase: 'Sets the wick going',          isReal: true },
      { id: 'light_pale',     emoji: '🫧', phrase: 'Washed out, almost white',    isReal: true },
      { id: 'light_monday',   emoji: '😌', phrase: "Monday's easier cousin",      isReal: false, trapType: 'almostSynonym' },
      { id: 'light_green',    emoji: '🟢', phrase: 'Green means go',              isReal: false, trapType: 'domainNeighbor' },
      { id: 'light_gentle',   emoji: '🌬️', phrase: 'A gentle kind of force',      isReal: false, trapType: 'visualNeighbor' },
    ],
  },

  // STEP 2 — BARK (Standard, flow)
  {
    kind: 'word',
    word: 'BARK',
    emotionalRole: 'flow',
    eventType: 'standard',
    difficulty: 'easy',
    hapticTier: 'light',
    tileStagger: 80,
    pollyLine: "Don't rush. One of these bites.",
    meanings: [],
    hiddenMeaning:   "A doorframe's parting gift",
    hiddenTrap:      "A lemon's bitter coat",
    hiddenEmoji:     '🚪',
    hiddenTrapEmoji: '🍋',
    masks: [
      { id: 'bark_order', emoji: '🫵', phrase: "Boss's favorite verb",      isReal: true },
      { id: 'bark_tree',  emoji: '🌳', phrase: "A trunk's outer jacket",    isReal: true },
      { id: 'bark_dog',   emoji: '🐕', phrase: 'What startles the mailman', isReal: true },
      { id: 'bark_growl', emoji: '🐩', phrase: 'A low rumbling warning',    isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_wolf',  emoji: '🐺', phrase: "A pack's night anthem",     isReal: false, trapType: 'domainNeighbor' },
      { id: 'bark_pie',   emoji: '🥧', phrase: 'Inside every apple pie',    isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 3 — MATCH (Standard, firstTension)
  {
    kind: 'word',
    word: 'MATCH',
    emotionalRole: 'firstTension',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    pollyLine: 'One of these is ancient history.',
    meanings: [],
    hiddenMeaning:   'Slow-burning battle cord',
    hiddenTrap:      "Your reflection's nod back",
    hiddenEmoji:     '🧨',
    hiddenTrapEmoji: '🪞',
    masks: [
      { id: 'match_rivals',  emoji: '⚔️', phrase: 'Where rivals settle things',    isReal: true },
      { id: 'match_flame',   emoji: '🪔', phrase: 'One scratch, instant light',    isReal: true },
      { id: 'match_pair',    emoji: '🤝', phrase: 'Two people, one verdict',       isReal: true },
      { id: 'match_copy',    emoji: '🧩', phrase: 'Identical by accident',         isReal: true },
      { id: 'match_tie',     emoji: '🎯', phrase: "The scoreboard's awkward tie",  isReal: false, trapType: 'almostSynonym' },
      { id: 'match_trophy',  emoji: '🏅', phrase: "A winner's permanent record",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'match_sticks',  emoji: '🎋', phrase: 'Little sticks, big ambitions',  isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 4 — COLD (Switchback, disruption)
  // After resolve: 1500ms Polly buffer → "Back to meanings. Stay sharp."
  {
    kind: 'switchback',
    emotionalRole: 'disruption',
    eventType: 'switchback',
    hapticTier: 'medium',
    maskA: { text: 'Left out on purpose' },
    maskB: { text: "Fever's uninvited guest" },
    answers: [
      { word: 'COLD',  correct: true  },
      { word: 'WARM',  correct: false },
      { word: 'SICK',  correct: false },
      { word: 'CHILL', correct: false },
    ],
    pollyReveal: 'Same word. Two completely different bad days.',
    pollyLine:   'Same word. Two completely different bad days.',
    pollyBufferDelay: 1500,
    pollyBufferLine:  'Back to meanings. Stay sharp.',
  },

  // STEP 5 — PHRASE BREAK: "Give it a shot" (relief)
  {
    kind: 'phraseBreak',
    emotionalRole: 'relief',
    eventType: 'phraseBreak',
    hapticTier: 'light',
    phrase: 'Give it a shot',
    question: 'Which of these capture its meaning?',
    answers: [
      { text: 'Try it once',   correct: true  },
      { text: 'Take a chance', correct: true  },
      { text: 'Pour a drink',  correct: false },
      { text: 'Aim carefully', correct: false },
    ],
    pollyReveal: 'From firearms to slang — one word, four lives.',
    pollyLine:   'One word. Four journeys.',
  },

  // STEP 6 — RAW (Slang Drop, freshness) — NOW era
  // Tile order: traps first, slang real last
  {
    kind: 'word',
    word: 'RAW',
    emotionalRole: 'freshness',
    eventType: 'slangDrop',
    slangEra: 'NOW',
    slangMaskId: 'raw_slang',
    hapticTier: 'medium',
    tileStagger: 80,
    pollyLine: 'Same word. Different century.',
    meanings: [],
    masks: [
      { id: 'raw_uncooked', emoji: '🥩', phrase: 'Not yet cooked',        isReal: true },
      { id: 'raw_tender',   emoji: '🤕', phrase: 'Tender to the touch',   isReal: true },
      { id: 'raw_exposed',  emoji: '🫣', phrase: 'Exposed and unguarded', isReal: true },
      { id: 'raw_slang',    emoji: '🔥', phrase: 'Uncut and electric',    isReal: true,  isSlang: true, era: 'modern' },
    ],
  },

  // STEP 7 — WAKE (Standard, escalation)
  {
    kind: 'word',
    word: 'WAKE',
    emotionalRole: 'escalation',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    pollyLine: 'Three meanings. One carries more weight.',
    meanings: [],
    hiddenMeaning:   'The mess nobody chose',
    hiddenTrap:      'Water that has opinions',
    hiddenEmoji:     '💧',
    hiddenTrapEmoji: '🌙',
    masks: [
      { id: 'wake_boat',    emoji: '🚢', phrase: "A boat's churned-up road",  isReal: true },
      { id: 'wake_funeral', emoji: '🪦', phrase: 'Goodbye before the ground', isReal: true },
      { id: 'wake_dawn',    emoji: '🌄', phrase: 'Eyelids lifting at dawn',   isReal: true },
      { id: 'wake_alarm',   emoji: '⏰', phrase: "Alarm clocks' one purpose", isReal: false, trapType: 'almostSynonym' },
      { id: 'wake_snooze',  emoji: '😴', phrase: 'Nine more minutes, always', isReal: false, trapType: 'associatedNeighbor' },
      { id: 'wake_river',   emoji: '🌊', phrase: "A river's gentle push",     isReal: false, trapType: 'domainNeighbor' },
    ],
  },

  // STEP 8 — PITCH (Standard, hesitation)
  {
    kind: 'word',
    word: 'PITCH',
    emotionalRole: 'hesitation',
    eventType: 'standard',
    difficulty: 'hard',
    hapticTier: 'medium',
    tileStagger: 80,
    pollyLine: 'Four meanings. One word. Stay sharp.',
    meanings: [],
    hiddenMeaning:   'Sailors sealed hulls with this',
    hiddenTrap:      "A thrower's signature move",
    hiddenEmoji:     '⛵',
    hiddenTrapEmoji: '🥎',
    masks: [
      { id: 'pitch_note',     emoji: '🎵', phrase: "A note's altitude",          isReal: true },
      { id: 'pitch_sales',    emoji: '💼', phrase: 'Where the sales begin',      isReal: true },
      { id: 'pitch_grass',    emoji: '⚽', phrase: 'British grass, match-ready', isReal: true },
      { id: 'pitch_black',    emoji: '🖤', phrase: 'Blacker than black itself',  isReal: true },
      { id: 'pitch_darkness', emoji: '🌑', phrase: 'Blackness made absolute',    isReal: false, trapType: 'almostSynonym' },
      { id: 'pitch_tent',     emoji: '⛺', phrase: "A tent's founding moment",   isReal: false, trapType: 'domainNeighbor' },
      { id: 'pitch_mound',    emoji: '🏟️', phrase: "The mound's main character", isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 9 — SPRING (Boss, firstBoss)
  {
    kind: 'word',
    word: 'SPRING',
    emotionalRole: 'firstBoss',
    eventType: 'bossWord',
    difficulty: 'hard',
    hapticTier: 'heavy',
    tileStagger: 100,
    bossModifier: true,
    pollyLine: 'Boss word. More meanings. Same clock.',
    meanings: [],
    hiddenMeaning:   "A mousetrap's big moment",
    hiddenTrap:      'A water source bubbling up',
    hiddenEmoji:     '🐭',
    hiddenTrapEmoji: '💦',
    masks: [
      { id: 'spring_coil',     emoji: '🔩', phrase: 'Bouncy metal squiggle',    isReal: true },
      { id: 'spring_jump',     emoji: '🤸', phrase: 'Launched from a crouch',   isReal: true },
      { id: 'spring_water',    emoji: '💦', phrase: 'Bubbling up from nowhere', isReal: true },
      { id: 'spring_season',   emoji: '☃️', phrase: 'What snowmen dread most',  isReal: true },
      { id: 'spring_mattress', emoji: '😴', phrase: "A mattress's bounce",      isReal: false, trapType: 'almostSynonym' },
      { id: 'spring_rivers',   emoji: '🏔️', phrase: 'Where rivers begin',       isReal: false, trapType: 'domainNeighbor' },
      { id: 'spring_cage',     emoji: '🔓', phrase: 'A cage door flying open',  isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 10 — BANK (Standard, rebound)
  {
    kind: 'word',
    word: 'BANK',
    emotionalRole: 'rebound',
    eventType: 'standard',
    difficulty: 'medium',
    hapticTier: 'medium',
    tileStagger: 80,
    pollyLine: 'Not just where money lives.',
    meanings: [],
    hiddenMeaning:   'What lighthouses argue with',
    hiddenTrap:      'Guarded by serious steel',
    hiddenEmoji:     '🌫️',
    hiddenTrapEmoji: '🔒',
    masks: [
      { id: 'bank_tilt',     emoji: '✈️', phrase: 'Sky tilted on purpose',             isReal: true },
      { id: 'bank_frozen',   emoji: '🧊', phrase: 'Frozen just in case',               isReal: true },
      { id: 'bank_river',    emoji: '🏞️', phrase: "A river's grassy edge",             isReal: true },
      { id: 'bank_money',    emoji: '🏦', phrase: 'Where your cash hibernates',        isReal: true },
      { id: 'bank_interest', emoji: '📈', phrase: 'Where interest quietly multiplies', isReal: false, trapType: 'almostSynonym' },
      { id: 'bank_cliff',    emoji: '🪨', phrase: 'Straight vertical drop',            isReal: false, trapType: 'domainNeighbor' },
      { id: 'bank_teller',   emoji: '💳', phrase: "A teller's long queue",             isReal: false, trapType: 'associatedNeighbor' },
    ],
  },

  // STEP 11 — STRIKE (Switchback, lateShock)
  {
    kind: 'switchback',
    emotionalRole: 'lateShock',
    eventType: 'switchback',
    hapticTier: 'medium',
    maskA: { text: 'Lightning does it' },
    maskB: { text: "Bowler's perfect throw" },
    answers: [
      { word: 'STRIKE', correct: true  },
      { word: 'HIT',    correct: false },
      { word: 'BOLT',   correct: false },
      { word: 'BOWL',   correct: false },
    ],
    pollyReveal: 'STRIKE hits. STRIKE wins.',
  },

  // STEP 12 — ORDER (Boss, finalBoss)
  {
    kind: 'word',
    word: 'ORDER',
    emotionalRole: 'finalBoss',
    eventType: 'bossWord',
    difficulty: 'hard',
    hapticTier: 'heavy',
    tileStagger: 100,
    bossModifier: true,
    postSessionPollyDuration: 3000,
    pollyLine: "That's everything. Did any of those surprise you?",
    meanings: [],
    hiddenMeaning:   'Below class, above family',
    hiddenTrap:      "The bench's final document",
    hiddenEmoji:     '⛪',
    hiddenTrapEmoji: '🏛️',
    masks: [
      { id: 'order_monks',        emoji: '🧹', phrase: 'What monks answer to',              isReal: true },
      { id: 'order_command',      emoji: '🎖️', phrase: 'Said once, not twice',              isReal: true },
      { id: 'order_purchase',     emoji: '📬', phrase: 'Your choice made official',         isReal: true },
      { id: 'order_arrange',      emoji: '🗂️', phrase: 'Chaos cleaned up',                  isReal: true },
      { id: 'order_court',        emoji: '⚖️', phrase: "A judge's last ruling",            isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_queue',        emoji: '🛒', phrase: 'The British national pastime',      isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_instructions', emoji: '📋', phrase: 'The instructions, page one',        isReal: false, trapType: 'associatedNeighbor' },
      { id: 'order_checklist',    emoji: '🔄', phrase: 'Everything ticked, nothing missed', isReal: false, trapType: 'almostSynonym' },
    ],
  },

];

// ============================================================
// HELPERS
// ============================================================

export function getStep(index: number): SessionStep | null {
  return SESSION[index] ?? null;
}

export function getTotalSteps(): number {
  return SESSION.length;
}

export function isWordStep(step: SessionStep): step is WordStep {
  return step.kind === 'word';
}

export function isPhraseBreak(step: SessionStep): step is PhraseBreakStep {
  return step.kind === 'phraseBreak';
}

export function isSwitchbackStep(step: SessionStep): step is SwitchbackStep {
  return step.kind === 'switchback';
}
