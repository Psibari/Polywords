export type PlaqueTextMaterialName = 'goldPlaque' | 'purplePlaque' | 'stonePlaque' | 'carvedStonePlaque' | 'carvedGoldPlaque';

export type PlaqueTextMaterial = {
  face: string;
  depth: string;
  highlight: string;
  shadow: string;
  /** Overrides the default dark drop shadow (PlaqueText): a carved look uses a light edge below. */
  edgeOffset?: { width: number; height: number };
  edgeRadius?: number;
};

export const PLAQUE_TEXT_MATERIALS: Record<PlaqueTextMaterialName, PlaqueTextMaterial> = {
  goldPlaque: {
    face: '#6C22A8',
    depth: '#2A0A46',
    highlight: '#C77BFF',
    shadow: 'rgba(20, 4, 35, 0.72)',
  },
  purplePlaque: {
    face: '#F5C842',
    depth: '#8A5400',
    highlight: '#FFF1A6',
    shadow: 'rgba(53, 28, 0, 0.72)',
  },
  stonePlaque: {
    face: '#1A1830',
    depth: '#080711',
    highlight: '#655F87',
    shadow: 'rgba(5, 4, 15, 0.72)',
  },
  // Haunted plaque lettering (Pete, 2026-10-29): the stonePlaque dark-on-dark shadow smeared on
  // the grey stone. Same dark ink, but `depth` is a thin light edge below each letter, so the
  // word reads as cut into the stone.
  //
  // 2026-10-30: the face now matches the ink of the carved HAUNTED / BANISHED headline baked into the
  // plaque art (measured from the art: about #3E3A55), so the live word and the headline read as the
  // same cut. The old #1A1830 read as black next to the headline.
  carvedStonePlaque: {
    face: '#3E3A55',
    depth: 'rgba(238, 236, 252, 0.8)',
    highlight: '#655F87',
    shadow: 'rgba(5, 4, 15, 0.72)',
    edgeOffset: { width: 0, height: 1.8 },
    edgeRadius: 0.5,
  },
  // KING plaque word (Pete, 2026-10-30): the same engraved look as the carved KING headline baked
  // into the art - deep purple cut into the gold, with a thin pale-gold lit edge below each letter.
  carvedGoldPlaque: {
    face: '#4A1E80',
    depth: 'rgba(255, 236, 150, 0.8)',
    highlight: '#C77BFF',
    shadow: 'rgba(20, 4, 35, 0.72)',
    edgeOffset: { width: 0, height: 1.8 },
    edgeRadius: 0.5,
  },
};

export type BusterTransformPhase = 'master' | 'swap' | 'final';

export function resolveBusterTransformFrame(phase: BusterTransformPhase) {
  if (phase === 'master') {
    return { visibleWord: 'MASTER', animatedPrefix: null, keptSuffix: null } as const;
  }
  if (phase === 'swap') {
    return { visibleWord: null, animatedPrefix: 'BU', keptSuffix: 'STER' } as const;
  }
  return { visibleWord: 'BUSTER', animatedPrefix: null, keptSuffix: null } as const;
}

export function resolvePlaqueImagePhase(phase: BusterTransformPhase): 'master' | 'final' {
  return phase === 'master' ? 'master' : 'final';
}
