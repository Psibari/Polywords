import { PlayerProgress } from './types';
import { getTodayDateString } from './dailyChallengeEngine';

export function getPreviousDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day - 1);
  return getTodayDateString(date);
}

export function applyDailyStreak(progress: PlayerProgress, today: string): PlayerProgress {
  if (progress.lastStreakDate === today) return progress;

  const isConsecutive = progress.lastStreakDate === getPreviousDateString(today);
  const currentStreak = isConsecutive ? progress.currentStreak + 1 : 1;

  return {
    ...progress,
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastStreakDate: today,
  };
}

export function getDisplayStreak(progress: PlayerProgress, today: string): number {
  if (progress.lastStreakDate === today) return progress.currentStreak;
  if (progress.lastStreakDate === getPreviousDateString(today)) return progress.currentStreak;
  return 0;
}
