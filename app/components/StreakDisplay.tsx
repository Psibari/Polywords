import React, { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated'
import { useGameStore } from '../store/useGameStore'

function getColor(streak: number): string {
  if (streak >= 7) return '#FF4500'
  if (streak >= 5) return '#FF9500'
  if (streak >= 3) return '#FFD700'
  return '#FFFFFF'
}

export function StreakDisplay() {
  const streak    = useGameStore(s => s.game.streak)
  const scaleSV   = useSharedValue(1)
  const opacitySV = useSharedValue(0)
  const [color, setColor] = useState(getColor(0))

  useEffect(() => {
    setColor(getColor(streak))

    if (streak === 0) {
      opacitySV.value = withTiming(0, { duration: 200 })
      return
    }

    opacitySV.value = 1
    scaleSV.value = withSequence(
      withSpring(1.4, { damping: 6, stiffness: 300 }),
      withSpring(1.0, { damping: 15, stiffness: 200 }),
    )
  }, [streak]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleSV.value }],
    opacity: opacitySV.value,
  }))

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
      <Text style={[styles.counter, { color }]}>
        ×{streak}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: { width: 60, alignItems: 'center' },
  counter: { fontFamily: 'BagelFatOne_400Regular', fontSize: 28 },
})
