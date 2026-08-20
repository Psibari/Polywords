import React, { useMemo, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../../constants/fonts';
import { GhostMeaning, MasteredWordRecord } from '../../game/types';
import { libraryMaterial } from '../../ui/pwMaterials';
import { spineVariantFor } from '../../ui/spineVariants';
import { BookSpine, SPINE_HEIGHT, SPINE_WIDTHS } from './BookSpine';

const SPINE_GAP = 4;
const MIN_MASTERED_SHELVES = 3; // honest empty space early on
const FRAME_ASPECT_RATIO = 900 / 1346;
const SHELF_SIDE_INSET = 0.074;
const VAULT_SPINE_HEIGHT = 84;

const bookcaseImage = require('../../../assets/images/vault/shelves.png');

const SHELF_SLOTS = [
  { top: '30.5%', height: '13.6%' },
  { top: '46.1%', height: '13.7%' },
  { top: '61.8%', height: '15.9%' },
] as const;

type Props = {
  mastered: MasteredWordRecord[];
  ghosts: GhostMeaning[];
  selectedWord: string | null;
  onSelect: (word: string | null) => void;
};

type ShelfRow<T> = T[];

type ShelfEntry =
  | { key: string; kind: 'mastered'; row: ShelfRow<MasteredWordRecord> }
  | { key: string; kind: 'ghost'; row: ShelfRow<GhostMeaning>; label?: string }
  | { key: string; kind: 'empty'; row: [] };

function spineWidthFor(word: string): number {
  const scale = VAULT_SPINE_HEIGHT / SPINE_HEIGHT;
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
export function Bookcase({ mastered, ghosts, selectedWord, onSelect }: Props) {
  const [frameWidth, setFrameWidth] = useState(0);
  // 0 is an honest "not measured yet" sentinel, but shelfWidth's own floor
  // (below) still produces a real, too-narrow packing width from it — so
  // gate the actual render on a real measurement having landed, same
  // pattern as SettingsScreen's chamberWidth, instead of ever painting
  // shelves packed against the floor value.
  const hasMeasuredFrame = frameWidth > 0;
  const shelfWidth = Math.max(
    frameWidth * (1 - SHELF_SIDE_INSET * 2),
    spineWidthFor('POLYWORDS') + SPINE_GAP,
  );

  const frames = useMemo(() => {
    const masteredRows = packShelves(mastered, r => spineWidthFor(r.word), shelfWidth);
    while (masteredRows.length < MIN_MASTERED_SHELVES) masteredRows.push([]);

    const ghostRows = ghosts.length === 0
      ? []
      : packShelves(ghosts, g => spineWidthFor(g.word), shelfWidth);

    const entries: ShelfEntry[] = masteredRows.map((row, i) => (
      row.length > 0
        ? { key: `mastered-${i}`, kind: 'mastered', row }
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
  }, [ghosts, mastered, shelfWidth]);

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
                  { top: slot.top, height: slot.height },
                ]}
              >
                {entry.kind === 'ghost' && entry.label && (
                  <Text style={styles.hauntedLabel}>{entry.label}</Text>
                )}

                <View style={styles.shelfBooks}>
                  {entry.kind === 'mastered' && entry.row.map(record => (
                    <View key={record.word} style={styles.spineWrap}>
                      <BookSpine
                        word={record.word}
                        kind="mastered"
                        isBoss={record.isBoss}
                        raised={selectedWord === record.word}
                        height={VAULT_SPINE_HEIGHT}
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
                        height={VAULT_SPINE_HEIGHT}
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: libraryMaterial.bookcaseShade,
  },
  shelfSlot: {
    position: 'absolute',
    left: `${SHELF_SIDE_INSET * 100}%`,
    right: `${SHELF_SIDE_INSET * 100}%`,
  },
  shelfBooks: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
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
