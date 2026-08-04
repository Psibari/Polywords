import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet } from 'react-native'
import { useGameStore } from '../store/useGameStore'
import { FONTS, FONT_SIZES } from '../constants/fonts'
import { PW } from '../ui/pwTheme'

// Plain inline text next to the score, not a floating badge — a floating,
// absolutely-positioned version of this broke three different ways on
// device (overlapping the score, blending into its color, wrapping onto a
// second line and bleeding into the round-chip row below it). Rendering
// nothing at all when there's no active chain, instead of an invisible
// reserved-width placeholder, is what keeps this from ever crowding the
// feather row next to it.
export function StreakDisplay() {
  const chainMultiplier = useGameStore(s => s.game?.chainMultiplier ?? 1.0)
  const isActive = chainMultiplier > 1.0
  const scale    = useRef(new Animated.Value(0.7)).current
  const opacity  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!isActive) return
    scale.setValue(0.7)
    opacity.setValue(0)
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.25, friction: 4, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start()
  }, [isActive, chainMultiplier]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isActive) return null

  return (
    <Animated.Text
      style={[styles.counter, { opacity, transform: [{ scale }] }]}
    >
      ×{chainMultiplier.toFixed(1)}
    </Animated.Text>
  )
}

const styles = StyleSheet.create({
  counter: {
    marginLeft: 6,
    lineHeight: 38,
    fontFamily: FONTS.hud,
    fontSize:   FONT_SIZES.hudMultiplier,
    color:      PW.color.rose,
    textShadowColor:  'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
