import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DAILY_ROUND_MARKERS } from '../ui/dailyCastleScene';
import { dailyHudMaterial } from '../ui/pwDailyMaterials';

/**
 * The Daily's five round markers, on the wall's frieze above the answer blocks
 * (Pete, 2026-09-28). Same dots and plate as the old top HUD row: gold done,
 * glowing white current, faint pending. DailyCastleStage places and sizes the
 * plate; `scale` is the scene's, so the dots scale with the wall they sit on.
 */
export default function DailyRoundMarkers({
  currentRound,
  total,
  scale,
}: {
  currentRound: number;
  total: number;
  scale: number;
}) {
  const m = DAILY_ROUND_MARKERS;
  const dot = m.dot * scale;
  return (
    <View
      accessible
      accessibilityLabel={`Round ${currentRound + 1} of ${total}`}
      style={[styles.plate, { gap: m.gap * scale, borderRadius: 8 * scale }]}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < currentRound;
        const isCurrent = i === currentRound;
        return (
          <View
            key={i}
            style={[
              { width: dot, height: dot, borderRadius: dot / 2 },
              isDone && styles.dotDone,
              isCurrent && styles.dotCurrent,
              !isDone && !isCurrent && styles.dotPending,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dailyHudMaterial.rowBg,
    borderWidth: 0.5,
    borderColor: dailyHudMaterial.rowBorder,
    borderBottomColor: dailyHudMaterial.rowBorderBottom,
  },
  dotDone: {
    backgroundColor: dailyHudMaterial.dotDone,
  },
  dotCurrent: {
    backgroundColor: dailyHudMaterial.dotCurrent,
    shadowColor: dailyHudMaterial.dotCurrent,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  dotPending: {
    backgroundColor: dailyHudMaterial.dotPending,
  },
});
