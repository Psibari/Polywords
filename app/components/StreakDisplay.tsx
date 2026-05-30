import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import { useGameStore } from '../store/useGameStore'


export function StreakDisplay() {
  const streak = useGameStore(s => s.game.streak)
  const scale = useSharedValue(1)
  const streakSV = useSharedValue(0)

  useEffect(() => {
    streakSV.value = streak
  }, [streak]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (streak === 0) return
    scale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 300 }),
      withSpring(1.0, { damping: 15, stiffness: 200 }),
    )
  }, [streak]) // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => {
    const s = streakSV.value
    const color = s >= 7 ? '#FF4500' : s >= 5 ? '#FF9500' : s >= 3 ? '#FFD700' : '#FFFFFF'
    return { transform: [{ scale: scale.value }], color }
  })

  if (streak === 0) return <View style={styles.placeholder} />

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.counter, animStyle]}>
        ×{streak}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    width: 60,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  counter: {
    fontSize: 28,
    fontFamily: 'BagelFatOne_400Regular',
    fontWeight: '400',
    color: '#FFFFFF',
  },
})
