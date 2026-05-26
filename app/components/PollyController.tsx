import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { SESSION } from '../game/session';
import { getPollyBudgetState, trackPollyTime } from '../logic/pollyBudget';

const BUDGET: Record<string, number> = {
  intro:      1.5,
  perfect:    0.8,
  nearMiss:   1.0,
  bossEntry:  0.5,
  streak5:    0.3,
  locked:     1.0,
  cleanSplit: 1.2,
};

const POLLY_LINES: Record<string, string> = {
  perfect:    "Something's hiding in this one.",
  nearMiss:   'Close, but no cigar.',
  intro:      "Let's see what you've got.",
  bossEntry:  'This one bites back.',
  streak5:    "You're on fire.",
  locked:     'Locked.',
  cleanSplit: 'Clean split.',
};

export function PollyController() {
  const game = useGameStore(s => s.game);
  const clearTrigger = useGameStore(s => s.clearPollyTrigger);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!game.pollyTrigger) return;

    const { totalShown, runStart } = getPollyBudgetState();
    const runtime = Math.max((Date.now() - runStart) / 1000, 0.001);
    if (totalShown / runtime > 0.15) { clearTrigger(); return; }
    if (SESSION[game.stepIndex].eventType === 'speedRound') { clearTrigger(); return; }

    const dur = BUDGET[game.pollyTrigger];
    trackPollyTime(dur);
    setText(POLLY_LINES[game.pollyTrigger] ?? game.pollyTrigger);

    const id = setTimeout(() => {
      setText(null);
      clearTrigger();
    }, dur * 1000);

    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.pollyTrigger]);

  if (!text) {
    return (
      <View style={styles.idle}>
        <Text style={styles.idleText}>🦜</Text>
      </View>
    );
  }

  return (
    <View style={styles.active}>
      <Text style={styles.activeText}>🦜 {text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  idle: {
    alignItems: 'center',
    marginVertical: 4,
    opacity: 0.15,
  },
  idleText: {
    fontSize: 20,
  },
  active: {
    alignItems: 'center',
    marginVertical: 4,
  },
  activeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1,
  },
});
