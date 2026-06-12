import { DailyWord } from './types';

export const DAILY_POOL: DailyWord[] = [

  // ── TIER 1 — Round 1 (accessible snap) ──────────────────

  {
    word: 'BARK',
    meanings: [
      'A ship with three masts',
      "Pine and elm's armor",
      "Mailman's worst nightmare",
    ],
    candidates: ['BARK', 'BITE', 'LOG', 'HOWL'],
    tier: 1,
  },
  {
    word: 'RING',
    meanings: [
      'Where fighters earn it',
      "Fourth finger's resident",
      'What bells do best',
    ],
    candidates: ['RING', 'BELL', 'LOOP', 'BAND'],
    tier: 1,
  },
  {
    word: 'MATCH',
    meanings: [
      'One scratch, instant light',
      'Two things, one verdict',
      'Where rivals settle things',
    ],
    candidates: ['MATCH', 'GAME', 'LIGHTER', 'PAIR'],
    tier: 1,
  },
  {
    word: 'SPRING',
    meanings: [
      'Bouncy metal squiggle',
      'Launched from a crouch',
      'What snowmen dread most',
    ],
    candidates: ['SPRING', 'JUMP', 'COIL', 'BOUNCE'],
    tier: 1,
  },
  {
    word: 'PITCH',
    meanings: [
      "A note's altitude",
      'Blacker than black itself',
      'British grass, match-ready',
    ],
    candidates: ['PITCH', 'TONE', 'TAR', 'FIELD'],
    tier: 1,
  },
  {
    word: 'PLANT',
    meanings: [
      'Nuclear factory floor',
      'Mole in the crowd',
      'Leaves need watering',
    ],
    candidates: ['PLANT', 'SPY', 'FACTORY', 'FLOWER'],
    tier: 1,
  },
  {
    word: 'FINE',
    meanings: [
      'Thinner than thread',
      "Officer's parting gift",
      'Not a cloud above',
    ],
    candidates: ['FINE', 'THIN', 'PENALTY', 'CLEAR'],
    tier: 1,
  },
  {
    word: 'WAKE',
    meanings: [
      "A boat's churned road",
      'Goodbye before the ground',
      'Eyelids lifting at dawn',
    ],
    candidates: ['WAKE', 'TRAIL', 'FUNERAL', 'RISE'],
    tier: 1,
  },
  {
    word: 'WAVE',
    meanings: [
      'Stadium crowd ripple',
      "Your gran's old curls",
      'What surfers chase',
    ],
    candidates: ['WAVE', 'TIDE', 'CURL', 'SWELL'],
    tier: 1,
  },
  {
    word: 'SPELL',
    meanings: [
      "Cold's short visit",
      'Wand words do work',
      'Letters fall in place',
    ],
    candidates: ['SPELL', 'MAGIC', 'CURSE', 'COLD'],
    tier: 1,
  },

  // ── TIER 2 — Round 2 (medium snap) ──────────────────────

  {
    word: 'CHARGE',
    meanings: [
      'Left in your care',
      'Head down, full speed',
      "Dead phone's problem",
    ],
    candidates: ['CHARGE', 'DUTY', 'RUSH', 'BATTERY'],
    tier: 2,
  },
  {
    word: 'BEAR',
    meanings: [
      'The market that eats portfolios',
      'Grit your teeth through it',
      'Hibernates all winter',
    ],
    candidates: ['BEAR', 'STOCK', 'ENDURE', 'BULL'],
    tier: 2,
  },
  {
    word: 'PRESS',
    meanings: [
      "Gutenberg's great machine",
      'A wardrobe essential',
      'Reporters as a group',
    ],
    candidates: ['PRESS', 'IRON', 'PRINT', 'MEDIA'],
    tier: 2,
  },
  {
    word: 'BANK',
    meanings: [
      'Sky tilted on purpose',
      'What lighthouses argue with',
      "River's grassy edge",
    ],
    candidates: ['BANK', 'TILT', 'FOG', 'SHORE'],
    tier: 2,
  },
  {
    word: 'TABLE',
    meanings: [
      'Underground water level',
      'Numbers in columns',
      'Elbows get judged here',
    ],
    candidates: ['TABLE', 'CHART', 'WATER', 'DESK'],
    tier: 2,
  },
  {
    word: 'DRAFT',
    meanings: [
      "Pub's beer option",
      'Cold sneaks under',
      'First try, marked up',
    ],
    candidates: ['DRAFT', 'BEER', 'BREEZE', 'SKETCH'],
    tier: 2,
  },
  {
    word: 'RANK',
    meanings: [
      'Left too long in sun',
      'Soldiers in a row',
      'General above colonel',
    ],
    candidates: ['RANK', 'ROTTEN', 'LINE', 'ORDER'],
    tier: 2,
  },
  {
    word: 'SEAL',
    meanings: [
      'What envelopes hate losing',
      'Deal made permanent',
      'Balances ball on nose',
    ],
    candidates: ['SEAL', 'STAMP', 'DEAL', 'ANIMAL'],
    tier: 2,
  },
  {
    word: 'SENTENCE',
    meanings: [
      "Logic's unit of truth",
      'Behind bars by noon',
      'Ends with a period',
    ],
    candidates: ['SENTENCE', 'PHRASE', 'PRISON', 'LOGIC'],
    tier: 2,
  },
  {
    word: 'CAPITAL',
    meanings: [
      "Column's decorative crown",
      'Crime that costs life',
      'First letter of names',
    ],
    candidates: ['CAPITAL', 'CITY', 'ARCH', 'CRIME'],
    tier: 2,
  },

  // ── TIER 3 — Round 3 (hardest snap — the daily boss) ────

  {
    word: 'CAST',
    meanings: [
      'Friends sign the armor',
      'Poured while still hot',
      'Fishing line leaves hand',
    ],
    candidates: ['CAST', 'CREW', 'MOLD', 'THROW'],
    tier: 3,
  },
  {
    word: 'SOUND',
    meanings: [
      'Sleeping without stirring',
      'Water between islands',
      'Advice worth keeping',
    ],
    candidates: ['SOUND', 'SLEEP', 'STRAIT', 'SOLID'],
    tier: 3,
  },
  {
    word: 'STRIKE',
    meanings: [
      'Idea hits suddenly',
      'Workers walk out',
      'Ten pins, one ball',
    ],
    candidates: ['STRIKE', 'IDEA', 'PROTEST', 'BOWL'],
    tier: 3,
  },
  {
    word: 'DRAW',
    meanings: [
      "Artist's first instinct",
      'Fastest hand in the west',
      'Neither side won',
    ],
    candidates: ['DRAW', 'SKETCH', 'GUNSLINGER', 'TIE'],
    tier: 3,
  },
  {
    word: 'GROUND',
    meanings: [
      "Coffee's morning aftermath",
      'Reason behind the belief',
      'Plane stuck on earth',
    ],
    candidates: ['GROUND', 'COFFEE', 'REASON', 'LAND'],
    tier: 3,
  },
  {
    word: 'MEAN',
    meanings: [
      'Middle of the numbers',
      'Cruel without cause',
      'Intends to do it',
    ],
    candidates: ['MEAN', 'AVERAGE', 'CRUEL', 'INTEND'],
    tier: 3,
  },
  {
    word: 'CURRENT',
    meanings: [
      'Latest news this week',
      "River's invisible push",
      'This very moment',
    ],
    candidates: ['CURRENT', 'NEWS', 'FLOW', 'NOW'],
    tier: 3,
  },
  {
    word: 'FIELD',
    meanings: [
      'Questions get handled here',
      "Scientist's area of focus",
      "Cricket's outdoor theater",
    ],
    candidates: ['FIELD', 'ANSWER', 'STUDY', 'PITCH'],
    tier: 3,
  },
  {
    word: 'SET',
    meanings: [
      'Sun going down',
      'Hardened beyond changing',
      'Tennis decides it',
    ],
    candidates: ['SET', 'SUNSET', 'FIXED', 'GAME'],
    tier: 3,
  },
  {
    word: 'RUN',
    meanings: [
      "Stocking's fatal flaw",
      'Color bleeding in wash',
      "Manager's daily task",
    ],
    candidates: ['RUN', 'LADDER', 'BLEED', 'MANAGE'],
    tier: 3,
  },
];
