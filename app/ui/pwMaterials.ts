import { StyleSheet } from 'react-native';

import { PW } from './pwTheme';

export const cardMaterial = StyleSheet.create({
  base: {
    backgroundColor: PW.color.cardFace,
    borderColor: PW.color.cardRim,
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
    paddingHorizontal: PW.space.cardPadX,
    paddingVertical: PW.space.cardPadY,
    overflow: 'hidden',
    ...PW.shadow.card,
  },
  pressed: {
    backgroundColor: PW.color.cardFacePressed,
    borderColor: PW.color.cardRimStrong,
    ...PW.shadow.cardLifted,
  },
  rim: {
    borderColor: PW.color.cardRim,
    borderRadius: PW.radius.card,
    borderWidth: 1.5,
  },
  topHighlight: {
    backgroundColor: PW.color.cardInner,
    height: 1,
    left: PW.space.lg,
    opacity: PW.opacity.secondary,
    position: 'absolute',
    right: PW.space.lg,
    top: PW.space.sm,
  },
  bottomEdge: {
    backgroundColor: PW.color.cardBottomEdge,
    bottom: 0,
    height: 3,
    left: PW.space.lg,
    opacity: PW.opacity.secondary,
    position: 'absolute',
    right: PW.space.lg,
  },
});

export const deckBackMaterial = StyleSheet.create({
  base: {
    backgroundColor: PW.color.surfaceDeep,
    borderRadius: PW.radius.card,
    opacity: PW.opacity.strong,
  },
  rim: {
    borderColor: PW.color.purpleSoft,
    borderWidth: 1,
  },
  shadow: {
    ...PW.shadow.card,
  },
});

export const heroPlaqueMaterial = StyleSheet.create({
  base: {
    backgroundColor: PW.color.bgDeep,
    borderColor: PW.color.goldSoft,
    borderRadius: PW.radius.md,
    borderWidth: 2,
    ...PW.shadow.panel,
  },
  rim: {
    borderColor: PW.color.cardRimStrong,
    borderRadius: PW.radius.sm,
    borderWidth: 1,
  },
  underGlow: {
    backgroundColor: PW.color.purple,
    opacity: PW.opacity.subtle,
    ...PW.shadow.glowGold,
  },
});

export const panelMaterial = StyleSheet.create({
  base: {
    backgroundColor: PW.color.surfaceDeep,
    borderRadius: PW.radius.lg,
    ...PW.shadow.panel,
  },
  rim: {
    borderColor: PW.color.purpleSoft,
    borderWidth: 1.5,
  },
});

export const affordanceText = StyleSheet.create({
  up: {
    color: PW.color.gold,
    fontSize: PW.font.label,
    fontWeight: '800',
    letterSpacing: 0.9,
    lineHeight: PW.font.labelLine,
    opacity: 0.72,
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  right: {
    color: PW.color.lavender,
    fontSize: PW.font.label,
    fontWeight: '800',
    letterSpacing: 0.9,
    lineHeight: PW.font.labelLine,
    opacity: 0.74,
    textShadowColor: 'rgba(0,0,0,0.42)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});
