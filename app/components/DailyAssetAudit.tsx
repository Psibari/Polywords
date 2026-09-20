import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../constants/fonts';
import { PW } from '../ui/pwTheme';
import {
  DAILY_CASTLE_EXPORT_3X,
  DAILY_CASTLE_LAYOUT,
} from '../ui/dailyCastleLayout';

const ASSETS = [
  {
    name: 'squarearch.png',
    source: require('../../assets/images/dailycastle/squarearch.png'),
    note: 'Square Arch',
    logical: DAILY_CASTLE_LAYOUT.arch,
    export3x: DAILY_CASTLE_EXPORT_3X.squarearch,
  },
  {
    name: 'gate.png',
    source: require('../../assets/images/dailycastle/gate.png'),
    note: 'Gate / clue face',
    logical: DAILY_CASTLE_LAYOUT.opening,
    export3x: DAILY_CASTLE_EXPORT_3X.gate,
  },
  {
    name: 'featherwall.png',
    source: require('../../assets/images/dailycastle/featherwall.png'),
    note: 'Feather wall behind gate',
    logical: DAILY_CASTLE_LAYOUT.opening,
    export3x: DAILY_CASTLE_EXPORT_3X.featherwall,
  },
  {
    name: 'stonefeather.png',
    source: require('../../assets/images/dailycastle/stonefeather.png'),
    note: 'Individual stone feather',
    logical: DAILY_CASTLE_LAYOUT.stoneFeather,
    export3x: DAILY_CASTLE_EXPORT_3X.stonefeather,
  },
  {
    name: 'answerwall.png',
    source: require('../../assets/images/dailycastle/answerwall.png'),
    note: 'Edge-to-edge answer wall',
    logical: DAILY_CASTLE_LAYOUT.answerWall,
    export3x: DAILY_CASTLE_EXPORT_3X.answerwall,
  },
  {
    name: 'answerwqallrecesses.png',
    source: require('../../assets/images/dailycastle/answerwqallrecesses.png'),
    note: 'Answer recess overlay',
    logical: DAILY_CASTLE_LAYOUT.answerRecesses,
    export3x: DAILY_CASTLE_EXPORT_3X.answerRecesses,
  },
  {
    name: 'answercard.png',
    source: require('../../assets/images/dailycastle/answercard.png'),
    note: 'Answer card',
    logical: DAILY_CASTLE_LAYOUT.card,
    export3x: DAILY_CASTLE_EXPORT_3X.answercard,
  },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function DailyAssetAudit({ visible, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const asset = ASSETS[index];
  const scale = Math.min(
    (W * 0.9) / asset.logical.width,
    (H * 0.52) / asset.logical.height,
  );

  return (
    <View style={styles.overlay}>
      <View style={styles.assetArea}>
        <Image
          source={asset.source}
          style={{
            width: asset.logical.width * scale,
            height: asset.logical.height * scale,
          }}
          resizeMode="stretch"
        />
      </View>

      <View style={[styles.infoBar, { bottom: insets.bottom + 16 }]}>
        <Text style={styles.assetName}>{asset.name}</Text>
        <Text style={styles.assetNote}>{asset.note}</Text>
        <Text style={styles.target}>
          {'TARGET ' + asset.logical.width + ' × ' + asset.logical.height + ' PT'}
        </Text>
        <Text style={styles.target}>
          {'3× EXPORT ' + asset.export3x.width + ' × ' + asset.export3x.height + ' PX'}
        </Text>
        <Text style={styles.counter}>{index + 1} / {ASSETS.length}</Text>

        <View style={styles.nav}>
          <Pressable
            style={styles.navBtn}
            onPress={() => setIndex(Math.max(0, index - 1))}
          >
            <Text style={styles.navBtnText}>← PREV</Text>
          </Pressable>
          <Pressable
            style={styles.navBtn}
            onPress={() => setIndex(Math.min(ASSETS.length - 1, index + 1))}
          >
            <Text style={styles.navBtnText}>NEXT →</Text>
          </Pressable>
        </View>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>CLOSE</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0818',
    zIndex: 999,
    elevation: 999,
  },
  assetArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(10,8,24,0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PW.color.gold,
    padding: 16,
    alignItems: 'center',
  },
  assetName: {
    color: PW.color.gold,
    fontFamily: FONTS.hud,
    fontSize: 20,
    letterSpacing: 2,
  },
  assetNote: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.tileCopy,
    fontSize: 14,
    marginTop: 4,
  },
  target: {
    color: PW.color.white,
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 4,
  },
  counter: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.label,
    fontSize: 12,
    marginTop: 6,
  },
  nav: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  navBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  navBtnText: {
    color: PW.color.white,
    fontFamily: FONTS.hud,
    fontSize: 14,
    letterSpacing: 1,
  },
  closeBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.label,
    fontSize: 12,
    letterSpacing: 1,
  },
});
