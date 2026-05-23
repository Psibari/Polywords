// ============================================================
// POLY WORDS — POLY RUN SESSION
// 4-word Mask session. Fixed order. No randomization.
// ============================================================

import { SessionStep, WordStep, PhraseBreakStep } from './types';

export const SESSION: SessionStep[] = [
  {
    kind: 'word',
    word: 'BARK',
    emotionalRole: 'confidence',
    eventType: 'normal',
    meanings: [],
    masks: [
      { id: 'bark_dog',    emoji: '🐶', phrase: 'Sharp noise from a dog', isReal: true },
      { id: 'bark_tree',   emoji: '🌳', phrase: 'Rough coat on a log',    isReal: true },
      { id: 'bark_loud',   emoji: '🔊', phrase: 'Loud commanding sound',  isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bark_howl',   emoji: '🐺', phrase: 'Howl at the moon',       isReal: false, trapType: 'domainNeighbor' },
      { id: 'bark_forest', emoji: '🌿', phrase: "Nature's outer armor",   isReal: false, trapType: 'visualNeighbor' },
    ],
  },
  {
    kind: 'word',
    word: 'BOLT',
    emotionalRole: 'confidence',
    eventType: 'speedRound',
    pollyLine: 'Three meanings. One word. No mercy.',
    meanings: [],
    masks: [
      { id: 'bolt_fastener', emoji: '🔩', phrase: "Nut's threaded partner", isReal: true },
      { id: 'bolt_dash',     emoji: '💨', phrase: 'Gone before you blinked', isReal: true },
      { id: 'bolt_lightning',emoji: '⚡', phrase: "Sky's electric whip",    isReal: true },
      { id: 'bolt_lock',     emoji: '🚪', phrase: 'Lock on a door',          isReal: false, trapType: 'associatedNeighbor' },
      { id: 'bolt_explode',  emoji: '💥', phrase: 'Sudden explosion',         isReal: false, trapType: 'almostSynonym' },
      { id: 'bolt_sprint',   emoji: '🏃', phrase: 'Sprint forward',           isReal: false, trapType: 'domainNeighbor' },
    ],
  },
  {
    kind: 'word',
    word: 'LIGHT',
    emotionalRole: 'curiosity',
    eventType: 'normal',
    meanings: [],
    masks: [
      { id: 'light_glow',   emoji: '💡', phrase: 'Glow in the dark',      isReal: true },
      { id: 'light_weight', emoji: '🪶', phrase: 'Easy to carry',         isReal: true },
      { id: 'light_ignite', emoji: '🔥', phrase: 'Set something burning', isReal: true },
      { id: 'light_pale',   emoji: '🎨', phrase: 'Washed-out blue',       isReal: true },
      { id: 'light_sun',    emoji: '☀️', phrase: 'The sun itself',         isReal: false, trapType: 'visualNeighbor' },
      { id: 'light_flash',  emoji: '⚡', phrase: 'Electric flash',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'light_candle', emoji: '🕯️', phrase: 'A candle',               isReal: false, trapType: 'visualNeighbor' },
    ],
  },
  {
    kind: 'word',
    word: 'DRAFT',
    emotionalRole: 'boss',
    eventType: 'bossWord',
    pollyLine: 'Careful. This one pulls in every direction.',
    meanings: [],
    masks: [
      { id: 'draft_version',  emoji: '📝', phrase: 'First messy version',       isReal: true },
      { id: 'draft_cold',     emoji: '🌬️', phrase: 'Cold air sneaking in',      isReal: true },
      { id: 'draft_recruit',  emoji: '🏈', phrase: 'Teams pick new players',    isReal: true },
      { id: 'draft_beer',     emoji: '🍺', phrase: 'Beer pulled from a tap',    isReal: true },
      { id: 'draft_airforce', emoji: '✈️', phrase: 'Air Force selection',       isReal: true, isHidden: true },
      { id: 'draft_final',   emoji: '📄', phrase: 'Final document',             isReal: false, trapType: 'almostSynonym' },
      { id: 'draft_winter',  emoji: '❄️', phrase: 'Winter cold',               isReal: false, trapType: 'domainNeighbor' },
      { id: 'draft_sketch',  emoji: '✏️', phrase: 'Sketch or drawing',         isReal: false, trapType: 'domainNeighbor' },
      { id: 'draft_bar',     emoji: '🍻', phrase: 'Bar scene',                 isReal: false, trapType: 'domainNeighbor' },
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
