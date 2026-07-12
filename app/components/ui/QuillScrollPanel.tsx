import React, { forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { dailyScrollMaterial as M } from '../../ui/pwDailyMaterials';

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Native driver: transform + opacity only.
  rollProgress: Animated.Value;
  // 0 = clue showing, 1 = purple reveal panel fully covers the card. Native driver: transform + opacity only.
  revealProgress?: Animated.Value;
  revealHeading?: string;
  revealBody?: string;
  children: React.ReactNode;
};

const VIEW_H = 190;

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel(
    { rollProgress, revealProgress, revealHeading, revealBody, children },
    ref,
  ) {
    const rollScaleX = rollProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 1],
    });
    const rollOpacity = rollProgress.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0, 0, 1],
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

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        <Animated.View
          style={[
            styles.scrollBody,
            { opacity: rollOpacity, transform: [{ scaleX: rollScaleX }] },
          ]}
        >
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

          {/* .content — purple curtain, slides down from above to cover the card */}
          {revealProgress && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.revealPanel,
                { transform: [{ translateY: revealTranslateY }] },
              ]}
            >
              {revealHeading ? (
                <Animated.Text style={styles.revealHeading}>{revealHeading}</Animated.Text>
              ) : null}
              {revealBody ? (
                <Animated.Text style={styles.revealBody}>{revealBody}</Animated.Text>
              ) : null}
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
    borderWidth: 1.5,
    borderColor: M.panelBorder,
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
    backgroundColor: '#7B2D8B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  revealHeading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  revealBody: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 20,
  },
});
