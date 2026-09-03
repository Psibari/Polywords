import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../constants/fonts";
import { PW } from "../../ui/pwTheme";

export type LexiconStatus = "mastered" | "haunted" | "finished" | "progress";

export type LexiconEntry = {
  word: string;
  status: LexiconStatus;
  statusLabel: string;
};

export type LexiconMeaningLine = {
  key: string;
  text: string;
  tone?: "normal" | "hidden" | "trap" | "locked";
};

export type LexiconDetail = {
  word: string;
  status: LexiconStatus;
  progressLabel: string;
  metaLines: string[];
  meanings: LexiconMeaningLine[];
};

type StatCellProps = {
  value: number;
  label: string;
};

type LexiconSummary = {
  meanings: number;
  words: number;
  mastered: number;
  haunted: number;
};

type Filter = "all" | "mastered" | "haunted" | "progress";

type Props = {
  entries: LexiconEntry[];
  selectedWord: string | null;
  onSelectWord: (word: string | null) => void;
  summary: LexiconSummary;
  detail: LexiconDetail | null;
};

const PAGE = "#D8CAA5";
const PAGE_EDGE = "#A78957";
const INK = "#33291F";
const INK_MUTED = "rgba(51,41,31,0.62)";
const COVER = "#4A315B";
const COVER_DARK = "#26182F";
const HAUNTED = "#775183";

function filterMatches(entry: LexiconEntry, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "mastered") return entry.status === "mastered";
  if (filter === "haunted") return entry.status === "haunted";

  // "In progress" includes words whose visible meanings are finished
  // but which have not reached permanent Mastery.
  return entry.status === "progress" || entry.status === "finished";
}

function statusStyle(status: LexiconStatus) {
  if (status === "mastered") return styles.statusMastered;
  if (status === "haunted") return styles.statusHaunted;
  if (status === "finished") return styles.statusFinished;
  return styles.statusProgress;
}

