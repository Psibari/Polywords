import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import { useGameStore } from '../store/useGameStore'
import { FONTS, FONT_SIZES } from '../constants/fonts'

export function StreakDisplay() {
  const chainMultiplier = useGameStore(s => s.game?.chainMultiplier ?? 1.0)
  const scale   = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(0)).current
  const previousMultiplier = useRef(chainMultiplier)
  const displayedMultiplier = useRef(chainMultiplier)
  if (chainMultiplier > 1.0) displayedMultiplier.current = chainMultiplier

  useEffect(() => {
    const isActive = chainMultiplier > 1.0
    const didIncrease = chainMultiplier > previousMultiplier.current
    previousMultiplier.current = chainMultiplier

    const opacityAnimation = Animated.timing(opacity, {
      toValue:  isActive ? 1.0 : 0,
      duration: 200,
      useNativeDriver: true,
    })
    opacityAnimation.start()

    if (isActive && didIncrease) {
      scale.stopAnimation()
      scale.setValue(1)
      const pulseAnimation = Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, friction: 3, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.0, friction: 6, useNativeDriver: true }),
      ])
      pulseAnimation.start()
      return () => {
        opacityAnimation.stop()
        pulseAnimation.stop()
      }
    }

    scale.stopAnimation()
    scale.setValue(1)
    return () => opacityAnimation.stop()
  }, [chainMultiplier]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }], opacity }]}>
      <Text style={styles.counter}>×{displayedMultiplier.current.toFixed(1)}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: { width: 64, alignItems: 'center' },
  counter: {
    fontFamily: FONTS.hud,
    fontSize:   FONT_SIZES.hudMultiplier,
    color:      '#F5C842',
    textShadowColor:  'rgba(245,200,66,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
})
