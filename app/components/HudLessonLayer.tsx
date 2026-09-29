import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import type { HudLessonId } from '../game/firstRunOnboarding';
import {
  HUD_LESSON_CONTINUE_ARM_MS,
  SPOTLIGHT_ARROW_HALF_WIDTH,
  SPOTLIGHT_ARROW_HEAD,
  hudLessonPollyVisit,
  resolveHudLessonPresentation,
  resolveHudSpotlightGeometry,
  type HudLessonTarget,
  type Rect,
  type SpotlightGeometry,
} from '../game/hudLessons';
import type { ActiveVisit } from '../hooks/usePollyVisits';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import { PW } from '../ui/pwTheme';
import { PollyHuntVisit } from './PollyHuntVisit';

// Retries while the HUD target has not laid out yet. After the last one the
// lesson still shows (over a full scrim, without the arrow) rather than
// leaving the Hunt locked behind a lesson that never appears.
const MEASURE_ATTEMPTS = 12;
const MEASURE_RETRY_MS = 50;

type Stage =
  | { kind: 'idle' }
  | { kind: 'settling'; lesson: HudLessonId }
  | { kind: 'showing'; lesson: HudLessonId; geometry: SpotlightGeometry | null }
  | { kind: 'polly'; lesson: HudLessonId };

type Props = {
  // The due lesson (resolveHudLesson), already gated off Boss/Haunt/death.
  lesson: HudLessonId | null;
  targets: Record<HudLessonTarget, React.RefObject<View | null>>;
  targetLabels: Record<HudLessonTarget, string>;
  onComplete: (lesson: HudLessonId) => void;
  // True while the rule panel is up, so the screen can hide everything else
  // from screen readers.
  onShowingChange: (showing: boolean) => void;
};

