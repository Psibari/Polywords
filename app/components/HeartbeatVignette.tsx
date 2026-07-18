import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { PW } from '../ui/pwTheme';

const TENSION_VIGNETTE_OPACITY = [0, 0.035, 0.07, 0.12] as const;

const EDGE_DEPTH = 80;

export default function HeartbeatVignette() {
  const { pulseAnim, tension } = useHeartbeat();
  const ceilingAnim = useRef(new Animated.Value(TENSION_VIGNETTE_OPACITY[0])).current;

  useEffect(() => {
    Animated.timing(ceilingAnim, {
      toValue: TENSION_VIGNETTE_OPACITY[Math.min(tension, 3)],
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [tension, ceilingAnim]);

  const edgeOpacity = Animated.multiply(pulseAnim, ceilingAnim);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.top, { opacity: edgeOpacity }]}>
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={[PW.color.purple, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[styles.bottom, { opacity: edgeOpacity }]}>
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={[PW.color.purple, 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>
      <Animated.View style={[styles.left, { opacity: edgeOpacity }]}>
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={[PW.color.rose, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
      <Animated.View style={[styles.right, { opacity: edgeOpacity }]}>
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={[PW.color.rose, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, height: EDGE_DEPTH },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: EDGE_DEPTH },
  left: { position: 'absolute', top: 0, bottom: 0, left: 0, width: EDGE_DEPTH },
  right: { position: 'absolute', top: 0, bottom: 0, right: 0, width: EDGE_DEPTH },
});
