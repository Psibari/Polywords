import { PlaytestEvent, summarizePlaytestEvents } from './playtestTelemetry';

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

console.log('playtestTelemetry tests passed');
