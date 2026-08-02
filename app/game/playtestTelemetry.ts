export type PlaytestEventName =
  | 'hunt_ambiguous_swipe'
  | 'hunt_hesitation'
  | 'hunt_complete'
  | 'hunt_death'
  | 'haunt_cleared'
  | 'boss_hidden_choice'
  | 'daily_abandon_candidate'
  | 'daily_complete'
  | 'daily_loss';

export type PlaytestEvent = {
  name: PlaytestEventName;
  at: number;
  data: Record<string, string | number | boolean>;
};

const MAX_EVENTS = 500;
let events: PlaytestEvent[] = [];

function devTelemetryEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function recordPlaytestEvent(
  name: PlaytestEventName,
  data: PlaytestEvent['data'] = {},
): void {
  if (!devTelemetryEnabled()) return;
  events.push({ name, at: Date.now(), data });
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
}

export function summarizePlaytestEvents(source: readonly PlaytestEvent[]) {
  const counts: Partial<Record<PlaytestEventName, number>> = {};
  const deathsByRound: Record<string, number> = {};
  let bossChoices = 0;
  let bossCorrect = 0;

  source.forEach(event => {
    counts[event.name] = (counts[event.name] ?? 0) + 1;
    if (event.name === 'hunt_death') {
      const round = String(event.data.round ?? 'unknown');
      deathsByRound[round] = (deathsByRound[round] ?? 0) + 1;
    }
    if (event.name === 'boss_hidden_choice') {
      bossChoices += 1;
      if (event.data.correct === true) bossCorrect += 1;
    }
  });

  return {
    eventCount: source.length,
    counts,
    deathsByRound,
    bossHiddenAccuracy: bossChoices > 0 ? bossCorrect / bossChoices : null,
  };
}

export function flushPlaytestSummary(label: 'hunt' | 'daily'): void {
  if (!devTelemetryEnabled() || events.length === 0) return;
  console.info(`[POLYWORDS playtest:${label}]`, summarizePlaytestEvents(events));
  events = [];
}
