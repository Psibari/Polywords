import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, FONT_SIZES } from '../../constants/fonts';
import { GhostMeaning, MasteredWordRecord } from '../../game/types';
import { libraryMaterial } from '../../ui/pwMaterials';
import { spineVariantFor } from '../../ui/spineVariants';
import { BookSpine, SPINE_HEIGHT, SPINE_WIDTHS } from './BookSpine';

const SPINE_GAP = 5;
const SHELF_RAIL_H = 12;
const SHELF_PAD_X = 14;
const MIN_SHELVES = 3; // honest empty space early on

type Props = {
  mastered: MasteredWordRecord[];
  ghosts: GhostMeaning[];
  selectedWord: string | null;
  onSelect: (word: string | null) => void;
};

type ShelfRow<T> = T[];

// Greedy row packing: fill a shelf until the next spine won't fit.
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

function spineWidthFor(word: string): number {
  return SPINE_WIDTHS[spineVariantFor(word).widthTier];
}

// The player's bookcase: warm wood backboard and rails (Warmth clause —
// purple leather spines stand against wood, never purple-on-purple).
export function Bookcase({ mastered, ghosts, selectedWord, onSelect }: Props) {
  const [innerWidth, setInnerWidth] = useState(0);

  const usable = Math.max(innerWidth - SHELF_PAD_X * 2, SPINE_WIDTHS[2] + SPINE_GAP);
  const masteredRows = innerWidth === 0
    ? []
    : packShelves(mastered, r => spineWidthFor(r.word), usable);
  while (masteredRows.length < MIN_SHELVES) masteredRows.push([]);

  const ghostRows = innerWidth === 0 || ghosts.length === 0
    ? []
    : packShelves(ghosts, g => spineWidthFor(g.word), usable);

  return (
    <View
      style={styles.case}
      onLayout={e => setInnerWidth(e.nativeEvent.layout.width)}
    >
      {masteredRows.map((row, i) => (
        <View key={`shelf-${i}`}>
          <View style={styles.shelfBooks}>
            {row.map(record => (
              <View key={record.word} style={{ marginRight: SPINE_GAP }}>
                <BookSpine
                  word={record.word}
                  kind="mastered"
                  isBoss={record.isBoss}
                  hiddenFound={record.hiddenMeaningFound.length > 0}
                  raised={selectedWord === record.word}
                  onPress={() =>
                    onSelect(selectedWord === record.word ? null : record.word)
                  }
                />
              </View>
            ))}
          </View>
          <View style={styles.rail}>
            <View style={styles.railHairline} />
          </View>
        </View>
      ))}

      {ghostRows.length > 0 && (
        <>
          <Text style={styles.hauntedLabel}>STILL HAUNTED</Text>
          {ghostRows.map((row, i) => (
            <View key={`haunt-${i}`}>
              <View style={styles.shelfBooks}>
                {row.map(ghost => (
                  <View key={ghost.wordId} style={{ marginRight: SPINE_GAP }}>
                    <BookSpine
                      word={ghost.word}
                      kind="ghost"
                      raised={selectedWord === ghost.word}
                      onPress={() =>
                        onSelect(selectedWord === ghost.word ? null : ghost.word)
                      }
                    />
                  </View>
                ))}
              </View>
              <View style={styles.rail}>
                <View style={styles.railHairline} />
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  case: {
    backgroundColor: libraryMaterial.woodDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: libraryMaterial.woodShadow,
    paddingHorizontal: SHELF_PAD_X,
    paddingTop: 18,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  shelfBooks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: SPINE_HEIGHT + 14, // headroom for the raise animation
    paddingTop: 14,
  },
  rail: {
    height: SHELF_RAIL_H,
    backgroundColor: libraryMaterial.wood,
    borderRadius: 2,
    marginBottom: 4,
  },
  railHairline: {
    height: 1,
    backgroundColor: libraryMaterial.shelfHairline,
  },
  hauntedLabel: {
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 3,
    color: 'rgba(185,138,222,0.6)', // faded lavender — her hold
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 2,
  },
});
