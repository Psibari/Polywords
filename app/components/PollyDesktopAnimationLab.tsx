import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import { POLLY_ANIMATIONS } from '../animations/pollyAnimations';
import { PollyPoseAnimation } from './PollyPoseAnimation';
import type { PollyPoseAnimationName } from '../animations/pollyPoseAnimations';
import { PollyPerchRig } from './PollyPerchRig';
import { POLLY_POSES, PollyPoseName } from '../ui/pollyPoses';
import { PW } from '../ui/pwTheme';

type Props = { visible: boolean; onClose: () => void };
type Tab = 'rig' | 'poses' | 'webp' | 'motion';

const TABS: { id: Tab; label: string }[] = [
  { id: 'rig', label: 'RIG 2' },
  { id: 'poses', label: 'POSES' },
  { id: 'webp', label: 'WEBP' },
  { id: 'motion', label: 'MOTION' },
];

const POSES = Object.keys(POLLY_POSES) as PollyPoseName[];
const MOTIONS: PollyPoseAnimationName[] = ['idle', 'angry', 'point', 'surprised', 'flying'];
const WEBPS = [
  ['IDLE', POLLY_ANIMATIONS.idle],
  ['TAUNT POINT', POLLY_ANIMATIONS.tauntPoint],
  ['LAUGH', POLLY_ANIMATIONS.laugh],
  ['BOSS WARNING', POLLY_ANIMATIONS.bossWarning],
  ['SULK', POLLY_ANIMATIONS.sulk],
  ['FLY IN', POLLY_ANIMATIONS.flyIn],
] as const;

