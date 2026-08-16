import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlaytestEvent,
  summarizePlaytestEvents,
  recordPlaytestEvent,
  flushPlaytestEvents,
  clearPlaytestHistory,
  getPlaytestEventCount,
} from './playtestTelemetry';

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

const events: PlaytestEvent[] = [
  { name: 'hunt_death', at: 1, data: { round: 8 } },
  { name: 'hunt_death', at: 2, data: { round: 8 } },
  { name: 'boss_hidden_choice', at: 3, data: { correct: true } },
  { name: 'boss_hidden_choice', at: 4, data: { correct: false } },
];
const summary = summarizePlaytestEvents(events);
ok(summary.eventCount === 4, 'summary counts all events');
ok(summary.deathsByRound['8'] === 2, 'summary buckets death round');
ok(summary.bossHiddenAccuracy === 0.5, 'summary computes hidden accuracy');

// New V2 event names round-trip through the generic per-name counter without
// any special-casing in summarizePlaytestEvents.
{
  const v2Events: PlaytestEvent[] = [
    { name: 'ghost_created', at: 1, data: { word: 'HORN' } },
    { name: 'haunt_reached', at: 2, data: { word: 'HORN' } },
  ];
  const v2Summary = summarizePlaytestEvents(v2Events);
  ok(v2Summary.counts.ghost_created === 1, 'summary counts ghost_created');
  ok(v2Summary.counts.haunt_reached === 1, 'summary counts haunt_reached');
}

async function run(): Promise<void> {
  clearPlaytestHistory();

  let setItemCalls = 0;
  const originalSetItem = AsyncStorage.setItem;
  AsyncStorage.setItem = ((...args: Parameters<typeof AsyncStorage.setItem>) => {
    setItemCalls += 1;
    return originalSetItem(...args);
  }) as typeof AsyncStorage.setItem;

  try {
    recordPlaytestEvent('hunt_hesitation', { round: 1 });
    ok(getPlaytestEventCount() === 1, 'recordPlaytestEvent still pushes synchronously');
    ok(setItemCalls === 0, 'recordPlaytestEvent debounces the write instead of persisting synchronously');

    recordPlaytestEvent('hunt_hesitation', { round: 2 });
    ok(getPlaytestEventCount() === 2, 'a second rapid event is also recorded synchronously');
    ok(setItemCalls === 0, 'a second rapid event does not trigger a second immediate write either');

    await flushPlaytestEvents();
    ok(setItemCalls === 1, 'flushPlaytestEvents writes immediately, bypassing the debounce');

    await flushPlaytestEvents();
    ok(setItemCalls === 2, 'flushPlaytestEvents can be called again for a later run-ending moment');
  } finally {
    AsyncStorage.setItem = originalSetItem;
  }
}

run().then(() => console.log('playtestTelemetry tests passed'));
