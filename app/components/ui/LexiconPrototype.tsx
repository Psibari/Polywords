import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FONTS } from "../../constants/fonts";

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

type MasteredWord = {
  word: string;
  dateMastered?: string;
};

type Props = {
  entries?: LexiconEntry[];
  selectedWord?: string | null;
  onSelectWord?: (word: string | null) => void;
  summary?: {
    meanings: number;
    words: number;
    mastered: number;
    haunted: number;
  };
  detail?: LexiconDetail | null;
  hauntedWords: string[];
  masteredWords: MasteredWord[];
};

type PolybookLayoutConfig = {
  bookWidthPct: number;
  bookHeightScale: number;
  bookTopOffset: number;
  pageTopPct: number;
  pageHeightPct: number;
  pageWidthPct: number;
  leftPageLeftPct: number;
  rightPageLeftPct: number;
  contentScale: number;
  sealSize: number;
  wordSize: number;
};

const INK = "#33291F";
const INK_MUTED = "rgba(51,41,31,0.62)";
const POLYBOOK_ART = require("../../../assets/images/vault/polybook_open.png");
const HAUNTED_SEAL = require("../../../assets/images/vault/polybook/polybook_haunted_seal_clean.png");
const MASTERED_SEAL = require("../../../assets/images/vault/polybook/polybook_master_seal_clean.png");
const POLYBOOK_SOURCE = Image.resolveAssetSource(POLYBOOK_ART);
const POLYBOOK_ASPECT_RATIO = POLYBOOK_SOURCE.width / POLYBOOK_SOURCE.height;

const DEFAULT_POLYBOOK_LAYOUT: PolybookLayoutConfig = {
  bookWidthPct: 98,
  bookHeightScale: 1.17,
  bookTopOffset: 60,
  pageTopPct: 13,
  pageHeightPct: 67,
  pageWidthPct: 33.5,
  leftPageLeftPct: 11.5,
  rightPageLeftPct: 55,
  contentScale: 1,
  sealSize: 60,
  wordSize: 28,
};

type TunerField = {
  key: keyof PolybookLayoutConfig;
  label: string;
  step: number;
  min?: number;
  max?: number;
  suffix: string;
};

const TUNER_FIELDS: TunerField[] = [
  {
    key: "bookWidthPct",
    label: "BOOK WIDTH",
    step: 0.5,
    min: 80,
    max: 105,
    suffix: "%",
  },
  {
    key: "bookHeightScale",
    label: "BOOK HEIGHT",
    step: 0.025,
    min: 0.95,
    max: 1.35,
    suffix: "x",
  },
  {
    key: "bookTopOffset",
    label: "BOOK Y",
    step: 4,
    min: -120,
    max: 300,
    suffix: "px",
  },
  {
    key: "pageTopPct",
    label: "PAGE TOP",
    step: 0.5,
    min: 0,
    max: 40,
    suffix: "%",
  },
  {
    key: "pageHeightPct",
    label: "PAGE HEIGHT",
    step: 0.5,
    min: 40,
    max: 85,
    suffix: "%",
  },
  {
    key: "pageWidthPct",
    label: "PAGE WIDTH",
    step: 0.5,
    min: 20,
    max: 45,
    suffix: "%",
  },
  {
    key: "leftPageLeftPct",
    label: "LEFT X",
    step: 0.5,
    min: 0,
    max: 30,
    suffix: "%",
  },
  {
    key: "rightPageLeftPct",
    label: "RIGHT X",
    step: 0.5,
    min: 45,
    max: 75,
    suffix: "%",
  },
  {
    key: "contentScale",
    label: "CONTENT SCALE",
    step: 0.02,
    min: 0.85,
    max: 1.1,
    suffix: "x",
  },
  {
    key: "sealSize",
    label: "SEAL SIZE",
    step: 2,
    min: 60,
    max: 100,
    suffix: "px",
  },
  {
    key: "wordSize",
    label: "WORD SIZE",
    step: 1,
    min: 26,
    max: 30,
    suffix: "px",
  },
];

