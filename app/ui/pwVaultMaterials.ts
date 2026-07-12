import { PW } from './pwTheme';
import { heroBookMaterial, libraryMaterial } from './pwMaterials';

export const vaultType = {
  title: 30,
  counts: 14,
  seal: 34,
  sealLabel: 13,
  sealDesc: 13,
  empty: 15,
  detailWord: 40,
  detailCopy: 15,
  detailLabel: 15,
  rankTitle: 20,
  rankLetter: 22,
  rankRow: 15,
} as const;

export const vaultMaterial = {
  bookplateFace: libraryMaterial.parchment,
  bookplateBorder: PW.color.goldSoft,
  bookplateSeal: PW.color.gold,
  bookplateSealText: '#33291A',
  bookplateTrack: 'rgba(51,41,26,0.28)',
  bookplateProgress: PW.color.amber,
  bookplateText: PW.color.softWhite,
  bookplateCopy: PW.color.white,
  emptyText: PW.color.mutedWhite,
  panelScrim: 'rgba(6,4,22,0.72)',
  detailFace: PW.color.cardFace,
  detailRim: PW.color.cardRim,
  detailText: PW.color.softWhite,
  detailGhostText: PW.color.lavender,
  detailBoss: PW.color.amber,
  rankBorder: PW.color.cardRim,
  rankBackground: heroBookMaterial.coverPurple,
  rankSeparator: heroBookMaterial.pagesLine,
  rankText: PW.color.white,
} as const;
