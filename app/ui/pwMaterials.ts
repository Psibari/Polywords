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

export const heroBookMaterial = {
  coverPurple:    '#191541',
  coverPurpleTop: '#2A1C5C',
  coverPurpleBot: '#120F32',
  hingeDark:      '#141038',
  hingeRail:      '#0F0D2A',
  pagesCreamTop:  '#9A8E7A',
  pagesCream:     '#887868',
  pagesCreamBot:  '#706050',
  pagesLine:      'rgba(55,42,22,0.42)',
  goldTrim:       '#F5C842',
  goldHairline:   'rgba(245,200,66,0.32)',
  goldPin:        '#F5C842',
  goldPinInner:   '#C8920E',
  intakeGlow:     '#7B2D8B',
  bookHeight:     210,
  hingeHeight:    18,
  coverHeight:    162,
  pageHeight:     52,
} as const;
