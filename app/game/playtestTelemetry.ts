import AsyncStorage from '@react-native-async-storage/async-storage';

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
const STORAGE_KEY = 'polywords_playtest_events';

let events: PlaytestEvent[] = [];

function devTelemetryEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

// Loads whatever was persisted from prior sessions before any new event can
// be recorded — called once from App.tsx's boot Promise.all, same convention
// as loadGhosts/loadProgress/loadSettings/loadPollyMemory. Without this, a
// recordPlaytestEvent() early in a session would start from an empty array
// and overwrite days of accumulated history the first time it saves.
let loadPromise: Promise<void> | null = null;

export function loadPlaytestEvents(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = AsyncStorage.getItem(STORAGE_KEY)
    .then(raw => {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) events = parsed;
    })
    .catch(() => {});
  return loadPromise;
}

// Records in every build, not just __DEV__ — this is the whole point of the
// local-only playtest stopgap: without it there is no way to check the
// design's survive/master targets (docs/GAME_REFERENCE.md) against real play
// once the app ships. Nothing here ever leaves the device; see
// getPlaytestSummary()/clearPlaytestHistory() and SettingsScreen's "Playtest
// Data" section, which is the only way this data is ever surfaced (a manual
// on-device Share, never automatic, never networked).
export function recordPlaytestEvent(
  name: PlaytestEventName,
  data: PlaytestEvent['data'] = {},
): void {
  events.push({ name, at: Date.now(), data });
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events)).catch(() => {});
}

export function summarizePlaytestEvents(source: readonly PlaytestEvent[]) {
  const counts: Partial<Record<PlaytestEventName, number>> = {};
  const deathsByRound: Record<string, number> = {};
  const huntOutcomes: Record<string, number> = {};
  const dailyOutcomes: Record<string, number> = {};
  let bossChoices = 0;
  let bossCorrect = 0;

  source.forEach(event => {
    counts[event.name] = (counts[event.name] ?? 0) + 1;
    if (event.name === 'hunt_death') {
      const round = String(event.data.round ?? 'unknown');
      deathsByRound[round] = (deathsByRound[round] ?? 0) + 1;
    }
    if (event.name === 'hunt_complete') {
      const outcome = String(event.data.outcome ?? 'unknown');
      huntOutcomes[outcome] = (huntOutcomes[outcome] ?? 0) + 1;
    }
    if (event.name === 'daily_complete') {
      const status = String(event.data.status ?? 'unknown');
      dailyOutcomes[status] = (dailyOutcomes[status] ?? 0) + 1;
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
    huntOutcomes,
    dailyOutcomes,
    bossHiddenAccuracy: bossChoices > 0 ? bossCorrect / bossChoices : null,
  };
}

// Dev-console convenience only — a quick printout right after a run so a
// local dev build shows a live readout without opening Settings. No longer
// clears the persisted log (it used to): the whole point of persistence is
// history that survives one run to the next, and a debug print is not a
// reason to discard it. Use clearPlaytestHistory() to actually reset.
export function flushPlaytestSummary(label: 'hunt' | 'daily'): void {
  if (!devTelemetryEnabled() || events.length === 0) return;
  console.info(`[POLYWORDS playtest:${label}]`, summarizePlaytestEvents(events));
}

// Read-only snapshot for the Settings "Share Debug Stats" export.
export function getPlaytestSummary() {
  return summarizePlaytestEvents(events);
}

export function getPlaytestEventCount(): number {
  return events.length;
}

// Explicit reset only — Settings "Clear Debug Stats" button.
export function clearPlaytestHistory(): void {
  events = [];
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

function pct(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : '—';
}

// Human-readable text for the Settings "Share Debug Stats" button — this is
// the whole point of the stopgap: turning the docs/GAME_REFERENCE.md
// survive/master targets (54%/25%, asserted from an unreproducible
// simulation, not measured code) into numbers actually pulled off a device.
export function formatPlaytestSummaryText(): string {
  const s = getPlaytestSummary();
  if (s.eventCount === 0) return 'POLYWORDS Playtest Stats\n\nNo events recorded yet — play a Hunt or Daily run first.';

  const huntTotal = Object.values(s.huntOutcomes).reduce((a, b) => a + b, 0);
  const dailyTotal = Object.values(s.dailyOutcomes).reduce((a, b) => a + b, 0);
  const deathRounds = Object.entries(s.deathsByRound)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([round, count]) => `    round ${round}: ${count}`)
    .join('\n');

  const lines = [
    'POLYWORDS Playtest Stats',
    `Events tracked: ${s.eventCount}`,
    '',
    `Hunt runs completed: ${huntTotal}`,
    `  mastered (playerBeatPolly): ${s.huntOutcomes.playerBeatPolly ?? 0} (${pct(s.huntOutcomes.playerBeatPolly ?? 0, huntTotal)})`,
    `  survived, not mastered (playerCompleted): ${s.huntOutcomes.playerCompleted ?? 0} (${pct(s.huntOutcomes.playerCompleted ?? 0, huntTotal)})`,
    `  died (pollyWon): ${s.huntOutcomes.pollyWon ?? 0} (${pct(s.huntOutcomes.pollyWon ?? 0, huntTotal)})`,
    '',
    'Deaths by round:',
    deathRounds || '    (none)',
    '',
    `Boss hidden-tile accuracy: ${s.bossHiddenAccuracy === null ? '—' : `${Math.round(s.bossHiddenAccuracy * 100)}%`}`,
    '',
    `Daily attempts: ${dailyTotal}`,
    `  won: ${s.dailyOutcomes.won ?? 0} (${pct(s.dailyOutcomes.won ?? 0, dailyTotal)})`,
    `  lost: ${s.dailyOutcomes.lost ?? 0} (${pct(s.dailyOutcomes.lost ?? 0, dailyTotal)})`,
  ];
  return lines.join('\n');
}
