import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../constants/fonts';
import { dailyCardMaterial, dailyCardFaceMaterial } from '../../ui/pwDailyMaterials';

export type DailyCardFaceState = 'idle' | 'correct' | 'wrong' | 'disabled';

type Props = {
  label: string;
  state: DailyCardFaceState;
};

export default function DailyCardFace({ label }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.background} />
      <View style={styles.insetTrim} />
      <LinearGradient
        colors={[dailyCardFaceMaterial.sheenTop, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
      />
      <Text
        style={styles.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: dailyCardMaterial.innerFace,
  },
  insetTrim: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1,
    borderColor: dailyCardFaceMaterial.insetTrim,
    borderRadius: Math.max(dailyCardMaterial.innerRadius - 2, 0),
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  label: {
    color: dailyCardMaterial.text,
    fontFamily: FONTS.tileCopy,
    includeFontPadding: false,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
