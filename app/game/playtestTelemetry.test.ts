import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlaytestEvent,
  summarizePlaytestEvents,
  recordPlaytestEvent,
  flushPlaytestEvents,
  clearPlaytestHistory,
  getPlaytestEventCount,
  formatPlaytestSummaryText,
  resolveHuntTelemetryPhase,
} from './playtestTelemetry';

function ok(condition: boolean, label: string): void {
  if (!condition) throw new Error(label);
}

{
  const feelEvents: PlaytestEvent[] = [
    { name: 'hunt_decision', at: 1, data: { phase: 'confidence', visibleToTouchMs: 100, touchToCommitMs: 40, precededByAmbiguous: false } },
    { name: 'hunt_ambiguous_swipe', at: 2, data: { phase: 'confidence', dx: 70, dy: -70 } },
    { name: 'hunt_decision', at: 3, data: { phase: 'confidence', visibleToTouchMs: 300, touchToCommitMs: 80, precededByAmbiguous: true } },
    { name: 'hunt_hesitation', at: 4, data: { phase: 'confidence', seconds: 3 } },
    { name: 'hunt_hesitation', at: 5, data: { phase: 'confidence', seconds: 6 } },
    { name: 'hunt_decision', at: 6, data: { phase: 'panic', visibleToTouchMs: 500, touchToCommitMs: 120, precededByAmbiguous: false } },
    { name: 'hunt_hesitation', at: 7, data: { phase: 'panic', seconds: 3 } },
    { name: 'boss_playable', at: 8, data: { round: 10, transitionMs: 2080 } },
    { name: 'boss_playable', at: 9, data: { round: 10, transitionMs: 2400 } },
    { name: 'boss_playable', at: 10, data: { round: 10, transitionMs: 3000 } },
    { name: 'ghost_created', at: 11, data: { word: 'HORN' } },
    { name: 'ghost_created', at: 12, data: { word: 'COURT' } },
    { name: 'haunt_reached', at: 13, data: { word: 'HORN' } },
    { name: 'haunt_failed', at: 14, data: { word: 'HORN' } },
  ];
  const feelSummary = summarizePlaytestEvents(feelEvents);
  ok(feelSummary.decisionTiming.visibleToTouch.samples === 3, 'summary counts visible-to-touch samples');
  ok(feelSummary.decisionTiming.visibleToTouch.medianMs === 300, 'summary computes visible-to-touch median');
  ok(feelSummary.decisionTiming.visibleToTouch.p90Ms === 460, 'summary computes interpolated visible-to-touch P90');
  ok(feelSummary.decisionTiming.touchToCommit.medianMs === 80, 'summary computes touch-to-commit median');
  ok(feelSummary.phaseFeel.confidence.decisions === 2, 'summary groups decisions by phase');
  ok(feelSummary.phaseFeel.confidence.ambiguousReleases === 1, 'summary groups ambiguous releases by phase');
  ok(feelSummary.phaseFeel.confidence.decisionsAfterAmbiguity === 1, 'summary counts recovered ambiguous decisions by phase');
  ok(feelSummary.phaseFeel.confidence.hesitation3s === 1, 'summary groups 3-second hesitation by phase');
  ok(feelSummary.phaseFeel.confidence.hesitation6s === 1, 'summary groups 6-second hesitation by phase');
  ok(feelSummary.phaseFeel.panic.hesitation3s === 1, 'summary keeps later phases separate');
  ok(feelSummary.bossReadyTiming.medianMs === 2400, 'summary reports actual boss-ready median');
  ok(feelSummary.bossReadyTiming.p90Ms === 2880, 'summary reports actual boss-ready P90');
  ok(feelSummary.hauntLifecycle.created === 2, 'summary counts created Haunts');
  ok(feelSummary.hauntLifecycle.reached === 1, 'summary counts reached Haunts');
  ok(feelSummary.hauntLifecycle.reachRate === 0.5, 'summary computes Haunt reach rate');
  ok(feelSummary.hauntLifecycle.failRate === 1, 'summary computes failure rate among reached Haunts');

  const exportText = formatPlaytestSummaryText(feelEvents);
  ok(exportText.includes('Visible-to-touch: median 300ms, P90 460ms (3)'), 'export includes visible-to-touch timing');
  ok(exportText.includes('Boss input ready: median 2400ms, P90 2880ms (3)'), 'export includes actual boss-ready timing');
  ok(exportText.includes('confidence: 2 decisions, 1 ambiguous releases, decisions after ambiguity 1, hesitation 3s/6s/9s 1/1/0'), 'export includes phase feel and ambiguity recovery');
  ok(exportText.includes('Haunts: 2 created, 1 reached (50%), 0 cleared (0% of reached), 1 failed (100% of reached)'), 'export includes Haunt lifecycle counts and rates');
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
ok(resolveHuntTelemetryPhase({ emotionalRole: 'confidence', eventType: 'standard' }) === 'confidence', 'confidence role maps to confidence phase');
ok(resolveHuntTelemetryPhase({ emotionalRole: 'firstTension', eventType: 'standard' }) === 'tension', 'first-tension role maps to tension phase');
ok(resolveHuntTelemetryPhase({ emotionalRole: 'adrenaline', eventType: 'standard' }) === 'panic', 'adrenaline role maps to panic phase');
ok(resolveHuntTelemetryPhase({ emotionalRole: 'finalBoss', eventType: 'bossWord' }) === 'boss', 'boss event maps to boss phase');
ok(resolveHuntTelemetryPhase({ emotionalRole: 'adrenaline', eventType: 'standard', isHauntReturn: true }) === 'haunt', 'Returning Haunt keeps its own phase');

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
