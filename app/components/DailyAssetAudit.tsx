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

const ASSETS = [
  { name: 'arch2.png', source: require('../../assets/images/dailycastle/arch2.png'), note: 'Castle arch scene' },
  { name: 'stonegate.png', source: require('../../assets/images/dailycastle/stonegate.png'), note: 'Gate/portcullis' },
  { name: 'featherwall.png', source: require('../../assets/images/dailycastle/featherwall.png'), note: 'Feather wall' },
  { name: 'stonefeather.png', source: require('../../assets/images/dailycastle/stonefeather.png'), note: 'Individual feather' },
  { name: 'answerwall.png', source: require('../../assets/images/dailycastle/answerwall.png'), note: 'Answer card wall' },
  { name: 'answercard.png', source: require('../../assets/images/dailycastle/answercard.png'), note: 'Answer card brick' },
  { name: 'SCMOCK1.png', source: require('../../assets/images/dailycastle/SCMOCK1.png'), note: 'Mock-up 1' },
  { name: 'SCMOCK2.png', source: require('../../assets/images/dailycastle/SCMOCK2.png'), note: 'Mock-up 2' },
  { name: 'SCMOCK3.png', source: require('../../assets/images/dailycastle/SCMOCK3.png'), note: 'Mock-up 3' },
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
  // Show at natural size, scaled to fit screen
  const scale = Math.min(W * 0.9 / 800, H * 0.6 / 800);

  return (
    <View style={styles.overlay}>
      {/* Asset display */}
      <View style={styles.assetArea}>
        <Image
          source={asset.source}
          style={{
            width: 800 * scale,
            height: 800 * scale,
          }}
          resizeMode="contain"
        />
      </View>

      {/* Info bar */}
      <View style={[styles.infoBar, { bottom: insets.bottom + 16 }]}>
        <Text style={styles.assetName}>{asset.name}</Text>
        <Text style={styles.assetNote}>{asset.note}</Text>
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
    ...StyleSheet.absoluteFill,
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
  counter: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.label,
    fontSize: 12,
    marginTop: 4,
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
