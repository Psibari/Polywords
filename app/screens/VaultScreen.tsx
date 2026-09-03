import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNav from "../components/BottomNav";
import { VaultIntroOverlay } from "../components/VaultIntroOverlay";
import { VAULT_INTRO_SEEN_KEY } from "../constants/storageKeys";
import AmbientSkyBackground from "../components/AmbientSkyBackground";
import { VAULT_SKY_TUNING } from "../ui/ambientSkyTuning";
import { FONTS } from "../constants/fonts";
import { PW } from "../ui/pwTheme";
import { stageMaterial } from "../ui/pwMaterials";
import type { VaultWordRecord } from "../components/ui/Bookcase";

import {
  LexiconPrototype,
  type LexiconDetail,
  type LexiconEntry,
  type LexiconMeaningLine,
  type LexiconStatus,
} from "../components/ui/LexiconPrototype";

import { useGameStore } from "../store/useGameStore";
import {
  resolveGhostPair,
  resolveMasteredPairs,
  pairsForWord,
} from "../game/hiddenPairIdentity";

import rawHuntData from "../../assets/data/huntData.json";

type HuntDataMask = {
  id: string;
  phrase: string;
  isReal: boolean;
};

type HuntDataEntry = {
  masks?: HuntDataMask[];
};

const HUNT_DATA = rawHuntData as unknown as Record<string, HuntDataEntry>;

function realMasksFor(word: string): HuntDataMask[] {
  return (HUNT_DATA[word]?.masks ?? []).filter((mask) => mask.isReal);
}

