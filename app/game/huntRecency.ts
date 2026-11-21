import { SessionStep, WordStep } from './types';
import rawHuntData from '../../assets/data/huntData.json';

// FULL VARIETY (Pete, 2026-11-20). Friend testers kept meeting the same words: the game only
// remembered the last 30 words, and a quit Hunt remembered nothing. Pete's rule: every word gets
// played before any word repeats (Haunts, mastered returns and the pinned Boss excepted).
//
// So the memory holds every word in the bank, most recent first. The generator deals any
// unplayed word before a remembered one, and replays remembered words oldest first. Once the
// whole bank has been played the list is full, and the oldest words simply come round again.
export const RECENT_WORDS_CAP = Object.keys(rawHuntData).length;

/** Words the player actually met this Hunt, in play order (rounds 1..stepIndex+1). */
export function reachedWords(session: readonly SessionStep[], stepIndex: number): string[] {
  return session
    .slice(0, stepIndex + 1)
    .filter((s): s is WordStep => s.kind === 'word')
    .map(s => s.word);
}

/** New memory: this Hunt's words first (latest round first), then the old memory, no duplicates. */
export function rememberReachedWords(
  reached: readonly string[],
  previous: readonly string[],
  cap: number = RECENT_WORDS_CAP,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...reached].reverse().concat(previous)) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= cap) break;
  }
  return out;
}
