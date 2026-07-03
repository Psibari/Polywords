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
      {/* Paneled backboard — vertical seams in the wood */}
      {innerWidth > 0 && (
        <View pointerEvents="none" style={styles.backboardPanels}>
          {Array.from({ length: Math.max(3, Math.round(innerWidth / 56)) }, (_, i) => (
            <View key={i} style={styles.panelSeam} />
          ))}
        </View>
      )}
      {/* Face frame — the cabinet's structure: posts + header/footer beams */}
      <View pointerEvents="none" style={styles.caseBeamTop} />
      <View pointerEvents="none" style={styles.caseBeamBottom} />
      <View pointerEvents="none" style={styles.casePostLeft} />
      <View pointerEvents="none" style={styles.casePostRight} />

      {masteredRows.map((row, i) => (
        <View key={`shelf-${i}`}>
          <View style={[styles.shelfBooks, row.length === 0 && styles.shelfBooksEmpty]}>
            {row.map(record => (
              <View key={record.word} style={{ marginRight: SPINE_GAP }}>
                <BookSpine
                  word={record.word}
                  kind="mastered"
                  isBoss={record.isBoss}
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
            <View style={styles.railTop} />
            <View style={styles.railFront} />
            <View style={[styles.bracket, styles.bracketLeft]} />
            <View style={[styles.bracket, styles.bracketRight]} />
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
  shelfBooksEmpty: {
    // An empty shelf is a shallow vacant slot, not a full-height void
    minHeight: 34,
    paddingTop: 0,
  },
  rail: {
    height: SHELF_RAIL_H + 2,
    marginBottom: 8,
    // Boards socket into the posts — run edge-to-edge past the padding
    marginHorizontal: -(SHELF_PAD_X - 10),
  },
  railHairline: {
    height: 1,
    backgroundColor: libraryMaterial.shelfHairline,
  },
  railTop: {
    // Lit top face of the shelf board
    height: 5,
    backgroundColor: libraryMaterial.wood,
  },
  railFront: {
    // Darker front face — the board's thickness
    height: 8,
    backgroundColor: libraryMaterial.woodShadow,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  backboardPanels: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  panelSeam: {
    width: 1,
    backgroundColor: libraryMaterial.woodShadow,
    opacity: 0.5,
  },
  caseBeamTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: libraryMaterial.wood,
    borderBottomWidth: 1,
    borderBottomColor: libraryMaterial.woodShadow,
  },
  caseBeamBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: libraryMaterial.wood,
    borderTopWidth: 1,
    borderTopColor: libraryMaterial.woodShadow,
  },
  casePostLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 10,
    backgroundColor: libraryMaterial.wood,
    borderRightWidth: 1,
    borderRightColor: libraryMaterial.woodShadow,
  },
  casePostRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 10,
    backgroundColor: libraryMaterial.wood,
    borderLeftWidth: 1,
    borderLeftColor: libraryMaterial.woodShadow,
  },
  bracket: {
    position: 'absolute',
    bottom: -5,
    width: 8,
    height: 6,
    backgroundColor: libraryMaterial.woodShadow,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  bracketLeft: {
    left: '12%',
  },
  bracketRight: {
    right: '12%',
  },
  hauntedLabel: {
    fontFamily: FONTS.label,
    fontSize: FONT_SIZES.progressLabel,
    letterSpacing: 3,
    color: libraryMaterial.hauntedLabel,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 2,
  },
});
