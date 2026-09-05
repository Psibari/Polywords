import React, { useMemo, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../../constants/fonts';
import { GhostMeaning } from '../../game/types';
import { libraryMaterial } from '../../ui/pwMaterials';
import { spineVariantFor } from '../../ui/spineVariants';
import { BookSpine, SPINE_HEIGHT, SPINE_WIDTHS } from './BookSpine';

const SPINE_GAP = 4;
const RAISE_RATIO = 14 / 128; // must match BookSpine RAISE_Y / SPINE_HEIGHT
const SHELF_BASE_GAP = 2;
const SPINE_TOP_MARGIN = 3;
const SPINE_MIN_HEIGHT = 48;
const MIN_MASTERED_SHELVES = 3; // honest empty space early on
// assets/images/vault/shelves.png is 1026 x 1533px.
const FRAME_ASPECT_RATIO = 1026 / 1533;
const SHELF_LEFT_INSET = 0.1774; // measured: plank rim left edge
const SHELF_RIGHT_INSET = 0.1832; // measured: plank rim right edge

const bookcaseImage = require('../../../assets/images/vault/shelves.png');

// Each slot's BOTTOM is a painted surface; books stand on it.
// Measured from shelves.png (1026 x 1533).
const SHELF_SLOTS = [
  { top: 0.1300, height: 0.1746 }, // alcove ceiling -> plank 1 (30.46%)
  { top: 0.3046, height: 0.1566 }, // plank 1 -> plank 2 (46.12%)
  { top: 0.4612, height: 0.1565 }, // plank 2 -> plank 3 (61.77%)
  { top: 0.6177, height: 0.2075 }, // plank 3 -> base ledge (82.52%)
] as const;

export type VaultWordRecord = {
  word: string;
  isBoss?: boolean;
  isFinished: boolean;
  claimedCount: number;
  totalCount: number;
};

type Props = {
  books: VaultWordRecord[];
  ghosts: GhostMeaning[];
  selectedWord: string | null;
  onSelect: (word: string | null) => void;
};

type ShelfRow<T> = T[];

type ShelfEntry =
  | { key: string; kind: 'book'; row: ShelfRow<VaultWordRecord> }
  | { key: string; kind: 'ghost'; row: ShelfRow<GhostMeaning>; label?: string }
  | { key: string; kind: 'empty'; row: [] };

function spineWidthFor(word: string, height: number): number {
  const scale = height / SPINE_HEIGHT;
  return Math.round(SPINE_WIDTHS[spineVariantFor(word).widthTier] * scale);
}

// Greedy row packing: fill a physical shelf until the next spine would crowd it.
function packShelves<T>(items: T[], widthOf: (item: T) => number, shelfWidth: number): ShelfRow<T>[] {
  const rows: ShelfRow<T>[] = [];
  let row: T[] = [];
  let used = 0;

  for (const item of items) {
    const w = widthOf(item) + SPINE_GAP;
    if (row.length > 0 && used + w > shelfWidth) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push(item);
    used += w;
  }

  if (row.length > 0) rows.push(row);
  return rows;
}

function chunkShelves(entries: ShelfEntry[]): ShelfEntry[][] {
  const frames: ShelfEntry[][] = [];
  for (let i = 0; i < entries.length; i += SHELF_SLOTS.length) {
    frames.push(entries.slice(i, i + SHELF_SLOTS.length));
  }
  return frames.length > 0 ? frames : [[{ key: 'empty-0', kind: 'empty', row: [] }]];
}

// The player's archive is made of physical cabinet frames. The uploaded
// bookcase art defines shelf positions; rows never stretch the image.
export function Bookcase({ books, ghosts, selectedWord, onSelect }: Props) {
  const [frameWidth, setFrameWidth] = useState(0);
  // 0 is an honest "not measured yet" sentinel, but shelfWidth's own floor
  // (below) still produces a real, too-narrow packing width from it — so
  // gate the actual render on a real measurement having landed, same
  // pattern as SettingsScreen's chamberWidth, instead of ever painting
  // shelves packed against the floor value.
  const hasMeasuredFrame = frameWidth > 0;

  // VAULT_SPINE_HEIGHT used to be a fixed pt value inside a slot whose real
  // pixel height depends on device width. Derive it from the shortest slot
  // instead, leaving room for BookSpine's own raise-on-select lift so a
  // raised spine never drives through the plank above it.
  const frameHeight = frameWidth / FRAME_ASPECT_RATIO;
  const shortestSlot = Math.min(...SHELF_SLOTS.map(s => s.height));
  const spineHeight = Math.max(
    SPINE_MIN_HEIGHT,
    Math.floor((frameHeight * shortestSlot - SHELF_BASE_GAP - SPINE_TOP_MARGIN)
               / (1 + RAISE_RATIO)),
  );

  const shelfWidth = Math.max(
    frameWidth * (1 - SHELF_LEFT_INSET - SHELF_RIGHT_INSET),
    spineWidthFor('POLYWORDS', spineHeight) + SPINE_GAP,
  );

  const frames = useMemo(() => {
    const bookRows = packShelves(books, r => spineWidthFor(r.word, spineHeight), shelfWidth);
    while (bookRows.length < MIN_MASTERED_SHELVES) bookRows.push([]);

    const ghostRows = ghosts.length === 0
      ? []
      : packShelves(ghosts, g => spineWidthFor(g.word, spineHeight), shelfWidth);

    const entries: ShelfEntry[] = bookRows.map((row, i) => (
      row.length > 0
        ? { key: `book-${i}`, kind: 'book', row }
        : { key: `empty-${i}`, kind: 'empty', row: [] }
    ));

    ghostRows.forEach((row, i) => {
      entries.push({
        key: `ghost-${i}`,
        kind: 'ghost',
        row,
        label: i === 0 ? 'STILL HAUNTED' : undefined,
      });
    });

    return chunkShelves(entries);
  }, [books, ghosts, shelfWidth, spineHeight]);

  return (
    <View style={styles.caseStack} onLayout={e => setFrameWidth(e.nativeEvent.layout.width)}>
      {hasMeasuredFrame && frames.map((frame, frameIndex) => (
        <ImageBackground
          key={`case-${frameIndex}`}
          source={bookcaseImage}
          resizeMode="stretch"
          imageStyle={styles.caseImage}
          style={styles.caseFrame}
        >
          <View pointerEvents="none" style={styles.caseShade} />

          {SHELF_SLOTS.map((slot, slotIndex) => {
            const entry = frame[slotIndex] ?? { key: `empty-${frameIndex}-${slotIndex}`, kind: 'empty', row: [] };

            return (
              <View
                key={entry.key}
                style={[
                  styles.shelfSlot,
                  { top: `${slot.top * 100}%`, height: `${slot.height * 100}%` },
                ]}
              >
                {entry.kind === 'ghost' && entry.label && (
                  <Text style={styles.hauntedLabel}>{entry.label}</Text>
                )}

                <View style={styles.shelfBooks}>
                  {entry.kind === 'book' && entry.row.map(record => (
                    <View key={record.word} style={styles.spineWrap}>
                      <BookSpine
                        word={record.word}
                        kind="mastered"
                        isBoss={record.isBoss}
                        isFinished={record.isFinished}
                        raised={selectedWord === record.word}
                        height={spineHeight}
                        onPress={() =>
                          onSelect(selectedWord === record.word ? null : record.word)
                        }
                      />
                    </View>
                  ))}

                  {entry.kind === 'ghost' && entry.row.map(ghost => (
                    <View key={ghost.wordId} style={styles.spineWrap}>
                      <BookSpine
                        word={ghost.word}
                        kind="ghost"
                        raised={selectedWord === ghost.word}
                        height={spineHeight}
                        onPress={() =>
                          onSelect(selectedWord === ghost.word ? null : ghost.word)
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ImageBackground>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caseStack: {
    gap: 14,
  },
  caseFrame: {
    width: '100%',
    aspectRatio: FRAME_ASPECT_RATIO,
    backgroundColor: libraryMaterial.woodDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: libraryMaterial.bookcaseBorder,
    overflow: 'hidden',
    ...libraryMaterial.bookcaseShadow,
  },
  caseImage: {
    borderRadius: 8,
  },
  caseShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: libraryMaterial.bookcaseShade,
  },
  shelfSlot: {
    position: 'absolute',
    left: `${SHELF_LEFT_INSET * 100}%`,
    right: `${SHELF_RIGHT_INSET * 100}%`,
  },
  shelfBooks: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SHELF_BASE_GAP,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  spineWrap: {
    marginRight: SPINE_GAP,
  },
  hauntedLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 3,
    color: libraryMaterial.hauntedLabel,
    textAlign: 'center',
  },
});
