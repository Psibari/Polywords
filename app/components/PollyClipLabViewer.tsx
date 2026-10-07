import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import { useReducedMotionPreference } from '../hooks/usePollyAmbientMotion';
import {
  POLLY_CLIP_ORDER,
  POLLY_CLIPS,
  POLLY_REACTION_CLIPS,
  type PollyClipName,
} from '../ui/pollyClips';
import { PW } from '../ui/pwTheme';
import { PollyClipPlayer } from './PollyClipPlayer';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const BACKGROUNDS: Array<{ label: string; color: string }> = [
  { label: 'Game', color: PW.color.bg },
  { label: 'Deep', color: PW.color.surfaceDeep },
  { label: 'Cream', color: '#F1E6CF' },
  { label: 'Black', color: '#000000' },
];

// TEST-ONLY (development build). Judges AI-video-derived Polly clips on a real phone.
// Two parts: a clip browser, and a "director" that holds the idle loop and cuts to a
// reaction clip on demand, then returns to idle on its own, the way a game screen would.
export function PollyClipLabViewer({ visible, onClose }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const stageWidth = Math.min(screenWidth - PW.space.lg * 2, 320);
  const reduceMotion = useReducedMotionPreference();

  const [bgIndex, setBgIndex] = useState(0);
  const [onionSkin, setOnionSkin] = useState(false);
  const [browseClip, setBrowseClip] = useState<PollyClipName>('idleBlinkHq');
  const [browseKey, setBrowseKey] = useState(0);

  const [directorClip, setDirectorClip] = useState<PollyClipName>('idleBlinkHq');
  const [directorKey, setDirectorKey] = useState(0);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearReturnTimer = useCallback(() => {
    if (returnTimer.current) {
      clearTimeout(returnTimer.current);
      returnTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      clearReturnTimer();
      setDirectorClip('idleBlinkHq');
    }
    return clearReturnTimer;
  }, [visible, clearReturnTimer]);

  const cutTo = useCallback((clip: PollyClipName) => {
    clearReturnTimer();
    setDirectorClip(clip);
    setDirectorKey(k => k + 1);
    returnTimer.current = setTimeout(() => {
      setDirectorClip('idleBlinkHq');
      setDirectorKey(k => k + 1);
      returnTimer.current = null;
    }, POLLY_CLIPS[clip].durationMs);
  }, [clearReturnTimer]);

  const bg = BACKGROUNDS[bgIndex];
  const browseDef = POLLY_CLIPS[browseClip];
  const directorDef = POLLY_CLIPS[directorClip];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.screen} accessibilityViewIsModal>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>DEVELOPMENT ONLY · EXPERIMENT</Text>
            <Text style={styles.title}>POLLY CLIP LAB</Text>
          </View>
          <Pressable
            accessibilityLabel="Close Polly clip lab"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.note}>
            AI-video clips, keyed to transparency and registered onto the approved neutral sprite. Nothing in Hunt, Daily, Home or Results uses them. Judge: does she look alive, and does she look like the same Polly?
          </Text>
          {reduceMotion ? (
            <Text style={styles.warn}>
              Reduce Motion is ON, so the approved still is shown instead of motion. Turn it off in system settings or Settings to test clips.
            </Text>
          ) : null}

          <Text style={styles.label}>BACKGROUND</Text>
          <View style={styles.chipRow}>
            {BACKGROUNDS.map((b, i) => (
              <Pressable
                key={b.label}
                accessibilityRole="button"
                onPress={() => setBgIndex(i)}
                style={[styles.chip, i === bgIndex && styles.chipOn]}
              >
                <Text style={[styles.chipText, i === bgIndex && styles.chipTextOn]}>{b.label}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setOnionSkin(v => !v)}
              style={[styles.chip, onionSkin && styles.chipOn]}
            >
              <Text style={[styles.chipText, onionSkin && styles.chipTextOn]}>Overlay approved still</Text>
            </Pressable>
          </View>

          {/* ---------- DIRECTOR ---------- */}
          <Text style={styles.sectionTitle}>DIRECTOR DEMO</Text>
          <Text style={styles.note}>
            Polly idles. Tap a reaction: she cuts to it, then returns to the idle loop by herself.
          </Text>
          <View style={[styles.stage, { backgroundColor: bg.color, width: stageWidth + 24 }]}>
            <PollyClipPlayer
              clip={directorClip}
              onionSkin={onionSkin}
              playKey={directorKey}
              reduceMotion={reduceMotion === true}
              width={stageWidth}
            />
          </View>
          <Text style={styles.readout}>
            Now playing: {directorDef.label}{directorClip === 'idleBlinkHq' ? '' : '  (returns to idle)'}
          </Text>
          <View style={styles.chipRow}>
            {POLLY_REACTION_CLIPS.map(name => (
              <Pressable
                key={name}
                accessibilityRole="button"
                onPress={() => cutTo(name)}
                style={({ pressed }) => [styles.chip, styles.chipAction, pressed && styles.pressed]}
              >
                <Text style={styles.chipText}>{POLLY_CLIPS[name].label}</Text>
              </Pressable>
            ))}
          </View>

          {/* ---------- BROWSER ---------- */}
          <Text style={[styles.sectionTitle, styles.sectionGap]}>CLIP BROWSER</Text>
          <View style={styles.chipRow}>
            {POLLY_CLIP_ORDER.map(name => (
              <Pressable
                key={name}
                accessibilityRole="button"
                onPress={() => {
                  setBrowseClip(name);
                  setBrowseKey(k => k + 1);
                }}
                style={[styles.chip, name === browseClip && styles.chipOn]}
              >
                <Text style={[styles.chipText, name === browseClip && styles.chipTextOn]}>
                  {POLLY_CLIPS[name].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.stage, { backgroundColor: bg.color, width: stageWidth + 24 }]}>
            <PollyClipPlayer
              clip={browseClip}
              onionSkin={onionSkin}
              playKey={browseKey}
              reduceMotion={reduceMotion === true}
              width={stageWidth}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setBrowseKey(k => k + 1)}
            style={({ pressed }) => [styles.replay, pressed && styles.pressed]}
          >
            <Text style={styles.replayText}>REPLAY FROM START</Text>
          </Pressable>
          <Text style={styles.readout}>
            {browseDef.width} x {browseDef.height} · {browseDef.frames} frames · {browseDef.frameMs} ms/frame
            {'\n'}
            {(browseDef.durationMs / 1000).toFixed(1)} s · {browseDef.loops ? 'loops' : 'plays once'} · {(browseDef.kb / 1024).toFixed(1)} MB
            {'\n'}
            {browseDef.suggestedUse}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bg },
  header: {
    minHeight: 92,
    paddingHorizontal: PW.space.lg,
    paddingTop: PW.space.md,
    paddingBottom: PW.space.md,
    borderBottomWidth: 1,
    borderBottomColor: PW.color.purpleSoft,
    backgroundColor: PW.color.surfaceDeep,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PW.space.md,
  },
  headerCopy: { flex: 1 },
  kicker: {
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1.5,
    marginBottom: PW.space.xs,
  },
  title: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 24,
    letterSpacing: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 30,
    lineHeight: 32,
  },
  content: { padding: PW.space.lg, paddingBottom: PW.space.xxl, alignItems: 'center' },
  note: {
    alignSelf: 'stretch',
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: PW.space.md,
  },
  warn: {
    alignSelf: 'stretch',
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: PW.space.md,
  },
  label: {
    alignSelf: 'stretch',
    color: PW.color.goldSoft,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 13,
    letterSpacing: 1.5,
    marginBottom: PW.space.xs,
  },
  sectionTitle: {
    alignSelf: 'stretch',
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 18,
    letterSpacing: 1,
    marginTop: PW.space.lg,
    marginBottom: PW.space.xs,
  },
  sectionGap: { marginTop: PW.space.xl },
  chipRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PW.space.sm,
    marginBottom: PW.space.md,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: PW.space.md,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    backgroundColor: PW.color.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: PW.color.gold, backgroundColor: PW.color.purpleSoft },
  chipAction: { borderColor: PW.color.goldSoft },
  chipText: {
    color: PW.color.white,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
  },
  chipTextOn: { color: PW.color.gold },
  stage: {
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.cardRim,
    padding: 12,
    alignItems: 'center',
    marginBottom: PW.space.sm,
  },
  readout: {
    alignSelf: 'stretch',
    color: PW.color.mutedWhite,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: PW.space.md,
  },
  replay: {
    minHeight: 44,
    paddingHorizontal: PW.space.lg,
    borderRadius: PW.radius.lg,
    borderWidth: 1,
    borderColor: PW.color.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: PW.space.md,
  },
  replayText: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    includeFontPadding: false,
    fontSize: 15,
    letterSpacing: 1,
  },
  pressed: { opacity: 0.7 },
});