function measureInWindow(view: View): Promise<Rect | null> {
  return new Promise(resolve => {
    view.measureInWindow((x, y, width, height) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}

// One spotlight for every HUD lesson. The Hunt screen owns input (the lesson
// already locks the board from the render it becomes due); this layer only
// presents: it lets the triggering beat land, measures the live HUD target,
// dims everything around it, points at it, waits for the player, then hands
// the moment to Polly and reports the lesson finished.
export function HudLessonLayer({
  lesson,
  targets,
  targetLabels,
  onComplete,
  onShowingChange,
}: Props) {
  const reduceMotion = useReducedMotionPreference() !== false;
  const layerRef = useRef<View>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [armed, setArmed] = useState(false);
  const [visit, setVisit] = useState<ActiveVisit | null>(null);
  const panelOpacity = useRef(new Animated.Value(0)).current;
  // Bumped whenever the due lesson changes, so callbacks from an older
  // lesson's timers or measurements can never act on the current one.
  const runRef = useRef(0);
  const visitIdRef = useRef(0);

  useEffect(() => {
    const run = ++runRef.current;
    setArmed(false);
    setVisit(null);
    if (!lesson) {
      setStage({ kind: 'idle' });
      return;
    }
    setStage({ kind: 'settling', lesson });
    const content = resolveHudLessonPresentation(lesson, reduceMotion);
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const measure = async (attempt: number) => {
      const layer = layerRef.current;
      const target = targets[content.target].current;
      const [layerRect, targetRect] = layer && target
        ? await Promise.all([measureInWindow(layer), measureInWindow(target)])
        : [null, null];
      if (run !== runRef.current) return;
      if (layerRect && targetRect) {
        setStage({ kind: 'showing', lesson, geometry: resolveHudSpotlightGeometry(targetRect, layerRect) });
        return;
      }
      if (attempt + 1 < MEASURE_ATTEMPTS) {
        retryTimer = setTimeout(() => void measure(attempt + 1), MEASURE_RETRY_MS);
        return;
      }
      setStage({ kind: 'showing', lesson, geometry: null });
    };

    const settleTimer = setTimeout(() => void measure(0), content.settleMs);
    return () => {
      clearTimeout(settleTimer);
      if (retryTimer !== null) clearTimeout(retryTimer);
    };
  }, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps

  const showing = stage.kind === 'showing';
  const showingLesson = showing ? stage.lesson : null;

  useEffect(() => {
    onShowingChange(showing);
  }, [showing, onShowingChange]);
  useEffect(() => () => onShowingChange(false), [onShowingChange]);

  // Entering the rule panel: fade (or snap, under Reduce Motion), announce the
  // rule once, and arm the continue control after a short guard.
  useEffect(() => {
    if (!showingLesson) return;
    const content = resolveHudLessonPresentation(showingLesson, reduceMotion);
    panelOpacity.stopAnimation();
    if (content.panelFadeMs === 0) {
      panelOpacity.setValue(1);
    } else {
      panelOpacity.setValue(0);
      Animated.timing(panelOpacity, {
        toValue: 1,
        duration: content.panelFadeMs,
        useNativeDriver: true,
      }).start();
    }
    AccessibilityInfo.announceForAccessibility(content.spokenCopy);
    const armTimer = setTimeout(() => setArmed(true), HUD_LESSON_CONTINUE_ARM_MS);
    return () => clearTimeout(armTimer);
  }, [showingLesson]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    if (stage.kind !== 'showing' || !armed) return;
    const content = resolveHudLessonPresentation(stage.lesson, reduceMotion);
    setArmed(false);
    setStage({ kind: 'polly', lesson: stage.lesson });
    visitIdRef.current += 1;
    setVisit({ id: visitIdRef.current, spec: hudLessonPollyVisit(stage.lesson), fastExit: false });
    AccessibilityInfo.announceForAccessibility(content.spokenPolly);
  }

  function handleVisitDone(id: number) {
    if (visit?.id !== id || stage.kind !== 'polly') return;
    setVisit(null);
    setStage({ kind: 'idle' });
    onComplete(stage.lesson);
  }

  return (
    <View
      ref={layerRef}
      collapsable={false}
      pointerEvents={showing ? 'auto' : 'none'}
      accessibilityViewIsModal={showing}
      style={styles.layer}
    >
      {stage.kind === 'showing' && (
        <LessonSpotlight
          lesson={stage.lesson}
          geometry={stage.geometry}
          reduceMotion={reduceMotion}
          opacity={panelOpacity}
          armed={armed}
          targetLabel={targetLabels[resolveHudLessonPresentation(stage.lesson, reduceMotion).target]}
          onContinue={handleContinue}
        />
      )}
      {stage.kind === 'polly' && <PollyHuntVisit visit={visit} onDone={handleVisitDone} />}
    </View>
  );
}

function LessonSpotlight({
  lesson,
  geometry,
  reduceMotion,
  opacity,
  armed,
  targetLabel,
  onContinue,
}: {
  lesson: HudLessonId;
  geometry: SpotlightGeometry | null;
  reduceMotion: boolean;
  opacity: Animated.Value;
  armed: boolean;
  targetLabel: string;
  onContinue: () => void;
}) {
  const content = resolveHudLessonPresentation(lesson, reduceMotion);
  const panel = (
    <View style={styles.panelInner}>
      <View accessible accessibilityRole="text" accessibilityLabel={content.spokenCopy}>
        {content.lines.map((line, index) => (
          <Text key={line} style={[styles.line, index === 0 && styles.lineLead]}>
            {line}
          </Text>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={content.continueLabel}
        accessibilityState={{ disabled: !armed }}
        disabled={!armed}
        onPress={onContinue}
        hitSlop={8}
        style={({ pressed }) => [
          styles.continue,
          !armed && styles.continueWaiting,
          pressed && styles.continuePressed,
        ]}
      >
        <Text style={styles.continueLabel}>{content.continueLabel}</Text>
      </Pressable>
    </View>
  );

  if (!geometry) {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        <View style={[styles.panel, styles.panelFallback]}>{panel}</View>
      </Animated.View>
    );
  }

  const { hole, scrim, arrow, placement } = geometry;
  const headTop = placement === 'below' ? arrow.tipY : arrow.tipY - SPOTLIGHT_ARROW_HEAD;
  const stemTop = placement === 'below' ? arrow.tipY + SPOTLIGHT_ARROW_HEAD - 1 : arrow.baseY;
  const stemHeight = Math.abs(arrow.baseY - arrow.tipY) - SPOTLIGHT_ARROW_HEAD + 1;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      {(['top', 'bottom', 'left', 'right'] as const).map(side => (
        <View key={side} style={[styles.scrim, rectStyle(scrim[side])]} />
      ))}
      <View
        accessible
        accessibilityLabel={targetLabel}
        style={[styles.ring, rectStyle(hole)]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.arrowHead,
          placement === 'below' ? styles.arrowHeadUp : styles.arrowHeadDown,
          { left: arrow.centerX - SPOTLIGHT_ARROW_HALF_WIDTH, top: headTop },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.arrowStem, { left: arrow.centerX - 1.5, top: stemTop, height: stemHeight }]}
      />
      <View
        style={[
          styles.panel,
          {
            left: geometry.panel.left,
            width: geometry.panel.width,
            ...(geometry.panel.top !== null ? { top: geometry.panel.top } : {}),
            ...(geometry.panel.bottom !== null ? { bottom: geometry.panel.bottom } : {}),
          },
        ]}
      >
        {panel}
      </View>
    </Animated.View>
  );
}

function rectStyle(rect: Rect) {
  return {
    position: 'absolute' as const,
    left: rect.x,
    top: rect.y,
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  };
}

const styles = StyleSheet.create({
  // Above the board, flashes, FX and the pause button (200); below the boss
  // intro (320) and the exit confirm (350), which still win if they appear.
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 300,
  },
  scrim: {
    backgroundColor: PW.color.overlayMedium,
  },
  ring: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PW.color.gold,
  },
  arrowHead: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: SPOTLIGHT_ARROW_HALF_WIDTH,
    borderRightWidth: SPOTLIGHT_ARROW_HALF_WIDTH,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowHeadUp: {
    borderBottomWidth: SPOTLIGHT_ARROW_HEAD,
    borderBottomColor: PW.color.gold,
  },
  arrowHeadDown: {
    borderTopWidth: SPOTLIGHT_ARROW_HEAD,
    borderTopColor: PW.color.gold,
  },
  arrowStem: {
    position: 'absolute',
    width: 3,
    borderRadius: 1.5,
    backgroundColor: PW.color.gold,
  },
  panel: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayHeavy,
  },
  panelFallback: {
    left: 16,
    right: 16,
    top: '32%',
  },
  panelInner: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 14,
  },
  line: {
    color: PW.color.softWhite,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  lineLead: {
    color: PW.color.gold,
    fontSize: 20,
    lineHeight: 26,
  },
  continue: {
    minWidth: 150,
    minHeight: 44,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PW.color.goldSoft,
    backgroundColor: PW.color.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueWaiting: {
    opacity: PW.opacity.disabled,
  },
  continuePressed: {
    opacity: 0.7,
  },
  continueLabel: {
    color: PW.color.gold,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 16,
    letterSpacing: 1.6,
  },
});