export function PollyDesktopAnimationLab({ visible, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('rig');
  const [pose, setPose] = useState<PollyPoseName>('idle');
  const [motion, setMotion] = useState<PollyPoseAnimationName>('idle');
  const [webpIndex, setWebpIndex] = useState(0);
  const [eyeWide, setEyeWide] = useState(false);
  const [browShock, setBrowShock] = useState(false);
  const [angryBrow, setAngryBrow] = useState(false);
  const [crownTilt, setCrownTilt] = useState(false);
  const [mouth, setMouth] = useState<'closed' | 'open' | 'gape'>('closed');
  const [playing, setPlaying] = useState(true);
  const [webpPlaying, setWebpPlaying] = useState(true);
  const [restartKey, setRestartKey] = useState(0);

  const webp = WEBPS[webpIndex];
  const stageLabel = useMemo(() => {
    if (tab === 'rig') return `RIG 2 · ${eyeWide ? 'WIDE EYE' : 'NORMAL EYE'} · ${mouth.toUpperCase()}`;
    if (tab === 'poses') return `POSE · ${pose.toUpperCase()}`;
    if (tab === 'webp') return `WEBP · ${webp[0]}`;
    return `MOTION · ${motion.toUpperCase()}`;
  }, [tab, eyeWide, mouth, pose, webp, motion]);

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>DEVELOPMENT ONLY · {Platform.OS.toUpperCase()}</Text>
            <Text style={styles.title}>POLLY DESKTOP ANIMATION LAB</Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {TABS.map(item => (
            <Pressable key={item.id} onPress={() => setTab(item.id)} style={[styles.tab, tab === item.id && styles.active]}>
              <Text style={[styles.tabText, tab === item.id && styles.activeText]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.workspace}>
          <View style={styles.stagePanel}>
            <Text style={styles.stageLabel}>{stageLabel}</Text>
            <View style={styles.stage}>
              {tab === 'rig' && (
                <PollyPerchRig
                  size={460}
                  reduceMotion={false}
                  crownTilt={crownTilt}
                  angryBrow={angryBrow}
                  eye={eyeWide ? 'wide' : 'default'}
                  brow={browShock ? 'shocked' : 'default'}
                  mouth={mouth}
                />
              )}
              {tab === 'poses' && <Image source={POLLY_POSES[pose]} resizeMode="contain" style={styles.largeImage} />}
              {tab === 'webp' && webpPlaying && (
                <Image key={restartKey} source={webp[1]} resizeMode="contain" style={styles.largeImage} />
              )}
              {tab === 'webp' && !webpPlaying && (
                <Text style={styles.pausedText}>PAUSED</Text>
              )}
              {tab === 'motion' && (
                <PollyPoseAnimation key={restartKey} animation={motion} size={460} active={playing} loop />
              )}
            </View>
          </View>

          <ScrollView style={styles.controlPanel} contentContainerStyle={styles.controls}>
            {tab === 'rig' && (
              <>
                <Text style={styles.section}>FACE PARTS</Text>
                <Control label="WIDE EYE" active={eyeWide} onPress={() => setEyeWide(v => !v)} />
                <Control label="SHOCK BROW" active={browShock} onPress={() => setBrowShock(v => !v)} />
                <Control label="ANGRY BROW" active={angryBrow} onPress={() => setAngryBrow(v => !v)} />
                <Control label="CROWN TILT" active={crownTilt} onPress={() => setCrownTilt(v => !v)} />
                <Text style={styles.section}>BEAK</Text>
                {(['closed','open','gape'] as const).map(v => (
                  <Control key={v} label={v.toUpperCase()} active={mouth === v} onPress={() => setMouth(v)} />
                ))}
                <Text style={styles.help}>Use the dedicated Face Rig viewer for pixel nudges. This lab is for large-scale emotional comparison and asset discovery.</Text>
              </>
            )}
            {tab === 'poses' && (
              <>
                <Text style={styles.section}>ALL REGISTERED POSES</Text>
                {POSES.map(v => <Control key={v} label={v.toUpperCase()} active={pose === v} onPress={() => setPose(v)} />)}
              </>
            )}
            {tab === 'webp' && (
              <>
                <Text style={styles.section}>FORGOTTEN WEBP ANIMATIONS</Text>
                {WEBPS.map((v,i) => <Control key={v[0]} label={v[0]} active={webpIndex === i} onPress={() => { setWebpIndex(i); setRestartKey(k => k + 1); }} />)}
                <Pressable onPress={() => setWebpPlaying(v => !v)} style={styles.action}><Text style={styles.actionText}>{webpPlaying ? 'PAUSE' : 'PLAY'}</Text></Pressable>
                <Pressable onPress={() => { setWebpPlaying(true); setRestartKey(k => k + 1); }} style={styles.action}><Text style={styles.actionText}>RESTART</Text></Pressable>
                <Text style={styles.help}>Animated WEBP playback is renderer/platform dependent. The PC web build is the intended inspection surface.</Text>
              </>
            )}
            {tab === 'motion' && (
              <>
                <Text style={styles.section}>WHOLE-IMAGE MOTION PRESETS</Text>
                {MOTIONS.map(v => <Control key={v} label={v.toUpperCase()} active={motion === v} onPress={() => { setMotion(v); setRestartKey(k => k + 1); }} />)}
                <Pressable onPress={() => setPlaying(v => !v)} style={styles.action}><Text style={styles.actionText}>{playing ? 'PAUSE' : 'PLAY'}</Text></Pressable>
                <Pressable onPress={() => setRestartKey(k => k + 1)} style={styles.action}><Text style={styles.actionText}>RESTART</Text></Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Control({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.control, active && styles.active]}>
      <Text style={[styles.controlText, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PW.color.bg },
  header: { minHeight: 88, paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: PW.color.purpleSoft },
  kicker: { color: PW.color.goldSoft, fontFamily: FONTS.tileCopy, fontSize: 13, letterSpacing: 1.5 },
  title: { color: PW.color.gold, fontFamily: FONTS.hud, fontSize: 25, marginTop: 4, letterSpacing: 1 },
  closeButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: PW.color.white, fontSize: 38, lineHeight: 40 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: PW.color.borderMuted },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: PW.color.purpleSoft, borderRadius: 10 },
  tabText: { color: PW.color.mutedWhite, fontFamily: FONTS.hud, fontSize: 14 },
  active: { borderColor: PW.color.gold, backgroundColor: PW.color.overlayMedium },
  activeText: { color: PW.color.gold },
  workspace: { flex: 1, flexDirection: 'row', minHeight: 0 },
  stagePanel: { flex: 1, minWidth: 0, padding: 20 },
  stageLabel: { color: PW.color.white, fontFamily: FONTS.hud, fontSize: 15, letterSpacing: 1, textAlign: 'center' },
  stage: { flex: 1, minHeight: 480, alignItems: 'center', justifyContent: 'center', backgroundColor: PW.color.overlayHeavy, borderRadius: 20, borderWidth: 1, borderColor: PW.color.purpleSoft, marginTop: 12, overflow: 'hidden' },
  largeImage: { width: 520, height: 520 },
  controlPanel: { width: 330, maxWidth: '38%', borderLeftWidth: 1, borderLeftColor: PW.color.purpleSoft },
  controls: { padding: 18, gap: 8 },
  section: { color: PW.color.goldSoft, fontFamily: FONTS.hud, fontSize: 13, letterSpacing: 1.5, marginTop: 8, marginBottom: 3 },
  control: { minHeight: 44, borderWidth: 1, borderColor: PW.color.purpleSoft, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  controlText: { color: PW.color.mutedWhite, fontFamily: FONTS.tileCopy, fontSize: 15 },
  action: { minHeight: 44, borderRadius: 10, backgroundColor: PW.color.purpleSoft, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  actionText: { color: PW.color.white, fontFamily: FONTS.hud, fontSize: 14, letterSpacing: 1 },
  help: { color: PW.color.mutedWhite, fontFamily: FONTS.tileCopy, fontSize: 13, lineHeight: 19, marginTop: 10 },
  pausedText: { color: PW.color.mutedWhite, fontFamily: FONTS.hud, fontSize: 22, letterSpacing: 2 },
});
