import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GhostMeaning } from '../game/types';
import { FONTS, FONT_SIZES } from '../constants/fonts';

const SWIPE_THRESHOLD = 40;

type Props = {
  ghost: GhostMeaning;
  tileHeight?: number;
  onCorrect: () => void;
  onWrong: () => void;
  onDone: () => void;
};

export function GhostTile({ ghost, tileHeight = 64, onCorrect, onWrong, onDone }: Props) {
  if (__DEV__ && ghost.hiddenMeaningReal === '') {
    console.error('Ghost tile missing label — every ghost tile requires text copy.');
  }

  const judgedRef     = useRef(false);
  const onCorrectRef  = useRef(onCorrect);
  const onWrongRef    = useRef(onWrong);
  const onDoneRef     = useRef(onDone);
  useEffect(() => { onCorrectRef.current  = onCorrect;  }, [onCorrect]);
  useEffect(() => { onWrongRef.current    = onWrong;    }, [onWrong]);
  useEffect(() => { onDoneRef.current     = onDone;     }, [onDone]);

  // Entry animation — native driver (transform/opacity)
  const entryOpacity  = useRef(new Animated.Value(0)).current;
  const entryTransY   = useRef(new Animated.Value(24)).current;

  // Tile opacity pulse — native driver, 0.75 ↔ 0.90 at 1400ms intervals
  const tileOpacity = useRef(new Animated.Value(0.75)).current;
  const pulsLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pan — non-native (translate drives layout)
  const panXY = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entryTransY,  { toValue: 0, tension: 160, friction: 14, useNativeDriver: true }),
      Animated.timing(entryOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tileOpacity, { toValue: 0.90, duration: 700, useNativeDriver: true }),
        Animated.timing(tileOpacity, { toValue: 0.75, duration: 700, useNativeDriver: true }),
      ])
    );
    pulsLoopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function exitTile() {
    Animated.timing(entryOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
      onDoneRef.current();
    });
  }

  function handleCorrect() {
    judgedRef.current = true;
    pulsLoopRef.current?.stop();
    Animated.sequence([
      Animated.timing(tileOpacity, { toValue: 1,   duration: 100, useNativeDriver: true }),
      Animated.timing(tileOpacity, { toValue: 0.75, duration: 300, useNativeDriver: true }),
    ]).start();
    panXY.setValue({ x: 0, y: 0 });
    onCorrectRef.current();
    exitTile();
  }

  function handleWrong() {
    judgedRef.current = true;
    pulsLoopRef.current?.stop();
    Animated.sequence([
      Animated.timing(tileOpacity, { toValue: 1,   duration: 80, useNativeDriver: true }),
      Animated.timing(tileOpacity, { toValue: 0.75, duration: 300, useNativeDriver: true }),
    ]).start();
    panXY.setValue({ x: 0, y: 0 });
    onWrongRef.current();
    exitTile();
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !judgedRef.current,
      onStartShouldSetPanResponderCapture: () => !judgedRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        !judgedRef.current && (Math.abs(g.dy) > 4 || Math.abs(g.dx) > 4),
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, g) => {
        if (judgedRef.current) return;
        panXY.setValue({ x: g.dx, y: g.dy });
      },

      onPanResponderRelease: (_, g) => {
        if (judgedRef.current) return;
        if (g.dy < -SWIPE_THRESHOLD) {
          handleCorrect();
        } else if (g.dx > SWIPE_THRESHOLD && Math.abs(g.dy) < SWIPE_THRESHOLD) {
          handleWrong();
        } else {
          Animated.spring(panXY, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        if (!judgedRef.current) {
          Animated.spring(panXY, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            speed: 22,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    // Layer A: entry animation — native driver (opacity + translateY)
    <Animated.View
      style={{
        opacity: entryOpacity,
        transform: [{ translateY: entryTransY }],
        marginBottom: 10,
      }}
    >
      {/* Layer B: pulse opacity — native driver (opacity only) */}
      <Animated.View
        style={{ opacity: tileOpacity }}
      >
        {/* Layer C: pan translation — non-native driver (translateX/Y) */}
        <Animated.View
          style={[
            styles.tile,
            {
              height: tileHeight,
              transform: [{ translateX: panXY.x }, { translateY: panXY.y }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.textBlock}>
            <Text style={styles.meaningText} numberOfLines={2}>
              {ghost.hiddenMeaningReal}
            </Text>
            <Text style={styles.subLabel}>
              {`Missed from ${ghost.word}`}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#1A1830',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#7B2D8B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#7B2D8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  meaningText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: FONT_SIZES.tileCopy,
    fontFamily: FONTS.tileCopy,
  },
  subLabel: {
    color: '#7B2D8B',
    fontSize: FONT_SIZES.ghostSubLabel,
    fontFamily: FONTS.label,
    fontStyle: 'italic',
    marginTop: 3,
  },
});
