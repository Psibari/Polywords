import React, { forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { dailyScrollMaterial as M } from '../../ui/pwDailyMaterials';

export type QuillScrollPanelProps = {
  // 0 = rolled closed, 1 = fully open. Native driver: transform + opacity only.
  rollProgress: Animated.Value;
  // 0 = at rest, 1 = feather fully lifted + glowing. Native driver: transform + opacity only.
  payoffProgress: Animated.Value;
  children: React.ReactNode;
};

const VIEW_W = 300;
const VIEW_H = 190;
const CAP_W = M.rollCapWidth;

const INKWELL_PATH =
  'M5,96 Q5,88 16,88 Q27,88 27,96 L26,106 Q26,112 16,112 Q6,112 6,106 Z';
const FEATHER_SHAFT_PATH = 'M17,94 C22,78 30,52 44,8';
const FEATHER_VANE_PATH =
  'M44,6 C33,14 20,26 15,44 C10,60 12,74 18,88 C20,90 23,90 25,87 C30,72 34,58 40,42 C46,30 52,18 44,6 Z';
const FEATHER_BARBS = [
  'M28,20 L18,28',
  'M31,28 L19,37',
  'M32,37 L18,47',
  'M31,47 L17,57',
  'M29,57 L17,67',
  'M26,67 L18,76',
  'M22,76 L18,83',
];

const QuillScrollPanel = forwardRef<View, QuillScrollPanelProps>(
  function QuillScrollPanel({ rollProgress, payoffProgress, children }, ref) {
    const rollScaleX = rollProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 1],
    });
    const rollOpacity = rollProgress.interpolate({
      inputRange: [0, 0.35, 1],
      outputRange: [0, 0, 1],
    });
    const quillLift = payoffProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -30],
    });
    const glowOpacity = payoffProgress.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 1, 0.7],
    });

    return (
      <View ref={ref} style={styles.root} collapsable={false}>
        <Animated.View
          style={[
            styles.scrollBody,
            { opacity: rollOpacity, transform: [{ scaleX: rollScaleX }] },
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGrad id="parchmentFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={M.parchmentTop} />
                <Stop offset="1" stopColor={M.parchmentBot} />
              </SvgGrad>
              <SvgGrad id="rollCapL" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={M.parchmentBot} />
                <Stop offset="1" stopColor={M.parchmentTop} />
              </SvgGrad>
              <SvgGrad id="rollCapR" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={M.parchmentTop} />
                <Stop offset="1" stopColor={M.parchmentBot} />
              </SvgGrad>
            </Defs>
            <Rect x={0} y={0} width={VIEW_W} height={VIEW_H} rx={M.radius} fill="url(#parchmentFill)" />
            <Rect x={0} y={0} width={CAP_W} height={VIEW_H} rx={CAP_W / 2} fill="url(#rollCapL)" />
            <Rect x={VIEW_W - CAP_W} y={0} width={CAP_W} height={VIEW_H} rx={CAP_W / 2} fill="url(#rollCapR)" />
            <Rect
              x={0} y={0} width={VIEW_W} height={VIEW_H} rx={M.radius}
              fill="none" stroke={M.goldTrim} strokeOpacity={0.5} strokeWidth={1.5}
            />
          </Svg>

          <View pointerEvents="none" style={styles.content}>
            {children}
          </View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity }]}>
          <Svg width="100%" height="100%" viewBox="0 0 80 80">
            <Defs>
              <RadialGradient id="payoffGlow" cx="50%" cy="50%" r="55%">
                <Stop offset="0" stopColor={M.goldTrim} stopOpacity={0.9} />
                <Stop offset="1" stopColor={M.goldTrim} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={80} height={80} fill="url(#payoffGlow)" />
          </Svg>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[styles.quillWrap, { transform: [{ translateY: quillLift }] }]}
        >
          <Svg width={56} height={104} viewBox="0 0 64 118">
            <Defs>
              <SvgGrad id="quillGold" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={M.goldTrim} />
                <Stop offset="1" stopColor={M.goldDeep} />
              </SvgGrad>
            </Defs>
            <Path d={INKWELL_PATH} fill={M.inkwellFill} />
            <Ellipse cx={16} cy={96} rx={10.5} ry={3.4} fill={M.inkwellFill} />
            <Ellipse
              cx={16} cy={95.5} rx={10.5} ry={3}
              fill="none" stroke={M.goldTrim} strokeOpacity={0.6} strokeWidth={0.6}
            />
            <Path d={FEATHER_SHAFT_PATH} fill="none" stroke={M.goldDeep} strokeWidth={2} strokeLinecap="round" />
            <Path d={FEATHER_VANE_PATH} fill="url(#quillGold)" stroke={M.goldDeep} strokeWidth={0.6} />
            {FEATHER_BARBS.map((d, i) => (
              <Path key={i} d={d} stroke={M.goldDeep} strokeOpacity={0.55} strokeWidth={0.7} strokeLinecap="round" />
            ))}
          </Svg>
        </Animated.View>
      </View>
    );
  },
);

export default QuillScrollPanel;

const styles = StyleSheet.create({
  root: {
    height: VIEW_H,
    marginHorizontal: 20,
    marginTop: 8,
    overflow: 'visible',
  },
  scrollBody: {
    flex: 1,
    borderRadius: M.radius,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  content: {
    position: 'absolute',
    left: 18,
    right: 60,
    top: 14,
    bottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -6,
    width: 80,
    height: 80,
  },
  quillWrap: {
    position: 'absolute',
    top: -22,
    right: 4,
    width: 56,
    height: 104,
  },
});
