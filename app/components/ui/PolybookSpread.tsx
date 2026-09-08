import React, { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { PlayerProgress } from "../../game/types";
import { PollyMemory } from "../../game/pollyMemory";
import {
  buildPreInstallRows,
  buildWorkLog,
  WorkLogRow,
} from "../../game/bookPage";
import { localDateKey } from "../../game/bookLog";
import { STRUCK_PAIRS, TODAY_ENTRIES } from "../../game/pollyBookLines";
import { resolveRivalryState } from "../../game/pollyMood";
import { createSeededRng, deriveSeed } from "../../game/seededRandom";
import PolybookTuningPanel from "../../dev/PolybookTuningPanel";
import { usePolybookTuning } from "../../dev/polybookTuning";
import { INK, INK_MUTED } from "../../ui/polybookInk";

// The Polybook spread — one open book, one page per screen. See
// docs/POLYBOOK.md for the rulings this renders and app/game/bookPage.ts for
// the pure functions that turn stored rows into what she wrote. This file
// only lays that out; it decides no content of its own beyond which pool
// entry a fixed seed points at.
//
// New component rather than an edit to LexiconPrototype, which is built for
// the old two-pages-at-once idea and already carries five dead props. See
// VaultScreen's POLYBOOK_SPREAD_ENABLED flag for the rollback path.

const POLYBOOK_ART = require("../../../assets/images/vault/polybook_open.png");
const MASTERED_SEAL = require("../../../assets/images/vault/polybook/polybook_master_seal_clean.png");
const POLYBOOK_SOURCE = Image.resolveAssetSource(POLYBOOK_ART);
const POLYBOOK_ASPECT_RATIO = POLYBOOK_SOURCE.width / POLYBOOK_SOURCE.height;

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatBookDate(date: string, showYear: boolean): string {
  const [year, month, day] = date.split("-");
  const label = `${MONTH_ABBR[Number(month) - 1]} ${day}`;
  return showYear ? `${label}, ${year}` : label;
}

function yearOf(date: string): string {
  return date.slice(0, 4);
}

// The row's most recent edge — its own date for a single-day row, endDate
// for a collapsed range. Used to find the adjacent date across a row
// boundary, since a range's `date` is always its OLDEST (start) edge.
function newEdgeDate(row: WorkLogRow): string {
  return row.endDate ?? row.date;
}

// A collapsed range renders as "Aug 22 – Aug 26" in the same muted date
// style as a single day. The base year rule (does THIS row show a year at
// all) only ever marks the start edge, same as a single-date row — a range
// that stays inside one calendar year has one year to show, so it shows it
// once. A range that itself crosses a year boundary is the one exception:
// both ends show their own year, regardless of the base rule.
function formatRowDateLabel(row: WorkLogRow, showStartYear: boolean): string {
  const crossesYear =
    row.endDate !== undefined && yearOf(row.date) !== yearOf(row.endDate);
  const startLabel = formatBookDate(row.date, showStartYear || crossesYear);
  if (row.endDate === undefined) return startLabel;
  const endLabel = formatBookDate(row.endDate, crossesYear);
  return `${startLabel} – ${endLabel}`;
}

// pageContent's own padding. In Yoga, an absolutely positioned child is
// placed from the PARENT'S PADDING EDGE, same as a normal-flow child — so an
// absolute child inside pageContent that also sets left/right to this value
// is not matching the padding, it is adding a second copy of it. logScroll
// and totalsBlock learned this the hard way (device-measured: the log column
// came out ~16pt narrower than the page box allows, exactly 2x this value)
// and now use left:0/right:0, same as any other absolute child that wants to
// fill pageContent's own content box exactly.
const PAGE_CONTENT_PADDING_H = 8;
const PAGE_CONTENT_PADDING_TOP = 10;
const PAGE_CONTENT_PADDING_BOTTOM = 8;

// The BEATEN corner never drops a word — it never scrolls, but it also never
// cuts the list. BEATEN_CORNER_MAX_WIDTH is a hard bound (the corner may not
// run into the page's centre); BEATEN_CORNER_MAX_HEIGHT is a soft ceiling —
// the block grows upward from the bottom as words accumulate, and only once
// it would exceed the ceiling do the seals themselves shrink to fit (see
// layoutBeatenSeals). The list is never sliced; the size is.
const BEATEN_CORNER_MAX_WIDTH = 170;
const BEATEN_CORNER_MAX_HEIGHT = 120;
const BEATEN_SEAL_GAP = 4;
const BEATEN_SEAL_MIN_SIZE = 10;

// Most-recent-first — kept for stable, deterministic ordering even though
// nothing is ever cut from it now; every mastered word renders regardless of
// position.
function sortMasteredMostRecentFirst<T extends { dateMastered?: string }>(
  words: T[],
): T[] {
  return [...words].sort((a, b) => {
    const aTime = a.dateMastered ? new Date(a.dateMastered).getTime() : 0;
    const bTime = b.dateMastered ? new Date(b.dateMastered).getTime() : 0;
    return bTime - aTime;
  });
}

type BeatenSealsLayout<T> = {
  sealSize: number;
  rows: T[][];
  blockWidth: number;
};

/**
 * Grid the BEATEN corner's seals: shrink the seal size (never the list) until
 * every word fits under BEATEN_CORNER_MAX_HEIGHT, then group them into rows
 * with any short row FIRST — rendered at the top of a plain top-to-bottom
 * column, full rows of exactly `columns` packed below it. Computed explicitly
 * rather than left to flexWrap: a wrap-reverse + justify combination was
 * producing a genuinely broken partial row (a hole, not a taper), and this
 * sidesteps that ambiguity entirely rather than papering over it with a
 * spacer.
 */
function layoutBeatenSeals<T>(
  words: T[],
  preferredSealSize: number,
): BeatenSealsLayout<T> {
  const count = words.length;
  const columnsAt = (size: number) =>
    Math.max(1, Math.floor(BEATEN_CORNER_MAX_WIDTH / (size + BEATEN_SEAL_GAP)));
  const heightForRows = (size: number, rowCount: number) =>
    rowCount * size + Math.max(0, rowCount - 1) * BEATEN_SEAL_GAP;

  let sealSize = preferredSealSize;
  let columns = columnsAt(sealSize);
  let rowCount = count === 0 ? 0 : Math.ceil(count / columns);

  while (
    count > 0 &&
    heightForRows(sealSize, rowCount) > BEATEN_CORNER_MAX_HEIGHT &&
    sealSize > BEATEN_SEAL_MIN_SIZE
  ) {
    sealSize -= 1;
    columns = columnsAt(sealSize);
    rowCount = Math.ceil(count / columns);
  }

  const rows: T[][] = [];
  const partial = count % columns;
  let index = 0;
  if (partial > 0) {
    rows.push(words.slice(0, partial));
    index = partial;
  }
  while (index < count) {
    rows.push(words.slice(index, index + columns));
    index += columns;
  }

  const blockWidth = columns * sealSize + Math.max(0, columns - 1) * BEATEN_SEAL_GAP;

  return { sealSize, rows, blockWidth };
}

type Props = {
  progress: PlayerProgress;
  pollyMemory: PollyMemory;
};

export function PolybookSpread({ progress, pollyMemory }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const layout = usePolybookTuning();

  // WORK LOG (plus its framing rule) and the totals block are both pinned
  // outside the log ScrollView, above and below it respectively (see the
  // left-page JSX below) — the ScrollView is inset on both edges by their
  // real rendered heights so rows clip at those edges instead of scrolling
  // underneath either one. These are just reasonable guesses for before the
  // first layout pass fires.
  const [logHeaderHeight, setLogHeaderHeight] = useState(30);
  const [totalsHeight, setTotalsHeight] = useState(90);

  const bookSeed = progress.bookSeed ?? 0;
  const log = progress.bookLog ?? [];
  const today = useMemo(() => localDateKey(new Date()), []);

  const workLogRows = useMemo(
    () => buildWorkLog({ log, today, bookSeed, maxRows: 60 }),
    [log, today, bookSeed],
  );

  // Oldest first in time, so they read as a continuation of the work log
  // going further back — reversed here because buildPreInstallRows returns
  // them oldest-first, but the page renders newest-to-oldest going down.
  const preInstallRows = useMemo(() => {
    const firstDate = log.length > 0 ? log[log.length - 1].date : today;
    return [...buildPreInstallRows({ firstDate, bookSeed })].reverse();
  }, [log, today, bookSeed]);

  const allRows = useMemo(
    () => [...workLogRows, ...preInstallRows],
    [workLogRows, preInstallRows],
  );

  // Rendered newest-first, so the row immediately AFTER a given row in this
  // array is the older neighbor. A row shows its year only when its own
  // start date's year differs from the older neighbor's most recent edge —
  // the point where the book actually crosses into a new year, shown once,
  // on the row where the crossing happened. The oldest row on screen has no
  // older neighbor to compare against, so it always shows its year. A
  // collapsed range that itself spans a year boundary shows the year on
  // both ends regardless (see formatRowDateLabel).
  const rowDisplays = useMemo(
    () =>
      allRows.map((row, index) => {
        const olderRow = allRows[index + 1];
        const showYear =
          !olderRow || yearOf(row.date) !== yearOf(newEdgeDate(olderRow));
        return { row, dateLabel: formatRowDateLabel(row, showYear) };
      }),
    [allRows],
  );

  // Stable forever once a player's book has a seed — rolled from bookSeed
  // alone, never the date, so this never changes as the log grows.
  const struckPair = useMemo(() => {
    const rng = createSeededRng(deriveSeed(bookSeed, "struckPair"));
    return STRUCK_PAIRS[Math.floor(rng() * STRUCK_PAIRS.length)];
  }, [bookSeed]);

  const rivalryState = useMemo(
    () =>
      resolveRivalryState({
        recent: progress.recentHuntPerformance ?? [],
        masteredCount: progress.masteredWords.length,
        runsCompleted: progress.runsCompleted,
      }),
    [
      progress.recentHuntPerformance,
      progress.masteredWords.length,
      progress.runsCompleted,
    ],
  );

  // Re-picked daily, stable within a day — keyed on today's date, so it
  // moves only when the calendar does, never on re-render.
  const todayEntry = useMemo(() => {
    const pool = TODAY_ENTRIES[rivalryState];
    const rng = createSeededRng(deriveSeed(bookSeed, today));
    return pool[Math.floor(rng() * pool.length)];
  }, [rivalryState, bookSeed, today]);

  const pageWidth = screenWidth;
  const bookWidth = pageWidth * 2;
  const bookHeight = bookWidth / POLYBOOK_ASPECT_RATIO;

  // This is a corner of a page, not a gallery: never scrolled, but never
  // cut either — every mastered word renders. layoutBeatenSeals shrinks the
  // seal size instead once the group would outgrow the corner's ceiling.
  const beatenWords = useMemo(
    () => sortMasteredMostRecentFirst(progress.masteredWords),
    [progress.masteredWords],
  );
  const beatenLayout = useMemo(
    () => layoutBeatenSeals(beatenWords, layout.sealSize),
    [beatenWords, layout.sealSize],
  );

  const pageBoxStyle = (leftPct: number) => ({
    left: `${leftPct}%` as const,
    top: `${layout.pageTopPct}%` as const,
    width: `${layout.pageWidthPct}%` as const,
    height: `${layout.pageHeightPct}%` as const,
    transform: [{ scale: layout.contentScale }],
  });

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={{ width: pageWidth, height: bookHeight }}
      >
        <View style={{ width: bookWidth, height: bookHeight }}>
          <Image
            source={POLYBOOK_ART}
            resizeMode="stretch"
            style={[
              styles.bookArt,
              { width: bookWidth, height: bookHeight },
            ]}
          />

          <View style={[styles.pageContent, pageBoxStyle(layout.leftPageLeftPct)]}>
            {/* Scroll region: the rows and ONLY the rows, framed top and
                bottom by the pinned header+rule and the pinned totals block
                below. */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={[
                styles.logScroll,
                {
                  top: PAGE_CONTENT_PADDING_TOP + logHeaderHeight,
                  bottom: PAGE_CONTENT_PADDING_BOTTOM + totalsHeight,
                },
              ]}
            >
              {rowDisplays.map(({ row, dateLabel }, index) => (
                <WorkLogRowView
                  key={`${row.date}-${index}`}
                  row={row}
                  dateLabel={dateLabel}
                />
              ))}
            </ScrollView>

            {/* Pinned header — WORK LOG plus a single framing rule beneath
                it. Normal flow, not absolute, so it naturally shares
                pageContent's own padding (and thus the same left edge as
                the rows above, via the explicit inset on logScroll). Never
                scrolls. */}
            <View
              style={styles.logHeader}
              onLayout={(e) => setLogHeaderHeight(e.nativeEvent.layout.height)}
            >
              <Text style={styles.label}>WORK LOG</Text>
              <View style={styles.logHeaderRule} />
            </View>

            {/* Pinned totals — the double rule and the four numbers she
                can't argue with. Anchored to the page's own bottom padding
                edge, out of the scroll entirely, so all four are always
                fully visible rather than the last items a long scroll
                might never quite reach. The double rule stays visually
                distinct from the single one above: two strokes, not one. */}
            <View
              style={[styles.totalsBlock, { bottom: PAGE_CONTENT_PADDING_BOTTOM }]}
              onLayout={(e) => setTotalsHeight(e.nativeEvent.layout.height)}
            >
              <View style={styles.doubleRule}>
                <View style={styles.ruleLine} />
                <View style={styles.ruleLine} />
              </View>

              <StatRow
                label="GOT PAST ME"
                value={(progress.realMaskIdsFound ?? []).length}
              />
              <StatRow label="HUNTS RUN" value={progress.runsCompleted} />
              <StatRow
                label="STREAK THEIRS"
                value={pollyMemory.playerWinStreak}
              />
              <StatRow label="STREAK MINE" value={pollyMemory.pollyWinStreak} />
            </View>
          </View>

          <View style={[styles.pageContent, pageBoxStyle(layout.rightPageLeftPct)]}>
            <View style={styles.struckPairBlock}>
              <Text style={styles.struckOld}>{struckPair.old}</Text>
              <Text style={styles.struckNext}>{struckPair.next}</Text>
            </View>

            <View style={styles.todayBlock}>
              {todayEntry.map((line, index) => (
                <Text key={index} style={styles.todayLine} numberOfLines={1}>
                  {line}
                </Text>
              ))}
            </View>

            <View style={styles.beatenCorner}>
              <Text style={styles.label}>BEATEN</Text>
              <View style={{ width: beatenLayout.blockWidth, gap: BEATEN_SEAL_GAP }}>
                {beatenLayout.rows.map((rowWords, rowIndex) => (
                  <View key={rowIndex} style={styles.beatenSealsRow}>
                    {rowWords.map((record) => (
                      <Image
                        key={record.word}
                        source={MASTERED_SEAL}
                        resizeMode="contain"
                        style={{
                          width: beatenLayout.sealSize,
                          height: beatenLayout.sealSize,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {__DEV__ && <PolybookTuningPanel />}
    </View>
  );
}

function WorkLogRowView({
  row,
  dateLabel,
}: {
  row: WorkLogRow;
  dateLabel: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{dateLabel}</Text>
      {row.word && <Text style={styles.rowWord}>{row.word}</Text>}
      {row.lines.map((line, index) => (
        <Text key={index} style={styles.rowLine} numberOfLines={1}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  bookArt: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  pageContent: {
    position: "absolute",
    overflow: "hidden",
    paddingHorizontal: PAGE_CONTENT_PADDING_H,
    paddingTop: PAGE_CONTENT_PADDING_TOP,
    paddingBottom: PAGE_CONTENT_PADDING_BOTTOM,
  },
  logScroll: {
    // Absolute (not flex), inset below the pinned header and above the
    // pinned totals by their own measured heights (top/bottom are set
    // per-instance — see the left-page JSX). Rows clip at these edges
    // rather than merely being padded past them, so nothing can travel
    // underneath either pinned block. left/right are 0 — Yoga positions an
    // absolute child from the parent's PADDING edge, so 0 already lands
    // this flush with pageContent's padded content box, same edge the
    // pinned header (a normal-flow sibling) sits at. See
    // PAGE_CONTENT_PADDING_H's own comment for the bug this replaced.
    position: "absolute",
    left: 0,
    right: 0,
  },
  logHeader: {
    // Normal flow, not absolute — it sits at pageContent's own top-left
    // padding like any other normal child, which is exactly why the rows
    // above (inset to match, not inheriting) now share its left edge.
  },
  logHeaderRule: {
    height: 1,
    backgroundColor: INK_MUTED,
    marginBottom: 6,
  },
  totalsBlock: {
    // Anchored to pageContent's bottom padding edge (bottom is set
    // per-instance). left/right are 0, same reasoning as logScroll — Yoga
    // already applies the parent's padding to an absolute child.
    position: "absolute",
    left: 0,
    right: 0,
  },
  label: {
    fontFamily: FONTS.ui,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 1.2,
    color: INK,
    marginBottom: 8,
  },
  row: {
    marginBottom: 10,
  },
  rowDate: {
    fontFamily: FONTS.ui,
    includeFontPadding: false,
    fontSize: 14,
    color: INK_MUTED,
  },
  rowWord: {
    fontFamily: FONTS.ui,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 0.6,
    color: INK,
  },
  rowLine: {
    fontFamily: FONTS.hand,
    includeFontPadding: false,
    fontSize: 19,
    color: INK,
  },
  doubleRule: {
    marginTop: 6,
    marginBottom: 8,
    gap: 2,
  },
  ruleLine: {
    height: 1,
    backgroundColor: INK_MUTED,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.ui,
    includeFontPadding: false,
    fontSize: 14,
    color: INK_MUTED,
  },
  statValue: {
    fontFamily: FONTS.ui,
    includeFontPadding: false,
    fontSize: 14,
    color: INK,
  },
  struckPairBlock: {
    marginBottom: 16,
  },
  struckOld: {
    fontFamily: FONTS.hand,
    includeFontPadding: false,
    fontSize: 17,
    color: INK_MUTED,
    textDecorationLine: "line-through",
  },
  struckNext: {
    fontFamily: FONTS.hand,
    includeFontPadding: false,
    fontSize: 17,
    color: INK,
  },
  todayBlock: {
    gap: 2,
  },
  todayLine: {
    fontFamily: FONTS.hand,
    includeFontPadding: false,
    fontSize: 21,
    color: INK,
  },
  beatenCorner: {
    // Hard into the page's bottom-right corner — she put these somewhere
    // she does not have to look, and laid out neatly with a cushion of
    // space around it is the opposite of that.
    position: "absolute",
    bottom: 0,
    right: 0,
    alignItems: "flex-end",
  },
  beatenSealsRow: {
    // One row of the BEATEN block (see layoutBeatenSeals) — stretches to
    // the parent's explicit blockWidth and right-aligns its own seals, so a
    // short top row tapers flush against the same right edge as the full
    // rows below it rather than leaving an off-center hole.
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: BEATEN_SEAL_GAP,
  },
});
