import React, { useMemo } from "react";
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

type Props = {
  progress: PlayerProgress;
  pollyMemory: PollyMemory;
};

export function PolybookSpread({ progress, pollyMemory }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const layout = usePolybookTuning();

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
  // array is the older neighbor. A row shows its year only when that differs
  // from the older neighbor's — the point where the book actually crosses
  // into a new year, shown once, on the row where the crossing happened. The
  // oldest row on screen has no older neighbor to compare against, so it
  // always shows its year.
  const rowDisplays = useMemo(
    () =>
      allRows.map((row, index) => {
        const olderRow = allRows[index + 1];
        const showYear =
          !olderRow || row.date.slice(0, 4) !== olderRow.date.slice(0, 4);
        return { row, dateLabel: formatBookDate(row.date, showYear) };
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
  // page's own footprint, not a guessed final value. Centered in the page by
  // default; offsetX/offsetY nudge it from there.
  const quillBaseWidth = bookWidth * (layout.pageWidthPct / 100);
  const quillBaseHeight = quillBaseWidth / QUILL_ASPECT_RATIO;

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
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.logScroll}
            >
              <Text style={styles.label}>WORK LOG</Text>

              {rowDisplays.map(({ row, dateLabel }, index) => (
                <WorkLogRowView
                  key={`${row.date}-${index}`}
                  row={row}
                  dateLabel={dateLabel}
                />
              ))}

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
            </ScrollView>
          </View>

          <View style={[styles.pageContent, pageBoxStyle(layout.rightPageLeftPct)]}>
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

            <View style={styles.struckPairBlock}>
              <Text style={styles.struckOld}>{struckPair.old}</Text>
              <Text style={styles.struckNext}>{struckPair.next}</Text>
            </View>

            <View style={styles.todayBlock}>
              {todayEntry.map((line, index) => (
                <Text key={index} style={styles.todayLine}>
                  {line}
                </Text>
              ))}
            </View>

            <View style={styles.beatenCorner}>
              <Text style={styles.label}>BEATEN</Text>
              <View style={styles.beatenSeals}>
                {progress.masteredWords.map((record) => (
                  <View key={record.word} style={styles.beatenSeal}>
                    <Image
                      source={MASTERED_SEAL}
                      resizeMode="contain"
                      style={{
                        width: layout.sealSize,
                        height: layout.sealSize,
                      }}
                    />
                    <Text style={styles.beatenWord} numberOfLines={1}>
                      {record.word}
                    </Text>
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
    position: "absolute",
    top: "50%",
    left: "50%",
    pointerEvents: "none",
  },
  pageContent: {
    position: "absolute",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  logScroll: {
    flex: 1,
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
    fontSize: 17,
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
    fontSize: 24,
    color: INK,
  },
  beatenCorner: {
    position: "absolute",
    bottom: 4,
    right: 4,
    alignItems: "flex-end",
  },
  beatenSeals: {
    flexDirection: "row",
    flexWrap: "wrap-reverse",
    justifyContent: "flex-end",
    maxWidth: 160,
  },
  beatenSeal: {
    alignItems: "center",
    margin: 2,
  },
  beatenWord: {
    fontFamily: FONTS.ui,
    includeFontPadding: false,
    fontSize: 14,
    color: INK,
    maxWidth: 60,
  },
});
