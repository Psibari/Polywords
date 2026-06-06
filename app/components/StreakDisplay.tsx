import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useGameStore } from '../store/useGameStore'
import { FONTS, FONT_SIZES } from '../constants/fonts'

function getColor(streak: number): string {
  if (streak >= 4) return '#F5C842'
  return '#FFFFFF'
}

export function StreakDisplay() {
  const streak = useGameStore(s => s.game?.streak ?? 0)
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (streak === 0) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
      return
    }
    opacity.setValue(1)
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.4,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start()
  }, [streak])

  return (
    <Animated.View style={[styles.wrapper, {
      transform: [{ scale }],
      opacity
    }]}>
      <Text style={[styles.counter, { color: getColor(streak) }]}>
        ×{streak}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: { width: 60, alignItems: 'center' },
  counter: {
    fontFamily: FONTS.hud,
    fontSize: FONT_SIZES.hudMultiplier,
    color: '#F5C842',
    textShadowColor: 'rgba(245,200,66,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
})
