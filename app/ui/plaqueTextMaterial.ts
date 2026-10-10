export type PlaqueTextMaterialName = 'goldPlaque' | 'purplePlaque' | 'stonePlaque';

export type PlaqueTextMaterial = {
  face: string;
  depth: string;
  highlight: string;
  shadow: string;
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
