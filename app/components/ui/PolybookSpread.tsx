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
const QUILL_ART = require("../../../assets/images/vault/polybook/quill_clean.png");
const POLYBOOK_SOURCE = Image.resolveAssetSource(POLYBOOK_ART);
const POLYBOOK_ASPECT_RATIO = POLYBOOK_SOURCE.width / POLYBOOK_SOURCE.height;
const QUILL_SOURCE = Image.resolveAssetSource(QUILL_ART);
const QUILL_ASPECT_RATIO = QUILL_SOURCE.width / QUILL_SOURCE.height;

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

// pageContent's own padding — named so the absolutely positioned children
// inside it (logScroll, totalsBlock) can explicitly match it. React Native
// does NOT apply a parent's padding to absolutely positioned children (only
// to normal-flow ones), so an absolute child using left:0/top:0 lands at the
// padding-less border edge — a few points off from a normal-flow sibling at
// the same nominal position. Matching these constants explicitly, rather
// than relying on inheritance, is what keeps the two from drifting apart.
const PAGE_CONTENT_PADDING_H = 8;
const PAGE_CONTENT_PADDING_TOP = 10;
const PAGE_CONTENT_PADDING_BOTTOM = 8;

// The BEATEN corner's own footprint — a corner of a page, not a gallery, so
// it never scrolls and never grows past this box. How many seals actually
// fit inside it is computed from the live sealSize (see beatenSealCap in the
// component), so shrinking or growing the tuner's SEAL knob keeps this box
// honest instead of needing a second hand-tuned constant.
const BEATEN_CORNER_MAX_WIDTH = 170;
const BEATEN_CORNER_MAX_HEIGHT = 120;
const BEATEN_SEAL_GAP = 4;

// Most-recent-first, same rule LexiconPrototype's formatMasteredWords used —
// so when the corner can't hold every mastered word, it's the newest ones
// that survive the cap, not an arbitrary slice.
function sortMasteredMostRecentFirst<T extends { dateMastered?: string }>(
  words: T[],
): T[] {
  return [...words].sort((a, b) => {
    const aTime = a.dateMastered ? new Date(a.dateMastered).getTime() : 0;
    const bTime = b.dateMastered ? new Date(b.dateMastered).getTime() : 0;
    return bTime - aTime;
  });
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

  // Base size before the tuner's scale knob — a starting point sized off the
  // screen, not a guessed final value. The quill is anchored to the screen
  // now (see styles.quill), not to page coordinates, so its base size scales
  // off pageWidth rather than the book image.
  const quillBaseWidth = pageWidth * 0.5;
  const quillBaseHeight = quillBaseWidth / QUILL_ASPECT_RATIO;

  // How many seals the BEATEN corner can actually hold at the tuner's live
  // sealSize — recomputed from the box's own footprint rather than a second
  // hand-picked number, so shrinking or growing SEAL in the tuner keeps the
  // cap honest instead of drifting out of sync with it.
  const beatenColumns = Math.max(
    1,
    Math.floor(BEATEN_CORNER_MAX_WIDTH / (layout.sealSize + BEATEN_SEAL_GAP)),
  );
  const beatenRows = Math.max(
    1,
    Math.floor(BEATEN_CORNER_MAX_HEIGHT / (layout.sealSize + BEATEN_SEAL_GAP)),
  );
  const beatenSealCap = beatenColumns * beatenRows;

  // This is a corner of a page, not a gallery: never scrolled, capped at
  // what the corner holds, and when the count exceeds that, the most recent
  // masteries survive the cut rather than an arbitrary slice.
  const beatenWords = useMemo(
    () => sortMasteredMostRecentFirst(progress.masteredWords).slice(0, beatenSealCap),
    [progress.masteredWords, beatenSealCap],
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
                below. Explicit left/right insets (PAGE_CONTENT_PADDING_H)
                rather than 0 — see the constant's own comment for why. */}
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
              <View style={styles.beatenSeals}>
                {beatenWords.map((record) => (
                  <Image
                    key={record.word}
                    source={MASTERED_SEAL}
                    resizeMode="contain"
                    style={{
                      width: layout.sealSize,
                      height: layout.sealSize,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Anchored to the SCREEN, not the page — a separate object resting
          beside the book rather than a mark printed on it. It sits outside
          the paging ScrollView entirely so the pages slide underneath it
          while it stays put (Pete's ruling). Default position targets the
          right page's empty middle, since the screen shows exactly one page
          at a time (pageWidth === screenWidth) — this is the last pass on
          this element; if it still doesn't land on device it comes out. */}
      <Image
        source={QUILL_ART}
        resizeMode="contain"
        style={[
          styles.quill,
          {
            width: quillBaseWidth,
            height: quillBaseHeight,
            marginLeft: -quillBaseWidth / 2,
            marginTop: -quillBaseHeight / 2,
            opacity: layout.quillOpacity,
            transform: [
              { translateX: layout.quillOffsetX },
              { translateY: layout.quillOffsetY },
              { rotate: `${layout.quillAngle}deg` },
              { scale: layout.quillScale },
            ],
          },
        ]}
      />

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
        <Text key={index} style={styles.rowLine}>
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
  quill: {
    // Anchored near screen center — the right page's empty middle, between
    // today's entry and the BEATEN corner, since the screen shows exactly
    // one page at a time. Centered via top/left + the negative margins set
    // alongside width/height at the call site; offsetX/offsetY (in the
    // tuner) nudge from this anchor. Last pass on this element — it has had
    // four already and has not earned its place. It must read as clearly
    // present and clearly behind her writing, never overlapping a line of
    // it or the BEATEN corner, or it comes out rather than getting a sixth.
    position: "absolute",
    top: "48%",
    left: "42%",
    pointerEvents: "none",
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
    // underneath either pinned block. Explicit left/right insets, not 0 —
    // see PAGE_CONTENT_PADDING_H's own comment.
    position: "absolute",
    left: PAGE_CONTENT_PADDING_H,
    right: PAGE_CONTENT_PADDING_H,
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
    // per-instance). Same explicit-inset reasoning as logScroll.
    position: "absolute",
    left: PAGE_CONTENT_PADDING_H,
    right: PAGE_CONTENT_PADDING_H,
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
    position: "absolute",
    bottom: 4,
    right: 4,
    alignItems: "flex-end",
  },
  beatenSeals: {
    // Grows sideways then downward, capped at what the corner holds
    // (beatenSealCap in the component) — never scrolled. This is a corner
    // of a page, not a gallery.
    flexDirection: "row",
    flexWrap: "wrap-reverse",
    justifyContent: "flex-end",
    alignContent: "flex-end",
    overflow: "hidden",
    gap: BEATEN_SEAL_GAP,
    maxWidth: BEATEN_CORNER_MAX_WIDTH,
    maxHeight: BEATEN_CORNER_MAX_HEIGHT,
  },
});
