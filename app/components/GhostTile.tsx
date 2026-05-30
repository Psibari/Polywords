import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GhostMeaning } from '../game/types';

const SWIPE_THRESHOLD = 40;

type Props = {
  ghost: GhostMeaning;
  tileHeight?: number;
  onCorrect: () => void;
  onWrong: () => void;
  onDone: () => void;
};

export function GhostTile({ ghost, tileHeight = 64, onCorrect, onWrong, onDone }: Props) {
  const judgedRef     = useRef(false);
  const onCorrectRef  = useRef(onCorrect);
  const onWrongRef    = useRef(onWrong);
  const onDoneRef     = useRef(onDone);
  useEffect(() => { onCorrectRef.current  = onCorrect;  }, [onCorrect]);
  useEffect(() => { onWrongRef.current    = onWrong;    }, [onWrong]);
  useEffect(() => { onDoneRef.current     = onDone;     }, [onDone]);

  // Entry animation — native driver OK (transform/opacity)
  const entryOpacity  = useRef(new Animated.Value(0)).current;
  const entryTransY   = useRef(new Animated.Value(24)).current;

  // Border pulse — native driver OK (opacity)
  const borderOpacity = useRef(new Animated.Value(0.4)).current;
  const loopRef       = useRef<Animated.CompositeAnimation | null>(null);

  // Pan — non-native (translate drives layout collision)
  const panXY = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entryTransY,  { toValue: 0, tension: 160, friction: 14, useNativeDriver: true }),
      Animated.timing(entryOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(borderOpacity, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        Animated.timing(borderOpacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loopRef.current = loop;
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
    loopRef.current?.stop();
    // Flash border gold
    Animated.sequence([
      Animated.timing(borderOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(borderOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    panXY.setValue({ x: 0, y: 0 });
    onCorrectRef.current();
    exitTile();
  }

  function handleWrong() {
    judgedRef.current = true;
    loopRef.current?.stop();
    Animated.sequence([
      Animated.timing(borderOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(borderOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
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
    // Outer: entry anim (native driver)
    <Animated.View
      style={{
        opacity: entryOpacity,
        transform: [{ translateY: entryTransY }],
        marginBottom: 10,
      }}
    >
      {/* Inner: pan tracking (non-native driver) */}
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
        <Text style={styles.label}>GHOST MEANING</Text>
        <View style={styles.content}>
          <Text style={styles.ghostEmoji}>👻</Text>
          <Text style={styles.phrase} numberOfLines={2}>
            {ghost.hiddenMeaningReal}
          </Text>
        </View>
        {/* Pulsing border overlay — native driver via opacity */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.borderOverlay, { opacity: borderOpacity }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#1A0A2E',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7B2FBE',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    shadowColor: '#7B2FBE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    overflow: 'visible',
  },
  borderOverlay: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7B2FBE',
  },
  label: {
    color: '#7B2FBE',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 3,
    marginBottom: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostEmoji: {
    fontSize: 14,
    marginRight: 10,
  },
  phrase: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'BagelFatOne_400Regular',
    fontWeight: '400',
    flex: 1,
  },
});
