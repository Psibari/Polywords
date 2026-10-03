import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FONTS } from "../../constants/fonts";
import { PlayerProgress } from "../../game/types";
import { PollyMemory } from "../../game/pollyMemory";
import { buildWorkLog } from "../../game/bookPage";
import { localDateKey } from "../../game/bookLog";
import { TODAY_ENTRIES, type BookRivalryState } from "../../game/pollyBookLines";
import { resolveRivalryState } from "../../game/pollyMood";
import { createSeededRng, deriveSeed } from "../../game/seededRandom";
import { INK, INK_MUTED } from "../../ui/polybookInk";
import { PW } from "../../ui/pwTheme";
import { useGameStore } from "../../store/useGameStore";

// Structural prototype for docs/POLYBOOK_LIVING_JOURNAL.md.
// Intentionally uses simple code-drawn book materials. Final cover/page art,
// doodles, ribbon art and transition polish wait until device geometry is approved.
const POLYBOOK_CROWN = require("../../../assets/images/polybook/polybook_crown.png");

type Section = "TODAY" | "JOURNAL" | "BEATEN";
const SECTIONS: readonly Section[] = ["TODAY", "JOURNAL", "BEATEN"];
const POLYBOOK_DEV_STATES: readonly BookRivalryState[] = [
  "DISMISSIVE", "AMUSED", "WATCHFUL", "RATTLED", "CONCEDING",
];

const TODAY_MOOD_BAR: Record<BookRivalryState, string> = {
  DISMISSIVE: "#54483E",
  AMUSED: "#2D9B57",
  WATCHFUL: "#465D70",
  RATTLED: "#8B314A",
  CONCEDING: "#69458D",
};

type Props = { progress: PlayerProgress; pollyMemory: PollyMemory };

