import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import { useGameStore } from '../store/useGameStore'
import { FONTS, FONT_SIZES } from '../constants/fonts'

export function StreakDisplay() {
  const chainMultiplier = useGameStore(s => s.game?.chainMultiplier ?? 1.0)
  const scale     = useRef(new Animated.Value(1)).current
  const opacity   = useRef(new Animated.Value(0)).current
  const dropY     = useRef(new Animated.Value(0)).current
  const previousMultiplier = useRef(chainMultiplier)
  const displayedMultiplier = useRef(chainMultiplier)
  if (chainMultiplier > 1.0) displayedMultiplier.current = chainMultiplier

  useEffect(() => {
    const isActive   = chainMultiplier > 1.0
    const didIncrease = chainMultiplier > previousMultiplier.current
    const brokeRealChain = chainMultiplier === 1.0 && previousMultiplier.current >= 1.5
    previousMultiplier.current = chainMultiplier

    if (brokeRealChain) {
      dropY.setValue(0)
      const dropAnimation = Animated.parallel([
        Animated.timing(dropY,   { toValue: 8, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ])
      dropAnimation.start(() => dropY.setValue(0))
      scale.stopAnimation()
      scale.setValue(1)
      return () => dropAnimation.stop()
    }

    const opacityAnimation = Animated.timing(opacity, {
      toValue:  isActive ? 1.0 : 0,
      duration: 200,
      useNativeDriver: true,
    })
    opacityAnimation.start()

    if (isActive && didIncrease) {
      scale.stopAnimation()
      scale.setValue(1)
      const peak = chainMultiplier >= 2.5 ? 1.45 : 1.3
      const pulseAnimation = Animated.sequence([
        Animated.spring(scale, { toValue: peak, friction: 3, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.0,  friction: 6, useNativeDriver: true }),
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
    <Animated.View style={[styles.wrapper, { transform: [{ scale }, { translateY: dropY }], opacity }]}>
      <Text style={styles.counter}>×{displayedMultiplier.current.toFixed(1)}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  // Was a permanently-laid-out `width: 64` flex slot — occupied that width
  // even while invisible (opacity 0) between chains, competing with the
  // feather row for space. Now an absolutely-positioned badge that only
  // takes up room when a parent renders it inside a `position: relative`
  // wrapper around the score (see TopBar) — starting offsets below, tune
  // on-device in the HUD redesign's verification pass, not final values.
  wrapper: {
    position: 'absolute',
    top: -10,
    right: -26,
    alignItems: 'center',
  },
  counter: {
    fontFamily: FONTS.hud,
    fontSize:   FONT_SIZES.hudMultiplier,
    color:      '#F5C842',
    textShadowColor:  'rgba(245,200,66,0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
})