function formatTunerValue(
  value: number,
  key: keyof PolybookLayoutConfig,
): string {
  return key === "contentScale" ? value.toFixed(2) : value.toFixed(1);
}

function PolybookDevTuner({
  layout,
  onChange,
  showSafeZones,
  onToggleSafeZones,
  showSamples,
  onToggleSamples,
  dimensions,
}: {
  layout: PolybookLayoutConfig;
  onChange: (layout: PolybookLayoutConfig) => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  showSamples: boolean;
  onToggleSamples: () => void;
  dimensions: {
    screenWidth: number;
    bookWidth: number;
    baseBookHeight: number;
    finalBookHeight: number;
  };
}) {
  const [expanded, setExpanded] = useState(false);

  if (!__DEV__) return null;

  const updateField = (field: TunerField, direction: -1 | 1) => {
    const nextValue = layout[field.key] + field.step * direction;
    const value = Math.min(
      field.max ?? Number.POSITIVE_INFINITY,
      Math.max(field.min ?? Number.NEGATIVE_INFINITY, nextValue),
    );
    onChange({ ...layout, [field.key]: Number(value.toFixed(2)) });
  };

  const printValues = () => {
    console.log("POLYBOOK_LAYOUT =", JSON.stringify(layout, null, 2));
    console.log(
      "POLYBOOK_DIMENSIONS =",
      JSON.stringify(
        {
          screenWidth: dimensions.screenWidth,
          bookWidth: dimensions.bookWidth,
          baseBookHeight: dimensions.baseBookHeight,
          finalBookHeight: dimensions.finalBookHeight,
          bookHeightScale: layout.bookHeightScale,
        },
        null,
        2,
      ),
    );
  };

  return (
    <View style={styles.tunerAnchor} pointerEvents="box-none">
      <View
        style={[styles.tunerPanel, !expanded && styles.tunerPanelCollapsed]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={
            expanded
              ? "Collapse Polybook dev tuner"
              : "Expand Polybook dev tuner"
          }
          onPress={() => setExpanded((value) => !value)}
          style={styles.tunerHeader}
        >
          <Text style={styles.tunerTitle}>DEV SIZE</Text>
          <Text style={styles.tunerChevron}>{expanded ? "-" : "+"}</Text>
        </Pressable>

        {expanded && (
          <ScrollView
            style={styles.tunerScroll}
            contentContainerStyle={styles.tunerContent}
            showsVerticalScrollIndicator={false}
          >
            {TUNER_FIELDS.map((field) => (
              <View key={field.key} style={styles.tunerRow}>
                <Text style={styles.tunerLabel}>{field.label}</Text>
                <View style={styles.tunerControls}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${field.label.toLowerCase()}`}
                    onPress={() => updateField(field, -1)}
                    style={styles.tunerButton}
                  >
                    <Text style={styles.tunerButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.tunerValue}>
                    {formatTunerValue(layout[field.key], field.key)}
                    {field.suffix}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${field.label.toLowerCase()}`}
                    onPress={() => updateField(field, 1)}
                    style={styles.tunerButton}
                  >
                    <Text style={styles.tunerButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: showSafeZones }}
              accessibilityLabel="Show Polybook safe zones"
              onPress={onToggleSafeZones}
              style={styles.tunerAction}
            >
              <Text style={styles.tunerActionText}>
                {showSafeZones ? "[x]" : "[ ]"} SHOW SAFE ZONES
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: showSamples }}
              accessibilityLabel="Show sample seals"
              onPress={onToggleSamples}
              style={styles.tunerAction}
            >
              <Text style={styles.tunerActionText}>
                {showSamples ? "[x]" : "[ ]"} SHOW SAMPLE SEALS
              </Text>
            </Pressable>

            <View style={styles.tunerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset Polybook layout values"
                onPress={() => onChange({ ...DEFAULT_POLYBOOK_LAYOUT })}
                style={styles.tunerAction}
              >
                <Text style={styles.tunerActionText}>RESET</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Print Polybook layout values"
                onPress={printValues}
                style={styles.tunerAction}
              >
                <Text style={styles.tunerActionText}>PRINT VALUES</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function formatMasteredWords(words: MasteredWord[]): string[] {
  return [...words]
    .sort((first, second) => {
      if (!first.dateMastered || !second.dateMastered) return 0;
      return (
        new Date(second.dateMastered).getTime() -
        new Date(first.dateMastered).getTime()
      );
    })
    .map((record) => record.word);
}

export function LexiconPrototype({ hauntedWords, masteredWords }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [layout, setLayout] = useState<PolybookLayoutConfig>({
    ...DEFAULT_POLYBOOK_LAYOUT,
  });
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  const bookWidth = screenWidth * (layout.bookWidthPct / 100);
  const baseBookHeight = bookWidth / POLYBOOK_ASPECT_RATIO;
  const bookHeight = baseBookHeight * layout.bookHeightScale;
  const displayedHaunts = showSamples
    ? ["FOLD", "BATTERY", "FORK"]
    : hauntedWords.slice(0, 3);
  const masteredNames = useMemo(
    () => formatMasteredWords(masteredWords),
    [masteredWords],
  );
  const displayedMastered = showSamples
    ? ["STOCK", "CAST", "COURT"]
    : masteredNames.slice(0, 3);
  const displayedSealSize = layout.sealSize;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.bookStage,
          {
            width: bookWidth,
            height: bookHeight,
            marginTop: layout.bookTopOffset,
          },
        ]}
      >
        <View pointerEvents="none" style={styles.bookArt}>
          <Image
            source={POLYBOOK_ART}
            resizeMode="stretch"
            style={styles.bookArtImage}
          />
        </View>

        <View
          style={[
            styles.pageContent,
            {
              left: `${layout.leftPageLeftPct}%`,
              top: `${layout.pageTopPct}%`,
              width: `${layout.pageWidthPct}%`,
              height: `${layout.pageHeightPct}%`,
              transform: [{ scale: layout.contentScale }],
            },
            __DEV__ && showSafeZones && styles.leftSafeZoneDebug,
          ]}
        >
          <Text style={styles.pageHeading}>HAUNTED</Text>
          <Image
            source={HAUNTED_SEAL}
            resizeMode="contain"
            style={[
              styles.pageSeal,
              { width: displayedSealSize, height: displayedSealSize },
            ]}
          />
          <Text style={styles.pageCount}>
            {showSamples
              ? `${displayedHaunts.length} ACTIVE`
              : `${hauntedWords.length} ACTIVE`}
          </Text>
          <View style={styles.wordStack}>
            {displayedHaunts.length > 0 ? (
              displayedHaunts.map((word, index) => (
                <Text
                  key={`${word}-${index}`}
                  style={[styles.pageWord, { fontSize: layout.wordSize }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {word}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyState}>NO ACTIVE HAUNTS</Text>
            )}
          </View>
        </View>

        <View
          style={[
            styles.pageContent,
            {
              left: `${layout.rightPageLeftPct}%`,
              top: `${layout.pageTopPct}%`,
              width: `${layout.pageWidthPct}%`,
              height: `${layout.pageHeightPct}%`,
              transform: [{ scale: layout.contentScale }],
            },
            __DEV__ && showSafeZones && styles.rightSafeZoneDebug,
          ]}
        >
          <Text style={styles.pageHeading}>MASTERED</Text>
          <Image
            source={MASTERED_SEAL}
            resizeMode="contain"
            style={[
              styles.pageSeal,
              { width: displayedSealSize, height: displayedSealSize },
            ]}
          />
          <Text style={styles.pageCount}>
            {showSamples
              ? `${displayedMastered.length} TOTAL`
              : `${masteredNames.length} TOTAL`}
          </Text>
          <View style={styles.wordStack}>
            {displayedMastered.length > 0 ? (
              displayedMastered.map((word, index) => (
                <Text
                  key={`${word}-${index}`}
                  style={[styles.pageWord, { fontSize: layout.wordSize }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {word}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyState}>NO MASTERY YET</Text>
            )}
          </View>
        </View>
      </View>

      {__DEV__ && (
        <PolybookDevTuner
          layout={layout}
          onChange={setLayout}
          showSafeZones={showSafeZones}
          onToggleSafeZones={() => setShowSafeZones((value) => !value)}
          showSamples={showSamples}
          onToggleSamples={() => setShowSamples((value) => !value)}
          dimensions={{
            screenWidth,
            bookWidth,
            baseBookHeight,
            finalBookHeight: bookHeight,
          }}
        />
      )}
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
    overflow: "visible",
  },
  bookStage: { position: "relative", alignSelf: "center", overflow: "visible" },
  bookArt: { ...StyleSheet.absoluteFillObject },
  bookArtImage: { width: "100%", height: "100%" },
  pageContent: {
    position: "absolute",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
  leftSafeZoneDebug: { borderWidth: 1, borderColor: "rgba(255, 70, 90, 0.9)" },
  rightSafeZoneDebug: {
    borderWidth: 1,
    borderColor: "rgba(40, 210, 255, 0.9)",
  },
  pageHeading: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 23,
    letterSpacing: 1.2,
    color: INK,
    textAlign: "center",
  },
  pageCount: {
    marginTop: 10,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 17,
    letterSpacing: 0.6,
    color: INK_MUTED,
    textAlign: "center",
  },
  pageSeal: {
    marginTop: 12,
    marginBottom: 10,
  },
  wordStack: {
    width: "100%",
    alignItems: "center",
    gap: 18,
    marginTop: 22,
  },
  pageWord: {
    fontFamily: FONTS.wordDisplay,
    includeFontPadding: false,
    lineHeight: 32,
    letterSpacing: 1,
    color: INK,
    textAlign: "center",
  },
  emptyState: {
    marginTop: 22,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 14,
    letterSpacing: 0.8,
    color: INK_MUTED,
    textAlign: "center",
  },
  tunerAnchor: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    alignItems: "flex-end",
  },
  tunerPanel: {
    width: 184,
    maxHeight: 390,
    backgroundColor: "rgba(15,13,42,0.94)",
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.68)",
    borderRadius: 8,
    padding: 6,
  },

  tunerPanelCollapsed: {
    width: 58,
    padding: 2,
  },
  tunerHeader: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  tunerTitle: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#FFF7D6",
  },
  tunerChevron: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 18,
    color: "#F5C842",
  },
  tunerScroll: { maxHeight: 342 },
  tunerContent: { paddingTop: 4, paddingBottom: 2 },
  tunerRow: { marginBottom: 5 },
  tunerLabel: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 9,
    letterSpacing: 0.8,
    color: "rgba(255,247,214,0.72)",
  },
  tunerControls: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  tunerButton: {
    width: 28,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.42)",
    borderRadius: 4,
    backgroundColor: "rgba(123,45,139,0.35)",
  },
  tunerButtonText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 16,
    lineHeight: 18,
    color: "#FFF7D6",
  },
  tunerValue: {
    flex: 1,
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 11,
    color: "#FFF7D6",
    textAlign: "center",
  },
  tunerActions: { flexDirection: "row", gap: 5, marginTop: 3 },
  tunerAction: {
    minHeight: 28,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245,200,66,0.42)",
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  tunerActionText: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 9,
    letterSpacing: 0.4,
    color: "#FFF7D6",
    textAlign: "center",
  },
});