export function PolybookSpread({ progress, pollyMemory }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [openBookArtReady, setOpenBookArtReady] = useState(false);
  const [section, setSection] = useState<Section>("TODAY");
  const [devRivalryState, setDevRivalryState] = useState<BookRivalryState | null>(null);
  const [devTodayIndex, setDevTodayIndex] = useState(0);
  const [devJournalRows, setDevJournalRows] = useState<"REAL" | "SHORT" | "MEDIUM" | "FULL">("REAL");
  const [journalPage, setJournalPage] = useState(0);
  const playerName = useGameStore((state) => state.playerName);
  const playerLabel = playerName.trim() || "PLAYER";

  const bookSeed = progress.bookSeed ?? 0;
  const log = progress.bookLog ?? [];
  const today = useMemo(() => localDateKey(new Date()), []);
  const workLogRows = useMemo(
    () => buildWorkLog({ log, today, bookSeed, maxRows: 60 }),
    [log, today, bookSeed],
  );
  const displayedWorkLogRows = useMemo(() => {
    if (!__DEV__ || devJournalRows === "REAL") return workLogRows;
    const count = devJournalRows === "SHORT" ? 3 : devJournalRows === "MEDIUM" ? 10 : 60;
    if (workLogRows.length >= count) return workLogRows.slice(0, count);
    if (workLogRows.length === 0) return [];
    return Array.from({ length: count }, (_, index) => workLogRows[index % workLogRows.length]);
  }, [workLogRows, devJournalRows]);
  const journalPages = useMemo(() => {
    const PAGE_BUDGET = 560;
    const HAND_CHARS_PER_LINE = 31;
    const pages: typeof displayedWorkLogRows[] = [];
    let page: typeof displayedWorkLogRows = [];
    let used = 0;

    for (const row of displayedWorkLogRows) {
      const handwritingLines = row.lines.reduce(
        (sum, line) => sum + Math.max(1, Math.ceil(line.length / HAND_CHARS_PER_LINE)),
        0,
      );
      const rowHeight = 24 + (row.word ? 22 : 0) + handwritingLines * 29 + 22;
      if (page.length > 0 && used + rowHeight > PAGE_BUDGET) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push(row);
      used += rowHeight;
    }
    if (page.length > 0) pages.push(page);
    return pages.length > 0 ? pages : [[]];
  }, [displayedWorkLogRows]);

  useEffect(() => {
    setJournalPage((current) => Math.min(current, journalPages.length - 1));
  }, [journalPages.length]);

  const turnJournalPage = (delta: number) => {
    setJournalPage((current) => Math.max(0, Math.min(journalPages.length - 1, current + delta)));
  };

  const journalPanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        section === "JOURNAL" && Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -44) turnJournalPage(1);
        else if (gesture.dx >= 44) turnJournalPage(-1);
      },
    }),
    [section, journalPages.length],
  );

  const rivalryState = useMemo(
    () => resolveRivalryState({
      recent: progress.recentHuntPerformance ?? [],
      masteredCount: progress.masteredWords.length,
      runsCompleted: progress.runsCompleted,
    }),
    [progress.recentHuntPerformance, progress.masteredWords.length, progress.runsCompleted],
  );
  const displayedRivalryState = __DEV__ && devRivalryState ? devRivalryState : rivalryState;
  const todayMoodBar = TODAY_MOOD_BAR[displayedRivalryState];
  const moodPulse = useRef(new Animated.Value(1)).current;
  const moodGlow = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    if (!isOpen || !openBookArtReady || section !== "TODAY") return;

    moodPulse.stopAnimation();
    moodGlow.stopAnimation();
    moodPulse.setValue(0.985);
    moodGlow.setValue(0.42);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(moodPulse, {
          toValue: 1.018,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(moodPulse, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(moodGlow, {
          toValue: 0.92,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(moodGlow, {
          toValue: 0.48,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [displayedRivalryState, isOpen, openBookArtReady, section, moodGlow, moodPulse]);

  const todayEntry = useMemo(() => {
    const pool = TODAY_ENTRIES[displayedRivalryState];
    if (__DEV__ && devRivalryState) return pool[devTodayIndex % pool.length];
    const rng = createSeededRng(deriveSeed(bookSeed, today));
    return pool[Math.floor(rng() * pool.length)];
  }, [displayedRivalryState, devRivalryState, devTodayIndex, bookSeed, today]);

  function openTo(next: Section) {
    setOpenBookArtReady(false);
    if (next === "JOURNAL") setJournalPage(0);
    setSection(next);
    setIsOpen(true);
  }

  function selectSection(next: Section) {
    if (next === "JOURNAL" && section !== "JOURNAL") setJournalPage(0);
    setSection(next);
  }
  function cycleDevState() {
    const current = devRivalryState ?? rivalryState;
    const index = POLYBOOK_DEV_STATES.indexOf(current);
    setDevRivalryState(POLYBOOK_DEV_STATES[(index + 1) % POLYBOOK_DEV_STATES.length]);
    setDevTodayIndex(0);
  }
  function cycleDevEntry() {
    const state = devRivalryState ?? rivalryState;
    setDevRivalryState(state);
    setDevTodayIndex((value) => (value + 1) % TODAY_ENTRIES[state].length);
  }
  function cycleDevJournalRows() {
    const modes = ["REAL", "SHORT", "MEDIUM", "FULL"] as const;
    setDevJournalRows((current) => modes[(modes.indexOf(current) + 1) % modes.length]);
  }

  // POLYBOOK ART TODO: remove the side ribbons from the closed-book artwork
  // and replace them with bottom ribbons so the closed cover matches the
  // open-book navigation language. Artwork change only; do not alter this pass.
  if (!isOpen) {
    return (
      <View style={styles.root}>
        <View style={styles.closedStage}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Polybook to Today"
            onPress={() => openTo("TODAY")}
            style={({ pressed }) => [styles.closedBookArtButton, pressed && styles.pressed]}
          >
            <Image
              source={require("../../../assets/images/polybook/POLYBOOKREV3.png")}
              resizeMode="contain"
              style={styles.closedBookArt}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {__DEV__ && (section === "TODAY" || section === "JOURNAL") && (
        <View style={styles.devControls}>
          {section === "TODAY" ? (
            <>
              <Pressable style={styles.devButton} onPress={cycleDevState}>
                <Text style={styles.devButtonText}>{displayedRivalryState}</Text>
              </Pressable>
              <Pressable style={styles.devButton} onPress={cycleDevEntry}>
                <Text style={styles.devButtonText}>
                  ENTRY {devTodayIndex + 1}/{TODAY_ENTRIES[displayedRivalryState].length}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.devButton} onPress={cycleDevJournalRows}>
              <Text style={styles.devButtonText}>JOURNAL {devJournalRows}</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.openBook}>
        <Image
          source={require("../../../assets/images/polybook/polybook_page.png")}
          resizeMode="stretch"
          style={styles.openBookArt}
          onLoad={() => setOpenBookArtReady(true)}
        />
        {openBookArtReady && (
          <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to Polybook cover"
          onPress={() => setIsOpen(false)}
          hitSlop={8}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <Text style={styles.closeButtonArrow}>‹</Text>
          <Text style={styles.closeButtonText}>COVER</Text>
        </Pressable>
        <View style={styles.pageFrame}>
          <View style={styles.page}>

            {section === "TODAY" && (
              <ScrollView key="TODAY" contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageDate}>{today.toUpperCase()}</Text>
                <Text style={styles.sectionHeading}>TODAY</Text>
                <View
                  style={[
                    styles.todayMoodGlow,
                    {
                      shadowColor: todayMoodBar,
                      backgroundColor: todayMoodBar,
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.todayMoodBar,
                      {
                        backgroundColor: todayMoodBar,
                        opacity: moodGlow,
                        transform: [{ scaleX: moodPulse }, { scaleY: moodPulse }],
                      },
                    ]}
                  />
                </View>
                <View style={styles.todayEntry}>
                  {todayEntry.map((line, index) => (
                    <Text key={index} style={styles.todayLine}>{line}</Text>
                  ))}
                </View>
                <View style={styles.todayOpenSpace}>
                  <Text style={styles.marginScratch}>♛</Text>
                  <Text style={styles.marginNote}>still my book.</Text>
                </View>
              </ScrollView>
            )}

            {section === "JOURNAL" && (
              <View key="JOURNAL" style={styles.journalPage} {...journalPanResponder.panHandlers}>
                <View style={styles.journalPageContent}>
                  <Text style={styles.sectionHeading}>JOURNAL</Text>
                  <View style={styles.journalRule} />
                  {journalPages[journalPage].map((row, index) => (
                    <View key={`${row.date}-${index}`} style={styles.journalRow}>
                      <Text style={styles.rowDate}>{row.endDate ? `${row.date} – ${row.endDate}` : row.date}</Text>
                      {row.word ? <Text style={styles.rowWord}>{row.word}</Text> : null}
                      {row.lines.map((line, lineIndex) => (
                        <Text key={lineIndex} style={styles.rowLine}>{line}</Text>
                      ))}
                    </View>
                  ))}
                </View>
                <View style={styles.pageTurner}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Previous journal page" disabled={journalPage === 0} hitSlop={10} onPress={() => turnJournalPage(-1)} style={({ pressed }) => [styles.pageTurnButton, journalPage === 0 && styles.pageTurnDisabled, pressed && styles.pressed]}>
                    <Text style={styles.pageTurnArrow}>‹</Text>
                  </Pressable>
                  <Text style={styles.pageTurnLabel}>PAGE {journalPage + 1} OF {journalPages.length}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Next journal page" disabled={journalPage === journalPages.length - 1} hitSlop={10} onPress={() => turnJournalPage(1)} style={({ pressed }) => [styles.pageTurnButton, journalPage === journalPages.length - 1 && styles.pageTurnDisabled, pressed && styles.pressed]}>
                    <Text style={styles.pageTurnArrow}>›</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {section === "BEATEN" && (
              <ScrollView key="BEATEN" contentContainerStyle={styles.pageScroll} showsVerticalScrollIndicator={false}>
                <Text
                  style={styles.sectionHeading}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.62}
                >
                  {playerLabel.toUpperCase()}
                </Text>
                <Text style={styles.masteryLabel}>MASTERY</Text>
                <View style={styles.inkRule} />
                <View style={styles.masteryGrid}>
                  {progress.masteredWords.map((record) => (
                    <View
                      key={record.word}
                      accessible
                      accessibilityLabel={`Mastered word: ${record.word}`}
                      style={styles.masteryItem}
                    >
                      <Image source={POLYBOOK_CROWN} resizeMode="contain" style={styles.crown} />
                    </View>
                  ))}
                </View>
                <Text style={styles.masteryCount}>
                  {progress.masteredWords.length} {progress.masteredWords.length === 1 ? "CROWN" : "CROWNS"}
                </Text>
                <View style={styles.futureMasteryArea} />
              </ScrollView>
            )}
          </View>
        </View>

        <View style={styles.ribbonRail}>
          {SECTIONS.map((item) => {
            const selected = item === section;
            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => selectSection(item)}
                style={({ pressed }) => [
                  styles.ribbon,
                  selected && styles.ribbonSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  source={require("../../../assets/images/polybook/polybook_ribbon.png")}
                  resizeMode="stretch"
                  style={styles.ribbonArt}
                />
                <Text
                  style={[styles.ribbonText, selected && styles.ribbonTextSelected]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                >
                  {item === "BEATEN" ? playerLabel.toUpperCase() : item}
                </Text>
              </Pressable>
            );
          })}
          <View style={[styles.ribbon, styles.futureRibbon]}>
            <Text style={styles.futureRibbonText}>?</Text>
            <View style={styles.forkCutOpen} />
          </View>
        </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, width: "100%", alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },

  closedStage: { width: "88%", maxWidth: 350, height: 440, justifyContent: "center", alignItems: "center" },
  closedBookArtButton: { width: 408, maxWidth: "100%", height: 510, alignItems: "center", justifyContent: "center", transform: [{ translateY: -18 }] },
  closedBookArt: { width: "100%", height: "100%" },
  closedBook: {
    width: 306, maxWidth: "84%", height: 382, borderRadius: 22, backgroundColor: "#2A155E",
    borderWidth: 4, borderColor: "#A77C1E", padding: 16, shadowColor: "#000", shadowOpacity: 0.42,
    shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  closedSpine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 42, borderRightWidth: 2, borderColor: "#8A6519", backgroundColor: "#21104E", borderTopLeftRadius: 18, borderBottomLeftRadius: 18 },
  closedInnerFrame: { flex: 1, marginLeft: 35, borderWidth: 2, borderColor: "#D2A936", borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 18 },
  closedPages: { position: "absolute", left: 48, right: 8, bottom: -8, height: 13, borderRadius: 7, backgroundColor: "#D7C38F", borderWidth: 1, borderColor: "#8F773F" },
  closedTitle: { fontFamily: FONTS.hud, fontSize: 34, letterSpacing: 2, color: PW.color.gold, textAlign: "center" },
  coverRule: { width: "72%", height: 2, backgroundColor: "#B98B24", marginVertical: 22 },
  coverMark: { fontFamily: FONTS.hud, fontSize: 54, color: "rgba(245,200,66,0.78)", letterSpacing: 3 },
  closedRibbonRail: { position: "absolute", right: 8, top: 104, gap: 12 },
  closedRibbon: { width: 62, height: 42, backgroundColor: "#55206C", borderWidth: 1, borderColor: "#A77C1E", justifyContent: "center", paddingLeft: 10 },
  closedRibbonText: { fontFamily: FONTS.label, fontSize: 9, letterSpacing: 0.5, color: "#FFF3CF" },
  forkCut: { position: "absolute", right: -1, top: 14, width: 13, height: 13, backgroundColor: "#17112E", transform: [{ rotate: "45deg" }] },

  openBook: { width: "96%", height: "100%", maxWidth: 520, position: "relative", alignItems: "stretch", justifyContent: "center" },
  openBookArt: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%" },
  pageFrame: { position: "absolute", left: "16.5%", right: "8.5%", top: "5.2%", bottom: "8.5%", minWidth: 0 },
  page: { flex: 1, minHeight: 0, overflow: "hidden" },
  pageScroll: { paddingHorizontal: 12, paddingTop: 22, paddingBottom: 54, minHeight: "100%" },
  closeButton: { position: "absolute", left: "2.2%", top: "2.2%", zIndex: 40, minWidth: 68, height: 34, paddingHorizontal: 9, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "rgba(32,15,70,0.92)", borderWidth: 1.5, borderColor: "rgba(245,200,66,0.88)", shadowColor: "#000", shadowOpacity: 0.24, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  closeButtonPressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  closeButtonArrow: { fontFamily: FONTS.label, fontSize: 24, lineHeight: 25, color: PW.color.gold, marginTop: -2 },
  closeButtonText: { fontFamily: FONTS.label, fontSize: 10, letterSpacing: 0.7, color: "#FFF4D6" },
  pageDate: { fontFamily: FONTS.ui, fontSize: 13, letterSpacing: 0.9, color: "#2A1B14", marginBottom: 7 },
  sectionHeading: { fontFamily: FONTS.hud, fontSize: 24, letterSpacing: 1.05, color: "#120B08", marginBottom: 7 },
  inkRule: { height: 1.5, backgroundColor: "rgba(28,17,12,0.68)", marginBottom: 22 },
  todayMoodGlow: { height: 9, borderRadius: 5, marginBottom: 22, shadowOpacity: 0.55, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  todayMoodBar: { width: "100%", height: 9, borderRadius: 5 },
  todayEntry: { gap: 3, paddingRight: 4, paddingTop: 9 },
  todayLine: { fontFamily: FONTS.hand, fontSize: 22, lineHeight: 29, color: "#140E0B" },
  todayOpenSpace: { minHeight: 300, marginTop: 28, justifyContent: "flex-end", alignItems: "flex-end" },
  marginScratch: { fontFamily: FONTS.hand, fontSize: 32, color: "rgba(58,39,31,0.46)", transform: [{ rotate: "-9deg" }] },
  marginNote: { fontFamily: FONTS.hand, fontSize: 16, color: "rgba(58,39,31,0.58)", transform: [{ rotate: "-3deg" }] },

  ribbonRail: { position: "absolute", left: "15%", right: "7%", bottom: "-4.8%", height: 112, zIndex: 30, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", overflow: "visible" },
  ribbon: { width: "30%", height: 108, justifyContent: "center", alignItems: "center", position: "relative", overflow: "visible" },
  ribbonArt: { position: "absolute", width: "100%", height: "100%", left: 0, top: 0, zIndex: 1 },
  ribbonSelected: { transform: [{ translateY: 4 }] },
  ribbonText: { width: "78%", zIndex: 2, marginTop: 8, fontFamily: FONTS.label, fontSize: 12, letterSpacing: 0.45, color: "#FFF4D6", textAlign: "center", textShadowColor: "rgba(25,10,45,0.92)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  ribbonTextSelected: { color: PW.color.gold, fontSize: 13 },
  forkCutOpen: { display: "none" },
  forkCutSelected: { display: "none" },
  futureRibbon: { display: "none" },
  futureRibbonText: { display: "none" },

  journalPage: { flex: 1, minHeight: 0, overflow: "hidden", paddingHorizontal: 12, paddingTop: 22, paddingBottom: 48 },
  journalPageContent: { flex: 1, minHeight: 0, overflow: "hidden" },
  journalRule: { height: 1, backgroundColor: "rgba(35,23,17,0.42)", marginBottom: 22 },
  journalRow: { marginBottom: 22 },
  rowDate: { fontFamily: FONTS.ui, fontSize: 14, color: "#4A382D", marginBottom: 3 },
  rowWord: { fontFamily: FONTS.ui, fontSize: 14, letterSpacing: 0.7, color: "#241811", marginBottom: 3 },
  rowLine: { fontFamily: FONTS.hand, fontSize: 22, lineHeight: 29, color: "#140E0B" },
  pageTurner: { height: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, borderTopWidth: 1, borderTopColor: "rgba(35,23,17,0.22)", paddingTop: 5 },
  pageTurnButton: { width: 38, height: 32, alignItems: "center", justifyContent: "center" },
  pageTurnDisabled: { opacity: 0.22 },
  pageTurnArrow: { fontFamily: FONTS.ui, fontSize: 28, lineHeight: 30, color: "#2A1B14" },
  pageTurnLabel: { minWidth: 112, textAlign: "center", fontFamily: FONTS.ui, fontSize: 14, letterSpacing: 0.7, color: "#3A291F" },

  masteryLabel: { fontFamily: FONTS.ui, fontSize: 12, letterSpacing: 1.5, color: "#4A382D", marginBottom: 10 },
  masteryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignContent: "flex-start", rowGap: 18 },
  masteryItem: { width: "33.333%", alignItems: "center", justifyContent: "center", minHeight: 64 },
  crown: { width: 54, height: 54 },
  masteryCount: { fontFamily: FONTS.ui, fontSize: 12, letterSpacing: 1.25, color: "#4A382D", textAlign: "center", marginTop: 20 },
  futureMasteryArea: { minHeight: 170, flexGrow: 1 },

  devControls: { position: "absolute", top: 2, right: 66, zIndex: 30, flexDirection: "row", gap: 4 },
  devButton: { backgroundColor: "rgba(15,13,42,0.92)", borderWidth: 1, borderColor: "rgba(245,200,66,0.75)", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 5 },
  devButtonText: { fontFamily: FONTS.ui, fontSize: 9, color: "#F5C842", letterSpacing: 0.4 },
});
