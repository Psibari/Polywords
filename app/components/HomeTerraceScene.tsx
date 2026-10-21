import React, { useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { playSfx } from '../audio/sfx';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import { dailyCardMaterial, dailyCastlePlaqueMaterial } from '../ui/pwDailyMaterials';
import {
  DAILY_PLAQUE_DROP,
  DAILY_PLAQUE_INPUT,
  DAILY_PLAQUE_OPACITY,
  DAILY_PLAQUE_OPACITY_INPUT,
  DAILY_PLAQUE_PROUD,
  DAILY_PLAQUE_SCALE,
  DAILY_WALL_TREMBLE_X,
  DAILY_WALL_TREMBLE_Y,
} from '../ui/dailyPlaqueEntrance';
import {
  TERRACE_CAGE_TOP_ROTATION_DEG,
  TERRACE_CASTLE_WINDOWS,
  TERRACE_DESIGN_H,
  TERRACE_FRONT_BOTTOM_COLOR,
  TERRACE_GROUND_SEAM_COLUMNS_BOTTOM_X,
  TERRACE_GROUND_SEAM_ROWS,
  TERRACE_GROUND_VANISH,
  TERRACE_LABEL,
  TERRACE_NICHE,
  TERRACE_SKY_TOP_COLOR,
  TERRACE_SLABS,
  TerraceLayout,
  TerraceElementId,
  terraceLabelFontSizes,
} from '../ui/homeTerraceScene';

// Static outdoor-terrace Home (Pete, 2026-10-20). Art and layout only: no movement yet. The
// screen owns navigation; this component draws the layers and reports taps.
// Geometry comes from resolveTerraceLayout (one width-fit, bottom-anchored frame).

const ART = {
  bg: require('../../assets/images/home/terrace/bg.webp'),
  front: require('../../assets/images/home/terrace/front.webp'),
  castle: require('../../assets/images/home/terrace/castle.webp'),
  wall: require('../../assets/images/home/terrace/wall.png'),
  casing: require('../../assets/images/home/terrace/casing.png'),
  slabHunt: require('../../assets/images/home/terrace/btn_hunt.png'),
  slabBook: require('../../assets/images/home/terrace/btn_book.png'),
  btnTop: require('../../assets/images/home/terrace/btn_top.png'),
  cageTop: require('../../assets/images/home/terrace/cage_top.png'),
  cageBase: require('../../assets/images/home/terrace/cage_base.png'),
  perch: require('../../assets/images/home/terrace/perch.png'),
  logo: require('../../assets/images/brand/home-title-lockup.png'),
  moon: require('../../assets/images/moons/moon-r2-c2.png'), // full moon
};

// Colours: the locked palette and Daily castle measurements (AGENTS.md, DESIGN.md).
const GOLD = PW.color.gold;
const WHITE = '#FFFFFF';
const NICHE_BACK = '#100B2E';
const LABEL_SHADOW = '#060316';
const GROUND_FACE = '#271E3D'; // measured Daily castle floor tile face
const GROUND_SEAM = '#0E081C';
const GROUND_BEVEL = '#4A3A78';

// A button standing out of the console: its drop shadow and top face, as the Daily's answer blocks
// (DailyAnswerCard). Same numbers: shadow offset x3 y7 at 0.45.
const POP_SHADOW = { x: 3, y: 7, opacity: 0.45 } as const;
const BTN_TOP_RATIO = 81 / 1117; // btn_top.png: 1117 x 81 over a 1117 wide button

export type TerraceEntranceProps = {
  progress: readonly Animated.Value[];
  tremble: Animated.Value;
  locked: boolean;
};

type Props = {
  layout: TerraceLayout;
  width: number;
  height: number;
  dailyPlayed: boolean;
  /** The castle is hidden at rest; it is shown only for positioning or its Daily reveal. */
  showCastle: boolean;
  huntLabel: string;
  /** Polly (the existing perch), already wrapped and positioned by the screen. */
  polly: React.ReactNode;
  selected?: TerraceElementId | null;
  showHitAreas?: boolean;
  onDaily: () => void;
  onHunt: () => void;
  onBook: () => void;
  onSettings: () => void;
  /** Buttons coming out of the console and the tremble; absent = everything at rest. */
  entrance?: TerraceEntranceProps;
};

export function HomeTerraceScene(props: Props) {
  const { layout, width, height, dailyPlayed, showCastle, huntLabel, polly } = props;
  const { k, rects } = layout;
  const casing = rects.casing;
  const niche = {
    left: casing.left + TERRACE_NICHE.x * casing.width,
    top: casing.top + TERRACE_NICHE.y * casing.height,
    width: TERRACE_NICHE.w * casing.width,
    height: TERRACE_NICHE.h * casing.height,
  };
  const castle = rects.castle;
  const ground = rects.ground;
  const plaque = rects.plaque;
  const hitDebug = props.showHitAreas ? styles.hitDebug : null;

  const restEntrance = useRef<TerraceEntranceProps>({
    progress: [new Animated.Value(1), new Animated.Value(1)],
    tremble: new Animated.Value(0),
    locked: false,
  }).current;
  const entrance = props.entrance ?? restEntrance;
  // Wall and console tremble together while the buttons come out (the Daily wall's own keyframes).
  const trembleStyle = useMemo(
    () => ({
      transform: [
        { translateX: entrance.tremble.interpolate(DAILY_WALL_TREMBLE_X) },
        { translateY: entrance.tremble.interpolate(DAILY_WALL_TREMBLE_Y) },
      ],
    }),
    [entrance.tremble],
  );
  const trembleLayer = [styles.trembleLayer, { width, height }, trembleStyle];
  const hunt = TERRACE_SLABS.hunt;
  const book = TERRACE_SLABS.book;
  const labelSizes = terraceLabelFontSizes(hunt.w * niche.width);

  return (
    <View style={[styles.root, { width, height }]} pointerEvents="box-none">
      {/* Sky above the frame on taller phones, and the sky/ridges image itself. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: TERRACE_SKY_TOP_COLOR }]} />
      <Image source={ART.bg} style={[styles.img, layout.background]} resizeMode="stretch" />
      {/* If the picture is raised, fill below its last row with the ridge's own dark. */}
      <View
        pointerEvents="none"
        style={[
          styles.abs,
          {
            left: 0,
            top: layout.background.top + layout.background.height - 1,
            width,
            height: Math.max(0, height - (layout.background.top + layout.background.height) + 1),
            backgroundColor: TERRACE_FRONT_BOTTOM_COLOR,
          },
        ]}
      />

      {/* Moon sits behind the castle and the ridges. */}
      <Image source={ART.moon} style={[styles.img, rects.moon]} resizeMode="contain" />

      {/* Castle, hidden at rest (Pete, 2026-10-20): it rises from behind the mountains when Daily
          is tapped. Windows and door are lit by code so the Daily state can change them. */}
      {showCastle ? (
        <>
      <Svg
        pointerEvents="none"
        style={[styles.abs, { left: castle.left - 40 * k, top: castle.top - 40 * k }]}
        width={castle.width + 80 * k}
        height={castle.height + 80 * k}
      >
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFC857" stopOpacity="0.8" />
            <Stop offset="0.35" stopColor="#FFC857" stopOpacity="0.33" />
            <Stop offset="0.7" stopColor="#FFC857" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {!dailyPlayed && (
          <Rect
            x={70 * k}
            y={60 * k}
            width={120 * k}
            height={120 * k}
            fill="url(#halo)"
          />
        )}
      </Svg>
      <Image source={ART.castle} style={[styles.img, castle]} resizeMode="stretch" />
      {TERRACE_CASTLE_WINDOWS.map((w, i) => (
        <LinearGradient
          key={`win${i}`}
          pointerEvents="none"
          colors={['#FFE08A', '#F5C842', '#D4962A']}
          style={[
            styles.abs,
            {
              left: castle.left + w.x * castle.width,
              top: castle.top + w.y * castle.height,
              width: w.w * castle.width,
              height: w.h * castle.height,
              borderTopLeftRadius: w.kind === 'arch' ? (w.w * castle.width) / 2 : 0,
              borderTopRightRadius: w.kind === 'arch' ? (w.w * castle.width) / 2 : 0,
              opacity: dailyPlayed ? 0 : 0.9,
            },
          ]}
        />
      ))}
        </>
      ) : null}

      {/* The front ridge draws over the castle's base. */}
      <Image source={ART.front} style={[styles.img, layout.front]} resizeMode="stretch" />

      {/* Ground: the Daily floor colour, wide perspective seams, no cracks. */}
      <View pointerEvents="none" style={[styles.abs, { left: 0, top: ground.top, width, height: height - ground.top }]}>
        <LinearGradient
          colors={['#271E3D00', '#0F0A1E', '#150F28', GROUND_FACE, GROUND_FACE, '#1D1631']}
          locations={[0, 0.075, 0.11, 0.24, 0.64, 1]}
          style={StyleSheet.absoluteFill}
        />
        <GroundSeams width={width} height={ground.height} k={k} />
      </View>

      <Animated.View pointerEvents="box-none" collapsable={false} style={trembleLayer}>
      {/* Back wall, and the soft shadow it casts onto the ground. */}
      <Image source={ART.wall} style={[styles.img, rects.wall]} resizeMode="stretch" />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(10,6,24,0.67)', 'rgba(10,6,24,0)']}
        style={[styles.abs, { left: 0, top: rects.wall.top + rects.wall.height - 12 * k, width, height: 40 * k }]}
      />

      {/* DAILY CHALLENGE sits on the wall's dark recess panel. Gold until it is played. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Daily Challenge"
        onPress={props.onDaily}
        style={[styles.abs, plaque, hitDebug]}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.dailyLabel,
            {
              left: 8 * k,
              right: 0,
              top: 22 * k,
              fontSize: 30 * k,
              lineHeight: 36 * k,
              letterSpacing: 3 * k,
              color: dailyPlayed ? WHITE : GOLD,
              // RN has one text shadow: gold glow while lit, a crisp dark drop when white.
              textShadowColor: dailyPlayed ? LABEL_SHADOW : 'rgba(255,184,58,0.6)',
              textShadowRadius: dailyPlayed ? 0 : 14 * k,
            },
          ]}
        >
          DAILY CHALLENGE
        </Text>
      </Pressable>
      </Animated.View>

      {/* The perch Polly lands on: a short wooden stick sticking out of the wall. */}
      <Image source={ART.perch} style={[styles.img, rects.perch]} resizeMode="stretch" />

      {/* Polly, perched on the back wall. */}
      {polly}

      {/* Sky group: the broken cage's top half hangs by the logo; the logo is the title. */}
      <Image
        source={ART.cageTop}
        style={[
          styles.img,
          rects.cageTop,
          { transform: [{ rotate: `${TERRACE_CAGE_TOP_ROTATION_DEG}deg` }] },
        ]}
        resizeMode="contain"
      />
      <Image source={ART.logo} accessibilityLabel="POLYWORDS" style={[styles.img, rects.logo]} resizeMode="contain" />

      {/* Settings gear, bottom-left, never on top. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Settings"
        onPress={props.onSettings}
        style={[styles.abs, styles.gear, rects.gear, hitDebug]}
      >
        <Svg width={26 * k} height={26 * k} viewBox="0 0 24 24" fill="none" opacity={0.75}>
          <Circle cx={12} cy={12} r={3.2} stroke="#B7ACDC" strokeWidth={2} />
          <Path
            d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
            stroke="#B7ACDC"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </Pressable>

      {/* The one stone console: casing, opening, two buttons. It trembles with the wall. */}
      <Animated.View pointerEvents="box-none" collapsable={false} style={trembleLayer}>
        <View
          pointerEvents="none"
          style={[
            styles.abs,
            {
              left: casing.left - 6 * k,
              top: casing.top + casing.height - 13 * k,
              width: casing.width + 12 * k,
              height: 26 * k,
              borderRadius: 13 * k,
              backgroundColor: 'rgba(5,3,20,0.35)',
            },
          ]}
        />
        <Image source={ART.casing} style={[styles.img, casing]} resizeMode="stretch" />
        <View style={[styles.abs, niche, { backgroundColor: NICHE_BACK }]} pointerEvents="box-none">
          <Slab
            source={ART.slabHunt}
            label={huntLabel}
            left={hunt.x * niche.width}
            top={hunt.y * niche.height}
            width={hunt.w * niche.width}
            height={hunt.h * niche.height}
            fontSize={labelSizes.hunt}
            k={k}
            color={dailyPlayed ? GOLD : WHITE}
            glow={dailyPlayed}
            progress={entrance.progress[0]}
            locked={entrance.locked}
            accessibilityLabel={huntLabel === 'RESUME HUNT' ? 'Resume Hunt' : 'Enter the Hunt'}
            onPress={props.onHunt}
            debug={hitDebug}
          />
          <Slab
            source={ART.slabBook}
            label="POLYBOOK"
            left={book.x * niche.width}
            top={book.y * niche.height}
            width={book.w * niche.width}
            height={book.h * niche.height}
            fontSize={labelSizes.book}
            k={k}
            color={WHITE}
            glow={false}
            progress={entrance.progress[1]}
            locked={entrance.locked}
            accessibilityLabel="Open the Polybook"
            onPress={props.onBook}
            debug={hitDebug}
          />
        </View>
      </Animated.View>

      {/* The cage's base half rests on the ground, overlapping the console's corner. */}
      <Image source={ART.cageBase} style={[styles.img, rects.cageBase]} resizeMode="contain" />

      {props.selected ? (
        <View
          pointerEvents="none"
          style={[styles.abs, styles.selection, selectionRect(props.selected, layout)]}
        />
      ) : null}
    </View>
  );
}

function selectionRect(id: TerraceElementId, layout: TerraceLayout) {
  const r = layout.rects[id];
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

type SlabProps = {
  source: number;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  k: number;
  color: string;
  glow: boolean;
  /** 0 hidden in the console, DAILY_PLAQUE_PEAK farthest out, 1 flush. */
  progress: Animated.Value;
  locked: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  debug: object | null;
};

function Slab(p: SlabProps) {
  const { progress } = p;
  // Held pop, the Daily answer block's own (DailyAnswerCard): pressed, the button stands out of the
  // console (top face, wall shadow, a little larger); released, it settles back.
  const grip = useRef(new Animated.Value(0)).current;
  const popIn = () => {
    grip.stopAnimation();
    Animated.timing(grip, { toValue: 1, duration: dailyCardMaterial.motion.pressInMs, useNativeDriver: true }).start();
    playSfx('pressHoldStart');
  };
  const popOut = () => {
    grip.stopAnimation();
    Animated.timing(grip, { toValue: 0, duration: dailyCardMaterial.motion.pressOutMs, useNativeDriver: true }).start();
  };
  // The Daily answer block's own keyframes (DailyAnswerCard): scale, drop and opacity, plus the top
  // face and wall shadow it shows while it stands out. Always Animated nodes, never plain numbers.
  const motion = useMemo(() => {
    const proud = (map: (v: number) => number) => DAILY_PLAQUE_PROUD.map(map);
    const topH = p.width * BTN_TOP_RATIO;
    return {
      shell: {
        opacity: progress.interpolate({
          inputRange: DAILY_PLAQUE_OPACITY_INPUT,
          outputRange: DAILY_PLAQUE_OPACITY,
          extrapolate: 'clamp' as const,
        }),
        transform: [
          { translateY: progress.interpolate({ inputRange: DAILY_PLAQUE_INPUT, outputRange: DAILY_PLAQUE_DROP }) },
          {
            scale: Animated.multiply(
              progress.interpolate({ inputRange: DAILY_PLAQUE_INPUT, outputRange: DAILY_PLAQUE_SCALE }),
              grip.interpolate({ inputRange: [0, 1], outputRange: [1, dailyCastlePlaqueMaterial.heldScale] }),
            ),
          },
        ],
      },
      popTop: {
        opacity: grip.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: grip.interpolate({ inputRange: [0, 1], outputRange: [topH / 2, 0] }) },
          { scaleY: grip.interpolate({ inputRange: [0, 1], outputRange: [0.001, 1] }) },
        ],
      },
      popShadow: {
        opacity: grip.interpolate({ inputRange: [0, 1], outputRange: [0, POP_SHADOW.opacity] }),
        transform: [
          { translateX: grip.interpolate({ inputRange: [0, 1], outputRange: [0, POP_SHADOW.x] }) },
          { translateY: grip.interpolate({ inputRange: [0, 1], outputRange: [0, POP_SHADOW.y] }) },
        ],
      },
      top: {
        opacity: progress.interpolate({
          inputRange: [0, 0.02, 0.98, 1],
          outputRange: [0, 1, 1, 0],
          extrapolate: 'clamp' as const,
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: DAILY_PLAQUE_INPUT,
              outputRange: proud((v) => ((1 - Math.max(0.001, v)) * topH) / 2),
            }),
          },
          {
            scaleY: progress.interpolate({
              inputRange: DAILY_PLAQUE_INPUT,
              outputRange: proud((v) => Math.max(0.001, v)),
            }),
          },
        ],
      },
      shadow: {
        opacity: progress.interpolate({
          inputRange: DAILY_PLAQUE_INPUT,
          outputRange: proud((v) => v * POP_SHADOW.opacity),
        }),
        transform: [
          { translateX: progress.interpolate({ inputRange: DAILY_PLAQUE_INPUT, outputRange: proud((v) => v * POP_SHADOW.x) }) },
          { translateY: progress.interpolate({ inputRange: DAILY_PLAQUE_INPUT, outputRange: proud((v) => v * POP_SHADOW.y) }) },
        ],
      },
      topH,
    };
  }, [progress, grip, p.width]);

  return (
    <Animated.View
      collapsable={false}
      pointerEvents="box-none"
      style={[styles.abs, { left: p.left, top: p.top, width: p.width, height: p.height }, motion.shell]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.popShadow, motion.shadow]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.popShadow, motion.popShadow]} />
      <Animated.Image
        source={ART.btnTop}
        resizeMode="stretch"
        style={[styles.btnTop, { width: p.width, height: motion.topH }, motion.popTop]}
      />
      <Animated.Image
        source={ART.btnTop}
        resizeMode="stretch"
        // Explicit size: a bundled image otherwise takes the file's pixel width.
        style={[styles.btnTop, { width: p.width, height: motion.topH }, motion.top]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={p.accessibilityLabel}
        disabled={p.locked}
        onPressIn={popIn}
        onPressOut={popOut}
        onPress={p.onPress}
        style={[styles.slab, { width: p.width, height: p.height }, p.debug]}
      >
        {/* Explicit size, NOT absoluteFill: on iOS an absoluteFill Image drew at its own pixel size
            (about 2x the button) and was clipped to the top-left quarter. */}
        <Image
          source={p.source}
          style={{ position: 'absolute', left: 0, top: 0, width: p.width, height: p.height }}
          resizeMode="stretch"
        />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.55}
          style={[
            styles.slabLabel,
            {
              fontSize: p.fontSize,
              letterSpacing: p.fontSize * TERRACE_LABEL.letterSpacingEm,
              color: p.color,
              textShadowColor: p.glow ? 'rgba(255,184,58,0.53)' : LABEL_SHADOW,
              textShadowRadius: p.glow ? 16 * p.k : 0,
              maxWidth: p.width * 0.96,
            },
          ]}
        >
          {p.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

type SeamProps = { width: number; height: number; k: number };

// Wide perspective seams (rows get farther apart toward the viewer, columns converge on a
// vanishing point above the ground). The line pairs give each seam a thin lit lower lip.
function GroundSeams({ width, height, k }: SeamProps) {
  const vx = TERRACE_GROUND_VANISH.x * k;
  const vy = TERRACE_GROUND_VANISH.y * k;
  const bottom = (TERRACE_DESIGN_H - 628) * k;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {TERRACE_GROUND_SEAM_ROWS.map((y) => (
        <React.Fragment key={`r${y}`}>
          <Line x1={0} x2={width} y1={y * k} y2={y * k} stroke={GROUND_SEAM} strokeOpacity={0.95} strokeWidth={3 * k} />
          <Line x1={0} x2={width} y1={(y + 2) * k} y2={(y + 2) * k} stroke={GROUND_BEVEL} strokeOpacity={0.5} strokeWidth={1.5 * k} />
        </React.Fragment>
      ))}
      {TERRACE_GROUND_SEAM_COLUMNS_BOTTOM_X.map((xb) => {
        const x0 = vx + (xb * k - vx) * ((0 - vy) / (bottom - vy));
        return (
          <Line key={`c${xb}`} x1={x0} y1={0} x2={xb * k} y2={bottom} stroke={GROUND_SEAM} strokeOpacity={0.9} strokeWidth={3 * k} />
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  abs: { position: 'absolute' },
  img: { position: 'absolute', pointerEvents: 'none' },
  dailyLabel: { position: 'absolute', textAlign: 'center', fontFamily: FONTS.wordDisplay, textShadowOffset: { width: 0, height: 2 } },
  gear: { alignItems: 'center', justifyContent: 'center' },
  slab: { alignItems: 'center', justifyContent: 'center' },
  trembleLayer: { position: 'absolute', left: 0, top: 0 },
  popShadow: { backgroundColor: '#000000' },
  btnTop: { position: 'absolute', left: 0, bottom: '100%' },
  slabLabel: { fontFamily: FONTS.terraceButton, textAlign: 'center', textShadowOffset: { width: 0, height: 2 } },
  selection: { borderWidth: 2, borderColor: '#B98ADE', borderStyle: 'dashed' },
  hitDebug: { borderWidth: 1, borderColor: 'rgba(245,200,66,0.9)', backgroundColor: 'rgba(245,200,66,0.12)' },
});
