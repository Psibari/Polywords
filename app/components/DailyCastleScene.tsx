import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import { dailyCardMaterial } from '../ui/pwDailyMaterials';
import { DAILY_POOL } from '../game/dailyPool';
import DailyCardFace from './ui/DailyCardFace';
import { PollyPerchRig } from './PollyPerchRig';

const castleArt = require('../../assets/images/dailycastle/castle.png');
const clueBoardArt = require('../../assets/images/dailycastle/daily-clue-board.png');

type Props = {
  word: 'HIT' | 'HOOD';
  clueCount: 1 | 3;
};

// Screen-fraction placement for the castle Daily layout, derived from Pete's
// approved mockup at 1320x2866. Every value below is DEFAULT — tune on
// device, except boardImageAspect, which is a fixed property of the art.
export const CASTLE_LAYOUT = {
  boardWidthPct: 0.864, // DEFAULT — tune on device — of W, full board image incl. transparent padding
  boardTopPct: 0.221, // DEFAULT — tune on device — of H, top of full board image
  boardImageAspect: 1154 / 830, // fixed — daily-clue-board.png's native aspect ratio
  clueInsetLeft: 0.1395, // DEFAULT — tune on device — inner dark panel, fraction of board image box
  clueInsetRight: 0.8847, // DEFAULT — tune on device — inner dark panel, fraction of board image box
  clueInsetTop: 0.1904, // DEFAULT — tune on device — inner dark panel, fraction of board image box
  clueInsetBottom: 0.6843, // DEFAULT — tune on device — inner dark panel, fraction of board image box
  cardWidthPct: 0.394, // DEFAULT — tune on device — of W
  cardHeightPct: 0.0663, // DEFAULT — tune on device — of H
  cardSideMarginPct: 0.0707, // DEFAULT — tune on device — of W, left margin = gap = right margin
  cardRow1TopPct: 0.6385, // DEFAULT — tune on device — of H
  cardRowStepPct: 0.0803, // DEFAULT — tune on device — of H, top-to-top
  pollySize: 288, // DEFAULT — tune on device — same size PollyDailyPerch uses today
  pollyLeftPct: -0.01, // DEFAULT — tune on device — of W
  pollyFeetPct: 0.23, // DEFAULT — tune on device — of H, where her perch should sit
  pollyFeetFracOfSize: 0.92, // DEFAULT — tune on device — where the perch sits inside the rig box
} as const;

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

export default function DailyCastleScene({ word, clueCount }: Props) {
  const { width: W, height: H } = useWindowDimensions();

  const entry = DAILY_POOL.find((w) => w.word === word);
  const clues = entry ? entry.meanings.slice(0, clueCount) : [];
  const candidates = candidatesFor(word);

  const boardWidth = W * CASTLE_LAYOUT.boardWidthPct;
  const boardHeight = boardWidth / CASTLE_LAYOUT.boardImageAspect;
  const boardLeft = (W - boardWidth) / 2;
  const boardTop = H * CASTLE_LAYOUT.boardTopPct;

  const panelLeft = boardLeft + boardWidth * CASTLE_LAYOUT.clueInsetLeft;
  const panelTop = boardTop + boardHeight * CASTLE_LAYOUT.clueInsetTop;
  const panelWidth = boardWidth * (CASTLE_LAYOUT.clueInsetRight - CASTLE_LAYOUT.clueInsetLeft);
  const panelHeight = boardHeight * (CASTLE_LAYOUT.clueInsetBottom - CASTLE_LAYOUT.clueInsetTop);

  const cardWidth = W * CASTLE_LAYOUT.cardWidthPct;
  const cardHeight = H * CASTLE_LAYOUT.cardHeightPct;
  const cardSideMargin = W * CASTLE_LAYOUT.cardSideMarginPct;
  const cardLeftCol = [cardSideMargin, cardSideMargin * 2 + cardWidth];
  const cardRowTops = [0, 1, 2].map(
    (row) => H * CASTLE_LAYOUT.cardRow1TopPct + row * H * CASTLE_LAYOUT.cardRowStepPct,
  );

  const pollyLeft = W * CASTLE_LAYOUT.pollyLeftPct;
  const pollyTop = H * CASTLE_LAYOUT.pollyFeetPct - CASTLE_LAYOUT.pollySize * CASTLE_LAYOUT.pollyFeetFracOfSize;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={castleArt}
        resizeMode="cover"
        style={[styles.absolute, { top: 0, left: 0, width: W, height: H }]}
      />

      <Image
        source={clueBoardArt}
        resizeMode="contain"
        style={[styles.absolute, { top: boardTop, left: boardLeft, width: boardWidth, height: boardHeight }]}
      />

      <View style={[styles.absolute, styles.cluePanel, { top: panelTop, left: panelLeft, width: panelWidth, height: panelHeight }]}>
        <Text
          style={styles.clueText}
          numberOfLines={6}
          adjustsFontSizeToFit
          minimumFontScale={14 / 26}
        >
          {clues.join('\n')}
        </Text>
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
        <PollyPerchRig size={CASTLE_LAYOUT.pollySize} reduceMotion={false} />
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
  clueText: {
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    textAlign: 'center',
    color: '#ECE8FA',
    letterSpacing: 0.5,
    fontSize: 26,
    lineHeight: 30,
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
