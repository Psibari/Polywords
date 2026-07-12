import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONTS } from '../constants/fonts';
import { MasteredWordRecord } from '../game/types';

type Props = {
  record: MasteredWordRecord | null;
  onClose: () => void;
};

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function MasteredWordBook({ record, onClose }: Props) {
  const [displayRecord, setDisplayRecord] = useState<MasteredWordRecord | null>(null);
  const closingRef  = useRef(false);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spineLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Pull-off-the-shelf lift — transform + opacity only, native driver
  const liftProgress = useRef(new Animated.Value(0)).current;
  // Cover falling open — scaleX only, native driver
  const coverScaleX  = useRef(new Animated.Value(1)).current;
  // Interior pages reveal — transform + opacity only, native driver
  const pagesOpacity = useRef(new Animated.Value(0)).current;
  const pagesShift   = useRef(new Animated.Value(14)).current;
  const spinePulse   = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!record || closingRef.current) return;

    setDisplayRecord(record);
    liftProgress.setValue(0);
    coverScaleX.setValue(1);
    pagesOpacity.setValue(0);
    pagesShift.setValue(14);
    spinePulse.setValue(0.35);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Phase 1 — T+0ms: pulled off the shelf toward the player
    Animated.spring(liftProgress, {
      toValue: 1,
      damping: 13,
      stiffness: 180,
      useNativeDriver: true,
    }).start();

    // Phase 2 — T+260ms: cover falls open from the spine
    const t2 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.timing(coverScaleX, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    }, 260);

    // Phase 3 — T+420ms: pages settle into view
    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(pagesOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(pagesShift,   { toValue: 0, damping: 12, stiffness: 160, useNativeDriver: true }),
      ]).start();
    }, 420);

    // Phase 4 — T+620ms: pages landed, quiet haptic + idle spine glow
    const t4 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(spinePulse, { toValue: 0.75, duration: 1400, useNativeDriver: true }),
        Animated.timing(spinePulse, { toValue: 0.35, duration: 1400, useNativeDriver: true }),
      ]));
      spineLoopRef.current = loop;
      loop.start();
    }, 620);

    timersRef.current.push(t2, t3, t4);
    return () => timersRef.current.forEach(clearTimeout);
  }, [record]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => spineLoopRef.current?.stop(), []);

  function handleClose() {
    if (!displayRecord || closingRef.current) return;
    closingRef.current = true;
    spineLoopRef.current?.stop();
    timersRef.current.forEach(clearTimeout);

    // Reverse — pages retreat, cover slams shut, book drops back to the shelf
    Animated.parallel([
      Animated.timing(pagesOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(pagesShift,   { toValue: 14, duration: 140, useNativeDriver: true }),
    ]).start();

    const t1 = setTimeout(() => {
      Animated.timing(coverScaleX, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    }, 100);

    const t2 = setTimeout(() => {
      Animated.timing(liftProgress, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }, 260);

    const t3 = setTimeout(() => {
      closingRef.current = false;
      setDisplayRecord(null);
      onClose();
    }, 500);

    timersRef.current = [t1, t2, t3];
  }

  if (!displayRecord) return null;

  const liftTranslateY = liftProgress.interpolate({ inputRange: [0, 1], outputRange: [46, 0] });
  const liftScale      = liftProgress.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const liftTilt       = liftProgress.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '0deg'] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.backdrop, { opacity: liftProgress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.bookOuter,
            {
              opacity: liftProgress,
              transform: [
                { translateY: liftTranslateY },
                { scale: liftScale },
                { rotate: liftTilt },
              ],
            },
          ]}
        >
          {/* Pages layer — revealed as the cover falls open */}
          <View style={[styles.bookBase, displayRecord.isBoss && styles.bookBaseBoss]}>
            <Animated.View style={[styles.spine, { opacity: spinePulse }]} />

            <Animated.View
              style={[
                styles.pagesRow,
                { opacity: pagesOpacity, transform: [{ translateX: pagesShift }] },
              ]}
            >
              <View style={styles.pageLeft}>
                {displayRecord.isBoss && (
                  <View style={styles.bossRibbon}>
                    <Text style={styles.bossRibbonText}>POLLY'S WORD</Text>
                  </View>
                )}
                <Text style={styles.pageWord} adjustsFontSizeToFit numberOfLines={1}>
                  {displayRecord.word}
                </Text>
                <View style={styles.masteredStamp}>
                  <Text style={styles.masteredStampText}>MASTERED</Text>
                </View>
              </View>

              <View style={styles.pageDivider} />

              <View style={styles.pageRight}>
                <Text style={styles.pageLabel}>DATE RECLAIMED</Text>
                <Text style={styles.pageValue}>{formatFullDate(displayRecord.dateMastered)}</Text>

                <Text style={[styles.pageLabel, { marginTop: 18 }]}>HIDDEN MEANING</Text>
                <Text style={styles.pageValueHidden}>
                  {displayRecord.hiddenMeaningFound || 'Core vaulted — no deep cut found.'}
                </Text>
              </View>
            </Animated.View>

            <Pressable style={styles.closeTab} onPress={handleClose} hitSlop={10}>
              <Text style={styles.closeTabText}>×</Text>
            </Pressable>
          </View>

          {/* Cover layer — falls open from the spine to reveal the pages */}
          <Animated.View
            style={[
              styles.cover,
              displayRecord.isBoss && styles.coverBoss,
              { transform: [{ scaleX: coverScaleX }], transformOrigin: ['0%', '50%'] } as any,
            ]}
          >
            <Text style={styles.coverKicker}>WORD VAULT</Text>
            <Text style={styles.coverWord} adjustsFontSizeToFit numberOfLines={1}>
              {displayRecord.word}
            </Text>
            <View style={styles.coverUnderline} />
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const BOOK_WIDTH = 320;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,13,42,0.86)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bookOuter: {
    width: BOOK_WIDTH,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  bookBase: {
    borderRadius: 18,
    backgroundColor: '#0F0D2A',
    borderWidth: 1.5,
    borderColor: 'rgba(123,45,139,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 22,
    minHeight: 260,
    overflow: 'hidden',
  },
  bookBaseBoss: {
    borderColor: 'rgba(245,200,66,0.55)',
  },
  spine: {
    position: 'absolute',
    left: '50%',
    top: 14,
    bottom: 14,
    width: 2,
    backgroundColor: '#7B2D8B',
    shadowColor: '#7B2D8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  pagesRow: {
    flexDirection: 'row',
  },
  pageLeft: {
    flex: 1,
    paddingRight: 12,
    alignItems: 'flex-start',
  },
  pageRight: {
    flex: 1,
    paddingLeft: 12,
  },
  pageDivider: {
    width: 1,
  },
  bossRibbon: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123,45,139,0.6)',
    backgroundColor: 'rgba(123,45,139,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  bossRibbonText: {
    color: '#C79BD6',
    fontFamily: FONTS.tileCopy,
    fontSize: 9,
    letterSpacing: 1,
  },
  pageWord: {
    color: '#FFFFFF',
    fontFamily: FONTS.heroFace,
    fontSize: 30,
    letterSpacing: 1,
  },
  masteredStamp: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,200,66,0.55)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ rotate: '-6deg' }],
  },
  masteredStampText: {
    color: '#F5C842',
    fontFamily: FONTS.tileCopy,
    fontSize: 10,
    letterSpacing: 2,
  },
  pageLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.tileCopy,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  pageValue: {
    color: '#FFFFFF',
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    marginTop: 4,
  },
  pageValueHidden: {
    color: '#7B2D8B',
    fontFamily: FONTS.tileCopy,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  closeTab: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(123,45,139,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.tileCopy,
    marginTop: -1,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: '#0F0D2A',
    borderWidth: 1.5,
    borderColor: 'rgba(123,45,139,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  coverBoss: {
    borderColor: 'rgba(245,200,66,0.55)',
  },
  coverKicker: {
    color: 'rgba(255,255,255,0.56)',
    fontFamily: FONTS.tileCopy,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 10,
  },
  coverWord: {
    color: '#FFFFFF',
    fontFamily: FONTS.wordDisplay,
    fontSize: 40,
    letterSpacing: 2,
    textAlign: 'center',
  },
  coverUnderline: {
    marginTop: 14,
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F5C842',
  },
});
