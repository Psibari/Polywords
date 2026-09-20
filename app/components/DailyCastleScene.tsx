import React, { useEffect, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import { dailyCardMaterial } from '../ui/pwDailyMaterials';
import { DAILY_POOL } from '../game/dailyPool';
import DailyCardFace from './ui/DailyCardFace';
import { PollyPerchRig } from './PollyPerchRig';

const castleArt = require('../../assets/images/dailycastle/answerwall.png');
const gateArt = require('../../assets/images/dailycastle/stonegate.png');

type Props = {
  word: 'HIT' | 'HOOD';
  clueCount: 1 | 3;
  layout?: Partial<CastleLayout>;
  onClueFit?: (fontSize: number, overflowAtFloor: boolean) => void;
};

// Screen-fraction placement for the castle Daily layout, tunable from
// DailyCastleSceneDevViewer's on-device panel. Every value is DEFAULT — tune
// on device. Fixed properties of the art (aspect ratio, clue panel insets)
// are kept as plain constants below, not part of this tunable set.
export type CastleLayout = {
  pollySizePct: number;
  pollyLeftPct: number;
  pollyTopPct: number;
  boardWidthPct: number;
  boardTopPct: number;
  cardRow1TopPct: number;
  cardRowStepPct: number;
  cardWidthPct: number;
  cardHeightPct: number;
  cardSideMarginPct: number;
  clueMaxFontPct: number;
};

export const CASTLE_LAYOUT_DEFAULTS: CastleLayout = {
  pollySizePct: 0.55, // DEFAULT — tune on device — Polly rig box size, fraction of W
  pollyLeftPct: -0.02, // DEFAULT — tune on device — fraction of W
  pollyTopPct: 0.0, // DEFAULT — tune on device — crown-box top, fraction of H, below the top safe-area inset
  boardWidthPct: 0.94, // DEFAULT — tune on device — fraction of W, full board image incl. transparent padding
  boardTopPct: 0.27, // DEFAULT — tune on device — fraction of H, top of full board image
  cardRow1TopPct: 0.66, // DEFAULT — tune on device — fraction of H
  cardRowStepPct: 0.08, // DEFAULT — tune on device — fraction of H, top-to-top
  cardWidthPct: 0.394, // DEFAULT — tune on device — fraction of W
  cardHeightPct: 0.0663, // DEFAULT — tune on device — fraction of H
  cardSideMarginPct: 0.0707, // DEFAULT — tune on device — fraction of W, left margin = gap = right margin
  clueMaxFontPct: 0.075, // DEFAULT — tune on device — largest clue font size, fraction of W
};

// Fixed properties of the committed art — not tunable.
const BOARD_IMAGE_ASPECT = 1508 / 1439;
const CLUE_INSET_LEFT = 0.130;
const CLUE_INSET_RIGHT = 0.909;
const CLUE_INSET_TOP = 0.118;
const CLUE_INSET_BOTTOM = 0.614;
const CLUE_FONT_FLOOR = 14;

const HIT_CANDIDATES = ['SLAP', 'ASSASSINATION', 'HIT', 'SINGLE', 'SMASH', 'STRIKE'] as const;

function candidatesFor(word: 'HIT' | 'HOOD'): readonly string[] {
  if (word === 'HIT') return HIT_CANDIDATES;
  const entry = DAILY_POOL.find((w) => w.word === 'HOOD');
  return entry ? entry.candidates.slice(0, 6) : [];
}

// Non-interactive copy of DailyAnswerCard's idle look (shell/rim/face), for a
// static grid — never DailyAnswerCard itself, which carries gestures and
// Reanimated shared values this preview must not depend on.
function StaticAnswerCard({
  label,
  left,
  top,
  width,
  height,
}: {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return (
    <View style={[styles.cardShell, { left, top, width, height }]}>
      <LinearGradient
        colors={dailyCardMaterial.outerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardRim}
      >
        <View style={styles.cardFace}>
          <DailyCardFace label={label} />
        </View>
      </LinearGradient>
    </View>
  );
}

// Renders each clue as its own line at one shared fontSize, used both for
// the visible block and the invisible measuring copy so the two always
// agree on layout.
function ClueLines({
  clues,
  fontSize,
  width,
}: {
  clues: readonly string[];
  fontSize: number;
  width: number;
}) {
  const lineHeight = Math.round(fontSize * 1.15);
  const gap = Math.round(fontSize * 0.45);
  return (
    <View style={{ width, gap }}>
      {clues.map((clue, index) => (
        <Text key={index} style={[styles.clueText, { fontSize, lineHeight }]}>
          {clue}
        </Text>
      ))}
    </View>
  );
}

export default function DailyCastleScene({ word, clueCount, layout, onClueFit }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const resolvedLayout: CastleLayout = { ...CASTLE_LAYOUT_DEFAULTS, ...layout };

  const entry = DAILY_POOL.find((w) => w.word === word);
  const clues = entry ? entry.meanings.slice(0, clueCount) : [];
  const candidates = candidatesFor(word);

  const boardWidth = W * resolvedLayout.boardWidthPct;
  const boardHeight = boardWidth / BOARD_IMAGE_ASPECT;
  const boardLeft = (W - boardWidth) / 2;
  const boardTop = H * resolvedLayout.boardTopPct;

  const panelLeft = boardLeft + boardWidth * CLUE_INSET_LEFT;
  const panelTop = boardTop + boardHeight * CLUE_INSET_TOP;
  const panelWidth = boardWidth * (CLUE_INSET_RIGHT - CLUE_INSET_LEFT);
  const panelHeight = boardHeight * (CLUE_INSET_BOTTOM - CLUE_INSET_TOP);

  const cardWidth = W * resolvedLayout.cardWidthPct;
  const cardHeight = H * resolvedLayout.cardHeightPct;
  const cardSideMargin = W * resolvedLayout.cardSideMarginPct;
  const cardLeftCol = [cardSideMargin, cardSideMargin * 2 + cardWidth];
  const cardRowTops = [0, 1, 2].map(
    (row) => H * resolvedLayout.cardRow1TopPct + row * H * resolvedLayout.cardRowStepPct,
  );

  const pollySize = W * resolvedLayout.pollySizePct;
  const pollyLeft = W * resolvedLayout.pollyLeftPct;
  const pollyTop = insets.top + H * resolvedLayout.pollyTopPct;

  // Deterministic clue fit: start at the tunable max, measure the invisible
  // copy below, and step the shared fontSize down one point at a time until
  // it fits the panel or hits the 14pt floor — never a numberOfLines clip.
  const clueTextKey = clues.join('\n');
  const [fontSize, setFontSize] = useState(() =>
    Math.max(CLUE_FONT_FLOOR, Math.floor(W * resolvedLayout.clueMaxFontPct)),
  );
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    setFontSize(Math.max(CLUE_FONT_FLOOR, Math.floor(W * resolvedLayout.clueMaxFontPct)));
    setSettled(false);
  }, [clueTextKey, panelWidth, panelHeight, resolvedLayout.clueMaxFontPct, W]);

  function handleMeasureLayout(event: LayoutChangeEvent) {
    if (settled) return;
    const measuredHeight = event.nativeEvent.layout.height;
    if (measuredHeight > panelHeight && fontSize > CLUE_FONT_FLOOR) {
      setFontSize((f) => Math.max(CLUE_FONT_FLOOR, f - 1));
      return;
    }
    setSettled(true);
    onClueFit?.(fontSize, measuredHeight > panelHeight);
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={castleArt}
        resizeMode="cover"
        style={[styles.absolute, { top: 0, left: 0, width: W, height: H }]}
      />

      <Image
        source={gateArt}
        resizeMode="contain"
        style={[styles.absolute, { top: boardTop, left: boardLeft, width: boardWidth, height: boardHeight }]}
      />

      <View
        style={[
          styles.absolute,
          styles.cluePanel,
          { top: panelTop, left: panelLeft, width: panelWidth, height: panelHeight },
        ]}
      >
        <ClueLines clues={clues} fontSize={fontSize} width={panelWidth} />
        <View
          style={[styles.absolute, styles.clueMeasure, { width: panelWidth }]}
          pointerEvents="none"
          onLayout={handleMeasureLayout}
        >
          <ClueLines clues={clues} fontSize={fontSize} width={panelWidth} />
        </View>
      </View>

      {candidates.map((label, index) => (
        <StaticAnswerCard
          key={label}
          label={label}
          left={cardLeftCol[index % 2]}
          top={cardRowTops[Math.floor(index / 2)]}
          width={cardWidth}
          height={cardHeight}
        />
      ))}

      <View style={[styles.absolute, { left: pollyLeft, top: pollyTop }]}>
        <PollyPerchRig size={pollySize} reduceMotion={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  cluePanel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clueMeasure: {
    top: 0,
    left: 0,
    opacity: 0,
  },
  clueText: {
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    textAlign: 'center',
    color: '#ECE8FA',
    letterSpacing: 0.5,
  },
  cardShell: {
    position: 'absolute',
    borderRadius: dailyCardMaterial.outerRadius,
    shadowColor: dailyCardMaterial.shadowColor,
    shadowOpacity: dailyCardMaterial.shadowOpacity,
    shadowRadius: dailyCardMaterial.shadowRadius,
    shadowOffset: dailyCardMaterial.shadowOffset,
    elevation: dailyCardMaterial.elevation,
  },
  cardRim: {
    flex: 1,
    borderRadius: dailyCardMaterial.outerRadius,
    padding: dailyCardMaterial.frameWidth,
  },
  cardFace: {
    flex: 1,
    borderRadius: dailyCardMaterial.innerRadius,
    backgroundColor: dailyCardMaterial.innerFace,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
});
