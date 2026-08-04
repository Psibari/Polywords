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
  // Anchored via `left: '100%'` + marginLeft so it always grows AWAY from
  // the score (rightward) regardless of its own text width — anchoring via
  // `right` (as before) made it grow leftward, into the score, as the font
  // got bigger. Background pill in rose (PW.color.rose, matching the
  // existing trap/chain accent used elsewhere for tier>1 feedback) instead
  // of gold text-on-transparent, so it can't blend into the gold score
  // number next to it.
  wrapper: {
    position: 'absolute',
    top: 2,
    left: '100%',
    marginLeft: 8,
    backgroundColor: 'rgba(155,45,107,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: 'center',
  },
  counter: {
    fontFamily: FONTS.hud,
    fontSize:   FONT_SIZES.hudMultiplier,
    color:      '#FFFFFF',
    textShadowColor:  'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