function formatDate(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function vaultBookFor(
  word: string,
  claimedIds: Set<string>,
  masteredByWord: Map<string, { isBoss: boolean }>,
): VaultWordRecord | null {
  const realMasks = realMasksFor(word);

  const claimedCount = realMasks.filter((mask) =>
    claimedIds.has(mask.id),
  ).length;

  const mastered = masteredByWord.get(word);

  if (claimedCount === 0 && !mastered) {
    return null;
  }

  return {
    word,
    ...(mastered?.isBoss ? { isBoss: true } : {}),
    isFinished: realMasks.length > 0 && claimedCount === realMasks.length,
    claimedCount,
    totalCount: realMasks.length,
  };
}

type Props = {
  navigation: any;
};

export default function VaultScreen({ navigation }: Props) {
  const progress = useGameStore((state) => state.progress);
  const ghosts = useGameStore((state) => state.ghosts);

  // Mastery remains permanent. A re-ghosted master is not presented
  // as an active Haunted Lexicon entry.
  const ghostsToShow = ghosts.filter(
    (ghost) =>
      !progress.masteredWords.some((mastered) => mastered.word === ghost.word),
  );

  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const [vaultIntroSeen, setVaultIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(VAULT_INTRO_SEEN_KEY)
      .then((value) => setVaultIntroSeen(value === "true"))
      .catch(() => setVaultIntroSeen(true));
  }, []);

  const handleVaultIntroDismiss = useCallback(() => {
    setVaultIntroSeen(true);

    AsyncStorage.setItem(VAULT_INTRO_SEEN_KEY, "true").catch(() => {});
  }, []);

  const claimedIds = new Set(progress.realMaskIdsFound ?? []);

  const masteredByWord = new Map(
    progress.masteredWords.map((record) => [record.word, record]),
  );

  const books = Object.keys(HUNT_DATA)
    .map((word) => vaultBookFor(word, claimedIds, masteredByWord))
    .filter((book): book is VaultWordRecord => book !== null);

  const bookByWord = new Map(books.map((book) => [book.word, book]));

  const ghostByWord = new Map(ghostsToShow.map((ghost) => [ghost.word, ghost]));

  const allRecordedWords = Array.from(
    new Set([
      ...books.map((book) => book.word),
      ...ghostsToShow.map((ghost) => ghost.word),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  function statusForWord(word: string): LexiconStatus {
    if (masteredByWord.has(word)) {
      return "mastered";
    }

    if (ghostByWord.has(word)) {
      return "haunted";
    }

    const book = bookByWord.get(word);

    if (book?.isFinished) {
      return "finished";
    }

    return "progress";
  }

  const lexiconEntries: LexiconEntry[] = allRecordedWords.map((word) => {
    const status = statusForWord(word);
    const book = bookByWord.get(word);

    let statusLabel: string;

    if (status === "mastered") {
      statusLabel = "MASTERED";
    } else if (status === "haunted") {
      statusLabel = "HAUNTED";
    } else if (status === "finished") {
      statusLabel = "FINISHED";
    } else if (book) {
      statusLabel = `${book.claimedCount}/${book.totalCount}`;
    } else {
      statusLabel = "IN PROGRESS";
    }

    return {
      word,
      status,
      statusLabel,
    };
  });

  const selectedBook = selectedWord
    ? (bookByWord.get(selectedWord) ?? null)
    : null;

  const selectedMastered = selectedWord
    ? (progress.masteredWords.find((record) => record.word === selectedWord) ??
      null)
    : null;

  const selectedGhost =
    selectedWord && !selectedMastered
      ? (ghostByWord.get(selectedWord) ?? null)
      : null;

  const selectedHiddenMeanings = selectedMastered
    ? resolveMasteredPairs(selectedMastered).map((pair) => pair.real)
    : [];

  const selectedGhostPair = selectedGhost
    ? resolveGhostPair(selectedGhost)
    : null;

  const selectedRealMeanings = selectedBook
    ? realMasksFor(selectedBook.word)
        .filter((mask) => claimedIds.has(mask.id))
        .map((mask) => mask.phrase)
    : [];

  const selectedGhostTotalPairs = selectedGhost
    ? pairsForWord(selectedGhost.word)
    : [];

  const selectedGhostCrackedCount = selectedGhost
    ? selectedGhostTotalPairs.filter((pair) =>
        (progress.hiddenPairIdsFound ?? []).includes(pair.id),
      ).length
    : 0;

  let selectedDetail: LexiconDetail | null = null;

  if (selectedWord && (selectedBook || selectedGhost)) {
    const status = statusForWord(selectedWord);

    const metaLines: string[] = [];
    const meanings: LexiconMeaningLine[] = [];

    if (selectedBook) {
      if (selectedBook.isFinished) {
        metaLines.push("Every visible meaning claimed.");
      }
    }

    if (selectedMastered) {
      metaLines.push(`Mastered ${formatDate(selectedMastered.dateMastered)}`);

      if (selectedMastered.isBoss) {
        metaLines.push("POLLY'S WORD — MASTERED");
      }

      metaLines.push(
        selectedMastered.flawless
          ? "Flawless mastery."
          : "Mastered with visible mistakes.",
      );

      const priorHaunts = selectedMastered.priorHauntAttempts ?? 0;

      if (priorHaunts > 0) {
        metaLines.push(
          `Mastered after ${priorHaunts} prior ${
            priorHaunts === 1 ? "Haunt" : "Haunts"
          }.`,
        );
      }
    }

    if (selectedGhost) {
      metaLines.push(
        `Still haunted — missed ${selectedGhost.runsMissed} ${
          selectedGhost.runsMissed === 1 ? "run" : "runs"
        }.`,
      );

      if (selectedGhostCrackedCount > 0) {
        metaLines.push(
          `Cracked ${selectedGhostCrackedCount} of ${selectedGhostTotalPairs.length} hidden meanings.`,
        );
      }

      metaLines.push("Run it back next Hunt.");
    }

    selectedRealMeanings.forEach((meaning, index) => {
      meanings.push({
        key: `visible-${index}`,
        text: `✓ ${meaning}`,
        tone: "normal",
      });
    });

    selectedHiddenMeanings.forEach((meaning, index) => {
      meanings.push({
        key: `mastered-hidden-${index}`,
        text: `Hidden ${index + 1}: ${meaning}`,
        tone: "hidden",
      });
    });

    if (selectedGhostPair?.real) {
      meanings.push({
        key: "ghost-real",
        text: `Hidden meaning: ${selectedGhostPair.real}`,
        tone: "hidden",
      });
    }

    if (selectedGhostPair?.trap) {
      meanings.push({
        key: "ghost-trap",
        text: `Watch for: ${selectedGhostPair.trap}`,
        tone: "trap",
      });
    }

    const undiscoveredVisibleCount = selectedBook
      ? Math.max(0, selectedBook.totalCount - selectedBook.claimedCount)
      : 0;

    for (let index = 0; index < undiscoveredVisibleCount; index += 1) {
      meanings.push({
        key: `locked-${index}`,
        text: "? Undiscovered meaning",
        tone: "locked",
      });
    }

    const progressLabel = selectedBook
      ? selectedBook.isFinished
        ? `${selectedBook.totalCount} of ${selectedBook.totalCount} visible meanings`
        : `${selectedBook.claimedCount} of ${selectedBook.totalCount} visible meanings`
      : "Haunted record";

    selectedDetail = {
      word: selectedWord,
      status,
      progressLabel,
      metaLines,
      meanings,
    };
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AmbientSkyBackground {...VAULT_SKY_TUNING} />

      <View pointerEvents="none" style={styles.ambientWash} />

      <LinearGradient
        colors={[...stageMaterial.vignette]}
        locations={[...stageMaterial.vignetteLocations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
      />

      <View pointerEvents="none" style={styles.candlePool} />

      <View pointerEvents="none" style={styles.candleCore} />

      <View style={styles.content}>
        <Text style={styles.kicker}>YOUR PERMANENT RECORD</Text>

        <Text style={styles.title}>THE LEXICON</Text>

        <Text style={styles.subtitle}>
          EVERY MEANING YOU SURVIVE LEAVES ITS MARK.
        </Text>

        <View style={styles.lexiconWrap}>
          <LexiconPrototype
            entries={lexiconEntries}
            selectedWord={selectedWord}
            onSelectWord={setSelectedWord}
            summary={{
              meanings: (progress.realMaskIdsFound ?? []).length,
              words: lexiconEntries.length,
              mastered: progress.masteredWords.length,
              haunted: ghostsToShow.length,
            }}
            detail={selectedDetail}
          />
        </View>
      </View>

      <BottomNav active="Vault" navigation={navigation} />

      {vaultIntroSeen === false && (
        <VaultIntroOverlay onDismiss={handleVaultIntroDismiss} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: stageMaterial.base,
  },

  content: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: PW.space.screenX,
    paddingTop: 8,
    paddingBottom: 8,
  },

  ambientWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: stageMaterial.purpleAmbient,
  },

  candlePool: {
    position: "absolute",
    alignSelf: "center",
    top: "28%",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: stageMaterial.candleGlow,
  },

  candleCore: {
    position: "absolute",
    alignSelf: "center",
    top: "28%",
    marginTop: 90,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245,200,66,0.12)",
  },

  kicker: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 10,
    letterSpacing: 1.6,
    color: PW.color.mutedWhite,
    textAlign: "center",
    marginTop: 2,
  },

  title: {
    fontFamily: FONTS.label,
    includeFontPadding: false,
    fontSize: 27,
    letterSpacing: 5,
    color: PW.color.softWhite,
    textAlign: "center",
    marginTop: 1,
  },

  subtitle: {
    fontFamily: FONTS.brand,
    includeFontPadding: false,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.8,
    color: PW.color.mutedWhite,
    textAlign: "center",
    marginTop: 1,
    marginBottom: 6,
  },

  lexiconWrap: {
    flex: 1,
    minHeight: 0,
    justifyContent: "flex-start",
  },
});