function StatCell({ value, label }: StatCellProps) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function LexiconPrototype({
  entries,
  selectedWord,
  onSelectWord,
  summary,
  detail,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredEntries = useMemo(
    () => entries.filter((entry) => filterMatches(entry, filter)),
    [entries, filter],
  );

  const showingDetail = selectedWord !== null && detail !== null;

  return (
    <View style={styles.root}>
      <View style={styles.bookCover}>
        <View pointerEvents="none" style={styles.coverInnerRim} />

        <View style={[styles.page, styles.leftPage]}>
          {showingDetail ? (
            <>
              <Text style={styles.pageHeading}>WORD RECORD</Text>
              <View style={styles.pageRule} />

              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={styles.detailWord}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.58}
                >
                  {detail.word}
                </Text>

                <Text style={styles.progressCopy}>{detail.progressLabel}</Text>

                <View style={[styles.detailStatus, statusStyle(detail.status)]}>
                  <Text style={styles.detailStatusText}>
                    {detail.status === "mastered"
                      ? "MASTERED"
                      : detail.status === "haunted"
                        ? "HAUNTED"
                        : detail.status === "finished"
                          ? "VISIBLE MEANINGS CLEARED"
                          : "IN PROGRESS"}
                  </Text>
                </View>

                {detail.metaLines.map((line, index) => (
                  <Text key={`${line}-${index}`} style={styles.metaLine}>
                    {line}
                  </Text>
                ))}
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Return to Lexicon index"
                onPress={() => onSelectWord(null)}
                style={({ pressed }) => [
                  styles.indexButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.indexButtonText}>← INDEX</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.pageHeading}>YOUR WORDS</Text>
              <View style={styles.pageRule} />

              {entries.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>
                    THE FIRST PAGE IS BLANK.
                  </Text>
                  <Text style={styles.emptyCopy}>
                    Claim a real meaning in the Hunt and its word will be
                    recorded here.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.pageScroll}
                  contentContainerStyle={styles.wordList}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredEntries.length === 0 ? (
                    <Text style={styles.emptyFilter}>
                      No words in this section yet.
                    </Text>
                  ) : (
                    filteredEntries.map((entry) => (
                      <Pressable
                        key={entry.word}
                        accessibilityRole="button"
                        accessibilityLabel={`${entry.word}. ${entry.statusLabel}`}
                        onPress={() => onSelectWord(entry.word)}
                        style={({ pressed }) => [
                          styles.wordRow,
                          pressed && styles.wordRowPressed,
                        ]}
                      >
                        <Text
                          style={styles.wordName}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {entry.word}
                        </Text>

                        <Text
                          style={[
                            styles.wordStatus,
                            entry.status === "mastered" &&
                              styles.wordStatusMastered,
                            entry.status === "haunted" &&
                              styles.wordStatusHaunted,
                          ]}
                        >
                          {entry.statusLabel}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              )}
            </>
          )}
        </View>

        <View pointerEvents="none" style={styles.gutter}>
          <View style={styles.gutterHighlight} />
        </View>

        <View style={[styles.page, styles.rightPage]}>
          {showingDetail ? (
            <>
              <Text style={styles.pageHeading}>MEANINGS</Text>
              <View style={styles.pageRule} />

              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.meaningList}
                showsVerticalScrollIndicator={false}
              >
                {detail.meanings.length === 0 ? (
                  <Text style={styles.emptyFilter}>
                    No recorded meanings yet.
                  </Text>
                ) : (
                  detail.meanings.map((line) => (
                    <View key={line.key} style={styles.meaningRow}>
                      <Text
                        style={[
                          styles.meaningText,
                          line.tone === "hidden" && styles.meaningHidden,
                          line.tone === "trap" && styles.meaningTrap,
                          line.tone === "locked" && styles.meaningLocked,
                        ]}
                      >
                        {line.text}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.pageHeading}>YOUR RECORD</Text>
              <View style={styles.pageRule} />

              <View style={styles.statsGrid}>
                <View style={styles.statRow}>
                  <StatCell value={summary.meanings} label="MEANINGS" />
                  <StatCell value={summary.words} label="WORDS" />
                </View>

                <View style={styles.statRow}>
                  <StatCell value={summary.mastered} label="MASTERED" />
                  <StatCell value={summary.haunted} label="HAUNTED" />
                </View>
              </View>

              <Text style={styles.filterHeading}>SHOW</Text>

              <View style={styles.filterGrid}>
                {(
                  [
                    ["all", "ALL"],
                    ["mastered", "MASTERED"],
                    ["haunted", "HAUNTED"],
                    ["progress", "IN PROGRESS"],
                  ] as const
                ).map(([key, label]) => {
                  const selected = filter === key;

                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Show ${label.toLowerCase()} words`}
                      onPress={() => setFilter(key)}
                      style={({ pressed }) => [
                        styles.filterButton,
                        selected && styles.filterButtonSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          selected && styles.filterTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.indexNote}>
                <Text style={styles.indexNoteText}>
                  Tap a word to open its permanent record.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  bookCover: {
    width: "100%",
    aspectRatio: 0.88,
    flexDirection: "row",
    backgroundColor: COVER,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PW.color.goldSoft,
    paddingHorizontal: 7,
    paddingVertical: 8,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  coverInnerRim: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.26)",
  },

  page: {
    flex: 1,
    minWidth: 0,
    backgroundColor: PAGE,
    borderColor: PAGE_EDGE,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 12,
  },

  leftPage: {
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  rightPage: {
    borderTopRightRadius: 15,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },

  gutter: {
    width: 12,
    marginVertical: 1,
    backgroundColor: COVER_DARK,
    alignItems: "center",
    overflow: "hidden",
  },

  gutterHighlight: {
    width: 3,
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  pageHeading: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1.8,
    color: INK,
    textAlign: "center",
  },

  pageRule: {
    height: 1,
    backgroundColor: "rgba(51,41,31,0.22)",
    marginTop: 7,
    marginBottom: 6,
  },

  pageScroll: {
    flex: 1,
    minHeight: 0,
  },

  wordList: {
    paddingBottom: 12,
  },

  wordRow: {
    minHeight: 46,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51,41,31,0.16)",
    paddingVertical: 5,
  },

  wordRowPressed: {
    backgroundColor: "rgba(123,45,139,0.08)",
  },

  wordName: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: 1.2,
    color: INK,
  },

  wordStatus: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 0.6,
    color: INK_MUTED,
  },

  wordStatusMastered: {
    color: "#806314",
  },

  wordStatusHaunted: {
    color: HAUNTED,
  },

  statsGrid: {
    gap: 6,
    marginTop: 4,
  },

  statRow: {
    flexDirection: "row",
    gap: 6,
  },

  statCell: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(51,41,31,0.18)",
    borderRadius: 7,
    paddingHorizontal: 3,
  },

  statValue: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 25,
    color: INK,
  },

  statLabel: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 9,
    letterSpacing: 0.8,
    color: INK_MUTED,
    textAlign: "center",
  },

  filterHeading: {
    marginTop: 17,
    marginBottom: 7,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 1.6,
    color: INK_MUTED,
  },

  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 5,
  },

  filterButton: {
    width: "48%",
    minHeight: 38,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(51,41,31,0.22)",
    borderRadius: 7,
    paddingHorizontal: 4,
  },

  filterButtonSelected: {
    backgroundColor: COVER,
    borderColor: COVER_DARK,
  },

  filterText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 9,
    letterSpacing: 0.5,
    color: INK,
    textAlign: "center",
  },

  filterTextSelected: {
    color: "#FFF3D4",
  },

  indexNote: {
    marginTop: "auto",
    paddingTop: 14,
  },

  indexNoteText: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 12,
    lineHeight: 16,
    color: INK_MUTED,
    textAlign: "center",
  },

  detailScrollContent: {
    paddingBottom: 12,
  },

  detailWord: {
    marginTop: 6,
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    fontSize: 36,
    letterSpacing: 1.5,
    color: INK,
    textAlign: "center",
  },

  progressCopy: {
    marginTop: 1,
    marginBottom: 10,
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 12,
    lineHeight: 16,
    color: INK_MUTED,
    textAlign: "center",
  },

  detailStatus: {
    borderWidth: 1,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  statusMastered: {
    backgroundColor: "rgba(184,145,39,0.18)",
    borderColor: "rgba(128,99,20,0.40)",
  },

  statusHaunted: {
    backgroundColor: "rgba(119,81,131,0.15)",
    borderColor: "rgba(119,81,131,0.45)",
  },

  statusFinished: {
    backgroundColor: "rgba(128,99,20,0.08)",
    borderColor: "rgba(128,99,20,0.25)",
  },

  statusProgress: {
    backgroundColor: "rgba(51,41,31,0.04)",
    borderColor: "rgba(51,41,31,0.18)",
  },

  detailStatusText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 0.8,
    color: INK,
    textAlign: "center",
  },

  metaLine: {
    marginBottom: 7,
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 12,
    lineHeight: 17,
    color: INK_MUTED,
    textAlign: "center",
  },

  indexButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(51,41,31,0.24)",
    borderRadius: 7,
    marginTop: 7,
  },

  indexButtonText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 11,
    letterSpacing: 1,
    color: INK,
  },

  meaningList: {
    paddingBottom: 12,
  },

  meaningRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(51,41,31,0.14)",
  },

  meaningText: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 19,
    color: INK,
  },

  meaningHidden: {
    color: "#5B3C68",
  },

  meaningTrap: {
    color: "#78364E",
  },

  meaningLocked: {
    color: INK_MUTED,
    fontStyle: "italic",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  emptyTitle: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1,
    color: INK,
    textAlign: "center",
    marginBottom: 8,
  },

  emptyCopy: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 12,
    lineHeight: 17,
    color: INK_MUTED,
    textAlign: "center",
  },

  emptyFilter: {
    marginTop: 18,
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 12,
    lineHeight: 17,
    color: INK_MUTED,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.72,
  },
});
