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
  pagesCreamBot:  '#8A7A68',
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

// ── Material language (spec: 2026-07-02 material-language-and-vault-library) ──

// Foil-stamped lettering — the trophy-word treatment. Rendered by FoilWord.
export const foilMaterial = {
  fill: PW.color.gold,
  edge: 'rgba(245,200,66,0.62)',      // tight warm edge on the fill
  deboss: 'rgba(0,0,0,0.72)',          // pressed-in shadow below
  catchLight: 'rgba(255,247,214,0.95)',// PW.color.foilLight at 0.95
} as const;

// Library wood + spine leather (Warmth clause: spines stand against warm
// wood, never purple-on-purple).
export const libraryMaterial = {
  wood: '#6A5A48',
  woodDark: '#4A3E30',
  woodShadow: '#332A20',
  shelfHairline: 'rgba(245,200,66,0.30)',
  spineLeather: heroBookMaterial.coverPurple,
  spineLeatherTop: heroBookMaterial.coverPurpleTop,
  spineLeatherBot: heroBookMaterial.coverPurpleBot,
  spineTooling: heroBookMaterial.goldTrim,
  spineToolingHairline: heroBookMaterial.goldHairline,
  spineAmber: PW.color.amber,
  ghostLeather: 'rgba(42,28,92,0.45)', // coverPurpleTop, faded — her grip
  ghostTint: 'rgba(123,45,139,0.35)',
  ghostTitle: 'rgba(185,138,222,0.75)',   // PW.color.lavender, faded
  ghostFeatherEdge: 'rgba(185,138,222,0.5)',
  hauntedLabel: 'rgba(185,138,222,0.6)',
  parchment: heroBookMaterial.pagesCreamTop,
  parchmentDeep: heroBookMaterial.pagesCream,
} as const;

// STAGE — the room the drama happens in. Backgrounds only, never panels.
export const stageMaterial = {
  base: PW.color.bgDeep,
  vignette: ['rgba(6,4,22,0.93)', 'rgba(9,6,26,0.55)', 'rgba(7,5,23,0.82)'] as const,
  vignetteLocations: [0, 0.5, 1] as const,
  purpleAmbient: 'rgba(123,45,139,0.14)',
  candleGlow: 'rgba(245,200,66,0.09)', // every room gets a candle
} as const;
