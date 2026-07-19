import React, { forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { dailyScrollMaterial as M } from '../../ui/pwDailyMaterials';
import DailyPanelFrame from './DailyPanelFrame';
import DailyRevealCurtain from './DailyRevealCurtain';

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Native driver: transform + opacity only.
  rollProgress: Animated.Value;
  // 0 = clue showing, 1 = purple reveal panel fully covers the card. Native driver: transform + opacity only.
  revealProgress?: Animated.Value;
  // Daily's day-progress feathers: 1-4 correct claims today shows that many
  // white feathers; the 5th (revealPerfect) shows a single gold feather and
  // gilds the card border for the rest of that reveal.
  revealFeatherCount?: number;
  revealPerfect?: boolean;
  children: React.ReactNode;
};

const VIEW_H = 190;
// Tuned for this panel's own size (~190px tall) — HERO_BOOK_PERSPECTIVE (2000)
// is scaled for HeroBook's much larger cover and would read nearly flat here.
const PANEL_PERSPECTIVE = 900;

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel(
    { rollProgress, revealProgress, revealFeatherCount, revealPerfect, children },
    ref,
  ) {
    const rollRotateY = rollProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['-90deg', '0deg'],
    });

    // front-content: fades + sinks as the curtain drops (CSS: opacity 0, translateY(30%))
    const frontOpacity = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
      : 1;
    const frontTranslateY = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [0, VIEW_H * 0.3] })
      : 0;

    // .content: slides down from translateY(-96%) to translateY(0)
    const revealTranslateY = revealProgress
      ? revealProgress.interpolate({ inputRange: [0, 1], outputRange: [-VIEW_H * 0.96, 0] })
      : -VIEW_H * 0.96;

    const isRevealing = Boolean(revealFeatherCount) || revealPerfect;

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        <Animated.View
          style={[
            styles.scrollBody,
            {
              transform: [
                { perspective: PANEL_PERSPECTIVE },
                { rotateY: rollRotateY },
              ],
            },
          ]}
        >
          <DailyPanelFrame state={revealPerfect ? 'perfect' : isRevealing ? 'revealing' : 'idle'}>
            {/* front-content — the live clue text, fades + sinks on reveal */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.content,
                { opacity: frontOpacity, transform: [{ translateY: frontTranslateY }] },
              ]}
            >
              {children}
            </Animated.View>
          </DailyPanelFrame>

          {/* purple curtain, slides down from above to cover the card */}
          {revealProgress && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.revealPanel,
                { transform: [{ translateY: revealTranslateY }] },
              ]}
            >
              <DailyRevealCurtain revealFeatherCount={revealFeatherCount} revealPerfect={revealPerfect} />
            </Animated.View>
          )}
        </Animated.View>
      </View>
    );
  },
);

export default QuillScrollPanel;

const styles = StyleSheet.create({
  root: {
    height: VIEW_H,
    marginHorizontal: 20,
    marginTop: 8,
  },
  scrollBody: {
    flex: 1,
    borderRadius: M.radius,
    overflow: 'hidden',
    backgroundColor: M.panelBg,
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  content: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 14,
    bottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealPanel: {
    ...StyleSheet.absoluteFillObject,
  },
});
